import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NepaliInput from "@/src/components/ui/NepaliInput";
import LogoImage from "@/src/components/ui/LogoImage";
import { 
  Globe, Save, MapPin, Share2, Image as ImageIcon, Play,
  Info, MessageSquare, Megaphone, Download, Upload, Shield, FileText, Sparkles, Menu
} from "lucide-react";
import { doc, getDoc, setDoc, safeOnSnapshot as onSnapshot, collection, getDocs, writeBatch } from "@/src/lib/firebase";
import { db, handleFirestoreError, OperationType, safeOnSnapshot, getDocsWithCacheFallback } from "@/src/lib/firebase";
import { setDocWithQueue } from "@/src/lib/offlineQueue";
import { useAuth } from "@/src/lib/auth";
import { motion } from "motion/react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import NotificationBell from "@/src/components/notifications/NotificationBell";
import { addDummyData } from "@/src/utils/dummyData";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import AlertModal from "@/src/components/ui/AlertModal";
import { getCollectionDataForBackup } from "@/src/lib/disasterRecovery";

import { AdminSkeleton } from "@/src/components/ui/PageLoaders";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { uploadMediaFile } from "@/src/services/mediaService";
import { settingsOS } from "@/src/services/settingsOS";
import DeveloperToolsSection from "@/src/components/admin/settings/DeveloperToolsSection";
import AskSanatanAdminSection from "@/src/components/admin/settings/AskSanatanAdminSection";

export default function AdminSettings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isDummyLoading, setIsDummyLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const sidebarLogoFileInputRef = useRef<HTMLInputElement>(null);

  const [uploadingLogo, setUploadingLogo] = useState<{[key: string]: boolean}>({});

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'sidebar') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingLogo(prev => ({ ...prev, [target]: true }));
    try {
      const asset = await uploadMediaFile({
        file,
        category: "branding",
        uploadedBy: user?.displayName || user?.email || "Admin"
      });
      if (asset && asset.url) {
        if (target === 'main') {
          setSettings(prev => ({ ...prev, logoUrl: asset.url }));
        } else {
          setSettings(prev => ({ ...prev, logoVerticalUrl: asset.url }));
        }
        setAlertInfo({ show: true, title: "सफल!", message: "लोगो सफलतापूर्वक अपलोड र सेभ भयो। कृपया सुरक्षित गर्नका लागि सुरक्षित बटन थिच्नुहोस्।", type: 'success' });
      } else {
        throw new Error("अपलोड लिंक फेला परेन।");
      }
    } catch (err: any) {
      console.error("Logo upload error:", err);
      setAlertInfo({ 
        show: true, 
        title: "त्रुटि!", 
        message: "लोगो अपलोड गर्दा समस्या भयो: " + (err.message || String(err)), 
        type: 'error' 
      });
    } finally {
      setUploadingLogo(prev => ({ ...prev, [target]: false }));
      e.target.value = '';
    }
  };
  
  // Modals state
  const [alertInfo, setAlertInfo] = useState({ show: false, title: "", message: "", type: 'success' as 'success' | 'error' });
  const [confirmInfo, setConfirmInfo] = useState({ show: false, title: "", message: "", onConfirm: () => {} });

  const [settings, setSettings] = useState({
    siteName: "Sanatan Marga",
    siteTagline: "Media & News Portal",
    siteDescription: "सत्य, तथ्य र निष्पक्ष समाचार पोर्टल",
    contactEmail: "info@sanatanmarga.com",
    contactPhone: "+977-9705125527",
    address: "Kathmandu, Nepal",
    facebookUrl: "https://www.facebook.com/Sanatanmarga",
    twitterUrl: "https://x.com/Sanatanmarga",
    youtubeUrl: "https://www.youtube.com/@omSanatanMarga",
    instagramUrl: "https://www.instagram.com/omsanatanmarga/",
    logoUrl: "/logo.svg",
    logoVerticalUrl: "/logo-vertical.png",
    liveVideoUrl: "",
    liveVideoType: "youtube" as "youtube" | "facebook",
    aboutUs: "",
    contactUs: "",
    footerText: "",
    termsContent: "",
    privacyContent: "",
    sponsoredAds: [] as (string | { text: string; link?: string })[],
    geminiApiKey: "",
    openaiApiKey: "",
    stabilityApiKey: "",
    adSenseClient: "",
    adSenseSlot: "",
    rotatingGeminiKeys: [] as string[],
    cornerRadius: 2,
    categoryHeroRadius: 40,
    postCardRadius: 24,
    tickerSpeed: 30,
    brandSlogan: "सत्य, तथ्य र निष्पक्ष समाचार",
    theme: {
      primaryColor: "#0072B5",
      accentColor: "#b91c1c",
      fontFamily: "Inter",
      cornerRadius: 2,
      categoryHeroRadius: 40,
      postCardRadius: 24,
      tickerSpeed: 30,
    },
    copyrightText: "© २०२६ Sanatan Marga। सर्वाधिकार सुरक्षित।",
    developerText: "Milijuli Solutions",
    splashBgColor: "#ffffff"
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');
    if (authLoading || !user || !isAdmin) return;

    // Fetch real settings from Firestore with defensive loading
    const unsubSite = safeOnSnapshot(doc(db, "settings", "site"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() || {};
        setSettings(prev => {
          const prevRot = Array.isArray(prev.rotatingGeminiKeys) ? prev.rotatingGeminiKeys : [];
          const dataRot = Array.isArray(data.rotatingGeminiKeys) ? data.rotatingGeminiKeys : [];
          const prevTheme = prev.theme || {
            primaryColor: "#D9381E",
            accentColor: "#F5A623",
            fontFamily: "Hind Siliguri",
            cornerRadius: 2,
            categoryHeroRadius: 40,
            postCardRadius: 24,
            tickerSpeed: 30,
          };
          const dataTheme = data.theme || {};
          
          return { 
            ...prev, 
            ...data,
            theme: {
              ...prevTheme,
              ...dataTheme,
            },
            sponsoredAds: Array.isArray(data.sponsoredAds) ? data.sponsoredAds : (prev.sponsoredAds || []),
            geminiApiKey: prev.geminiApiKey || data.geminiApiKey || "",
            openaiApiKey: prev.openaiApiKey || data.openaiApiKey || "",
            stabilityApiKey: prev.stabilityApiKey || data.stabilityApiKey || "",
            rotatingGeminiKeys: prevRot.length > 0 ? prevRot : dataRot
          };
        });
      }
    }, "admin/settings/site");

    const unsubKeys = safeOnSnapshot(doc(db, "settings", "keys"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() || {};
        setSettings(prev => {
          const prevRot = Array.isArray(prev.rotatingGeminiKeys) ? prev.rotatingGeminiKeys : [];
          const dataRot = Array.isArray(data.rotatingGeminiKeys) ? data.rotatingGeminiKeys : [];
          return { 
            ...prev, 
            geminiApiKey: data.geminiApiKey || prev.geminiApiKey || "",
            openaiApiKey: data.openaiApiKey || prev.openaiApiKey || "",
            stabilityApiKey: data.stabilityApiKey || prev.stabilityApiKey || "",
            rotatingGeminiKeys: dataRot.length > 0 ? dataRot : prevRot
          };
        });
      }
    }, "admin/settings/keys");

    return () => {
      unsubSite();
      unsubKeys();
    };
  }, [user, authLoading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Clean up rotating keys and sponsored ads defensively before saving
      const rawRotatingKeys = Array.isArray(settings.rotatingGeminiKeys) ? settings.rotatingGeminiKeys : [];
      const cleanedRotatingKeys = rawRotatingKeys
        .map(k => typeof k === 'string' ? k.trim() : k)
        .filter(k => typeof k === 'string' && k !== "");
        
      const rawSponsoredAds = Array.isArray(settings.sponsoredAds) ? settings.sponsoredAds : [];
      const cleanedSponsoredAds = rawSponsoredAds
        .map(ad => {
          if (!ad) return { text: "", link: "" };
          if (typeof ad === 'string') return ad.trim();
          return { text: ad.text?.trim() || "", link: ad.link?.trim() || "" };
        })
        .filter(ad => {
          if (!ad) return false;
          if (typeof ad === 'string') return ad !== "";
          return ad.text && ad.text !== "";
        });

      // Split settings into public and private
      const { geminiApiKey, openaiApiKey, stabilityApiKey, rotatingGeminiKeys, ...publicSettings } = settings;
      
      // Update public settings with cleaned ads
      (publicSettings as any).sponsoredAds = cleanedSponsoredAds;

      // Make sure theme object inside publicSettings has updated radii and colors
      publicSettings.theme = {
        primaryColor: settings.theme?.primaryColor || "#D9381E",
        accentColor: settings.theme?.accentColor || "#F5A623",
        fontFamily: settings.theme?.fontFamily || "Hind Siliguri",
        cornerRadius: settings.cornerRadius ?? settings.theme?.cornerRadius ?? 2,
        categoryHeroRadius: settings.categoryHeroRadius ?? settings.theme?.categoryHeroRadius ?? 40,
        postCardRadius: settings.postCardRadius ?? settings.theme?.postCardRadius ?? 24,
        tickerSpeed: settings.tickerSpeed ?? settings.theme?.tickerSpeed ?? 30,
      };

      const keysData = {
        geminiApiKey: geminiApiKey || "",
        openaiApiKey: openaiApiKey || "",
        stabilityApiKey: stabilityApiKey || "",
        rotatingGeminiKeys: cleanedRotatingKeys
      };

      const result = await settingsOS.saveSettings(publicSettings, keysData);

      if (result.success) {
        await snapshotEngine.triggerServerRebuild();
        setAlertInfo({ 
          show: true, 
          title: "सफलता!", 
          message: `सेटिङहरू सुरक्षित गरियो! (संस्करण v${result.version})`, 
          type: 'success' 
        });
      } else {
        throw new Error("सेटिङ सेभ गर्न असफल भयो।");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setAlertInfo({ show: true, title: "त्रुटि!", message: "सेटिङहरू सुरक्षित गर्दा त्रुटि भयो: " + errMsg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const executeAddDummyData = async () => {
    if (!user) return;
    setIsDummyLoading(true);
    try {
      await addDummyData(user.uid);
      setAlertInfo({ show: true, title: "सफलता!", message: "डमी डेटा सफलतापूर्वक थपियो!", type: 'success' });
      setTimeout(() => navigate("/admin"), 1500);
    } catch (err) {
      console.error(err);
      setAlertInfo({ show: true, title: "त्रुटि!", message: "डमी डेटा थप्न सकिएन।", type: 'error' });
    } finally {
      setIsDummyLoading(false);
    }
  };

  const handleAddDummyData = () => {
    setConfirmInfo({
      show: true,
      title: "डमी डेटा थप्नुहोस्",
      message: "के तपाईं डमी डेटा थप्न चाहनुहुन्छ? यसले केही विधा र समाचारहरू थप्नेछ।",
      onConfirm: () => {
        setConfirmInfo(prev => ({ ...prev, show: false }));
        executeAddDummyData();
      }
    });
  };

  const executeExport = async () => {
    setExporting(true);
    try {
      const collections = [
        "articles", "categories", "settings", "ads", "users", "notifications",
        "communityPosts", "communityComments", "communityVotes", "communityReports",
        "events", "models", "agents", "contactMessages", "modelInquiries", "agentInquiries"
      ];
      const backupData: any = {};

      for (const colName of collections) {
        backupData[colName] = await getCollectionDataForBackup(colName);
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sanatan_marga_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      setAlertInfo({ show: true, title: "त्रुटि!", message: "डेटा निर्यात गर्दा त्रुटि भयो।", type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleExport = () => {
    setConfirmInfo({
      show: true,
      title: "ब्याकअप डाउनलोड",
      message: "के तपाईं सबै डेटा ब्याकअपको लागि डाउनलोड गर्न चाहनुहुन्छ?",
      onConfirm: () => {
        setConfirmInfo(prev => ({ ...prev, show: false }));
        executeExport();
      }
    });
  };

  const executeImport = async (file: File) => {
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target?.result as string);
        let skippedCount = 0;
        let importedCount = 0;
        
        for (const colName in backupData) {
          const items = backupData[colName];
          if (!Array.isArray(items)) continue;

          // Process in batches of 500 (Firestore limit)
          for (let i = 0; i < items.length; i += 500) {
            const batch = writeBatch(db);
            const chunk = items.slice(i, i + 500);
            
            for (const item of chunk) {
              const { id, ...data } = item;
              const docRef = doc(db, colName, id);
              
              // Check if document exists before setting (as requested to skip existing)
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                skippedCount++;
                continue;
              }
              
              batch.set(docRef, data);
              importedCount++;
            }
            
            if (importedCount > 0) {
              await batch.commit();
            }
          }
        }
        
        setAlertInfo({ 
          show: true, 
          title: "सफलता!", 
          message: `डेटा रिस्टोर गरियो! (थपिएको: ${importedCount}, पहिले नै भएकोले छोडिएको: ${skippedCount})`, 
          type: 'success' 
        });
        setTimeout(() => window.location.reload(), 2000);
      } catch (err) {
        console.error("Import error:", err);
        setAlertInfo({ show: true, title: "त्रुटि!", message: "डेटा रिस्टोर गर्दा त्रुटि भयो। फाइल सही छ कि छैन जाँच गर्नुहोस्।", type: 'error' });
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setConfirmInfo({
      show: true,
      title: "ब्याकअप रिस्टोर",
      message: "सावधानी: यसले तपाईंको हालको डेटालाई ब्याकअप फाइलको डेटाले ओभरराइट गर्न सक्छ। के तपाईं जारी राख्न चाहनुहुन्छ?",
      onConfirm: () => {
        setConfirmInfo(prev => ({ ...prev, show: false }));
        executeImport(file);
      }
    });
  };

  if (authLoading) return <AdminSkeleton />;

  return (
    <AdminLayout>
      <AlertModal 
        isOpen={alertInfo.show}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
        onClose={() => setAlertInfo({ ...alertInfo, show: false })}
      />
      <ConfirmModal
        isOpen={confirmInfo.show}
        title={confirmInfo.title}
        message={confirmInfo.message}
        onConfirm={confirmInfo.onConfirm}
        onCancel={() => setConfirmInfo({ ...confirmInfo, show: false })}
      />
      
      <div className="p-4 sm:p-8">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl lg:text-3xl font-black text-card-foreground tracking-tight">सेटिङहरू</h1>
            <p className="text-sm font-medium text-muted-text">वेबसाइटको सामान्य सेटिङहरू यहाँबाट मिलाउनुहोस्।</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 lg:gap-4">
            <NotificationBell />
            <button 
              type="button"
              onClick={handleAddDummyData}
              disabled={isDummyLoading || exporting || importing}
              className="bg-accent text-white px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-black text-xs lg:text-sm uppercase tracking-widest shadow-lg hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles size={18} /> <span className="hidden sm:inline">{isDummyLoading ? "थपिँदै..." : "डमी डेटा"}</span>
            </button>
            <button 
              type="button"
              onClick={handleExport}
              disabled={exporting || importing}
              className="bg-card-foreground text-background dark:bg-primary dark:text-white px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-black text-xs lg:text-sm uppercase tracking-widest shadow-lg hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2 border border-border-theme dark:border-none"
            >
              <Download size={18} /> <span className="hidden sm:inline">{exporting ? "निर्यात..." : "ब्याकअप"}</span>
            </button>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={exporting || importing}
              className="bg-muted text-card-foreground px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-black text-xs lg:text-sm uppercase tracking-widest shadow-lg hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2 border border-border-theme"
            >
              <Upload size={18} /> <span className="hidden sm:inline">{importing ? "रिस्टोर..." : "रिस्टोर"}</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImport} 
              accept=".json" 
              className="hidden" 
            />
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-white px-4 lg:px-8 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-black text-xs lg:text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={20} /> <span className="hidden sm:inline">{saving ? "बचत..." : "बचत गर्नुहोस्"}</span>
            </button>
          </div>
        </header>

        <form onSubmit={handleSave} className="max-w-4xl flex flex-col gap-6 lg:gap-8 pb-20">
          {/* Theme Settings */}
          <div className="bg-card p-10 rounded-[2.5rem] border border-border-theme flex flex-col gap-8 shadow-sm">
            <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
              <Sparkles size={24} className="text-primary" /> थिम सेटिङ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">Primary Color</label>
                <input 
                  type="color" 
                  value={settings.theme.primaryColor}
                  onChange={(e) => setSettings({ ...settings, theme: { ...settings.theme, primaryColor: e.target.value } })}
                  className="w-full h-12 bg-muted-area border-none rounded-xl cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">Accent Color</label>
                <input 
                  type="color" 
                  value={settings.theme.accentColor}
                  onChange={(e) => setSettings({ ...settings, theme: { ...settings.theme, accentColor: e.target.value } })}
                  className="w-full h-12 bg-muted-area border-none rounded-xl cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest p-1 bg-primary/10 rounded-t-lg">Splash Background</label>
                <input 
                  type="color" 
                  value={settings.splashBgColor || "#ffffff"}
                  onChange={(e) => setSettings({ ...settings, splashBgColor: e.target.value })}
                  className="w-full h-12 bg-muted-area border-none rounded-xl cursor-pointer"
                />
                <p className="text-[10px] text-muted-text font-medium italic">
                  * एप खुल्दा देखिने स्प्लास स्क्रिनको रङ्ग।
                </p>
              </div>
            </div>
          </div>

          {/* Logo Settings */}
          <div className="bg-card p-6 lg:p-10 rounded-3xl lg:rounded-[2.5rem] border border-border-theme flex flex-col gap-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
                <ImageIcon size={24} className="text-primary" /> लोगो सेटिङ (Site & Admin Logo)
              </h3>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, logoUrl: "/logo.svg", logoVerticalUrl: "/logo-vertical.png" })}
                className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-black uppercase transition-colors"
              >
                मानक लोगो प्रयोग गर्नुहोस् (Default Logo)
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Primary Header Logo */}
              <div className="flex flex-col gap-4 p-5 bg-muted-area/30 rounded-2xl border border-border-theme/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-card-foreground uppercase tracking-wider">मुख्य वेबसाइट लोगो (Header & Footer)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">५०० x १५० px</span>
                    <input 
                      type="file" 
                      ref={logoFileInputRef}
                      onChange={(e) => handleLogoUpload(e, 'main')} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <button
                      type="button"
                      disabled={uploadingLogo['main']}
                      onClick={() => logoFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {uploadingLogo['main'] ? (
                        <>अपलोड हुँदै...</>
                      ) : (
                        <><Upload size={12} /> अपलोड</>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-card rounded-2xl p-2 flex items-center justify-center border-2 border-dashed border-border-theme shrink-0 overflow-hidden shadow-inner">
                    <LogoImage 
                      src={settings.logoUrl} 
                      alt="Current Main Logo" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex-grow flex flex-col gap-2">
                    <input 
                      type="text" 
                      value={settings.logoUrl}
                      onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                      placeholder="/logo.svg वा https://..."
                      className="w-full bg-card border border-border-theme rounded-xl py-3 px-3 text-xs font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <p className="text-[10px] text-muted-text font-medium">
                      * हेडर र फुटरमा देखिने मुख्य लोगो URL वा अपलोड गरिएको तस्बिर।
                    </p>
                  </div>
                </div>
              </div>

              {/* Vertical / Admin Sidebar Logo */}
              <div className="flex flex-col gap-4 p-5 bg-muted-area/30 rounded-2xl border border-border-theme/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-card-foreground uppercase tracking-wider">एडमिन मेनु र साइडबार लोगो (Admin Sidebar)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">वर्ग / ५०० x ५०० px</span>
                    <input 
                      type="file" 
                      ref={sidebarLogoFileInputRef}
                      onChange={(e) => handleLogoUpload(e, 'sidebar')} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <button
                      type="button"
                      disabled={uploadingLogo['sidebar']}
                      onClick={() => sidebarLogoFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {uploadingLogo['sidebar'] ? (
                        <>अपलोड हुँदै...</>
                      ) : (
                        <><Upload size={12} /> अपलोड</>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-card rounded-2xl p-2 flex items-center justify-center border-2 border-dashed border-border-theme shrink-0 overflow-hidden shadow-inner">
                    <LogoImage 
                      src={settings.logoVerticalUrl || settings.logoUrl} 
                      alt="Current Sidebar Logo" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex-grow flex flex-col gap-2">
                    <input 
                      type="text" 
                      value={settings.logoVerticalUrl || ""}
                      onChange={(e) => setSettings({ ...settings, logoVerticalUrl: e.target.value })}
                      placeholder="/logo-vertical.png वा खाली छोड्नुहोस्"
                      className="w-full bg-card border border-border-theme rounded-xl py-3 px-3 text-xs font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <p className="text-[10px] text-muted-text font-medium">
                      * एडमिन साइडबार र ड्यासबोर्ड मेनुमा देखिने लोगो URL वा अपलोड गरिएको तस्बिर।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* App Appearance Settings */}
          <div className="bg-card p-10 rounded-[2.5rem] border border-border-theme flex flex-col gap-12 shadow-sm">
            <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
              <Sparkles size={24} className="text-primary" /> एपको बनावट (Appearance)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Global Corner Radius */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <label className="text-xxs font-black text-muted-text uppercase tracking-widest ml-1">सामान्य कुनाको रेडियस (Global Radius - px)</label>
                  <div className="flex items-center gap-6">
                    <input 
                      type="range" 
                      min="0" 
                      max="60" 
                      step="2"
                      value={settings.cornerRadius || 24}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSettings({ 
                          ...settings, 
                          cornerRadius: val,
                          theme: { ...settings.theme, cornerRadius: val }
                        });
                      }}
                      className="flex-grow h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="w-20 h-14 bg-muted-area border border-border-theme rounded-xl flex items-center justify-center text-lg font-black text-primary shadow-inner">
                      {settings.cornerRadius || 24}
                    </div>
                  </div>
                  <div className="flex justify-between text-xxs font-bold text-muted-text/30 uppercase tracking-widest px-1">
                    <span>Sharp (0px)</span>
                    <span>Rounded (60px)</span>
                  </div>
                  <p className="text-xxs text-muted-text font-medium italic bg-muted-area p-4 rounded-2xl border border-border-theme">
                    * यसले एपका कार्डहरू, बटनहरू र सानो इमेजहरूको कुना कत्तिको गोलो हुने भन्ने निर्धारण गर्छ।
                  </p>
                </div>
              </div>

              {/* Category Hero Radius */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <label className="text-xxs font-black text-muted-text uppercase tracking-widest ml-1">विधाको मुख्य फोटो रेडियस (Category Hero Radius - px)</label>
                  <div className="flex items-center gap-6">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="2"
                      value={settings.categoryHeroRadius || 40}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSettings({ 
                          ...settings, 
                          categoryHeroRadius: val,
                          theme: { ...settings.theme, categoryHeroRadius: val }
                        });
                      }}
                      className="flex-grow h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                    <div className="w-20 h-14 bg-muted-area border border-border-theme rounded-xl flex items-center justify-center text-lg font-black text-accent shadow-inner">
                      {settings.categoryHeroRadius || 40}
                    </div>
                  </div>
                  <div className="flex justify-between text-xxs font-bold text-muted-text/30 uppercase tracking-widest px-1">
                    <span>Sharp (0px)</span>
                    <span>Extra Rounded (100px)</span>
                  </div>
                  <p className="text-xxs text-muted-text font-medium italic bg-muted-area p-4 rounded-2xl border border-border-theme">
                    * यसले विधाका मुख्य फोटोहरू (Category Hero Images) को कुना कत्तिको गोलो हुने भन्ने निर्धारण गर्छ।
                  </p>
                </div>
              </div>

              {/* Post Card Radius */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <label className="text-xxs font-black text-muted-text uppercase tracking-widest ml-1">समाचार कार्ड रेडियस (Post Card Radius - px)</label>
                  <div className="flex items-center gap-6">
                    <input 
                      type="range" 
                      min="0" 
                      max="60" 
                      step="2"
                      value={settings.postCardRadius || 24}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSettings({ 
                          ...settings, 
                          postCardRadius: val,
                          theme: { ...settings.theme, postCardRadius: val }
                        });
                      }}
                      className="flex-grow h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="w-20 h-14 bg-muted-area border border-border-theme rounded-xl flex items-center justify-center text-lg font-black text-primary shadow-inner">
                      {settings.postCardRadius || 24}
                    </div>
                  </div>
                  <div className="flex justify-between text-xxs font-bold text-muted-text/30 uppercase tracking-widest px-1">
                    <span>Sharp (0px)</span>
                    <span>Rounded (60px)</span>
                  </div>
                  <p className="text-xxs text-muted-text font-medium italic bg-muted-area p-4 rounded-2xl border border-border-theme">
                    * यसले समाचार कार्डहरूको कुना कत्तिको गोलो हुने भन्ने निर्धारण गर्छ।
                  </p>
                </div>
              </div>

              {/* Ticker Speed */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <label className="text-xxs font-black text-muted-text uppercase tracking-widest ml-1">टिकरको गति (Ticker Speed - seconds)</label>
                  <div className="flex items-center gap-6">
                    <input 
                      type="range" 
                      min="10" 
                      max="120" 
                      step="5"
                      value={settings.tickerSpeed || 30}
                      onChange={(e) => setSettings({ ...settings, tickerSpeed: parseInt(e.target.value) })}
                      className="flex-grow h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                    <div className="w-20 h-14 bg-muted-area border border-border-theme rounded-xl flex items-center justify-center text-lg font-black text-accent shadow-inner">
                      {settings.tickerSpeed || 30}s
                    </div>
                  </div>
                  <div className="flex justify-between text-xxs font-bold text-muted-text/30 uppercase tracking-widest px-1">
                    <span>Fast (10s)</span>
                    <span>Slow (120s)</span>
                  </div>
                  <p className="text-xxs text-muted-text font-medium italic bg-muted-area p-4 rounded-2xl border border-border-theme">
                    * यसले ताजा अपडेट (Ticker) कति छिटो चल्ने भन्ने निर्धारण गर्छ (थोरै सेकेन्ड = छिटो)।
                  </p>
                </div>
              </div>

              {/* Splash Screen Background Color */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <label className="text-xxs font-black text-muted-text uppercase tracking-widest ml-1">स्प्ल्याश स्क्रिन ब्याकग्राउन्ड रङ (Splash Background Color)</label>
                  <div className="flex items-center gap-6">
                    <input 
                      type="color" 
                      value={settings.splashBgColor || "#ffffff"}
                      onChange={(e) => setSettings({ ...settings, splashBgColor: e.target.value })}
                      className="w-20 h-14 bg-transparent border-none rounded-xl cursor-pointer"
                    />
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black text-card-foreground font-mono uppercase">{settings.splashBgColor}</span>
                      <span className="text-xxs text-muted-text font-bold">एप खुल्दा देखिने ब्याकग्राउन्ड रङ</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Video Settings */}
          <div className="bg-card p-10 rounded-[2.5rem] border border-border-theme flex flex-col gap-8 shadow-sm">
            <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
              <Play size={24} className="text-primary" /> प्रत्यक्ष प्रसारण (Live) सेटिङ
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">भिडियो प्रकार</label>
                <select 
                  value={settings.liveVideoType}
                  onChange={(e) => setSettings({ ...settings, liveVideoType: e.target.value as "youtube" | "facebook" })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                >
                  <option value="youtube">YouTube</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">भिडियो URL</label>
                <input 
                  type="text" 
                  value={settings.liveVideoUrl}
                  onChange={(e) => setSettings({ ...settings, liveVideoUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=... वा Facebook Live URL"
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50"
                />
              </div>
            </div>
            <p className="text-xxs font-bold text-muted-text uppercase tracking-widest">
              नोट: YouTube को लागि भिडियो ID वा पूरा URL र Facebook को लागि पूरा भिडियो URL राख्नुहोस्।
            </p>
          </div>

          {/* General Settings */}
          <div className="bg-card p-6 lg:p-10 rounded-3xl lg:rounded-[2.5rem] border border-border-theme flex flex-col gap-8 shadow-sm">
            <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
              <Globe size={24} className="text-primary" /> सामान्य जानकारी
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">वेबसाइटको नाम</label>
                <NepaliInput 
                  value={settings.siteName}
                  onChange={(val) => setSettings({ ...settings, siteName: val })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">वेबसाइटको ट्यागलाइन (Tagline)</label>
                <NepaliInput 
                  value={settings.siteTagline}
                  onChange={(val) => setSettings({ ...settings, siteTagline: val })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">ब्रान्ड स्लोगन (Brand Slogan)</label>
                <NepaliInput 
                  value={settings.brandSlogan}
                  onChange={(val) => setSettings({ ...settings, brandSlogan: val })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="सत्य, तथ्य र निष्पक्ष समाचार"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">सम्पर्क इमेल</label>
                <input 
                  type="email" 
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">फोन नम्बर</label>
                <input 
                  type="text" 
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xxs font-black text-muted-text uppercase tracking-widest">वेबसाइटको विवरण (Description)</label>
              <NepaliInput 
                value={settings.siteDescription}
                onChange={(val) => setSettings({ ...settings, siteDescription: val })}
                className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                rows={3}
                type="textarea"
              />
            </div>
          </div>

          {/* Footer Settings */}
          <div className="bg-card p-10 rounded-[2.5rem] border border-border-theme flex flex-col gap-8 shadow-sm">
            <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
              <FileText size={24} className="text-primary" /> फुटर (Footer) सेटिङ
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">प्रतिलिपि अधिकार (Copyright) पाठ</label>
                <NepaliInput 
                  value={settings.copyrightText}
                  onChange={(val) => setSettings({ ...settings, copyrightText: val })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">विकासकर्ता (Developer) पाठ</label>
                <input 
                  type="text" 
                  value={settings.developerText}
                  onChange={(e) => setSettings({ ...settings, developerText: e.target.value })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50"
                />
              </div>
            </div>
          </div>

          {/* Contact Settings */}
          <div className="bg-card p-10 rounded-[2.5rem] border border-border-theme flex flex-col gap-8 shadow-sm">
            <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
              <MapPin size={24} className="text-primary" /> सम्पर्क विवरण
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">फोन नम्बर</label>
                <input 
                  type="text" 
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">ठेगाना</label>
                <NepaliInput 
                  value={settings.address}
                  onChange={(val) => setSettings({ ...settings, address: val })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Social Settings */}
          <div className="bg-card p-10 rounded-[2.5rem] border border-border-theme flex flex-col gap-8 shadow-sm">
            <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
              <Share2 size={24} className="text-primary" /> सामाजिक सञ्जाल
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">Facebook URL</label>
                <input 
                  type="text" 
                  value={settings.facebookUrl}
                  onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50"
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">Twitter URL</label>
                <input 
                  type="text" 
                  value={settings.twitterUrl}
                  onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50"
                  placeholder="https://twitter.com/..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">YouTube URL</label>
                <input 
                  type="text" 
                  value={settings.youtubeUrl}
                  onChange={(e) => setSettings({ ...settings, youtubeUrl: e.target.value })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50"
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">Instagram URL</label>
                <input 
                  type="text" 
                  value={settings.instagramUrl}
                  onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50"
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>
          </div>

          {/* Page Content Settings */}
          <div className="bg-card p-10 rounded-[2.5rem] border border-border-theme flex flex-col gap-8 shadow-sm">
            <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
              <Info size={24} className="text-primary" /> पेज सामाग्री (Page Content)
            </h3>
            
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">हाम्रो बारेमा (About Us)</label>
                <NepaliInput 
                  value={settings.aboutUs}
                  onChange={(val) => setSettings({ ...settings, aboutUs: val })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  rows={6}
                  type="textarea"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">सम्पर्क (Contact Us)</label>
                <NepaliInput 
                  value={settings.contactUs}
                  onChange={(val) => setSettings({ ...settings, contactUs: val })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  rows={4}
                  type="textarea"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">फुटर टेक्स्ट (Footer Text)</label>
                <NepaliInput 
                  value={settings.footerText}
                  onChange={(val) => setSettings({ ...settings, footerText: val })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Terms & Privacy Settings */}
          <div className="bg-card p-10 rounded-[2.5rem] border border-border-theme flex flex-col gap-8 shadow-sm">
            <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
              <Shield size={24} className="text-primary" /> नियम र गोपनीयता (Terms & Privacy)
            </h3>
            
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> नियम र सर्तहरू (Terms & Conditions)
                </label>
                <NepaliInput 
                  value={settings.termsContent}
                  onChange={(val) => setSettings({ ...settings, termsContent: val })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  rows={10}
                  type="textarea"
                  placeholder="नियम र सर्तहरू यहाँ लेख्नुहोस्..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest flex items-center gap-2">
                  <Shield size={14} /> गोपनीयता नीति (Privacy Policy)
                </label>
                <NepaliInput 
                  value={settings.privacyContent}
                  onChange={(val) => setSettings({ ...settings, privacyContent: val })}
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  rows={10}
                  type="textarea"
                  placeholder="गोपनीयता नीति यहाँ लेख्नुहोस्..."
                />
              </div>
            </div>
          </div>

          {/* AI API Keys Settings */}
          <div className="bg-card p-10 rounded-[2.5rem] border border-border-theme flex flex-col gap-8 shadow-sm">
            <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
              <Save size={24} className="text-primary" /> AI API कुञ्जीहरू (API Keys)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">Gemini API Key</label>
                <input 
                  type="password" 
                  value={settings.geminiApiKey || ""}
                  onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                  placeholder="AI समाचार र ट्रान्सलिटरेसनको लागि"
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">OpenAI API Key</label>
                <input 
                  type="password" 
                  value={settings.openaiApiKey || ""}
                  onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                  placeholder="वैकल्पिक AI मोडेलको लागि"
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">Stability AI Key</label>
                <input 
                  type="password" 
                  value={settings.stabilityApiKey || ""}
                  onChange={(e) => setSettings({ ...settings, stabilityApiKey: e.target.value })}
                  placeholder="फोटो सिर्जनाको लागि"
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">वैकल्पिक Gemini API कुञ्जीहरू (Rotating Keys - प्रति लाइन एक)</label>
                <textarea 
                  value={settings.rotatingGeminiKeys?.join("\n") || ""}
                  onChange={(e) => {
                    const keys = e.target.value.split("\n");
                    setSettings({ ...settings, rotatingGeminiKeys: keys });
                  }}
                  placeholder="अतिरिक्त Gemini API कुञ्जीहरू यहाँ राख्नुहोस्..."
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50"
                  rows={6}
                />
              </div>
            </div>
            <p className="text-xxs font-bold text-muted-text uppercase tracking-widest">
              नोट: यदि पहिलो कुञ्जीको कोटा सकियो भने, यी अतिरिक्त कुञ्जीहरू प्रयोग गरिनेछन्।
            </p>
          </div>

          {/* AdSense Settings */}
          <div className="bg-card p-10 rounded-[2.5rem] border border-border-theme flex flex-col gap-8 shadow-sm">
            <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
              <Megaphone size={24} className="text-primary" /> Google AdSense सेटिङ
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">AdSense Client ID</label>
                <input 
                  type="text" 
                  value={settings.adSenseClient || ""}
                  onChange={(e) => setSettings({ ...settings, adSenseClient: e.target.value })}
                  placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">Default Ad Slot ID</label>
                <input 
                  type="text" 
                  value={settings.adSenseSlot || ""}
                  onChange={(e) => setSettings({ ...settings, adSenseSlot: e.target.value })}
                  placeholder="XXXXXXXXXX"
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50"
                />
              </div>
            </div>
            <p className="text-xxs font-bold text-muted-text uppercase tracking-widest">
              नोट: यदि कस्टम विज्ञापनहरू छैनन् भने, यी AdSense विज्ञापनहरू देखिनेछन्।
            </p>
          </div>

          <div className="bg-card p-10 rounded-[2.5rem] border border-border-theme flex flex-col gap-8 shadow-sm">
            <h3 className="text-xl font-black text-card-foreground uppercase tracking-tight flex items-center gap-3">
              <Megaphone size={24} className="text-primary" /> प्रायोजित विज्ञापनहरू (Sponsored Ads)
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-black text-muted-text uppercase tracking-widest">विज्ञापनहरू (प्रति लाइन एक: 'विज्ञापन | लिङ्क' वा केवल 'विज्ञापन')</label>
                <textarea 
                  value={(Array.isArray(settings.sponsoredAds) ? settings.sponsoredAds : []).map(ad => {
                    if (typeof ad === 'string') return ad;
                    if (!ad) return "";
                    return `${ad.text}${ad.link ? ` | ${ad.link}` : ''}`;
                  }).join("\n")}
                  onChange={(e) => {
                    const lines = e.target.value.split("\n");
                    const adsArray = lines.map(line => {
                      if (line.includes('|')) {
                        const [text, link] = line.split('|').map(s => s.trim());
                        return { text, link };
                      }
                      return line;
                    });
                    setSettings({ ...settings, sponsoredAds: adsArray });
                  }}
                  placeholder="विज्ञापन १ | https://link1.com&#10;विज्ञापन २"
                  className="w-full bg-muted-area border-none rounded-xl py-4 px-4 text-sm font-bold text-card-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-text/50"
                  rows={8}
                />
              </div>
              <p className="text-xxs font-bold text-muted-text uppercase tracking-widest leading-loose">
                नोट: यी विज्ञापनहरू लाइभ च्याटमा स्क्रोलिङ टेक्स्टको रूपमा देखिनेछन्। लिङ्क राख्नको लागि 'विज्ञापन नाम | URL' ढाँचा प्रयोग गर्नुहोस्।
              </p>
            </div>
          </div>

          {/* Ask Sanatan AI Settings */}
          <AskSanatanAdminSection />

          {/* Advanced / Developer Tools Hub */}
          <DeveloperToolsSection />
        </form>
      </div>
    </AdminLayout>
  );
}
