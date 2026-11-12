import React, { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { 
  Compass, Calendar, TrendingUp, MapPin, BookOpen, FileText, DollarSign, BarChart3, 
  Plus, Search, Edit3, Trash2, CheckCircle, AlertTriangle, RefreshCw, Sparkles, 
  Globe, Sun, Moon, Shield, Save, Eye, Layers, ArrowUpRight, Check, X, Radio, Pin, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, safeOnSnapshot } from "@/src/lib/firebase";
import { collection, query, orderBy, getDocs, serverTimestamp } from "@/src/lib/firebase";
import { Link } from "react-router-dom";
import { offlineQueue } from "@/src/lib/offlineQueue";
import NepaliCalendarPickerModal from "@/src/components/ui/NepaliCalendarPickerModal";
import { snapshotEngine } from "@/src/services/snapshotEngine";

export default function AdminNepalHubPage() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'panchang' | 'markets' | 'districts' | 'knowledge' | 'briefings' | 'sponsors' | 'analytics' | 'live'>('calendar');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showBsDatePickerModal, setShowBsDatePickerModal] = useState(false);

  // Live Updates state for Admin Panel
  const [liveUpdates, setLiveUpdates] = useState<any[]>([]);

  // State for modules
  const [festivals, setFestivals] = useState<any[]>([
    { id: '1', title: 'महाशिवरात्रि', dateBS: '२०८२ फागुन १४', dateAD: '2026-02-26', category: 'चाडपर्व', province: 'वाग्मती प्रदेश', importance: 'राष्ट्रीय', featured: true },
    { id: '2', title: 'फागु पूर्णिमा (होली)', dateBS: '२०८२ फागुन २१', dateAD: '2026-03-05', category: 'चाडपर्व', province: 'सम्पूर्ण', importance: 'राष्ट्रीय', featured: true },
    { id: '3', title: 'घोडेजात्रा', dateBS: '२०८२ चैत्र ०६', dateAD: '2026-03-19', category: 'सांस्कृतिक', province: 'वाग्मती प्रदेश', importance: 'क्षेत्रीय', featured: false },
    { id: '4', title: 'नयाँ वर्ष २०८३', dateBS: '२०८३ वैशाख ०१', dateAD: '2026-04-14', category: 'राष्ट्रिय', province: 'सम्पूर्ण', importance: 'राष्ट्रीय', featured: true },
  ]);

  const [panchangData, setPanchangData] = useState({
    dateBS: '२०८२ फागुन १२, मंगलबार',
    tithi: 'चतुर्दशी (बिहान १०:१५ सम्म, उप्रान्त पूर्णिमा)',
    nakshatra: 'मघा नक्षत्र (रात्री ०८:४० सम्म)',
    yoga: 'शिव योग',
    karana: 'वणिज करण',
    sunrise: '०६:३२ बिहान',
    sunset: '०५:५८ बेलुकी',
    auspiciousTime: '११:४५ देखि १२:३२ (अभिजित मुहूर्त)'
  });

  const [markets, setMarkets] = useState<any[]>([
    { id: '1', symbol: 'USD/NPR', name: 'अमेरिकी डलर', buy: '१३३.४५', sell: '१३४.०५', change: '+0.15%', source: 'Nepal Rastra Bank API' },
    { id: '2', symbol: 'EUR/NPR', name: 'युरो', buy: '१४४.20', sell: '१४४.85', change: '-0.22%', source: 'Nepal Rastra Bank API' },
    { id: '3', symbol: 'GOLD (10g)', name: 'छापावाल सुन (प्रतिका)', buy: '१,४८,५००', sell: '१,४९,१००', change: '+५००', source: 'Gold Traders Federation' },
    { id: '4', symbol: 'SILVER (10g)', name: 'चाँदी', buy: '१,८५०', sell: '१,८६५', change: 'स्थिर', source: 'Gold Traders Federation' },
    { id: '5', symbol: 'PETROL (L)', name: 'पेट्रोल (प्रति लिटर)', buy: '१७५.००', sell: '१७५.००', change: 'स्थिर', source: 'Nepal Oil Corporation' }
  ]);

  const [districts, setDistricts] = useState<any[]>([
    { id: '1', name: 'काठमाडौं', province: 'वाग्मती प्रदेश', noticesCount: 14, alert: 'सडक मर्मत सम्बन्धी सूचना', status: 'सक्रिय' },
    { id: '2', name: 'पोखरा (कास्की)', province: 'गण्डकी प्रदेश', noticesCount: 9, alert: 'फेवाताल सरसफाई अभियान', status: 'सक्रिय' },
    { id: '3', name: 'ललितपुर', province: 'वाग्मती प्रदेश', noticesCount: 11, alert: 'पाटन जात्रा सुरक्षा प्रबन्ध', status: 'सक्रिय' },
    { id: '4', name: 'विराटनगर (मोरङ)', province: 'कोशी प्रदेश', noticesCount: 8, alert: 'औद्योगिक मेला उद्घाटन', status: 'सक्रिय' },
    { id: '5', name: 'बटवल (रूपन्देही)', province: 'लुम्बिनी प्रदेश', noticesCount: 7, alert: 'लुम्बिनी भ्रमण वर्ष प्रचार', status: 'सक्रिय' }
  ]);

  const [knowledgeEntities, setKnowledgeEntities] = useState<any[]>([
    { id: '1', title: 'पशुपतिनाथ मन्दिर', type: 'मन्दिर', province: 'वाग्मती प्रदेश', articlesLinked: 42 },
    { id: '2', title: 'मुक्तिनाथ क्षेत्र', type: 'तीर्थस्थल', province: 'गण्डकी प्रदेश', articlesLinked: 28 },
    { id: '3', title: 'महाभारत ग्रन्थ', type: 'शास्त्र', province: 'राष्ट्रिय', articlesLinked: 156 },
    { id: '4', title: 'सीता मन्दिर (जनकपुर)', type: 'मन्दिर', province: 'मधेश प्रदेश', articlesLinked: 35 }
  ]);

  const [briefings, setBriefings] = useState<any[]>([
    { id: '1', title: 'बिहानको मुख्य सारांश (Morning Brief)', date: '२०८२ फागुन १२', author: 'मुख्य सम्पादक', status: 'प्रकाशित' },
    { id: '2', title: 'साँझको बजार तथा अर्थ विशेष', date: '२०८२ फागुन ११', author: 'अर्थ डेस्क', status: 'प्रकाशित' },
    { id: '3', title: 'शिवरात्रि विशेष सांस्कृतिक बुलेटिन', date: '२०८२ फागुन १४ (प्रस्तावित)', author: 'संस्कृति अनुसन्धान', status: 'ड्राफ्ट' }
  ]);

  const [sponsors, setSponsors] = useState<any[]>([
    { id: '1', slot: "आजको बजार पल्स प्रायोजक", sponsorName: "Nabil Bank Ltd.", status: "सक्रिय", validTill: "2026-03-31" },
    { id: '2', slot: "चाडपर्व काउन्टर विशेष", sponsorName: "Chaudhary Group", status: "सक्रिय", validTill: "2026-04-15" },
    { id: '3', slot: "जिल्ला स्पटलाइट ब्यानर", sponsorName: "IME Remittance", status: "रिजर्भ", validTill: "2026-05-01" }
  ]);

  // Modal State for Nepal Hub OS CRUD
  const [activeModal, setActiveModal] = useState<'festival' | 'market' | 'district' | 'briefing' | 'sponsor' | 'live' | null>(null);
  const [modalItem, setModalItem] = useState<any>(null);

  // Load Nepal Hub data from Firestore
  useEffect(() => {
    const loadFirestoreData = async () => {
      try {
        const festSnap = await getDocs(collection(db, "nepal_hub_festivals"));
        if (!festSnap.empty) setFestivals(festSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const mktSnap = await getDocs(collection(db, "nepal_hub_markets"));
        if (!mktSnap.empty) setMarkets(mktSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const distSnap = await getDocs(collection(db, "nepal_hub_districts"));
        if (!distSnap.empty) setDistricts(distSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const briefSnap = await getDocs(collection(db, "nepal_hub_briefings"));
        if (!briefSnap.empty) setBriefings(briefSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const sponSnap = await getDocs(collection(db, "nepal_hub_sponsors"));
        if (!sponSnap.empty) setSponsors(sponSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.warn("Nepal Hub Firestore load warning:", err);
      }
    };
    loadFirestoreData();

    // Live updates subscription
    const unsubLive = safeOnSnapshot(
      query(collection(db, "nepal_hub_live_updates"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setLiveUpdates(items);
      },
      "admin_nepal_hub_live"
    );

    return () => unsubLive();
  }, []);

  const triggerNotification = (msg: string) => {
    setSuccessMessage(msg);
    snapshotEngine.triggerPublishRebuild("admin_nepal_hub");
    setTimeout(() => setSuccessMessage(""), 3500);
  };

  const handleSavePanchang = async () => {
    offlineQueue.queueAction({
      type: 'CUSTOM',
      collection: 'nepal_hub',
      docId: 'panchang',
      data: panchangData
    });
    triggerNotification("पञ्चाङ्ग डाटा सफलतापुर्वक सेभ भयो!");
  };

  // CRUD Handlers for Nepal Hub OS
  const handleSaveFestival = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItem?.title) return;
    const id = modalItem.id || `fest-${Date.now()}`;
    const payload = {
      id,
      title: modalItem.title,
      dateBS: modalItem.dateBS || '२०८३ साउन १०',
      dateAD: modalItem.dateAD || '2026-07-26',
      category: modalItem.category || 'चाडपर्व',
      province: modalItem.province || 'सम्पूर्ण',
      importance: modalItem.importance || 'राष्ट्रीय',
      featured: modalItem.featured ?? true
    };

    offlineQueue.queueAction({
      type: 'CUSTOM',
      collection: 'nepal_hub_festivals',
      docId: id,
      data: payload
    });

    if (modalItem.id) {
      setFestivals(prev => prev.map(f => f.id === id ? payload : f));
      triggerNotification("चाडपर्व सम्पादन भयो!");
    } else {
      setFestivals(prev => [payload, ...prev]);
      triggerNotification("नयाँ चाडपर्व सफलतापुर्वक थपियो!");
    }
    setActiveModal(null);
  };

  const handleDeleteFestival = async (id: string) => {
    if (!confirm("के तपाईं यो चाडपर्व हटाउन चाहनुहुन्छ?")) return;
    offlineQueue.queueAction({
      type: 'ARTICLE_DELETE',
      collection: 'nepal_hub_festivals',
      docId: id
    });
    setFestivals(prev => prev.filter(f => f.id !== id));
    triggerNotification("चाडपर्व हटाइयो!");
  };

  const handleSaveMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItem?.name) return;
    const id = modalItem.id || `mkt-${Date.now()}`;
    const payload = {
      id,
      symbol: modalItem.symbol || 'NPR',
      name: modalItem.name,
      buy: modalItem.buy || '०',
      sell: modalItem.sell || '०',
      change: modalItem.change || 'स्थिर',
      source: modalItem.source || 'नेपाल राष्ट्र बैंक'
    };

    offlineQueue.queueAction({
      type: 'CUSTOM',
      collection: 'nepal_hub_markets',
      docId: id,
      data: payload
    });

    if (modalItem.id) {
      setMarkets(prev => prev.map(m => m.id === id ? payload : m));
      triggerNotification("बजार दर सम्पादन भयो!");
    } else {
      setMarkets(prev => [...prev, payload]);
      triggerNotification("नयाँ बजार दर थपियो!");
    }
    setActiveModal(null);
  };

  const handleDeleteMarket = async (id: string) => {
    if (!confirm("के तपाईं यो बजार दर हटाउन चाहनुहुन्छ?")) return;
    offlineQueue.queueAction({
      type: 'ARTICLE_DELETE',
      collection: 'nepal_hub_markets',
      docId: id
    });
    setMarkets(prev => prev.filter(m => m.id !== id));
    triggerNotification("बजार दर हटाइयो!");
  };

  const handleSaveDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItem?.name) return;
    const id = modalItem.id || `dist-${Date.now()}`;
    const payload = {
      id,
      name: modalItem.name,
      province: modalItem.province || 'वाग्मती प्रदेश',
      noticesCount: modalItem.noticesCount || 1,
      alert: modalItem.alert || 'सामान्य सूचना',
      status: modalItem.status || 'सक्रिय'
    };

    offlineQueue.queueAction({
      type: 'CUSTOM',
      collection: 'nepal_hub_districts',
      docId: id,
      data: payload
    });

    if (modalItem.id) {
      setDistricts(prev => prev.map(d => d.id === id ? payload : d));
      triggerNotification("जिल्ला डाटा सम्पादन भयो!");
    } else {
      setDistricts(prev => [...prev, payload]);
      triggerNotification("नयाँ जिल्ला थपियो!");
    }
    setActiveModal(null);
  };

  const handleDeleteDistrict = async (id: string) => {
    if (!confirm("के तपाईं यो जिल्ला हटाउन चाहनुहुन्छ?")) return;
    offlineQueue.queueAction({
      type: 'ARTICLE_DELETE',
      collection: 'nepal_hub_districts',
      docId: id
    });
    setDistricts(prev => prev.filter(d => d.id !== id));
    triggerNotification("जिल्ला हटाइयो!");
  };

  const handleSaveBriefing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItem?.title) return;
    const id = modalItem.id || `brief-${Date.now()}`;
    const payload = {
      id,
      title: modalItem.title,
      date: modalItem.date || '२०८३ साउन १०',
      author: modalItem.author || 'मुख्य सम्पादक',
      status: modalItem.status || 'प्रकाशित'
    };

    offlineQueue.queueAction({
      type: 'CUSTOM',
      collection: 'nepal_hub_briefings',
      docId: id,
      data: payload
    });

    if (modalItem.id) {
      setBriefings(prev => prev.map(b => b.id === id ? payload : b));
      triggerNotification("बुलेटिन सम्पादन भयो!");
    } else {
      setBriefings(prev => [payload, ...prev]);
      triggerNotification("नयाँ बुलेटिन थपियो!");
    }
    setActiveModal(null);
  };

  const handleDeleteBriefing = async (id: string) => {
    if (!confirm("के तपाईं यो बुलेटिन हटाउन चाहनुहुन्छ?")) return;
    offlineQueue.queueAction({
      type: 'ARTICLE_DELETE',
      collection: 'nepal_hub_briefings',
      docId: id
    });
    setBriefings(prev => prev.filter(b => b.id !== id));
    triggerNotification("बुलेटिन हटाइयो!");
  };

  const handleSaveSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItem?.sponsorName) return;
    const id = modalItem.id || `spon-${Date.now()}`;
    const payload = {
      id,
      slot: modalItem.slot || 'विशेष विजेट',
      sponsorName: modalItem.sponsorName,
      status: modalItem.status || 'सक्रिय',
      validTill: modalItem.validTill || '2026-12-31'
    };

    offlineQueue.queueAction({
      type: 'CUSTOM',
      collection: 'nepal_hub_sponsors',
      docId: id,
      data: payload
    });

    if (modalItem.id) {
      setSponsors(prev => prev.map(s => s.id === id ? payload : s));
      triggerNotification("प्रायोजक सम्पादन भयो!");
    } else {
      setSponsors(prev => [...prev, payload]);
      triggerNotification("नयाँ प्रायोजक थपियो!");
    }
    setActiveModal(null);
  };

  const handleDeleteSponsor = async (id: string) => {
    if (!confirm("के तपाईं यो प्रायोजक हटाउन चाहनुहुन्छ?")) return;
    offlineQueue.queueAction({
      type: 'ARTICLE_DELETE',
      collection: 'nepal_hub_sponsors',
      docId: id
    });
    setSponsors(prev => prev.filter(s => s.id !== id));
    triggerNotification("प्रायोजक हटाइयो!");
  };

  const handleSaveLiveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItem?.title || !modalItem?.content) return;
    const id = modalItem.id || `live-${Date.now()}`;
    const payload = {
      id,
      title: modalItem.title,
      content: modalItem.content,
      category: modalItem.category || 'national',
      urgency: modalItem.urgency || 'normal',
      badge: modalItem.badge || 'समाचार कक्ष लाइभ',
      pinned: Boolean(modalItem.pinned),
      authorName: modalItem.authorName || 'एडमिन डेक्स',
      authorRole: modalItem.authorRole || 'प्रशासक',
      time: modalItem.time || 'भर्खरै',
      createdAt: modalItem.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    offlineQueue.queueAction({
      type: 'CUSTOM',
      collection: 'nepal_hub_live_updates',
      docId: id,
      data: payload
    });
    triggerNotification(modalItem.id ? "लाइभ बुलेटिन सम्पादन भयो!" : "नयाँ लाइभ बुलेटिन प्रकाशित भयो!");
    setActiveModal(null);
  };

  const handleDeleteLiveUpdate = async (id: string) => {
    if (!confirm("के तपाईं यो लाइभ बुलेटिन हटाउन चाहनुहुन्छ?")) return;
    offlineQueue.queueAction({
      type: 'ARTICLE_DELETE',
      collection: 'nepal_hub_live_updates',
      docId: id
    });
    triggerNotification("लाइभ बुलेटिन हटाइयो!");
  };

  const handleSyncNRB = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      triggerNotification("नेपाल राष्ट्र बैंक API र सुन-चाँदी बजार डाटा सफलतापूर्वक सिंक भयो!");
    }, 1200);
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 space-y-6">
        {/* Top Header Bar */}
        <header className="bg-card rounded-2xl border border-border-theme p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Compass size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-card-foreground">नेपाल हब OS (Live Intelligence Engine)</h1>
              <p className="text-xs text-muted-text font-medium">राष्ट्रिय क्यालेन्डर, पञ्चाङ्ग, बजार इन्टेलिजेन्स, र जिल्ला सञ्जाल व्यवस्थापन</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncNRB}
              disabled={isLoading}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              लाइभ डाटा सिंक गर्नुहोस्
            </button>
          </div>
        </header>

        {/* Success Banner */}
        <AnimatePresence>
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-emerald-500 text-white px-6 py-3 font-bold text-xs flex items-center justify-between shadow-md"
            >
              <div className="flex items-center gap-2">
                <CheckCircle size={16} />
                {successMessage}
              </div>
              <button onClick={() => setSuccessMessage("")}><X size={16} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Tabs */}
        <div className="bg-card border-b border-border-theme px-6 py-2 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          {[
            { id: 'calendar', label: 'क्यालेन्डर & चाडपर्व', icon: Calendar },
            { id: 'live', label: 'राष्ट्रिय लाइभ ब्रोडकास्ट OS', icon: Radio },
            { id: 'panchang', label: 'पञ्चाङ्ग OS', icon: Sun },
            { id: 'markets', label: 'बजार इन्टेलिजेन्स', icon: TrendingUp },
            { id: 'districts', label: 'जिल्ला सञ्जाल', icon: MapPin },
            { id: 'knowledge', label: 'नलेज ग्राफ', icon: BookOpen },
            { id: 'briefings', label: 'दैनिक बुलेटिन', icon: FileText },
            { id: 'sponsors', label: 'प्रायोजन & रेभेन्यु', icon: DollarSign },
            { id: 'analytics', label: 'एनालिटिक्स', icon: BarChart3 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-md shadow-primary/20' 
                  : 'text-muted-text hover:bg-muted-area hover:text-card-foreground'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <main className="p-6 md:p-8 max-w-7xl mx-auto">
          
          {/* 1. Calendar & Festival OS */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-card-foreground">चाडपर्व तथा राष्ट्रिय पर्व व्यवस्थापन</h2>
                  <p className="text-xs text-muted-text">नेपाली पात्रो अनुसार चाडपर्व, बिदा र विशेष तिथिको क्युरेसन</p>
                </div>
                <button 
                  onClick={() => {
                    setModalItem({ title: '', dateBS: '', dateAD: '', category: 'चाडपर्व', province: 'सम्पूर्ण', importance: 'राष्ट्रीय', featured: true });
                    setActiveModal('festival');
                  }}
                  className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/20 transition-all border border-primary/20"
                >
                  <Plus size={16} /> चाडपर्व थप्नुहोस्
                </button>
              </div>

              <div className="bg-card rounded-2xl border border-border-theme shadow-sm overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-muted-area/50 text-[11px] font-black uppercase text-muted-text border-b border-border-theme">
                      <th className="p-4">चाडपर्व शीर्षक</th>
                      <th className="p-4">नेपाली मिति (BS)</th>
                      <th className="p-4">अंग्रेजी मिति (AD)</th>
                      <th className="p-4">वर्ग</th>
                      <th className="p-4">प्रदेश / क्षेत्र</th>
                      <th className="p-4">महत्व</th>
                      <th className="p-4 text-right">कार्य</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-theme text-xs font-bold">
                    {festivals.map((fest) => (
                      <tr key={fest.id} className="hover:bg-muted-area/30 transition-colors">
                        <td className="p-4 font-black text-card-foreground flex items-center gap-2">
                          {fest.title}
                          {fest.featured && <span className="bg-primary/10 text-primary text-[9px] px-2 py-0.5 rounded-full font-black">विशेष</span>}
                        </td>
                        <td className="p-4">{fest.dateBS}</td>
                        <td className="p-4 font-mono text-muted-text">{fest.dateAD}</td>
                        <td className="p-4"><span className="bg-amber-500/10 text-amber-600 px-2.5 py-1 rounded-md">{fest.category}</span></td>
                        <td className="p-4">{fest.province}</td>
                        <td className="p-4"><span className="text-primary font-black">{fest.importance}</span></td>
                        <td className="p-4 text-right space-x-2">
                          <button 
                            onClick={() => { setModalItem(fest); setActiveModal('festival'); }} 
                            className="p-1.5 hover:bg-primary/10 text-primary rounded-lg"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteFestival(fest.id)} 
                            className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Panchang OS */}
          {activeTab === 'panchang' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-card-foreground">दैनिक पञ्चाङ्ग OS</h2>
                  <p className="text-xs text-muted-text">तिथि, नक्षत्र, योग, करण, सूर्योदय र सूर्यास्तको स्वचालन इन्जिन</p>
                </div>
                <button 
                  onClick={handleSavePanchang}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-primary/90"
                >
                  <Save size={16} /> पञ्चाङ्ग सेभ गर्नुहोस्
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { label: "मिति (BS)", value: panchangData.dateBS, key: "dateBS", isDateBs: true },
                  { label: "तिथि", value: panchangData.tithi, key: "tithi" },
                  { label: "नक्षत्र", value: panchangData.nakshatra, key: "nakshatra" },
                  { label: "योग", value: panchangData.yoga, key: "yoga" },
                  { label: "करण", value: panchangData.karana, key: "karana" },
                  { label: "सूर्योदय", value: panchangData.sunrise, key: "sunrise" },
                  { label: "सूर्यास्त", value: panchangData.sunset, key: "sunset" },
                  { label: "शुभ समय / मुहूर्त", value: panchangData.auspiciousTime, key: "auspiciousTime" },
                ].map((item, idx) => (
                  <div key={idx} className="bg-card p-6 rounded-2xl border border-border-theme shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-muted-text uppercase tracking-wider">{item.label}</span>
                      {item.isDateBs && (
                        <button
                          type="button"
                          onClick={() => setShowBsDatePickerModal(true)}
                          className="px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-black flex items-center gap-1 border border-purple-500/20 transition-all shadow-sm"
                        >
                          <Calendar size={12} />
                          <span>नेपाली पात्रो (BS Calendar)</span>
                        </button>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={item.value} 
                      onChange={(e) => setPanchangData({ ...panchangData, [item.key]: e.target.value })}
                      className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-sm font-bold text-card-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <NepaliCalendarPickerModal
            isOpen={showBsDatePickerModal}
            onClose={() => setShowBsDatePickerModal(false)}
            initialValue={panchangData.dateBS}
            onSelectDate={(formattedBsDate) => {
              setPanchangData(prev => ({ ...prev, dateBS: formattedBsDate }));
            }}
          />

          {/* 3. Market Intelligence OS */}
          {activeTab === 'markets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-card-foreground">बजार इन्टेलिजेन्स OS (Forex & Bullion)</h2>
                  <p className="text-xs text-muted-text">नेपाल राष्ट्र बैंक, सुन-चाँदी महासंघ तथा नेपाल आयल निगमको सिंक डाटा</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setModalItem({ symbol: '', name: '', buy: '', sell: '', change: 'स्थिर', source: 'नेपाल राष्ट्र बैंक' });
                      setActiveModal('market');
                    }}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-primary/90"
                  >
                    <Plus size={16} /> नयाँ दर थप्नुहोस्
                  </button>
                  <button 
                    onClick={handleSyncNRB}
                    className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl text-xs font-bold border border-primary/20"
                  >
                    <RefreshCw size={16} /> NRB API सिंक
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {markets.map((m) => (
                  <div key={m.id} className="bg-card p-6 rounded-2xl border border-border-theme shadow-sm space-y-4 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black bg-primary/10 text-primary px-3 py-1 rounded-full">{m.symbol}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">{m.change}</span>
                        <button onClick={() => { setModalItem(m); setActiveModal('market'); }} className="p-1 hover:bg-primary/10 text-primary rounded"><Edit3 size={13} /></button>
                        <button onClick={() => handleDeleteMarket(m.id)} className="p-1 hover:bg-red-500/10 text-red-500 rounded"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-card-foreground">{m.name}</h3>
                      <p className="text-[11px] text-muted-text font-medium mt-0.5">स्रोत: {m.source}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border-theme/60">
                      <div>
                        <span className="text-[10px] text-muted-text font-bold">खरिद दर</span>
                        <p className="text-sm font-black text-card-foreground">रू {m.buy}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-text font-bold">बिक्री दर</span>
                        <p className="text-sm font-black text-card-foreground">रू {m.sell}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. District Intelligence OS */}
          {activeTab === 'districts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-card-foreground">जिल्ला तथा नगरपालिका इन्टेलिजेन्स OS</h2>
                  <p className="text-xs text-muted-text">Federation tenants र स्थानीय तहका सूचनाहरूको स्वचालन</p>
                </div>
                <button 
                  onClick={() => {
                    setModalItem({ name: '', province: 'वाग्मती प्रदेश', noticesCount: 1, alert: 'सामान्य सूचना', status: 'सक्रिय' });
                    setActiveModal('district');
                  }}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md"
                >
                  <Plus size={16} /> जिल्ला जोड्नुहोस्
                </button>
              </div>

              <div className="bg-card rounded-2xl border border-border-theme shadow-sm overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-muted-area/50 text-[11px] font-black uppercase text-muted-text border-b border-border-theme">
                      <th className="p-4">जिल्ला / स्थानीय तह</th>
                      <th className="p-4">प्रदेश</th>
                      <th className="p-4">सक्रिय सूचनाहरू</th>
                      <th className="p-4">ताजा आपतकालीन अलर्ट</th>
                      <th className="p-4">स्थिति</th>
                      <th className="p-4 text-right">कार्य</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-theme text-xs font-bold">
                    {districts.map((d) => (
                      <tr key={d.id} className="hover:bg-muted-area/30 transition-colors">
                        <td className="p-4 font-black text-card-foreground">{d.name}</td>
                        <td className="p-4">{d.province}</td>
                        <td className="p-4 font-mono">{d.noticesCount} वटा</td>
                        <td className="p-4 text-amber-600 font-semibold">{d.alert}</td>
                        <td className="p-4"><span className="bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full">{d.status}</span></td>
                        <td className="p-4 text-right space-x-2">
                          <button onClick={() => { setModalItem(d); setActiveModal('district'); }} className="p-1.5 hover:bg-primary/10 text-primary rounded-lg"><Edit3 size={14} /></button>
                          <button onClick={() => handleDeleteDistrict(d.id)} className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. Cultural Knowledge OS */}
          {activeTab === 'knowledge' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-card-foreground">सरस्वती नलेज ग्राफ इन्टिग्रेशन</h2>
                  <p className="text-xs text-muted-text">चाडपर्व, मन्दिर र शास्त्रहरूलाई लेख र मिडियासँग जोड्ने इन्जिन</p>
                </div>
                <a href="/admin/knowledge" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-primary/90">
                  <Plus size={16} /> नलेज हब खुला गर्नुहोस्
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {knowledgeEntities.map((k) => (
                  <div key={k.id} className="bg-card p-6 rounded-2xl border border-border-theme shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-md">{k.type}</span>
                      <h3 className="text-base font-black text-card-foreground mt-2">{k.title}</h3>
                      <p className="text-xs text-muted-text">{k.province}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-card-foreground">{k.articlesLinked}</span>
                      <p className="text-[10px] text-muted-text font-bold">सम्बद्ध लेखहरू</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Daily Briefing OS */}
          {activeTab === 'briefings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-card-foreground">दैनिक बुलेटिन OS (Briefings)</h2>
                  <p className="text-xs text-muted-text">Morning/Evening Briefs र Festival Specials का लागि सम्पादन</p>
                </div>
                <button 
                  onClick={() => {
                    setModalItem({ title: '', date: '२०८३ साउन १०', author: 'मुख्य सम्पादक', status: 'प्रकाशित' });
                    setActiveModal('briefing');
                  }}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md"
                >
                  <Plus size={16} /> बुलेटिन थप्नुहोस्
                </button>
              </div>

              <div className="space-y-4">
                {briefings.map((b) => (
                  <div key={b.id} className="bg-card p-6 rounded-2xl border border-border-theme shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded ${b.status === 'प्रकाशित' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>{b.status}</span>
                        <span className="text-xs font-mono text-muted-text">{b.date}</span>
                      </div>
                      <h3 className="text-base font-black text-card-foreground">{b.title}</h3>
                      <p className="text-xs text-muted-text">लेखक / क्युरेटर: {b.author}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setModalItem(b); setActiveModal('briefing'); }} className="px-4 py-2 bg-muted-area hover:bg-muted-area/80 text-card-foreground rounded-xl text-xs font-bold">सम्पादन</button>
                      <button onClick={() => handleDeleteBriefing(b.id)} className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold">हटाउनुहोस्</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Sponsorship & Revenue OS */}
          {activeTab === 'sponsors' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-card-foreground">प्रायोजन तथा रेभेन्यु OS (Sponsors)</h2>
                  <p className="text-xs text-muted-text">नेपाल हबका विशेष विजेट तथा ब्यानरहरूको विज्ञापन व्यवस्थापन</p>
                </div>
                <button 
                  onClick={() => {
                    setModalItem({ slot: '', sponsorName: '', status: 'सक्रिय', validTill: '2026-12-31' });
                    setActiveModal('sponsor');
                  }}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md"
                >
                  <Plus size={16} /> प्रायोजक जोड्नुहोस्
                </button>
              </div>

              <div className="bg-card rounded-2xl border border-border-theme shadow-sm overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-muted-area/50 text-[11px] font-black uppercase text-muted-text border-b border-border-theme">
                      <th className="p-4">विजेट स्लट</th>
                      <th className="p-4">प्रायोजक संस्था</th>
                      <th className="p-4">म्याद समाप्ति</th>
                      <th className="p-4">स्थिति</th>
                      <th className="p-4 text-right">कार्य</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-theme text-xs font-bold">
                    {sponsors.map((s) => (
                      <tr key={s.id} className="hover:bg-muted-area/30 transition-colors">
                        <td className="p-4 font-black text-card-foreground">{s.slot}</td>
                        <td className="p-4 text-primary">{s.sponsorName}</td>
                        <td className="p-4 font-mono">{s.validTill}</td>
                        <td className="p-4"><span className="bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full">{s.status}</span></td>
                        <td className="p-4 text-right space-x-2">
                          <button onClick={() => { setModalItem(s); setActiveModal('sponsor'); }} className="p-1.5 hover:bg-primary/10 text-primary rounded-lg"><Edit3 size={14} /></button>
                          <button onClick={() => handleDeleteSponsor(s.id)} className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. Analytics OS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-card-foreground">नेपाल हब एनालिटिक्स OS</h2>
                <p className="text-xs text-muted-text">दैनिक सक्रिय प्रयोगकर्ता, चाडपर्व पेज भिजिट र विजेट इन्गेजमेन्ट मेट्रिक्स</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "आजको नेपाल हब भिजिट", val: "४८,२१५", change: "+१४.२%", icon: BarChart3 },
                  { label: "चाडपर्व विजेट क्लिक", val: "१२,९४०", change: "+८.५%", icon: Calendar },
                  { label: "बजार दर हेर्ने प्रयोगकर्ता", val: "१८,६५०", change: "+२२.१%", icon: TrendingUp },
                  { label: "जिल्ला फीड सिंक दर", val: "९९.८%", change: "उत्कृष्ट", icon: CheckCircle }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-card p-6 rounded-2xl border border-border-theme shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-muted-text">
                      <span className="text-xs font-bold uppercase tracking-wider">{stat.label}</span>
                      <stat.icon size={20} className="text-primary" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-card-foreground">{stat.val}</span>
                      <span className="text-xs font-extrabold text-emerald-500">{stat.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LIVE BROADCAST OS TAB */}
          {activeTab === 'live' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border-theme shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black border border-red-500/20 flex items-center gap-1">
                      <Radio size={12} className="animate-spin" /> REAL-TIME DISPATCH ENGINE
                    </span>
                    <span className="text-xs font-bold text-muted-text">२४/७ समाचार कक्ष तथा कभरेज सञ्चालन</span>
                  </div>
                  <h2 className="text-xl font-black text-card-foreground mt-1">राष्ट्रिय लाइभ ब्रोडकास्ट व्यवस्थापन</h2>
                  <p className="text-xs text-muted-text">प्रत्यक्ष समाचार बुलेटिन, आपतकालीन अलर्ट र विशेष कभरेज प्रकाशित एवं सम्पादन गर्नुहोस्</p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/nepal-hub/live"
                    target="_blank"
                    className="px-4 py-2.5 rounded-xl bg-muted-area border border-border-theme text-xs font-bold text-card-foreground hover:bg-muted-area/80 flex items-center gap-1.5"
                  >
                    <Eye size={14} /> लाइभ पेज हेर्नुहोस्
                  </Link>

                  <button
                    onClick={() => {
                      setModalItem({
                        title: '',
                        content: '',
                        category: 'festivals',
                        urgency: 'normal',
                        badge: 'समाचार कक्ष लाइभ',
                        pinned: false,
                        time: 'भर्खरै',
                        authorName: 'एडमिन डेक्स',
                        authorRole: 'मुख्य सम्पादक'
                      });
                      setActiveModal('live');
                    }}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                  >
                    <Plus size={16} />
                    नयाँ लाइभ बुलेटिन थप्नुहोस्
                  </button>
                </div>
              </div>

              {/* STATS OVERVIEW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card p-5 rounded-2xl border border-border-theme space-y-1">
                  <span className="text-[10px] font-bold text-muted-text uppercase">कुल लाइभ अपडेटहरू</span>
                  <p className="text-2xl font-black text-card-foreground">{liveUpdates.length}</p>
                </div>
                <div className="bg-card p-5 rounded-2xl border border-border-theme space-y-1">
                  <span className="text-[10px] font-bold text-muted-text uppercase">आपतकालीन अलर्टहरू</span>
                  <p className="text-2xl font-black text-red-500">{liveUpdates.filter(u => u.urgency === 'urgent').length}</p>
                </div>
                <div className="bg-card p-5 rounded-2xl border border-border-theme space-y-1">
                  <span className="text-[10px] font-bold text-muted-text uppercase">पिन गरिएका मुख्य बुलेटिन</span>
                  <p className="text-2xl font-black text-amber-500">{liveUpdates.filter(u => u.pinned).length}</p>
                </div>
                <div className="bg-card p-5 rounded-2xl border border-border-theme space-y-1">
                  <span className="text-[10px] font-bold text-muted-text uppercase">सिंक स्थिति</span>
                  <p className="text-2xl font-black text-emerald-500 flex items-center gap-1">
                    <CheckCircle size={18} /> Active
                  </p>
                </div>
              </div>

              {/* LIVE DISPATCHES TABLE */}
              <div className="bg-card border border-border-theme rounded-3xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border-theme bg-muted-area/40 flex items-center justify-between">
                  <span className="text-xs font-black text-card-foreground">हाल उपलब्ध लाइभ ब्रोडकास्ट सूची</span>
                  <span className="text-[11px] font-bold text-muted-text">{liveUpdates.length} बुलेटिनहरू उपलब्ध</span>
                </div>

                <div className="divide-y divide-border-theme overflow-x-auto">
                  {liveUpdates.length === 0 ? (
                    <div className="text-center py-12 text-xs font-bold text-muted-text">
                      कुनै लाइभ बुलेटिन उपलब्ध छैन। नयाँ बुलेटिन थप्नुहोस्।
                    </div>
                  ) : (
                    liveUpdates.map((item) => (
                      <div key={item.id} className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted-area/30 transition-colors">
                        <div className="space-y-1 max-w-3xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                              {item.badge || item.category}
                            </span>
                            {item.pinned && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold text-[10px] flex items-center gap-1">
                                <Pin size={10} /> pinned
                              </span>
                            )}
                            <span className="text-[10px] text-muted-text font-mono flex items-center gap-1">
                              <Clock size={10} /> {item.time || 'भर्खरै'}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-card-foreground leading-snug">{item.title}</h4>
                          <p className="text-xs text-muted-text line-clamp-2">{item.content}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          <button
                            onClick={() => {
                              setModalItem({ ...item });
                              setActiveModal('live');
                            }}
                            className="p-2 bg-muted-area rounded-xl text-muted-text hover:text-primary hover:bg-card transition-all"
                            title="सम्पादन गर्नुहोस्"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            onClick={() => handleDeleteLiveUpdate(item.id)}
                            className="p-2 bg-muted-area rounded-xl text-muted-text hover:text-red-500 hover:bg-card transition-all"
                            title="हटाउनुहोस्"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </main>

        {/* MODAL OVERLAYS FOR NEPAL HUB OS MODULES */}
        <AnimatePresence>
          {activeModal && modalItem && (
            <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border-theme rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl my-8 space-y-6"
              >
                <div className="flex items-center justify-between border-b border-border-theme pb-4">
                  <div>
                    <h3 className="text-lg font-black text-card-foreground">
                      {activeModal === 'festival' && (modalItem.id ? 'चाडपर्व सम्पादन' : 'नयाँ चाडपर्व थप्नुहोस्')}
                      {activeModal === 'market' && (modalItem.id ? 'बजार दर सम्पादन' : 'नयाँ बजार दर थप्नुहोस्')}
                      {activeModal === 'district' && (modalItem.id ? 'जिल्ला डाटा सम्पादन' : 'नयाँ जिल्ला थप्नुहोस्')}
                      {activeModal === 'briefing' && (modalItem.id ? 'दैनिक बुलेटिन सम्पादन' : 'नयाँ बुलेटिन थप्नुहोस्')}
                      {activeModal === 'sponsor' && (modalItem.id ? 'प्रायोजक सम्पादन' : 'नयाँ प्रायोजक थप्नुहोस्')}
                      {activeModal === 'live' && (modalItem.id ? 'लाइभ बुलेटिन सम्पादन' : 'नयाँ लाइभ बुलेटिन थप्नुहोस्')}
                    </h3>
                    <p className="text-xs text-muted-text">नेपाल हब लाइभ इन्टेलिजेन्स अपडेट</p>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-muted-area rounded-xl">
                    <X size={18} />
                  </button>
                </div>

                {/* FESTIVAL FORM */}
                {activeModal === 'festival' && (
                  <form onSubmit={handleSaveFestival} className="space-y-4 text-xs font-bold">
                    <div>
                      <label className="block text-muted-text mb-1">चाडपर्व शीर्षक *</label>
                      <input
                        type="text"
                        value={modalItem.title || ''}
                        onChange={(e) => setModalItem({ ...modalItem, title: e.target.value })}
                        placeholder="उदा: महाशिवरात्रि"
                        className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-muted-text mb-1">नेपाली मिति (BS)</label>
                        <input
                          type="text"
                          value={modalItem.dateBS || ''}
                          onChange={(e) => setModalItem({ ...modalItem, dateBS: e.target.value })}
                          placeholder="२०८२ फागुन १४"
                          className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-muted-text mb-1">अंग्रेजी मिति (AD)</label>
                        <input
                          type="date"
                          value={modalItem.dateAD || ''}
                          onChange={(e) => setModalItem({ ...modalItem, dateAD: e.target.value })}
                          className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-muted-text mb-1">वर्ग</label>
                        <input
                          type="text"
                          value={modalItem.category || ''}
                          onChange={(e) => setModalItem({ ...modalItem, category: e.target.value })}
                          placeholder="चाडपर्व / सांस्कृतिक"
                          className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-muted-text mb-1">प्रदेश / क्षेत्र</label>
                        <input
                          type="text"
                          value={modalItem.province || ''}
                          onChange={(e) => setModalItem({ ...modalItem, province: e.target.value })}
                          placeholder="सम्पूर्ण / वाग्मती प्रदेश"
                          className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <label className="text-muted-text">विशेष प्राथमिकता (Featured)</label>
                      <input
                        type="checkbox"
                        checked={modalItem.featured ?? true}
                        onChange={(e) => setModalItem({ ...modalItem, featured: e.target.checked })}
                        className="w-4 h-4 accent-primary rounded"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border-theme">
                      <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-muted-area">रद्द</button>
                      <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-white font-bold">सेभ गर्नुहोस्</button>
                    </div>
                  </form>
                )}

                {/* MARKET FORM */}
                {activeModal === 'market' && (
                  <form onSubmit={handleSaveMarket} className="space-y-4 text-xs font-bold">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-muted-text mb-1">चिन्ह (Symbol)</label>
                        <input
                          type="text"
                          value={modalItem.symbol || ''}
                          onChange={(e) => setModalItem({ ...modalItem, symbol: e.target.value })}
                          placeholder="USD/NPR"
                          className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-muted-text mb-1">शीर्षक / नाम *</label>
                        <input
                          type="text"
                          value={modalItem.name || ''}
                          onChange={(e) => setModalItem({ ...modalItem, name: e.target.value })}
                          placeholder="अमेरिकी डलर / सुन"
                          className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-muted-text mb-1">खरिद दर</label>
                        <input
                          type="text"
                          value={modalItem.buy || ''}
                          onChange={(e) => setModalItem({ ...modalItem, buy: e.target.value })}
                          placeholder="१३३.४५"
                          className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-muted-text mb-1">बिक्री दर</label>
                        <input
                          type="text"
                          value={modalItem.sell || ''}
                          onChange={(e) => setModalItem({ ...modalItem, sell: e.target.value })}
                          placeholder="१३४.०५"
                          className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-muted-text mb-1">परिवर्तन (% / रकम)</label>
                        <input
                          type="text"
                          value={modalItem.change || ''}
                          onChange={(e) => setModalItem({ ...modalItem, change: e.target.value })}
                          placeholder="+0.15% / स्थिर"
                          className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-muted-text mb-1">स्रोत (Source)</label>
                        <input
                          type="text"
                          value={modalItem.source || ''}
                          onChange={(e) => setModalItem({ ...modalItem, source: e.target.value })}
                          placeholder="Nepal Rastra Bank API"
                          className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border-theme">
                      <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-muted-area">रद्द</button>
                      <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-white font-bold">सेभ गर्नुहोस्</button>
                    </div>
                  </form>
                )}

                {/* DISTRICT FORM */}
                {activeModal === 'district' && (
                  <form onSubmit={handleSaveDistrict} className="space-y-4 text-xs font-bold">
                    <div>
                      <label className="block text-muted-text mb-1">जिल्ला / स्थानीय तह *</label>
                      <input
                        type="text"
                        value={modalItem.name || ''}
                        onChange={(e) => setModalItem({ ...modalItem, name: e.target.value })}
                        placeholder="काठमाडौँ / पोखरा"
                        className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-muted-text mb-1">प्रदेश</label>
                        <input
                          type="text"
                          value={modalItem.province || ''}
                          onChange={(e) => setModalItem({ ...modalItem, province: e.target.value })}
                          placeholder="वाग्मती प्रदेश"
                          className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-muted-text mb-1">सूचना सङ्ख्या</label>
                        <input
                          type="number"
                          value={modalItem.noticesCount || 0}
                          onChange={(e) => setModalItem({ ...modalItem, noticesCount: parseInt(e.target.value) || 0 })}
                          className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-muted-text mb-1">ताजा अलर्ट / मुख्य सूचना</label>
                      <input
                        type="text"
                        value={modalItem.alert || ''}
                        onChange={(e) => setModalItem({ ...modalItem, alert: e.target.value })}
                        placeholder="सडक मर्मत सम्बन्धी सूचना"
                        className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border-theme">
                      <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-muted-area">रद्द</button>
                      <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-white font-bold">सेभ गर्नुहोस्</button>
                    </div>
                  </form>
                )}

                {/* BRIEFING FORM */}
                {activeModal === 'briefing' && (
                  <form onSubmit={handleSaveBriefing} className="space-y-4 text-xs font-bold">
                    <div>
                      <label className="block text-muted-text mb-1">बुलेटिन शीर्षक *</label>
                      <input
                        type="text"
                        value={modalItem.title || ''}
                        onChange={(e) => setModalItem({ ...modalItem, title: e.target.value })}
                        placeholder="बिहानको मुख्य सारांश (Morning Brief)"
                        className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-muted-text mb-1">मिति</label>
                        <input
                          type="text"
                          value={modalItem.date || ''}
                          onChange={(e) => setModalItem({ ...modalItem, date: e.target.value })}
                          placeholder="२०८२ फागुन १२"
                          className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-muted-text mb-1">लेखक / डेस्क</label>
                        <input
                          type="text"
                          value={modalItem.author || ''}
                          onChange={(e) => setModalItem({ ...modalItem, author: e.target.value })}
                          placeholder="मुख्य सम्पादक"
                          className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-muted-text mb-1">स्थिति (Status)</label>
                      <select
                        value={modalItem.status || 'प्रकाशित'}
                        onChange={(e) => setModalItem({ ...modalItem, status: e.target.value })}
                        className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                      >
                        <option value="प्रकाशित">प्रकाशित</option>
                        <option value="ड्राफ्ट">ड्राफ्ट</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border-theme">
                      <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-muted-area">रद्द</button>
                      <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-white font-bold">सेभ गर्नुहोस्</button>
                    </div>
                  </form>
                )}

                {/* SPONSOR FORM */}
                {activeModal === 'sponsor' && (
                  <form onSubmit={handleSaveSponsor} className="space-y-4 text-xs font-bold">
                    <div>
                      <label className="block text-muted-text mb-1">विजेट / ब्यानर स्लट *</label>
                      <input
                        type="text"
                        value={modalItem.slot || ''}
                        onChange={(e) => setModalItem({ ...modalItem, slot: e.target.value })}
                        placeholder="आजको बजार पल्स प्रायोजक"
                        className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-muted-text mb-1">प्रायोजक संस्था *</label>
                      <input
                        type="text"
                        value={modalItem.sponsorName || ''}
                        onChange={(e) => setModalItem({ ...modalItem, sponsorName: e.target.value })}
                        placeholder="Nabil Bank Ltd."
                        className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-muted-text mb-1">म्याद समाप्ति (Valid Till)</label>
                        <input
                          type="date"
                          value={modalItem.validTill || ''}
                          onChange={(e) => setModalItem({ ...modalItem, validTill: e.target.value })}
                          className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-muted-text mb-1">स्थिति</label>
                        <select
                          value={modalItem.status || 'सक्रिय'}
                          onChange={(e) => setModalItem({ ...modalItem, status: e.target.value })}
                          className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="सक्रिय">सक्रिय</option>
                          <option value="रिजर्भ">रिजर्भ</option>
                          <option value="निष्क्रिय">निष्क्रिय</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border-theme">
                      <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-muted-area">रद्द</button>
                      <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-white font-bold">सेभ गर्नुहोस्</button>
                    </div>
                  </form>
                )}

                {/* LIVE UPDATE FORM */}
                {activeModal === 'live' && (
                  <form onSubmit={handleSaveLiveUpdate} className="space-y-4 text-xs font-bold">
                    <div>
                      <label className="block text-muted-text mb-1">बुलेटिन शीर्षक *</label>
                      <input
                        type="text"
                        value={modalItem.title || ''}
                        onChange={(e) => setModalItem({ ...modalItem, title: e.target.value })}
                        placeholder="उदा: पशुपतिनाथ क्षेत्रमा साउने सोमबार पूजा सुरु"
                        className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-muted-text mb-1">विधा (Category)</label>
                        <select
                          value={modalItem.category || 'festivals'}
                          onChange={(e) => setModalItem({ ...modalItem, category: e.target.value })}
                          className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-3 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="festivals">चाडपर्व तथा संस्कृति</option>
                          <option value="disaster">मौसम तथा आपतकाल</option>
                          <option value="elections">राष्ट्रिय घटना</option>
                          <option value="national">अन्य राष्ट्रिय समाचार</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-muted-text mb-1">संवेदनशीलता (Urgency)</label>
                        <select
                          value={modalItem.urgency || 'normal'}
                          onChange={(e) => setModalItem({ ...modalItem, urgency: e.target.value })}
                          className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-3 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="normal">सामान्य (Normal)</option>
                          <option value="high">उच्च (High)</option>
                          <option value="urgent">आपतकालीन (Urgent)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-muted-text mb-1">ब्याज लेबल</label>
                      <input
                        type="text"
                        value={modalItem.badge || ''}
                        onChange={(e) => setModalItem({ ...modalItem, badge: e.target.value })}
                        placeholder="समाचार कक्ष लाइभ"
                        className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-muted-text mb-1">घटनाको मुख्य विवरण *</label>
                      <textarea
                        value={modalItem.content || ''}
                        onChange={(e) => setModalItem({ ...modalItem, content: e.target.value })}
                        rows={4}
                        placeholder="प्रत्यक्ष घटनाको विवरण लेख्नुहोस्..."
                        className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-4 py-2.5 text-card-foreground focus:outline-none focus:border-primary"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(modalItem.pinned)}
                          onChange={(e) => setModalItem({ ...modalItem, pinned: e.target.checked })}
                          className="w-4 h-4 accent-primary rounded"
                        />
                        <span className="text-card-foreground">शीर्षमा पिन गर्नुहोस् (Pin to Top)</span>
                      </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border-theme">
                      <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-muted-area">रद्द</button>
                      <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-white font-bold">प्रकाशित गर्नुहोस्</button>
                    </div>
                  </form>
                )}

              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
