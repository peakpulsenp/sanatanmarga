import { db } from "./firebase";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "@/src/lib/firebase";
import { TenantWorkflow, WorkflowTriggerType, TenantWorkflowStep } from "@/src/types";
import { logActivity } from "./activityLogger";

export const DEFAULT_WORKFLOWS: TenantWorkflow[] = [
  {
    id: "wf-editorial-auto",
    tenantId: "sanatan-media",
    title: "समाचार प्रवाह स्वचालित सम्पादन (Editorial Review Pipeline)",
    trigger: "story_submitted",
    isActive: true,
    runCount: 142,
    lastTriggeredAt: new Date().toISOString(),
    steps: [
      { id: "s1", title: "AI तथ्य जाँच तथा व्याकरण परीक्षण", assigneeRole: "ai_bot", actionType: "auto_tag", status: "completed" },
      { id: "s2", title: "वरिष्ठ सम्पादकलाई समीक्षा पठाउने", assigneeRole: "tenant_editor", actionType: "notify", status: "completed" },
      { id: "s3", title: "स्वीकृति पश्चात् सामाजिक सञ्जालमा प्रसारण", assigneeRole: "system", actionType: "external_webhook", status: "completed" }
    ]
  },
  {
    id: "wf-sponsor-followup",
    tenantId: "sanatan-media",
    title: "प्रायोजन प्रस्ताव स्वतः ताकेता (Sponsorship Follow-up Engine)",
    trigger: "sponsor_proposal_sent",
    isActive: true,
    runCount: 28,
    lastTriggeredAt: new Date().toISOString(),
    steps: [
      { id: "s1", title: "प्रस्ताव बुझाएको ७ दिन कुरेर हेर्ने", assigneeRole: "system", actionType: "notify", status: "completed" },
      { id: "s2", title: "प्रायोजकलाई धन्यवाद तथा स्मरण इमेल", assigneeRole: "tenant_admin", actionType: "notify", status: "completed" },
      { id: "s3", title: "मुख्य प्रबन्धकलाई नवीकरण एलर्ट", assigneeRole: "tenant_admin", actionType: "approval", status: "pending" }
    ]
  },
  {
    id: "wf-civic-complaint",
    tenantId: "pokhara-municipality",
    title: "नागरिक गुनासो तथा वडा सिफारिस (Civic Escalation Workflow)",
    trigger: "civic_complaint_logged",
    isActive: true,
    runCount: 89,
    lastTriggeredAt: new Date().toISOString(),
    steps: [
      { id: "s1", title: "सम्बन्धित वडा प्राविधिकलाई दर्ता सूचना", assigneeRole: "ward_officer", actionType: "notify", status: "completed" },
      { id: "s2", title: "४८ घण्टा भित्र समाधान नभए मेयर सचिवालय ताकेता", assigneeRole: "mayor_office", actionType: "approval", status: "pending" }
    ]
  },
  {
    id: "wf-new-member",
    tenantId: "sanskrit-gurukul",
    title: "नयाँ सदस्य तथा विद्यार्थी स्वागत श्रृंखला (Member Onboarding Pipeline)",
    trigger: "new_member_joined",
    isActive: true,
    runCount: 54,
    lastTriggeredAt: new Date().toISOString(),
    steps: [
      { id: "s1", title: "स्वागत इमेल तथा लगइन कोड प्रवाह", assigneeRole: "system", actionType: "notify", status: "completed" },
      { id: "s2", title: "प्रशासक द्वारा प्रोफाइल प्रमाणिकरण", assigneeRole: "tenant_admin", actionType: "approval", status: "completed" }
    ]
  }
];

export async function fetchTenantWorkflows(tenantId?: string): Promise<TenantWorkflow[]> {
  try {
    const q = tenantId 
      ? query(collection(db, "tenant_workflows"), where("tenantId", "==", tenantId))
      : collection(db, "tenant_workflows");
    
    const snap = await getDocs(q);
    if (snap.empty) {
      return DEFAULT_WORKFLOWS;
    }

    const list: TenantWorkflow[] = [];
    snap.forEach(docSnap => {
      list.push({ id: docSnap.id, ...docSnap.data() } as TenantWorkflow);
    });
    return list;
  } catch (err) {
    console.warn("Error fetching workflows from Firestore, using default fallback:", err);
    return DEFAULT_WORKFLOWS;
  }
}

export async function saveTenantWorkflow(workflow: Partial<TenantWorkflow>): Promise<TenantWorkflow> {
  const id = workflow.id || `wf-${Date.now()}`;
  const now = new Date().toISOString();

  const fullWorkflow: TenantWorkflow = {
    id,
    tenantId: workflow.tenantId || "sanatan-media",
    title: workflow.title || "नयाँ स्वचालित नियम",
    trigger: workflow.trigger || "story_submitted",
    steps: workflow.steps || [
      { id: "s1", title: "प्रारम्भिक सूचना जारी गर्ने", assigneeRole: "system", actionType: "notify", status: "completed" }
    ],
    isActive: workflow.isActive !== undefined ? workflow.isActive : true,
    runCount: workflow.runCount || 0,
    lastTriggeredAt: workflow.lastTriggeredAt || now
  };

  try {
    await setDoc(doc(db, "tenant_workflows", id), fullWorkflow);
  } catch (e) {
    console.warn("Failed to persist workflow to Firestore:", e);
  }

  return fullWorkflow;
}

export async function deleteTenantWorkflow(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "tenant_workflows", id));
  } catch (e) {
    console.warn("Failed deleting workflow from Firestore:", e);
  }
}

export async function triggerWorkflow(
  triggerType: WorkflowTriggerType,
  payload: {
    tenantId?: string;
    title?: string;
    author?: string;
    details?: any;
    [key: string]: any;
  }
) {
  try {
    const workflows = await fetchTenantWorkflows(payload.tenantId);
    const matchingWorkflows = workflows.filter(
      w => w.trigger === triggerType && w.isActive
    );

    if (matchingWorkflows.length === 0) {
      console.log(`No active workflow rules found for trigger: ${triggerType}`);
      return;
    }

    for (const wf of matchingWorkflows) {
      const updatedRunCount = (wf.runCount || 0) + 1;
      const lastTriggeredAt = "भरखरै";

      // Update run count in Firestore
      try {
        await updateDoc(doc(db, "tenant_workflows", wf.id), {
          runCount: updatedRunCount,
          lastTriggeredAt: new Date().toISOString()
        });
      } catch (e) {
        // Safe fail
      }

      // Log execution activity
      await logActivity(
        "WORKFLOW_TRIGGERED",
        "system",
        wf.id,
        {
          workflowId: wf.id,
          workflowTitle: wf.title,
          trigger: triggerType,
          payloadTitle: payload.title || "Automated trigger execution",
          stepsExecuted: wf.steps.length,
          tenantId: payload.tenantId || wf.tenantId,
          author: payload.author || "Workflow Engine"
        }
      );

      // Create workflow notification in Firestore
      try {
        await addDoc(collection(db, "notifications"), {
          title: `[Workflow Execution] ${wf.title}`,
          message: `ट्रिगर "${triggerType}" अन्तर्गत स्वचालित नियम सफलतापूर्वक सञ्चालन भयो। (${payload.title || 'प्रक्रिया सम्पादित'})`,
          type: "workflow",
          isRead: false,
          createdAt: new Date().toISOString(),
          extra: { workflowId: wf.id, trigger: triggerType }
        });
      } catch (e) {
        // Safe fail
      }
    }
  } catch (err) {
    console.error("Workflow Engine execution error:", err);
  }
}
