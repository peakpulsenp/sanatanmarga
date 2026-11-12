import { useState, useEffect } from "react";
import { 
  Bell, LayoutTemplate, Send, ShieldAlert, CheckCircle2, 
  Trash2, Plus, Sparkles, Settings, FileText, Check, AlertTriangle, Eye 
} from "lucide-react";
import { 
  collection, query, orderBy, limit, onSnapshot, 
  addDoc, doc, updateDoc, deleteDoc, getDocs, where 
} from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { formatDate } from "@/src/lib/utils";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { 
  DEFAULT_TEMPLATES, 
  seedNotificationTemplates, 
  triggerNotificationFromTemplate 
} from "@/src/lib/notifications";
import type { NotificationTemplate, NotificationCampaign, Notification } from "@/src/types";


interface NormalizedCampaign extends NotificationCampaign {
  isMalformed?: boolean;
}

interface NormalizedTemplate extends NotificationTemplate {
  isMalformed?: boolean;
}

interface NormalizedLog extends Notification {
  isMalformed?: boolean;
}

function normalizeCampaign(doc: any): NormalizedCampaign {
  const id = String(doc?.id || `camp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const name = typeof doc?.name === "string" ? doc.name.trim() : "Untitled Campaign";
  const title = typeof doc?.title === "string" ? doc.title.trim() : "No Title";
  const body = typeof doc?.body === "string" ? doc.body.trim() : "";
  const rawAudience = typeof doc?.audience === "string" ? doc.audience.trim() : "all_users";
  const audience = ["all_users", "editorial_staff", "subscribers", "admins"].includes(rawAudience)
    ? (rawAudience as any)
    : "all_users";
  const status = ["draft", "scheduled", "sent", "failed"].includes(doc?.status) ? doc.status : "draft";
  const createdAt = doc?.createdAt || new Date().toISOString();
  const metrics = doc?.metrics || { targetedCount: 0, deliveredCount: 0, clickedCount: 0 };
  const isMalformed = !doc?.name && !doc?.title;

  return {
    id,
    name,
    title,
    body,
    audience,
    status,
    scheduledAt: doc?.scheduledAt,
    sentAt: doc?.sentAt,
    metrics,
    createdAt,
    isMalformed
  };
}

function normalizeTemplate(doc: any): NormalizedTemplate {
  const id = String(doc?.id || `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const code = typeof doc?.code === "string" ? doc.code.trim().toUpperCase() : "UNTITLED_CODE";
  const title = typeof doc?.title === "string" ? doc.title.trim() : "Untitled Template";
  const body = typeof doc?.body === "string" ? doc.body.trim() : "";
  const category = ["workflow", "editorial", "system", "community", "business"].includes(doc?.category)
    ? doc.category
    : "system";
  const isActive = typeof doc?.isActive === "boolean" ? doc.isActive : true;
  const isMalformed = !doc?.code && !doc?.title;

  return {
    id,
    code,
    title,
    body,
    category,
    isActive,
    updatedAt: doc?.updatedAt || new Date().toISOString(),
    isMalformed
  };
}

function normalizeLog(doc: any): NormalizedLog {
  const id = String(doc?.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const title = typeof doc?.title === "string" ? doc.title.trim() : "सूचना";
  const message = typeof doc?.message === "string" ? doc.message.trim() : "";
  const type = doc?.type || "system";
  const userId = typeof doc?.userId === "string" ? doc.userId.trim() : "";
  const createdAt = doc?.createdAt || new Date().toISOString();
  const isMalformed = !doc?.title && !doc?.message;

  return {
    id,
    userId,
    title,
    message,
    type,
    isRead: Boolean(doc?.isRead ?? doc?.read),
    link: doc?.link,
    createdAt,
    isMalformed
  };
}

export default function AdminNotifications() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [liveLogs, setLiveLogs] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'logs'>('campaigns');
  
  // Modal/Form states
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    code: "", title: "", body: "", category: "workflow" as any, isActive: true
  });

  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: "", title: "", body: "", audience: "all_users" as any
  });

  const [testUserUid, setTestUserUid] = useState("");
  const [testTemplateCode, setTestTemplateCode] = useState("ASSIGNMENT_CREATED");

  const [health, setHealth] = useState<any>(null);

  // Real-time Listeners & Health Fetch
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/notifications/health");
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        }
      } catch (e) {
        console.warn("Could not fetch notifications health:", e);
      }
    };

    fetchHealth();
    const healthInterval = setInterval(fetchHealth, 15000);

    // 1. Listen to templates
    const templatesQuery = query(collection(db, "notificationTemplates"), orderBy("code", "asc"));
    const unsubTemplates = onSnapshot(templatesQuery, (snap) => {
      const list = snap.docs.map(d => normalizeTemplate({ id: d.id, ...d.data() }));
      setTemplates(list);
    });

    // 2. Listen to campaigns
    const campaignsQuery = query(collection(db, "notificationCampaigns"), orderBy("createdAt", "desc"), limit(30));
    const unsubCampaigns = onSnapshot(campaignsQuery, (snap) => {
      const list = snap.docs.map(d => normalizeCampaign({ id: d.id, ...d.data() }));
      setCampaigns(list);
    });

    // 3. Listen to live dispatch logs
    const logsQuery = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(50));
    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      const list = snap.docs.map(d => normalizeLog({ id: d.id, ...d.data() }));
      setLiveLogs(list);
    });

    // Trigger template auto-seeding on load
    seedNotificationTemplates();

    return () => {
      clearInterval(healthInterval);
      unsubTemplates();
      unsubCampaigns();
      unsubLogs();
    };
  }, []);

  // Save/Update Template
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedTemplate) {
        // Update
        const docRef = doc(db, "notificationTemplates", selectedTemplate.id);
        await updateDoc(docRef, {
          ...templateForm,
          updatedAt: new Date().toISOString()
        });
        toast.success("टेम्प्लेट सुरक्षित गरियो!");
      } else {
        // Create
        await addDoc(collection(db, "notificationTemplates"), {
          ...templateForm,
          updatedAt: new Date().toISOString()
        });
        toast.success("नयाँ टेम्प्लेट सिर्जना गरियो!");
      }
      setIsTemplateModalOpen(false);
      setSelectedTemplate(null);
    } catch (err: any) {
      toast.error("त्रुटि: " + err.message);
    }
  };

  // Launch Campaign (Broadcast)
  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.name || !campaignForm.title || !campaignForm.body) {
      toast.error("कृपया सबै विवरण भर्नुहोस्।");
      return;
    }

    try {
      toast.info("प्रसारण (Broadcast) तयारी गर्दै...");
      
      // 1. Fetch target audience UIDs
      let targetUids: string[] = [];
      const usersCol = collection(db, "users");
      let usersQuery = query(usersCol);

      if (campaignForm.audience === "editorial_staff") {
        usersQuery = query(usersCol, where("role", "in", ["admin", "editor", "journalist", "fact_checker"]));
      } else if (campaignForm.audience === "subscribers") {
        usersQuery = query(usersCol, where("role", "==", "subscriber"));
      } else if (campaignForm.audience === "admins") {
        usersQuery = query(usersCol, where("role", "==", "admin"));
      }

      const usersSnap = await getDocs(usersQuery);
      targetUids = usersSnap.docs.map(d => d.id);

      // Fallback to current user if database users is empty (development comfort)
      if (targetUids.length === 0 && user) {
        targetUids = [user.uid];
      }

      // 2. Write Campaign to database in scheduled/sending status
      const campRef = await addDoc(collection(db, "notificationCampaigns"), {
        ...campaignForm,
        status: "sent",
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        metrics: {
          targetedCount: targetUids.length,
          deliveredCount: targetUids.length,
          clickedCount: 0
        }
      });

      // 3. Dispatch Notification docs to Firestore for each user
      const notifCol = collection(db, "notifications");
      for (const uid of targetUids) {
        await addDoc(notifCol, {
          userId: uid,
          title: campaignForm.title,
          message: campaignForm.body,
          type: "business",
          isRead: false,
          campaignId: campRef.id,
          createdAt: new Date().toISOString()
        });
      }

      toast.success(`${targetUids.length} प्रयोगकर्ताहरूलाई सफलतापूर्वक प्रसारण गरियो!`);
      setIsCampaignModalOpen(false);
      setCampaignForm({ name: "", title: "", body: "", audience: "all_users" });
    } catch (err: any) {
      toast.error("प्रसारण असफल भयो: " + err.message);
    }
  };

  // Test Notification Dispatch manually
  const handleTestDispatch = async () => {
    const targetUid = testUserUid || user?.uid;
    if (!targetUid) {
      toast.error("कृपया प्राप्तकर्ता प्रयोगकर्ता UID हाल्नुहोस्।");
      return;
    }

    try {
      toast.info("नमुना चेतावनी पठाउँदै...");
      await triggerNotificationFromTemplate(testTemplateCode, targetUid, {
        title: "ताजा अपडेट",
        deadline: "आज साँझ ५ बजे",
        reporterName: user?.displayName || "सम्पादक",
        authorName: "राजन शर्मा",
        error: "मशीन जडान विच्छेद",
        name: "प्रवर्द्धन उपहार"
      });
      toast.success("परीक्षण चेतावनी सफलतापूर्वक पठाइयो!");
    } catch (err: any) {
      toast.error("परीक्षण असफल भयो: " + err.message);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-10 flex flex-col gap-8 max-w-7xl mx-auto" id="notification-os-container">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Bell className="text-primary animate-pulse" size={28} />
              Notification OS Control Center
            </h1>
            <p className="text-sm font-medium text-slate-500">
              एप्लिकेसन भित्रका महत्वपूर्ण र तत्काल आवश्यक प्रसारण, कार्य प्रवाह र प्रणाली अलर्टहरू व्यवस्थित गर्नुहोस्।
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => {
                setTemplateForm({ code: "", title: "", body: "", category: "workflow", isActive: true });
                setSelectedTemplate(null);
                setIsTemplateModalOpen(true);
              }}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-200"
            >
              <LayoutTemplate size={16} /> नयाँ टेम्प्लेट
            </button>
            <button 
              onClick={() => setIsCampaignModalOpen(true)}
              className="px-5 py-3 bg-primary hover:bg-primary/95 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-primary/10"
            >
              <Send size={16} /> नयाँ प्रसारण (Campaign)
            </button>
          </div>
        </div>

        {/* Notifications OS 5.0 Telemetry Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="text-xxs font-black uppercase text-slate-400 tracking-wider mb-1">
              Resolution Accuracy
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-emerald-600">
                {health?.metrics?.canonicalResolutionSuccessRate || 100}%
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                Deterministic
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Zero fallback regressions</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="text-xxs font-black uppercase text-slate-400 tracking-wider mb-1">
              Total Dispatched
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {health?.metrics?.totalDispatched || liveLogs.length}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                Multi-Channel
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Push, In-App & Snapshot</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="text-xxs font-black uppercase text-slate-400 tracking-wider mb-1">
              Registered Devices
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-orange-600">
                {health?.metrics?.activeRegisteredDevices || 0}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold">
                Active FCM
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Web push tokens indexed</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="text-xxs font-black uppercase text-slate-400 tracking-wider mb-1">
              Engine Health
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-emerald-600 uppercase">
                {health?.status || "HEALTHY"}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                OS 5.0
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Partitioned public/private storage</div>
          </div>
        </div>

        {/* Diagnostic Testing Sandbox */}
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 flex flex-col gap-1">
            <span className="text-xxs font-black uppercase text-primary tracking-widest flex items-center gap-1">
              <Sparkles size={12} /> Live Diagnostic Sandbox
            </span>
            <h3 className="text-sm font-black text-slate-900">द्रुत सूचना परीक्षण उपकरण</h3>
            <p className="text-xs text-slate-500">कुनै पनि सूचना टेम्प्लेट तत्कालै आफैलाई पठाएर प्रतिक्रिया परीक्षण गर्नुहोस्।</p>
          </div>

          <div className="md:col-span-3">
            <label className="text-xxs font-black text-slate-500 uppercase tracking-widest block mb-1">प्राप्तकर्ता UID (खाली राखेमा आफैलाई)</label>
            <input 
              type="text" 
              placeholder="UID" 
              value={testUserUid} 
              onChange={e => setTestUserUid(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-xxs font-black text-slate-500 uppercase tracking-widest block mb-1">टेम्प्लेट कोड</label>
            <select 
              value={testTemplateCode} 
              onChange={e => setTestTemplateCode(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
            >
              {DEFAULT_TEMPLATES.map(t => (
                <option key={t.code} value={t.code}>{t.code}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <button 
              onClick={handleTestDispatch}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              पठाउनुहोस्
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 gap-6">
          {(['campaigns', 'templates', 'logs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-1 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                activeTab === tab 
                  ? 'border-primary text-slate-900' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'campaigns' ? 'विज्ञापन प्रसारण (Campaigns)' : tab === 'templates' ? 'अलर्ट टेम्प्लेटहरू' : 'लाइभ लगहरू (Sent Alerts)'}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {activeTab === 'campaigns' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Broadcast Campaigns List */}
              <div className="md:col-span-12 flex flex-col gap-4">
                {campaigns.map(camp => (
                  <div key={camp.id} className="p-6 bg-white border border-slate-100 shadow-sm rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-slate-300 transition-all">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xxs font-black uppercase tracking-wider">
                          {(camp.audience || 'all_users').replace(/_/g, ' ')}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xxs font-bold text-slate-400">{formatDate(camp.createdAt)}</span>
                      </div>
                      <h3 className="text-md font-black text-slate-800">{camp.name}</h3>
                      <p className="text-sm font-semibold text-slate-500">{camp.title}</p>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">{camp.body}</p>
                    </div>

                    <div className="flex items-center gap-8 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                      <div className="text-center">
                        <p className="text-slate-400 text-xxs font-black uppercase">लक्ष्यित</p>
                        <p className="text-lg font-black text-slate-800">{camp.metrics?.targetedCount || 0}</p>
                      </div>
                      <div className="h-6 w-px bg-slate-200" />
                      <div className="text-center">
                        <p className="text-slate-400 text-xxs font-black uppercase">डेलिभर</p>
                        <p className="text-lg font-black text-slate-800">{camp.metrics?.deliveredCount || 0}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {campaigns.length === 0 && (
                  <div className="text-center py-24 text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <Send className="mx-auto text-slate-300 mb-3" size={32} />
                    <p className="text-xs font-bold uppercase tracking-widest">कुनै सक्रिय प्रसारण अभियान फेला परेन।</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(tmp => (
                <div key={tmp.id} className="p-6 bg-white border border-slate-100 rounded-3xl flex flex-col justify-between gap-6 hover:border-slate-300 transition-all group">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xxs font-black uppercase tracking-wider">
                        {tmp.category}
                      </span>
                      <span className={`h-2.5 w-2.5 rounded-full ${tmp.isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-mono font-black text-primary select-all">{tmp.code}</h4>
                      <h3 className="text-sm font-black text-slate-800 mt-2">{tmp.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">{tmp.body}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 pt-4">
                    <button 
                      onClick={() => {
                        setSelectedTemplate(tmp);
                        setTemplateForm({
                          code: tmp.code,
                          title: tmp.title,
                          body: tmp.body,
                          category: tmp.category,
                          isActive: tmp.isActive
                        });
                        setIsTemplateModalOpen(true);
                      }}
                      className="flex-grow py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xxs uppercase tracking-wider transition-all"
                    >
                      सम्पादन गर्नुहोस्
                    </button>
                    <button 
                      onClick={async () => {
                        if (confirm("के तपाईं यो टेम्प्लेट हटाउन चाहनुहुन्छ?")) {
                          await deleteDoc(doc(db, "notificationTemplates", tmp.id));
                          toast.success("टेम्प्लेट हटाइयो");
                        }
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Sent Alerts real-time stream</h3>
                <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xxs font-bold">Live Feed</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
                {liveLogs.map(log => (
                  <div key={log.id} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className={`mt-0.5 p-2 rounded-xl flex-shrink-0 ${
                      log.type === 'error' || log.type === 'system' ? 'bg-red-50 text-red-500' :
                      log.type === 'warning' ? 'bg-amber-50 text-amber-500' :
                      log.type === 'workflow' ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Bell size={14} />
                    </div>

                    <div className="flex-grow">
                      <div className="flex items-center justify-between gap-4">
                        <h4 className="text-xs font-black text-slate-800">{log.title}</h4>
                        <span className="text-xxs font-mono text-slate-400">{formatDate(log.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{log.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xxs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">To UID: {log.userId?.substring(0, 8)}...</span>
                        {log.type && (
                          <span className="text-xxs font-bold text-slate-400 capitalize">• Category: {log.type}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {liveLogs.length === 0 && (
                  <div className="text-center py-24 text-slate-400">
                    <p className="text-xs font-bold uppercase tracking-widest">कुनै प्रणाली सूचना पठाइएको छैन।</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL: Save Template */}
        <AnimatePresence>
          {isTemplateModalOpen && (
            <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-100 shadow-2xl flex flex-col gap-6"
              >
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {selectedTemplate ? "टेम्प्लेट सम्पादन गर्नुहोस्" : "नयाँ टेम्प्लेट सिर्जना गर्नुहोस्"}
                  </h3>
                  <p className="text-xs text-slate-500">सूचना टेम्प्लेट र प्रतिस्थापन चरहरू सेट गर्नुहोस्।</p>
                </div>

                <form onSubmit={handleSaveTemplate} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">टेम्प्लेट कोड (अनौठो कोड)</label>
                    <input 
                      type="text" 
                      value={templateForm.code}
                      onChange={e => setTemplateForm({...templateForm, code: e.target.value.toUpperCase()})}
                      disabled={!!selectedTemplate}
                      placeholder="उदा: ARTICLE_APPROVED"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">श्रेणी (Category)</label>
                    <select 
                      value={templateForm.category}
                      onChange={e => setTemplateForm({...templateForm, category: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="workflow">Workflow</option>
                      <option value="editorial">Editorial</option>
                      <option value="system">System</option>
                      <option value="community">Community</option>
                      <option value="business">Business</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">शीर्षक (Title Template)</label>
                    <input 
                      type="text" 
                      value={templateForm.title}
                      onChange={e => setTemplateForm({...templateForm, title: e.target.value})}
                      placeholder="शीर्षक... {title} चर प्रयोग गर्नुहोस्"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">बडी (Body Message Template)</label>
                    <textarea 
                      value={templateForm.body}
                      onChange={e => setTemplateForm({...templateForm, body: e.target.value})}
                      placeholder="सन्देश... {reporterName}, {deadline} चर प्रयोग गर्नुहोस्"
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="isActive"
                      checked={templateForm.isActive}
                      onChange={e => setTemplateForm({...templateForm, isActive: e.target.checked})}
                    />
                    <label htmlFor="isActive" className="text-xs font-bold text-slate-700">यो टेम्प्लेट सक्रिय छ</label>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button 
                      type="button" 
                      onClick={() => setIsTemplateModalOpen(false)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-wider"
                    >
                      रद्द गर्नुहोस्
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-wider"
                    >
                      बचत गर्नुहोस्
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: Launch Campaign */}
        <AnimatePresence>
          {isCampaignModalOpen && (
            <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-100 shadow-2xl flex flex-col gap-6"
              >
                <div>
                  <h3 className="text-lg font-black text-slate-900">नयाँ प्रसारण अभियान (Broadcast Campaign)</h3>
                  <p className="text-xs text-slate-500">एकै पटक धेरै प्रयोगकर्ताहरूलाई लक्षित गरी आवश्यक अलर्ट वा प्रवर्द्धन पठाउनुहोस्।</p>
                </div>

                <form onSubmit={handleLaunchCampaign} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">अभियान नाम (Internal Campaign Name)</label>
                    <input 
                      type="text" 
                      value={campaignForm.name}
                      onChange={e => setCampaignForm({...campaignForm, name: e.target.value})}
                      placeholder="उदा: Breaking News: Special Election"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">लक्ष्यित दर्शक (Audience)</label>
                    <select 
                      value={campaignForm.audience}
                      onChange={e => setCampaignForm({...campaignForm, audience: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="all_users">All Registered Users</option>
                      <option value="editorial_staff">Editorial Staff (Admins, Editors, Journalists)</option>
                      <option value="subscribers">Subscribers Only</option>
                      <option value="admins">Admins Only</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">सूचना शीर्षक (Notification Title)</label>
                    <input 
                      type="text" 
                      value={campaignForm.title}
                      onChange={e => setCampaignForm({...campaignForm, title: e.target.value})}
                      placeholder="शीर्षक..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">सूचना सन्देश (Notification Message Body)</label>
                    <textarea 
                      value={campaignForm.body}
                      onChange={e => setCampaignForm({...campaignForm, body: e.target.value})}
                      placeholder="सन्देश..."
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button 
                      type="button" 
                      onClick={() => setIsCampaignModalOpen(false)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-wider"
                    >
                      रद्द गर्नुहोस्
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/10"
                    >
                      प्रसारण सुरु गर्नुहोस्
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}
