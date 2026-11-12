import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, safeOnSnapshot as onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, writeBatch } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { offlineQueue, setDocWithQueue } from "@/src/lib/offlineQueue";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { 
  Plus, Edit, Trash2, ExternalLink, Radio, Globe, Network, 
  Sparkles, Search, Filter, Calendar, MapPin, CheckCircle2, 
  AlertCircle, RefreshCw, Zap, Shield, HelpCircle, FileText, 
  User, Check, X, Link as LinkIcon, History, Merge, AlertTriangle, ArrowRight, Save
} from "lucide-react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { usePermissions } from "@/src/context/PermissionsContext";
import { ROLE_DEFINITIONS } from "@/src/constants/permissions";
import { logEventGovernanceAction, EventGovernanceLog } from "@/src/lib/activityLogger";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

// High-Fidelity Nepal Districts & Provinces
const DISTRICTS = ["काठमाडौँ", "ललितपुर", "भक्तपुर", "कास्की", "धनुषा", "चितवन", "गोरखा", "रूपन्देही"];

const SAMPLE_CIVILIZATIONAL_EVENTS = [
  {
    id: "pashupati-shivaratri-2083",
    title: "महाशिवरात्रि तथा पशुपतिनाथ विशेष महामहोत्सव २०८३",
    tagline: "विश्वभरका १० लाख भन्दा बढी वैदिक सनातन धर्मावलम्बीहरूको पावन आगमन तथा अखण्ड दीप आराधना।",
    date: "2026-03-08",
    location: "पशुपतिनाथ मन्दिर परिसर, गौशाला",
    district: "काठमाडौँ",
    province: "बागमती प्रदेश",
    featuredImage: "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=2070&auto=format&fit=crop",
    status: "published",
    isFeatured: true,
    isLiveOnNepalHub: true,
    nepalHubCategory: "festivals",
    knowledgeEntities: ["pashupatinath", "महाशिवरात्रि", "वाग्मती", "काठमाडौँ"],
    knowledgeTags: ["सनातन धर्म", "शिव पूजा", "वैदिक सम्पदा"],
    sources: [
      { id: "s-1", name: "पशुपति क्षेत्र विकास कोष (PADT) आधिकारिक बुलेटिन", type: "official", verified: true },
      { id: "s-2", name: "गोरखापत्र राष्ट्रिय दैनिक समाचार विवरण", type: "media", verified: true }
    ],
    verificationAgeHours: 4,
    isCanonical: true,
    timeline: [
      { time: "बिहान ०३:००", title: "पशुपतिनाथ मन्दिरका चारै ढोका खुला", description: "भक्तजनहरूको दर्शनका लागि विशेष लाइन प्रबन्ध।" },
      { time: "दिउँसो १२:००", title: "विशेष मध्याह्न महापूजा तथा आरती", description: "मूल पुजारीद्वारा चतुर्मुखी शिवलिङ्गको जल र पञ्चामृत अभिषेक।" }
    ]
  },
  {
    id: "janakpur-vivah-panchami",
    title: "जनकपुरधाम सीता-राम विवाह पञ्चमी महामहोत्सव",
    tagline: "त्रेतायुगीन संस्कृति र मिथिला सम्पदाको भव्य प्रवर्धन, विवाह मण्डप पूजा तथा डोला यात्रा।",
    date: "2026-12-14",
    location: "जानकी मन्दिर तथा रङ्गभूमि मैदान",
    district: "धनुषा",
    province: "मधेश प्रदेश",
    featuredImage: "https://images.unsplash.com/photo-1590001155093-a3c68ab0ac67?q=80&w=2070&auto=format&fit=crop",
    status: "verified",
    isFeatured: false,
    isLiveOnNepalHub: false,
    nepalHubCategory: "festivals",
    knowledgeEntities: ["janaki-mandir", "सीता माता", "विवाह पञ्चमी"],
    knowledgeTags: ["वैवाहिक उत्सव", "मिथिला संस्कृति"],
    sources: [
      { id: "s-3", name: "जनकपुर गुठी संस्थान कार्यतालिका", type: "official", verified: true }
    ],
    verificationAgeHours: 12,
    isCanonical: false,
    timeline: [
      { time: "बिहान ०९:००", title: "नगर दर्शन तथा डोला यात्रा", description: "जनकपुरधामको रङ्गभूमि मैदान तर्फ विशेष डोला प्रस्थान।" }
    ]
  },
  {
    id: "candidate-indrajatra-duplicate",
    title: "काठमाडौँ इन्द्रजात्रा येँया विशेष उत्सव (Duplicate Canditate)",
    tagline: "श्री कुमारी रथयात्रा र लाखे नाच प्रदर्शन।",
    date: "2026-09-24",
    location: "वसन्तपुर दरबार क्षेत्र",
    district: "काठमाडौँ",
    province: "बागमती प्रदेश",
    featuredImage: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=2070&auto=format&fit=crop",
    status: "candidate",
    isFeatured: false,
    isLiveOnNepalHub: false,
    nepalHubCategory: "festivals",
    knowledgeEntities: ["kumari-house", "इन्द्रजात्रा"],
    knowledgeTags: ["नेवारी संस्कृति", "रथयात्रा"],
    sources: [
      { id: "s-4", name: "फेसबुक पोस्ट युजर अपडेट", type: "social", verified: false }
    ],
    verificationAgeHours: 48,
    isCanonical: false,
    timeline: []
  }
];

export default function AdminEvents() {
  const { userRole: actualUserRole, hasPermission } = usePermissions();
  
  // Simulated Role Switcher for preview validation & dual-editorial flow testing
  const [activeRoleOverride, setActiveRoleOverride] = useState<string>("");
  const activeRole = activeRoleOverride || actualUserRole;
  
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [seeding, setSeeding] = useState(false);
  
  // Dashboard Tabs: Live Canonical Registry, Candidate Review Queue, Deduplication Center, Governance Audit Logs
  const [activeTab, setActiveTab] = useState<"live" | "candidates" | "deduplicate" | "audit">("live");
  
  // Governance Trail List State
  const [governanceLogs, setGovernanceLogs] = useState<any[]>([]);
  
  // Deduplication selections
  const [mergeSourceId, setMergeSourceId] = useState<string>("");
  const [mergeTargetId, setMergeTargetId] = useState<string>("");
  const [mergeReason, setMergeReason] = useState("");
  
  // Verification dialog states
  const [verifyingEventId, setVerifyingEventId] = useState<string | null>(null);
  const [verificationSource, setVerificationSource] = useState("");
  const [verificationWhy, setVerificationWhy] = useState("");
  const [verificationType, setVerificationType] = useState<"official" | "field" | "media" | "crowdsourced">("official");
  
  // Retraction drawer states
  const [retractingEventId, setRetractingEventId] = useState<string | null>(null);
  const [retractionWhy, setRetractionWhy] = useState("");
  
  // Custom Recurrence rule state
  const [recursOption, setRecursOption] = useState<Record<string, string>>({});

  // Dynamic capabilities helper reflecting actual/simulated RBAC mapping
  const hasGovPerm = (permission: string) => {
    if (activeRole === "super_admin") return true;
    const roleDef = ROLE_DEFINITIONS[activeRole];
    if (!roleDef) return false;
    return roleDef.permissions.includes(permission) || roleDef.permissions.includes("*");
  };

  // Fetch Firestore Events or Fallback to Civilizational Samples
  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setEvents(items);
      setLoading(false);
    }, (err) => {
      console.warn("Firestore fallback to high-fidelity samples:", err);
      // Populate local storage if empty to support seamless simulation
      const local = localStorage.getItem("simulated_events");
      if (local) {
        setEvents(JSON.parse(local));
      } else {
        localStorage.setItem("simulated_events", JSON.stringify(SAMPLE_CIVILIZATIONAL_EVENTS));
        setEvents(SAMPLE_CIVILIZATIONAL_EVENTS);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Fetch Governance Trail Log List
  useEffect(() => {
    const loadLogs = () => {
      const storedLogs = localStorage.getItem("event_governance_logs") || "[]";
      setGovernanceLogs(JSON.parse(storedLogs));
    };
    loadLogs();
    
    // Add event listener to react to logs added in same session
    window.addEventListener("storage", loadLogs);
    const interval = setInterval(loadLogs, 2000);
    return () => {
      window.removeEventListener("storage", loadLogs);
      clearInterval(interval);
    };
  }, []);

  const saveEventsLocalState = (updatedEvents: any[]) => {
    setEvents(updatedEvents);
    localStorage.setItem("simulated_events", JSON.stringify(updatedEvents));
  };

  const handleSeedCivilizationalEvents = async () => {
    setSeeding(true);
    try {
      let count = 0;
      for (const ev of SAMPLE_CIVILIZATIONAL_EVENTS) {
        await setDocWithQueue(doc(db, "events", ev.id), ev, { merge: true });
        count++;
      }
      await snapshotEngine.triggerPublishRebuild("admin_events_seed");
      toast.success(`${count} वटा मुख्य सांस्कृतिक तथा राष्ट्रिय घटनाक्रमहरू सफल बीजारोपण गरियो!`);
    } catch (err: any) {
      // Offline fallback
      saveEventsLocalState(SAMPLE_CIVILIZATIONAL_EVENTS);
      toast.success("सिमुलेसन डेटाबेस सफलतापुर्वक स्थानीय रूपमा तयार पारियो!");
    } finally {
      setSeeding(false);
    }
  };

  const handleToggleNepalHubLive = async (eventId: string, currentVal: boolean) => {
    if (!hasGovPerm("events.publish")) {
      toast.error("अपर्याप्त अनुमति: वरिष्ठ सम्पादक वा माथिल्लो भूमिका मात्र घटना लाइभ गर्न योग्य छ।");
      return;
    }
    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return;

    try {
      await updateDoc(doc(db, "events", eventId), {
        isLiveOnNepalHub: !currentVal,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      // local simulation fallback
      const updated = events.map(e => e.id === eventId ? { ...e, isLiveOnNepalHub: !currentVal } : e);
      saveEventsLocalState(updated);
    }

    await logEventGovernanceAction({
      eventId,
      actionType: "publish",
      beforeState: { isLiveOnNepalHub: currentVal },
      afterState: { isLiveOnNepalHub: !currentVal },
      why: !currentVal ? "Published live on Nepal Hub" : "De-escalated / Un-published from live tickers",
      source: "Events OS Command Center"
    });

    toast.success(`नेपाल हब लाइभ अवस्था सम्पादन गरियो (${!currentVal ? "सक्रिय" : "निष्क्रिय"})!`);
  };

  // 1. VERIFICATION GATE (Four-Eyes control)
  const handleVerifyEventSubmit = async () => {
    if (!verifyingEventId) return;
    if (!hasGovPerm("events.verify")) {
      toast.error("अपर्याप्त अनुमति: तपाईंसँग घटना प्रमाणित (verify) गर्ने अधिकार छैन।");
      return;
    }
    if (!verificationSource.trim() || !verificationWhy.trim()) {
      toast.error("कृपया विश्वसनीय स्रोत र सम्पादकीय पुष्टीकरण अनिवार्य रूपमा उल्लेख गर्नुहोस्।");
      return;
    }

    const targetEvent = events.find(e => e.id === verifyingEventId);
    if (!targetEvent) return;

    const beforeState = { status: targetEvent.status, sources: targetEvent.sources || [] };
    const newSources = [...(targetEvent.sources || []), {
      id: `s-${Date.now()}`,
      name: verificationSource,
      type: verificationType,
      verified: true
    }];

    const afterState = {
      status: "verified",
      sources: newSources,
      verificationAgeHours: 0,
      verifiedBy: activeRole,
      verifiedAt: new Date().toISOString()
    };

    try {
      await updateDoc(doc(db, "events", verifyingEventId), afterState);
    } catch (err) {
      // Local simulation
      const updated = events.map(e => e.id === verifyingEventId ? { ...e, ...afterState } : e);
      saveEventsLocalState(updated);
    }

    await logEventGovernanceAction({
      eventId: verifyingEventId,
      actionType: "verify",
      beforeState,
      afterState,
      why: verificationWhy,
      source: verificationSource
    });

    toast.success("घटना प्रमाणिकरण तथा स्रोत प्रमाणीकरण सफल भयो!");
    setVerifyingEventId(null);
    setVerificationSource("");
    setVerificationWhy("");
  };

  // 2. RETRACTION GATE (Editorial Admin Override)
  const handleRetractEventSubmit = async () => {
    if (!retractingEventId) return;
    if (!hasGovPerm("events.retract")) {
      toast.error("अपर्याप्त अनुमति: केवल सम्पादकीय प्रशासक (Editorial Admin) सँग मात्र घटना फिर्ता (Retract) गर्ने अधिकार छ।");
      return;
    }
    if (!retractionWhy.trim()) {
      toast.error("कृपया घटना फिर्ता लिनुको चित्तबुझ्दो कारण खुलाउनुहोस्।");
      return;
    }

    const targetEvent = events.find(e => e.id === retractingEventId);
    if (!targetEvent) return;

    const beforeState = { status: targetEvent.status, isLiveOnNepalHub: targetEvent.isLiveOnNepalHub };
    const afterState = {
      status: "retracted",
      isLiveOnNepalHub: false,
      retractedAt: new Date().toISOString(),
      retractionReason: retractionWhy
    };

    try {
      await updateDoc(doc(db, "events", retractingEventId), afterState);
    } catch (err) {
      const updated = events.map(e => e.id === retractingEventId ? { ...e, ...afterState } : e);
      saveEventsLocalState(updated);
    }

    await logEventGovernanceAction({
      eventId: retractingEventId,
      actionType: "retract",
      beforeState,
      afterState,
      why: retractionWhy,
      source: "Official Retraction Mandate"
    });

    toast.warning("घटना सफलतापूर्वक फिर्ता (Retracted) लिइयो र पब्लिक फिडबाट हटाइयो!");
    setRetractingEventId(null);
    setRetractionWhy("");
  };

  // 3. DEDUPLICATION & CANONICAL MERGE
  const handleMergeEvents = async () => {
    if (!mergeSourceId || !mergeTargetId) {
      toast.error("कृपया विलीन हुने स्रोत घटना र मुख्य गन्तव्य घटना दुवै छनोट गर्नुहोस्।");
      return;
    }
    if (mergeSourceId === mergeTargetId) {
      toast.error("स्रोत र गन्तव्य घटना फरक-फरक हुनुपर्छ।");
      return;
    }
    if (!hasGovPerm("events.merge")) {
      toast.error("अपर्याप्त अनुमति: केवल वरिष्ठ सम्पादक वा प्रशासकसँग मात्र घटनाहरू मिलाउने (merge) अधिकार छ।");
      return;
    }
    if (!mergeReason.trim()) {
      toast.error("मर्जरको स्पष्ट सम्पादकीय औचित्य अनिवार्य खुलाउनुहोस्।");
      return;
    }

    const sourceEvent = events.find(e => e.id === mergeSourceId);
    const targetEvent = events.find(e => e.id === mergeTargetId);

    if (!sourceEvent || !targetEvent) return;

    // Combine tags and nodes
    const combinedEntities = Array.from(new Set([
      ...(sourceEvent.knowledgeEntities || []),
      ...(targetEvent.knowledgeEntities || [])
    ]));
    const combinedTags = Array.from(new Set([
      ...(sourceEvent.knowledgeTags || []),
      ...(targetEvent.knowledgeTags || [])
    ]));
    const combinedSources = [
      ...(targetEvent.sources || []),
      ...(sourceEvent.sources || []).map((s: any) => ({ ...s, id: `merged-${s.id}` }))
    ];

    const targetBefore = { ...targetEvent };
    const targetAfter = {
      ...targetEvent,
      knowledgeEntities: combinedEntities,
      knowledgeTags: combinedTags,
      sources: combinedSources,
      isCanonical: true,
      title: `${targetEvent.title} (एकीकृत)`,
      tagline: targetEvent.tagline || sourceEvent.tagline
    };

    try {
      // 1. Delete source
      await deleteDoc(doc(db, "events", mergeSourceId));
      // 2. Update target
      await updateDoc(doc(db, "events", mergeTargetId), {
        knowledgeEntities: combinedEntities,
        knowledgeTags: combinedTags,
        sources: combinedSources,
        isCanonical: true
      });
    } catch (err) {
      // Local fallback
      const filtered = events.filter(e => e.id !== mergeSourceId);
      const updated = filtered.map(e => e.id === mergeTargetId ? targetAfter : e);
      saveEventsLocalState(updated);
    }

    await logEventGovernanceAction({
      eventId: mergeTargetId,
      actionType: "merge",
      beforeState: { target: targetBefore, sourceDeletedId: mergeSourceId },
      afterState: targetAfter,
      why: `Deduplicated: Merged duplicate event [${sourceEvent.title}]. Reason: ${mergeReason}`,
      source: "Events OS Deduplication Suite"
    });

    toast.success(`डुप्लिकेट घटनाहरू सफलतापूर्वक एकीकृत गरियो! "${sourceEvent.title}" हटाइएको छ।`);
    setMergeSourceId("");
    setMergeTargetId("");
    setMergeReason("");
  };

  // 4. FESTIVAL RECURRENCE SETUP (Nepali Calendar Engine simulation)
  const handleRecurrenceSave = (eventId: string, recurrenceRule: string) => {
    if (!hasGovPerm("events.manage_recurrence")) {
      toast.error("अपर्याप्त अनुमति: तपाईंसँग उत्सव पुनरावृत्ति प्रबन्ध गर्ने अधिकार छैन।");
      return;
    }
    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return;

    const beforeState = { recurrenceRule: targetEvent.recurrenceRule || "none" };
    const afterState = { recurrenceRule: recurrenceRule };

    const updated = events.map(e => e.id === eventId ? { ...e, ...afterState } : e);
    saveEventsLocalState(updated);

    logEventGovernanceAction({
      eventId,
      actionType: "festival_edit",
      beforeState,
      afterState,
      why: `Configured astronomical/Nepali lunar calendar recurrence rule: ${recurrenceRule}`,
      source: "Canonical Nepali Calendar Engine"
    });

    toast.success("उत्सवको तिथिमिति पुनरावृत्ति नियम सफलतापूर्वक लागु गरियो!");
  };

  const handleDeleteEvent = async (eventId: string, title: string) => {
    if (!hasGovPerm("events.delete")) {
      toast.error("अपर्याप्त अनुमति: घटना मेटाउने अधिकार केवल प्रशासकीय भूमिकामा सीमित छ।");
      return;
    }
    if (!window.confirm(`के तपाईं "${title}" घटना पूर्ण रूपमा हटाउन निश्चित हुनुहुन्छ?`)) return;
    
    const targetEvent = events.find(e => e.id === eventId);
    
    try {
      await deleteDoc(doc(db, "events", eventId));
    } catch (err) {
      const updated = events.filter(e => e.id !== eventId);
      saveEventsLocalState(updated);
    }

    await logEventGovernanceAction({
      eventId,
      actionType: "delete",
      beforeState: targetEvent || {},
      afterState: null,
      why: "Editorial Clean-up / Absolute deletion",
      source: "Events OS Admin Override"
    });

    toast.success("घटना सफलतापूर्वक हटाइयो!");
  };

  // Filter List based on search, category and district
  const filteredEvents = events.filter(e => {
    const matchesCategory = filterCategory === "all" || e.nepalHubCategory === filterCategory;
    const matchesDistrict = filterDistrict === "all" || e.district === filterDistrict;
    const matchesSearch = !searchQuery.trim() || 
      (e.title && e.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.district && e.district.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesDistrict && matchesSearch;
  });

  // Separate tab list arrays
  const liveCanonicalEvents = filteredEvents.filter(e => e.status === "published" || e.isCanonical);
  const candidateEvents = filteredEvents.filter(e => e.status === "candidate" || e.status === "draft" || e.status === "verified" || e.status === "retracted");

  // Statistics
  const totalEvents = events.length;
  const liveCount = events.filter(e => e.isLiveOnNepalHub).length;
  const verifiedCount = events.filter(e => e.status === "verified").length;
  const candidateCount = events.filter(e => e.status === "candidate").length;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* ROLE SIMULATION OVERRIDE BAR */}
        <div className="bg-slate-950 text-slate-100 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-3.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Shield size={120} />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black tracking-widest text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-md">
                Dual-Control Governance Simulator
              </span>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Shield size={18} className="text-primary animate-pulse" /> सम्पादकीय भूमिका सिमुलेटर (Newsroom Role Switcher)
              </h2>
              <p className="text-slate-400 text-xs font-medium">
                चार-आँखा सिद्धान्त (Four-Eyes Editorial Principle) र क्षमतामा आधारित भूमिका प्रणाली परीक्षण गर्न भूमिका परिवर्तन गर्नुहोस्।
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 self-start md:self-center">
              <span className="text-xxs text-slate-500 font-bold px-2.5">Active Session:</span>
              <span className="text-xxs font-black px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-xl">
                {ROLE_DEFINITIONS[activeRole]?.nameEn || activeRole}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2">
            {[
              { key: "contributor", label: "Contributor", desc: "Submit Candidate" },
              { key: "researcher", label: "Researcher", desc: "Link Knowledge" },
              { key: "editor", label: "Editor", desc: "Edit & Review" },
              { key: "senior_editor", label: "Senior Editor", desc: "Verify & Publish" },
              { key: "editorial_admin", label: "Editorial Admin", desc: "Retract & Recur" },
              { key: "super_admin", label: "Super Admin", desc: "Full Access" }
            ].map((roleOpt) => {
              const isSelected = activeRole === roleOpt.key;
              return (
                <button
                  key={roleOpt.key}
                  onClick={() => setActiveRoleOverride(roleOpt.key)}
                  className={`p-2.5 rounded-2xl text-left border transition-all flex flex-col justify-between h-16 ${
                    isSelected 
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/25 scale-102"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <span className="text-xs font-black block leading-none">{roleOpt.label}</span>
                  <span className={`text-[9px] font-medium leading-none ${isSelected ? "text-white/80" : "text-slate-500"}`}>
                    {roleOpt.desc}
                  </span>
                </button>
              );
            })}
          </div>
          {activeRoleOverride && (
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" />
                सिमुलेटेड अनुमतिहरू: <b>{ROLE_DEFINITIONS[activeRole]?.descriptionEn}</b>
              </span>
              <button 
                onClick={() => setActiveRoleOverride("")}
                className="text-primary hover:underline font-bold"
              >
                Reset to Original ({actualUserRole})
              </button>
            </div>
          )}
        </div>

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black px-3 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Globe size={14} /> Events OS v3.8 Temporal Truth
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-card-foreground tracking-tight">
              Event Intelligence Workspace
            </h1>
            <p className="text-muted-text text-sm font-medium mt-1">
              सभ्यता र ऐतिहासिक तिथिमितिको शुद्धता र सुरक्षा नियन्त्रण। स्रोत प्रमाणिकरण तथा डुप्लिकेट नियन्त्रण बोर्ड।
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {events.length === 0 && (
              <button
                onClick={handleSeedCivilizationalEvents}
                disabled={seeding}
                className="px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-2 transition-all border border-amber-500/30"
              >
                <Zap size={14} className={seeding ? "animate-spin" : ""} />
                स्वतः सिमुलेसन बीजारोपण
              </button>
            )}
            <Link 
              to="/admin/events/new" 
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
            >
              <Plus size={18} /> नयाँ घटना दर्ता गर्नुहोस्
            </Link>
          </div>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card p-5 rounded-3xl border border-border-theme shadow-sm">
            <span className="text-xs font-black text-muted-text uppercase tracking-wider block mb-1">कुल दर्ता</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-card-foreground font-mono">{totalEvents}</span>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">Active</span>
            </div>
          </div>
          <div className="bg-card p-5 rounded-3xl border border-border-theme shadow-sm">
            <span className="text-xs font-black text-muted-text uppercase tracking-wider block mb-1">नेपाल हब लाइव</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-red-500 font-mono">{liveCount}</span>
              <span className="text-xxs font-black px-1.5 py-0.5 bg-red-500/10 text-red-600 rounded-md animate-pulse">LIVE FEED</span>
            </div>
          </div>
          <div className="bg-card p-5 rounded-3xl border border-border-theme shadow-sm">
            <span className="text-xs font-black text-muted-text uppercase tracking-wider block mb-1">प्रमाणित घटनाक्रम</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-600 font-mono">{verifiedCount}</span>
              <span className="text-xxs font-bold text-muted-text">Verified Sources</span>
            </div>
          </div>
          <div className="bg-card p-5 rounded-3xl border border-border-theme shadow-sm">
            <span className="text-xs font-black text-muted-text uppercase tracking-wider block mb-1">उम्मेदवार बालुवा (Sandbox)</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-purple-600 font-mono">{candidateCount}</span>
              <span className="text-xxs font-bold text-purple-600 bg-purple-500/5 px-2 py-0.5 rounded">Awaiting Review</span>
            </div>
          </div>
        </div>

        {/* WORKSPACE NAVIGATION TABS */}
        <div className="border-b border-border-theme flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: "live", label: "Live Canonical Registry", count: liveCanonicalEvents.length },
            { id: "candidates", label: "Candidate Queue & Governance Flow", count: candidateEvents.length },
            { id: "deduplicate", label: "Deduplication & Merge Center", count: null },
            { id: "audit", label: "Governance Audit Trail", count: governanceLogs.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3.5 font-bold text-xs whitespace-nowrap transition-all border-b-2 -mb-px flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-text hover:text-card-foreground"
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-muted-area text-muted-text"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* SEARCH & FILTER BAR */}
        {activeTab !== "audit" && activeTab !== "deduplicate" && (
          <div className="bg-card p-4 rounded-3xl border border-border-theme shadow-sm grid md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 bg-muted-area/60 px-3 py-2.5 rounded-2xl border border-border-theme/80">
              <Search size={16} className="text-muted-text" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="शीर्षक, स्थान वा जिल्ला खोज्नुहोस्..."
                className="bg-transparent text-xs font-bold text-card-foreground outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2 bg-muted-area/60 px-3 py-2.5 rounded-2xl border border-border-theme/80">
              <Filter size={16} className="text-muted-text" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-transparent text-xs font-bold text-card-foreground outline-none w-full"
              >
                <option value="all">सबै प्रकारका घटनाहरू</option>
                <option value="festivals">जात्रा तथा पर्व (Festivals)</option>
                <option value="national">राष्ट्रिय उत्सव (National)</option>
                <option value="disaster">विपद् तथा सतर्कता (Alerts)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-muted-area/60 px-3 py-2.5 rounded-2xl border border-border-theme/80">
              <MapPin size={16} className="text-muted-text" />
              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="bg-transparent text-xs font-bold text-card-foreground outline-none w-full"
              >
                <option value="all">सबै जिल्लाहरू (Districts)</option>
                {DISTRICTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* TAB CONTENTS */}
        <div className="space-y-4">
          
          {/* TAB 1: LIVE CANONICAL REGISTRY */}
          {activeTab === "live" && (
            <div className="grid gap-4">
              {liveCanonicalEvents.map((event) => (
                <div 
                  key={event.id}
                  className="bg-card p-6 rounded-3xl shadow-sm border border-border-theme flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/20 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-border-theme bg-muted-area">
                      <img src={event.featuredImage || "https://picsum.photos/seed/nepalevent/200/200"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full">
                          {event.district || "नेपाल"}
                        </span>
                        <span className="text-[10px] font-black px-2.5 py-0.5 bg-slate-500/10 text-slate-600 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={10} className="text-emerald-500" /> Canonical Canonical
                        </span>
                        {event.isLiveOnNepalHub && (
                          <span className="text-[10px] font-black px-2.5 py-0.5 bg-red-500/10 text-red-500 rounded-full flex items-center gap-1 animate-pulse">
                            <Radio size={10} /> Live
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-base text-card-foreground">{event.title}</h3>
                      <p className="text-xs text-muted-text leading-relaxed">{event.tagline}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xxs font-semibold text-muted-text pt-0.5">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {event.date}</span>
                        <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
                        {event.sources && (
                          <span className="text-primary font-black flex items-center gap-1">
                            <Check size={12} /> {event.sources.length} Verified Sources
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {hasGovPerm("events.publish") && (
                      <button
                        onClick={() => handleToggleNepalHubLive(event.id, !!event.isLiveOnNepalHub)}
                        className={`px-3 py-2 rounded-xl text-xxs font-bold flex items-center gap-1.5 transition-all border ${
                          event.isLiveOnNepalHub 
                            ? "bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20" 
                            : "bg-muted-area text-muted-text border-border-theme hover:bg-border-theme"
                        }`}
                      >
                        <Radio size={12} />
                        {event.isLiveOnNepalHub ? "Live Active" : "Go Live"}
                      </button>
                    )}

                    {hasGovPerm("events.retract") && (
                      <button
                        onClick={() => setRetractingEventId(event.id)}
                        className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded-xl text-xxs font-bold border border-amber-500/20 transition-all"
                        title="भूल सुधार तथा फिर्ता"
                      >
                        Retract Event
                      </button>
                    )}

                    <Link 
                      to={`/admin/events/${event.id}`} 
                      className="p-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold transition-all"
                    >
                      <Edit size={14} />
                    </Link>
                  </div>
                </div>
              ))}
              {liveCanonicalEvents.length === 0 && (
                <div className="text-center py-12 bg-card rounded-3xl border border-border-theme text-muted-text text-xs">
                  कुनै पनि प्रमाणित र मुख्य क्यानोनिकल घटना फेला परेन।
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CANDIDATE QUEUE & GOVERNANCE FLOW */}
          {activeTab === "candidates" && (
            <div className="grid gap-4">
              
              {/* SPECIAL SYSTEM ALERT */}
              <div className="bg-purple-500/5 p-4 rounded-3xl border border-purple-500/20 flex gap-3 items-start text-xs text-purple-700 dark:text-purple-300">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">सभ्यता प्रमाणिकरण गेटवे (Four-Eyes Gatekeeping)</p>
                  <p className="leading-relaxed">
                    यो खण्ड योगदानकर्ताहरूले पठाएका नयाँ अन-भेरिफाइड मस्यौदारू राख्ने ठाउँ हो। वरिष्ठ सम्पादक वा एड्मिनले कम्तिमा एउटा आधिकारिक सरकारी वा प्रमाणिक स्रोत रुजु नगरेसम्म यी घटनाहरू फिडमा जाँदैनन्।
                  </p>
                </div>
              </div>

              {candidateEvents.map((event) => {
                const isVerified = event.status === "verified";
                const isRetracted = event.status === "retracted";
                
                return (
                  <div 
                    key={event.id}
                    className="bg-card p-6 rounded-3xl shadow-sm border border-border-theme flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-purple-500/20 transition-all relative overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${
                      isRetracted ? "bg-amber-500" : (isVerified ? "bg-teal-500" : "bg-purple-500")
                    }`} />
                    
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-border-theme bg-muted-area">
                        <img src={event.featuredImage || "https://picsum.photos/seed/nepalevent/200/200"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                            isRetracted 
                              ? "bg-amber-500/10 text-amber-600" 
                              : (isVerified ? "bg-teal-500/10 text-teal-600" : "bg-purple-500/10 text-purple-600")
                          }`}>
                            {event.status?.toUpperCase() || "CANDIDATE"}
                          </span>
                          
                          {/* Freshness metrics */}
                          <span className="text-[10px] text-muted-text bg-muted-area px-2 py-0.5 rounded font-mono">
                            Verification Age: {event.verificationAgeHours || 24}h
                          </span>

                          {event.sources && event.sources.length > 0 ? (
                            <span className="text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                              {event.sources.length} Sources Linked
                            </span>
                          ) : (
                            <span className="text-[10px] text-red-500 bg-red-500/10 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                              <AlertTriangle size={10} /> No Sources!
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-base text-card-foreground">{event.title}</h3>
                        <p className="text-xs text-muted-text leading-relaxed">{event.tagline}</p>

                        {/* Listed Sources */}
                        {event.sources && event.sources.length > 0 && (
                          <div className="space-y-1 pt-1.5">
                            <span className="text-[10px] font-black text-muted-text uppercase block">सम्बद्ध प्रमाण तथा स्रोत:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {event.sources.map((src: any) => (
                                <span key={src.id} className="text-[10px] px-2.5 py-1 bg-muted-area text-card-foreground border border-border-theme rounded-md flex items-center gap-1 font-bold">
                                  <LinkIcon size={10} className="text-primary" />
                                  {src.name}
                                  {src.verified ? (
                                    <span className="text-[9px] text-teal-500 bg-teal-500/10 px-1 rounded font-black">Verified</span>
                                  ) : (
                                    <span className="text-[9px] text-amber-500 bg-amber-500/10 px-1 rounded font-black">Raw</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recurrence Rule */}
                        {event.recurrenceRule && (
                          <div className="pt-1 text-[10px] text-purple-600 font-bold flex items-center gap-1">
                            <Calendar size={12} /> पुनरावृत्ति तिथिमिति नियम: <u>{event.recurrenceRule}</u>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                      {/* SOURCE APPROVAL & ADD CITATION */}
                      {hasGovPerm("events.manage_sources") && (
                        <button
                          onClick={() => {
                            setVerifyingEventId(event.id);
                            setVerificationType("official");
                          }}
                          className="px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xxs font-bold rounded-xl border border-primary/20 transition-all flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Source Evidence
                        </button>
                      )}

                      {/* EDIT RECURRING RULES FOR FESTIVALS */}
                      {hasGovPerm("events.manage_recurrence") && (
                        <button
                          onClick={() => {
                            const rule = prompt("नेपाली पञ्चाङ्ग तिथिमिति नियम प्रविष्ट गर्नुहोस् (उदा: Lunar Kartik Shukla Dwadashi):", event.recurrenceRule || "");
                            if (rule !== null) {
                              handleRecurrenceSave(event.id, rule);
                            }
                          }}
                          className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 text-xxs font-bold rounded-xl border border-purple-500/20 transition-all"
                        >
                          Tithi Rule
                        </button>
                      )}

                      {/* VERIFY PROCESS (Senior Editor & above) */}
                      {!isVerified && hasGovPerm("events.verify") && (
                        <button
                          onClick={() => {
                            setVerifyingEventId(event.id);
                          }}
                          className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xxs font-black rounded-xl shadow-md shadow-teal-500/10 transition-all flex items-center gap-1"
                        >
                          <Check size={12} /> Verify Candidate
                        </button>
                      )}

                      {/* CANONICALIZE & PUBLISH */}
                      {isVerified && hasGovPerm("events.publish") && (
                        <button
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, "events", event.id), {
                                status: "published",
                                isCanonical: true,
                                isLiveOnNepalHub: true,
                                publishedBy: activeRole,
                                publishedAt: new Date().toISOString()
                              });
                            } catch (err) {
                              const updated = events.map(e => e.id === event.id ? { ...e, status: "published", isCanonical: true, isLiveOnNepalHub: true } : e);
                              saveEventsLocalState(updated);
                            }
                            await logEventGovernanceAction({
                              eventId: event.id,
                              actionType: "publish",
                              beforeState: { status: "verified" },
                              afterState: { status: "published", isCanonical: true, isLiveOnNepalHub: true },
                              why: "Canonical publication authorized by Senior Editor",
                              source: "Verified Editorial Sandbox"
                            });
                            toast.success("घटना सफलतापुर्वक क्यानोनिकल रेकर्डमा प्रकाशन गरियो!");
                          }}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xxs font-black rounded-xl transition-all flex items-center gap-1"
                        >
                          <Zap size={12} /> Canonical Publish
                        </button>
                      )}

                      <Link 
                        to={`/admin/events/${event.id}`} 
                        className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold transition-all"
                      >
                        <Edit size={14} />
                      </Link>

                      {hasGovPerm("events.delete") && (
                        <button
                          onClick={() => handleDeleteEvent(event.id, event.title)}
                          className="p-2 hover:bg-red-500/10 text-muted-text hover:text-red-500 rounded-xl transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {candidateEvents.length === 0 && (
                <div className="text-center py-12 bg-card rounded-3xl border border-border-theme text-muted-text text-xs">
                  कुनै पनि घटना समीक्षा तथा मस्यौदाको रूपमा खाली छ।
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEDUPLICATION & MERGE CENTER */}
          {activeTab === "deduplicate" && (
            <div className="bg-card p-6 rounded-3xl border border-border-theme space-y-6">
              <div className="flex items-start gap-3 text-xs text-amber-600 bg-amber-500/5 p-4 rounded-3xl border border-amber-500/20">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Deduplication Protocol</p>
                  <p className="leading-relaxed">
                    कुनै पनि जात्रा वा उत्सव दोहोरो रूपमा दर्ता हुन नदिन यहाँबाट एकीकृत (Merge) गर्न सकिन्छ। मर्जर गर्दा स्रोत घटनाका सबै नोड, प्रमाण, र ट्यागहरू मुख्य (गन्तव्य) घटनामा थपिन्छन् र पुराना डुप्लिकेटहरू पूर्ण रूपमा हटाइन्छन्।
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                
                {/* SOURCE SELECT */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-text uppercase block">१. स्रोत डुप्लिकेट घटना (Source Duplicate - Will be deleted)</label>
                  <select
                    value={mergeSourceId}
                    onChange={(e) => setMergeSourceId(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-border-theme bg-muted-area text-card-foreground font-bold outline-none focus:ring-2 focus:ring-primary/20 text-xs"
                  >
                    <option value="">-- स्रोत घटना छनोट गर्नुहोस् --</option>
                    {events.map(e => (
                      <option key={e.id} value={e.id}>
                        [{e.status}] {e.title} ({e.date})
                      </option>
                    ))}
                  </select>
                </div>

                {/* TARGET SELECT */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-text uppercase block">२. क्यानोनिकल गन्तव्य घटना (Destination Canonical - Will absorb details)</label>
                  <select
                    value={mergeTargetId}
                    onChange={(e) => setMergeTargetId(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-border-theme bg-muted-area text-card-foreground font-bold outline-none focus:ring-2 focus:ring-primary/20 text-xs"
                  >
                    <option value="">-- गन्तव्य घटना छनोट गर्नुहोस् --</option>
                    {events.map(e => (
                      <option key={e.id} value={e.id}>
                        [{e.status}] {e.title} ({e.date})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* WHY EXPLANATION */}
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-text uppercase block">३. सम्पादकीय औचित्य तथा प्रमाण (Deduplication Rationale) *</label>
                <textarea
                  value={mergeReason}
                  onChange={(e) => setMergeReason(e.target.value)}
                  placeholder="उदा: दुवै घटनाहरू काठमाडौँको इन्द्रजात्रा येँया पर्वसँग सम्बन्धित हुन्। स्रोत घटनालाई क्यानोनिकल घटनामा एकीकृत गरी सुदृढ गरिएको छ।"
                  rows={3}
                  className="w-full p-4 rounded-2xl border border-border-theme bg-muted-area text-card-foreground text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleMergeEvents}
                  disabled={!hasGovPerm("events.merge")}
                  className="px-8 py-3.5 bg-primary hover:bg-primary/95 text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50"
                >
                  <Merge size={16} /> एकीकृत गर्नुहोस् (Deduplicate & Merge)
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: GOVERNANCE AUDIT TRAIL */}
          {activeTab === "audit" && (
            <div className="bg-card p-6 rounded-3xl border border-border-theme space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-card-foreground flex items-center gap-2">
                    <History size={18} className="text-primary" /> सम्पादकीय इतिहास तथा प्रणाली अडिट लग
                  </h3>
                  <p className="text-xxs text-muted-text">Privileged Event Action Logs. Who, What, When, Before, After, Why, Source.</p>
                </div>
                <button 
                  onClick={() => {
                    localStorage.removeItem("event_governance_logs");
                    setGovernanceLogs([]);
                    toast.success("स्थानीय अडिट लग सफा गरियो।");
                  }}
                  className="text-xxs text-red-500 font-bold hover:underline"
                >
                  Clear Log History
                </button>
              </div>

              <div className="border border-border-theme rounded-2xl overflow-hidden bg-muted-area/30">
                <table className="w-full text-left border-collapse text-xxs font-medium">
                  <thead>
                    <tr className="bg-muted-area border-b border-border-theme text-muted-text font-black uppercase text-[10px]">
                      <th className="p-3.5">WHO (सम्पादक)</th>
                      <th className="p-3.5">WHAT (कार्य)</th>
                      <th className="p-3.5">WHY / REASON (औचित्य)</th>
                      <th className="p-3.5">SOURCE / IP</th>
                      <th className="p-3.5">WHEN (समय)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {governanceLogs.map((log: any) => (
                      <tr key={log.id} className="border-b border-border-theme hover:bg-muted-area/40">
                        <td className="p-3.5">
                          <div className="font-bold text-card-foreground">{log.who.name}</div>
                          <div className="text-[10px] text-muted-text">{log.who.email}</div>
                          <span className="text-[8px] font-black px-1.5 py-0.5 bg-primary/10 text-primary rounded-md uppercase">
                            {log.who.role}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-black px-2 py-1 bg-slate-900 text-white rounded-md uppercase tracking-wider text-[9px]">
                            {log.what}
                          </span>
                        </td>
                        <td className="p-3.5 text-card-foreground max-w-xs break-words">
                          <p className="font-bold">{log.why}</p>
                          {log.before && (
                            <details className="mt-1 text-[9px] text-slate-500 cursor-pointer">
                              <summary className="hover:underline">View Before/After States</summary>
                              <pre className="p-2 bg-slate-950 text-emerald-400 font-mono text-[9px] rounded-lg mt-1 overflow-x-auto max-w-sm">
                                {JSON.stringify({ before: log.before, after: log.after }, null, 2)}
                              </pre>
                            </details>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-primary">{log.source}</div>
                          <code className="text-[9px] text-muted-text">{log.ipSession}</code>
                        </td>
                        <td className="p-3.5 text-muted-text font-mono">
                          {new Date(log.when).toLocaleString("ne-NP")}
                        </td>
                      </tr>
                    ))}
                    {governanceLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-text">
                          कुनै पनि अडिट लग रेकर्ड उपलब्ध छैन। प्रणालीमा कुनै पनि कार्य भएपछि यहाँ स्वतः रेकर्ड रहनेछ।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* VERIFICATION DIALOG MODAL */}
      {verifyingEventId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card w-full max-w-lg rounded-3xl border border-border-theme p-6 sm:p-8 space-y-6 shadow-2xl relative"
          >
            <button 
              onClick={() => setVerifyingEventId(null)}
              className="absolute top-4 right-4 p-2 text-muted-text hover:text-card-foreground rounded-full transition-colors"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-md">
                Verification Protocol Gate
              </span>
              <h3 className="text-xl font-black text-card-foreground">घटना तथा प्रमाण रुजु फारम</h3>
              <p className="text-xs text-muted-text leading-relaxed">
                यस घटनाक्रमको ऐतिहासिक, भौगोलिक वा धार्मिक तिथिमितिको सत्यता पुष्टि गर्न सम्बद्ध विश्वसनीय प्रमाण खुलाउनुहोस्।
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider">प्रमाणको प्रकार (Evidence Category)</label>
                <select
                  value={verificationType}
                  onChange={(e) => setVerificationType(e.target.value as any)}
                  className="w-full p-3.5 rounded-2xl border border-border-theme bg-muted-area text-xs font-bold outline-none text-card-foreground"
                >
                  <option value="official">सरकारी/गुठी संस्थान बुलेटिन (Trusted Official Source)</option>
                  <option value="field">फिल्ड रिपोर्टिङ/स्थान प्रमाण (Field Verification)</option>
                  <option value="media">राष्ट्रिय मूलधारको सञ्चारमाध्यम (Mainstream National Media)</option>
                  <option value="crowdsourced">सभ्यता योगदानकर्ता दाबी (Corroborated Contributor Claim)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider">आधिकारिक स्रोत/लिङ्क (Citation / Trusted Source) *</label>
                <input
                  type="text"
                  value={verificationSource}
                  onChange={(e) => setVerificationSource(e.target.value)}
                  placeholder="उदा: पशुपति क्षेत्र विकास कोष पर्व बुलेटिन २०८३, गोरखापत्र समाचार"
                  className="w-full p-3.5 rounded-2xl border border-border-theme bg-muted-area text-xs font-bold outline-none text-card-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider">सम्पादकीय पुष्टीकरण र विश्लेषण (Editorial Justification) *</label>
                <textarea
                  value={verificationWhy}
                  onChange={(e) => setVerificationWhy(e.target.value)}
                  placeholder="उदा: पशुपति क्षेत्र विकास कोषले तोकेको महाशिवरात्रीको शुभ साइत र तिथिमिति पञ्चाङ्ग समितिसँग दाँजेर प्रमाणीकरण गरिएको।"
                  rows={3}
                  className="w-full p-3.5 rounded-2xl border border-border-theme bg-muted-area text-xs font-medium outline-none text-card-foreground"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVerifyingEventId(null)}
                className="flex-1 py-3 bg-muted-area text-card-foreground rounded-2xl text-xs font-bold border border-border-theme hover:bg-border-theme"
              >
                रद्द गर्नुहोस्
              </button>
              <button
                type="button"
                onClick={handleVerifyEventSubmit}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-black"
              >
                पुष्टि र प्रमाणित गर्नुहोस्
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* RETRACTION OVERLAY MODAL */}
      {retractingEventId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card w-full max-w-lg rounded-3xl border border-border-theme p-6 sm:p-8 space-y-6 shadow-2xl relative"
          >
            <button 
              onClick={() => setRetractingEventId(null)}
              className="absolute top-4 right-4 p-2 text-muted-text hover:text-card-foreground rounded-full transition-colors"
            >
              <X size={18} />
            </button>

            <div className="space-y-1 text-amber-600">
              <span className="text-[10px] font-black uppercase bg-amber-500/10 px-2 py-0.5 rounded-md">
                Critical Correction Portal
              </span>
              <h3 className="text-xl font-black flex items-center gap-2">
                <AlertTriangle size={20} /> प्रकाशित घटना फिर्ता (Retract) लिने फारम
              </h3>
              <p className="text-xs text-muted-text leading-relaxed">
                यस कार्यले घटनालाई नेपाल हब फिड र सार्वजनिक सञ्जालबाट तत्काल रोक्का गरी ड्राफ्ट मोडमा फर्काउँछ। अडिट ट्रायलमा यसको पूर्ण विवरण स्थायी रहनेछ।
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider">फिर्ता लिनुको चित्तबुझ्दो कारण (Retraction Cause) *</label>
                <textarea
                  value={retractionWhy}
                  onChange={(e) => setRetractionWhy(e.target.value)}
                  placeholder="उदा: खगोलीय गणना परिवर्तनका कारण पर्वको नेपाली तिथिमा गम्भीर त्रुटि फेला परेकोले संशोधनका लागि फिर्ता गरिएको।"
                  rows={4}
                  className="w-full p-4 rounded-2xl border border-border-theme bg-muted-area text-xs font-medium outline-none text-card-foreground"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRetractingEventId(null)}
                className="flex-1 py-3 bg-muted-area text-card-foreground rounded-2xl text-xs font-bold border border-border-theme hover:bg-border-theme"
              >
                रद्द गर्नुहोस्
              </button>
              <button
                type="button"
                onClick={handleRetractEventSubmit}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black"
              >
                फिर्ता गर्नुहोस् (Retract & De-publish)
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </AdminLayout>
  );
}
