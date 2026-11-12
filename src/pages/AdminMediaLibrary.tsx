import { useState, useEffect } from "react";
import { 
  Image as ImageIcon, Film, Music, FileText, Plus, Search, Filter, Copy, 
  Trash2, Edit, Check, Eye, HelpCircle, Calendar, Share2, Tag, 
  Copyright, Sparkles, X, Info, ExternalLink, AlertCircle, RefreshCw
} from "lucide-react";
import { 
  collection, query, orderBy, limit, onSnapshot, 
  addDoc, doc, updateDoc, deleteDoc, getDocs, writeBatch
} from "@/src/lib/firebase";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import { formatDate } from "../lib/utils";
import AdminLayout from "../components/layout/AdminLayout";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import type { MediaAsset, MediaLicenseType, MediaMimeType } from "../types";
import { snapshotEngine } from "@/src/services/snapshotEngine";

// Static Seed Data for fallback and demo
const SEED_MEDIA_ASSETS = [
  {
    title: "Pasupatinath Temple Evening Aarati",
    caption: "A breathtaking video documentation of the daily Bagmati Ganga Aarati ritual at Pashupatinath Temple.",
    altText: "Daily Ganga Aarati ritual at Pashupatinath temple banks with lamps and devotees",
    tags: ["culture", "kathmandu", "aarati", "temple", "pashupatinath"],
    photographer: "Sujal Shrestha",
    copyrightOwner: "Sanatan Media Group LLC",
    licenseType: "owned" as MediaLicenseType,
    storagePath: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=1200", // Fallback beautiful image
    mimeType: "video" as MediaMimeType,
    usageRights: "Full digital publication rights across all web, television, and print domains under Sanatan Media.",
    expirationDate: "2030-12-31",
    linkedArticlesCount: 4,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString() // 3 days ago
  },
  {
    title: "Boudhanath Stupa Sunset Aerial",
    caption: "High-resolution overhead shot of the sacred Boudhanath Stupa surrounded by prayer flags under a golden sunset.",
    altText: "Boudhanath Stupa hemisphere under a brilliant orange sunset cloudscape",
    tags: ["buddhism", "stupa", "sunset", "kathmandu", "heritage"],
    photographer: "Aayush Manandhar",
    copyrightOwner: "Creative Commons ShareAlike",
    licenseType: "creative_commons" as MediaLicenseType,
    storagePath: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=1200",
    mimeType: "image" as MediaMimeType,
    usageRights: "Attribution-ShareAlike (CC BY-SA). Free for commercial distribution with appropriate author attribution.",
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString() // 5 days ago
  },
  {
    title: "Vedic Chanting and Rigveda Recitation",
    caption: "Studio quality audio recording of traditional Brahmin scholars chanting initial hymns of the Rigveda in high fidelity.",
    altText: "Rigveda auditory recording cover with Sanskrit script",
    tags: ["vedic", "rigveda", "mantra", "audio", "sanskrit"],
    photographer: "Acharya Ram Sharma",
    copyrightOwner: "Sanatan Veda Foundation",
    licenseType: "partner" as MediaLicenseType,
    storagePath: "https://images.unsplash.com/photo-1609137144813-7d7211bf7fc4?auto=format&fit=crop&q=80&w=1200",
    mimeType: "audio" as MediaMimeType,
    usageRights: "Restricted partner distribution. Licensed exclusively for educational and non-commercial supplementary media loops.",
    expirationDate: "2028-06-01",
    linkedArticlesCount: 2,
    createdAt: new Date(Date.now() - 3600000 * 24 * 12).toISOString()
  },
  {
    title: "Gorkha Durbar Historical Registry",
    caption: "Scanned manuscript details of the unification declaration written inside Gorkha Durbar in late 18th century.",
    altText: "Ancient hand-written parchment document with historic wax seals and royal signet",
    tags: ["history", "gorkha", "manuscript", "document", "unification"],
    photographer: "National Archives Department",
    copyrightOwner: "Department of Archaeology, Nepal",
    licenseType: "restricted" as MediaLicenseType,
    storagePath: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=1200",
    mimeType: "document" as MediaMimeType,
    usageRights: "Highly Restricted. Read-only editorial reference. Strictly prohibited from download or secondary redistribution.",
    expirationDate: "2026-12-31",
    linkedArticlesCount: 1,
    createdAt: new Date(Date.now() - 3600000 * 24 * 18).toISOString()
  },
  {
    title: "Janaki Temple Deepawali Splendor",
    caption: "A magnificent night-time wide view of Janaki Mandir in Janakpur illuminated with thousands of oil lamps and led lighting.",
    altText: "Janaki Temple glowing in brilliant colorful illuminations with thousands of small oil lamps on stairs",
    tags: ["janakpur", "festival", "diwali", "temple", "mithila"],
    photographer: "Mithila Photo Labs",
    copyrightOwner: "Janakpur Area Development Trust",
    licenseType: "sponsored" as MediaLicenseType,
    storagePath: "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&q=80&w=1200",
    mimeType: "image" as MediaMimeType,
    usageRights: "Sponsored promotion asset. Rights valid until expiration for regional campaign integration.",
    expirationDate: "2027-11-01",
    linkedArticlesCount: 5,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString() // 12 hours ago
  }
];

export default function AdminMediaLibrary() {
  const { user } = useAuth();
  
  // States
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [mimeFilter, setMimeFilter] = useState<string>("all");
  const [licenseFilter, setLicenseFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "popularity">("newest");
  const [showTrashOnly, setShowTrashOnly] = useState(false);

  // Form States for creating new asset
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formType, setFormType] = useState<"image" | "video" | "audio" | "document">("image");
  const [assetForm, setAssetForm] = useState({
    title: "",
    caption: "",
    altText: "",
    tagInput: "",
    photographer: "",
    copyrightOwner: "",
    licenseType: "owned" as MediaLicenseType,
    storagePath: "",
    usageRights: "",
    expirationDate: ""
  });

  // Drawer / Details modal state
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<MediaAsset>>({});

  // Trigger real-time Firestore listeners
  useEffect(() => {
    setLoading(true);
    const mediaQuery = query(collection(db, "mediaAssets"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(mediaQuery, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as MediaAsset));
      setAssets(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching media assets:", error);
      toast.error("मिडिया एसेटहरू लोड गर्न असफल भयो।");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Quick seed function if empty
  const handleSeedDatabase = async () => {
    setIsUploading(true);
    try {
      const batch = writeBatch(db);
      SEED_MEDIA_ASSETS.forEach((item) => {
        const docRef = doc(collection(db, "mediaAssets"));
        batch.set(docRef, {
          ...item,
          uploadedBy: user?.uid || "system",
          uploadedByName: user?.displayName || "System Operator",
          createdAt: new Date(item.createdAt).toISOString()
        });
      });
      await batch.commit();
      toast.success("नमुना मिडिया एसेटहरू सफलतापूर्वक सीड गरियो!");
    } catch (err: any) {
      console.error(err);
      toast.error("सीड गर्न असफल: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  // Simulate file upload and populate form fields nicely
  const handleFileSelected = (file: File) => {
    // Detect mime type
    let detectedType: MediaMimeType = "image";
    if (file.type.startsWith("video/")) detectedType = "video";
    else if (file.type.startsWith("audio/")) detectedType = "audio";
    else if (file.type.startsWith("application/pdf") || file.type.includes("document") || file.type.includes("sheet")) detectedType = "document";

    setFormType(detectedType);

    // Auto-generate realistic URLs using Unsplash, Pixabay or simple placeholder for preview
    let mockUrl = "";
    if (detectedType === "image") {
      mockUrl = `https://images.unsplash.com/photo-${Math.floor(1000000000000 + Math.random() * 900000000000)}?auto=format&fit=crop&q=80&w=1200`;
    } else if (detectedType === "video") {
      mockUrl = "https://assets.mixkit.co/videos/preview/mixkit-traditional-hindu-wedding-ceremony-nepal-41870-large.mp4";
    } else if (detectedType === "audio") {
      mockUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    } else {
      mockUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
    }

    // Clean name for title
    const cleanName = file.name.split(".")[0].replace(/[_-]/g, " ");

    setAssetForm(prev => ({
      ...prev,
      title: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      photographer: user?.displayName || "Sujal Shrestha",
      copyrightOwner: "Sanatan Media LLC",
      storagePath: mockUrl,
      caption: `A high-quality ${detectedType} file uploaded named '${file.name}'.`,
      altText: `Visual asset demonstrating ${cleanName}`,
      tagInput: detectedType + ", upload, custom"
    }));

    toast.success(`'${file.name}' सफलतापूर्वक लोड भयो! अब बाँकी विवरणहरू थप्नुहोस्।`);
  };

  // Form submission to Firestore
  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetForm.title || !assetForm.storagePath) {
      toast.error("शीर्षक र एसेट युआरएल (URL) अनिवार्य छ।");
      return;
    }

    setIsUploading(true);
    try {
      const tagsArray = assetForm.tagInput
        ? assetForm.tagInput.split(",").map(t => t.trim().toLowerCase()).filter(t => t !== "")
        : [];

      const newAsset = {
        title: assetForm.title,
        caption: assetForm.caption || "",
        altText: assetForm.altText || "",
        tags: tagsArray,
        photographer: assetForm.photographer || "",
        copyrightOwner: assetForm.copyrightOwner || "Sanatan Media",
        licenseType: assetForm.licenseType,
        storagePath: assetForm.storagePath,
        mimeType: formType,
        uploadedBy: user?.uid || "unknown",
        uploadedByName: user?.displayName || "System Operator",
        usageRights: assetForm.usageRights || "",
        expirationDate: assetForm.expirationDate || "",
        linkedArticlesCount: 0,
        createdAt: new Date().toISOString()
      };

      // Save to firebase
      const docRef = await addDoc(collection(db, "mediaAssets"), newAsset);
      const injectedAsset = { id: docRef.id, ...newAsset };
      snapshotEngine.injectMediaAssets([injectedAsset]);
      snapshotEngine.triggerPublishRebuild("admin_media_upload");

      // Audit Log
      await addDoc(collection(db, "auditLogs"), {
        action: "MEDIA_ASSET_UPLOADED",
        userId: user?.uid || "system",
        userEmail: user?.email || "system@sanatanmarga.com",
        userName: user?.displayName || "System Operator",
        metadata: { assetId: docRef.id, title: assetForm.title, mimeType: formType },
        timestamp: new Date().toISOString()
      });

      toast.success("नयाँ मिडिया एसेट मिडिया लाइब्रेरीमा थपियो!");
      
      // Reset form
      setAssetForm({
        title: "",
        caption: "",
        altText: "",
        tagInput: "",
        photographer: "",
        copyrightOwner: "",
        licenseType: "owned",
        storagePath: "",
        usageRights: "",
        expirationDate: ""
      });
      setShowUploadForm(false);
    } catch (err: any) {
      console.error(err);
      toast.error("थप्न असफल भयो: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Quick edit save
  const handleSaveEdit = async () => {
    if (!selectedAsset || !editForm.title) return;
    try {
      const docRef = doc(db, "mediaAssets", selectedAsset.id);
      await updateDoc(docRef, {
        ...editForm,
        createdAt: selectedAsset.createdAt // preserve date
      });

      // Update local detailed view
      setSelectedAsset(prev => prev ? { ...prev, ...editForm } as MediaAsset : null);
      setIsEditing(false);
      toast.success("मिडिया विवरणहरू सफलतापूर्वक सुरक्षित गरियो!");

      // Audit Log
      await addDoc(collection(db, "auditLogs"), {
        action: "MEDIA_ASSET_UPDATED",
        userId: user?.uid || "system",
        userEmail: user?.email || "system@sanatanmarga.com",
        userName: user?.displayName || "System Operator",
        metadata: { assetId: selectedAsset.id, title: editForm.title },
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error(err);
      toast.error("सुरक्षित गर्न असफल: " + err.message);
    }
  };

  // Soft Delete Asset handler with confirmation (Soft Delete by default to protect the archive)
  const handleDeleteAsset = async (assetId: string, title: string) => {
    if (!window.confirm(`के तपाईं निश्चित रूपमा '${title}' एसेट हटाउन चाहनुहुन्छ? (यो फाइल सफ्ट-मेटाएर कचरा बक्समा सुरक्षित रहनेछ)`)) return;
    try {
      const docRef = doc(db, "mediaAssets", assetId);
      await updateDoc(docRef, {
        deleted: true,
        deletedBy: user?.uid || "system",
        deletedByName: user?.displayName || "System Operator",
        deletedAt: new Date().toISOString()
      });
      setSelectedAsset(null);
      toast.success("मिडिया एसेट सफ्ट-डिलिट भयो। कचरा बक्सबाट यसलाई पुनःस्थापना गर्न सकिन्छ।");

      // Audit Log
      await addDoc(collection(db, "auditLogs"), {
        action: "MEDIA_ASSET_SOFT_DELETED",
        userId: user?.uid || "system",
        userEmail: user?.email || "system@sanatanmarga.com",
        userName: user?.displayName || "System Operator",
        metadata: { assetId, title },
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error(err);
      toast.error("सफ्ट-मेटाउन असफल भयो: " + err.message);
    }
  };

  // Restore Asset from soft deleted state
  const handleRestoreAsset = async (assetId: string, title: string) => {
    try {
      const docRef = doc(db, "mediaAssets", assetId);
      await updateDoc(docRef, {
        deleted: false,
        deletedBy: null,
        deletedByName: null,
        deletedAt: null
      });
      setSelectedAsset(null);
      toast.success("मिडिया एसेट सफलतापूर्वक पुनःस्थापना गरियो!");

      // Audit Log
      await addDoc(collection(db, "auditLogs"), {
        action: "MEDIA_ASSET_RESTORED",
        userId: user?.uid || "system",
        userEmail: user?.email || "system@sanatanmarga.com",
        userName: user?.displayName || "System Operator",
        metadata: { assetId, title },
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error(err);
      toast.error("पुनःस्थापना गर्न असफल: " + err.message);
    }
  };

  // Permanent Delete Asset (Only available to Admins)
  const handlePermanentDeleteAsset = async (assetId: string, title: string) => {
    if (!window.confirm(`चेतावनी: के तपाईं निश्चित रूपमा '${title}' लाई स्थायी रूपमा मेटाउन चाहनुहुन्छ? यो फिर्ता ल्याउन सकिने छैन र सबै सम्बन्धित लेखहरू प्रभावित हुन सक्छन्!`)) return;
    try {
      await deleteDoc(doc(db, "mediaAssets", assetId));
      setSelectedAsset(null);
      toast.success("मिडिया एसेट स्थायी रूपमा डेटाबेसबाट हटाइयो।");

      // Audit Log
      await addDoc(collection(db, "auditLogs"), {
        action: "MEDIA_ASSET_PERMANENTLY_DELETED",
        userId: user?.uid || "system",
        userEmail: user?.email || "system@sanatanmarga.com",
        userName: user?.displayName || "System Operator",
        metadata: { assetId, title },
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error(err);
      toast.error("स्थायी रूपमा मेटाउन असफल: " + err.message);
    }
  };

  // Copy helper
  const handleCopyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  // Filter & Search computation
  const filteredAssets = assets.filter(asset => {
    // Hide soft deleted assets unless we are in Trash mode
    if (showTrashOnly) {
      if (!asset.deleted) return false;
    } else {
      if (asset.deleted) return false;
    }

    const q = (searchQuery || "").toLowerCase();
    const matchesSearch = 
      (asset.title || "").toLowerCase().includes(q) ||
      (asset.photographer ? asset.photographer.toLowerCase().includes(q) : false) ||
      (asset.copyrightOwner ? asset.copyrightOwner.toLowerCase().includes(q) : false) ||
      (Array.isArray(asset.tags) && asset.tags.some(tag => (tag || "").toLowerCase().includes(q)));

    const matchesMime = mimeFilter === "all" || asset.mimeType === mimeFilter;
    const matchesLicense = licenseFilter === "all" || asset.licenseType === licenseFilter;

    return matchesSearch && matchesMime && matchesLicense;
  }).sort((a, b) => {
    if (showTrashOnly) {
      const timeA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
      const timeB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
      return timeB - timeA;
    }
    if (sortBy === "newest") {
      const timeA = new Date(a.restoredAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.restoredAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    } else if (sortBy === "oldest") {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeA - timeB;
    } else {
      return (b.linkedArticlesCount || 0) - (a.linkedArticlesCount || 0);
    }
  });

  // Stats calculation
  const activeAssets = assets.filter(a => !a.deleted);
  const totalCount = activeAssets.length;
  const imageCount = activeAssets.filter(a => a.mimeType === "image").length;
  const videoCount = activeAssets.filter(a => a.mimeType === "video").length;
  const audioCount = activeAssets.filter(a => a.mimeType === "audio").length;
  const docCount = activeAssets.filter(a => a.mimeType === "document").length;
  const trashCount = assets.filter(a => a.deleted).length;
  
  const licenseStats = activeAssets.reduce((acc, curr) => {
    acc[curr.licenseType] = (acc[curr.licenseType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ccCount = licenseStats["creative_commons"] || 0;
  const restrictedCount = licenseStats["restricted"] || 0;

  // Colors based on License Type
  const getLicenseColor = (type: MediaLicenseType) => {
    switch (type) {
      case "owned": return "bg-blue-500/15 text-blue-500 border-blue-500/20";
      case "creative_commons": return "bg-green-500/15 text-green-500 border-green-500/20";
      case "restricted": return "bg-rose-500/15 text-rose-500 border-rose-500/20";
      case "partner": return "bg-violet-500/15 text-violet-500 border-violet-500/20";
      case "sponsored": return "bg-amber-500/15 text-amber-500 border-amber-500/20";
      default: return "bg-slate-500/15 text-slate-500 border-slate-500/20";
    }
  };

  const getMimeIcon = (type: MediaMimeType) => {
    switch (type) {
      case "image": return <ImageIcon size={18} />;
      case "video": return <Film size={18} />;
      case "audio": return <Music size={18} />;
      case "document": return <FileText size={18} />;
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black text-card-foreground tracking-tight flex items-center gap-2">
              मिडिया एसेट लाइब्रेरी <span className="text-primary font-mono text-xs px-2.5 py-1 bg-primary/10 rounded-full">Media Asset OS</span>
            </h1>
            <p className="text-xs font-medium text-muted-text">
              प्रतिलिपि अधिकार सुशासन (Copyright Governance), एसेट रेफरेन्सिङ, र मिडिया प्रकार फिल्टर सहितको डिजिटल सम्पत्ति भण्डार।
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto">
            {assets.length === 0 && (
              <button 
                onClick={handleSeedDatabase}
                disabled={isUploading}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-muted-area border border-border-theme text-xs font-bold rounded-2xl hover:bg-muted-area/80 transition-all text-card-foreground disabled:opacity-50"
              >
                <Sparkles size={16} className="text-amber-500" />
                नमुना डेटा सीड गर्नुहोस्
              </button>
            )}
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-primary/95 transition-all shadow-lg shadow-primary/10"
            >
              {showUploadForm ? <X size={16} /> : <Plus size={16} />}
              {showUploadForm ? "फारम बन्द गर्नुहोस्" : "मिडिया थप्नुहोस्"}
            </button>
          </div>
        </div>

        {/* Dynamic Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-card p-5 sm:p-6 rounded-[2rem] border border-border-theme flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <ImageIcon size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-xxs font-black text-slate-500 uppercase tracking-widest">जम्मा फाइलहरू</span>
              <span className="text-xl sm:text-2xl font-black text-card-foreground">{totalCount}</span>
              <span className="text-xxs font-bold text-muted-text mt-0.5">Images: {imageCount} | Videos: {videoCount}</span>
            </div>
          </div>

          <div className="bg-card p-5 sm:p-6 rounded-[2rem] border border-border-theme flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center flex-shrink-0">
              <Copyright size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-xxs font-black text-slate-500 uppercase tracking-widest">क्रिएटिभ कमन्स (CC)</span>
              <span className="text-xl sm:text-2xl font-black text-card-foreground">{ccCount}</span>
              <span className="text-xxs font-bold text-green-600/90 mt-0.5">मुक्त वितरण र प्रयोग</span>
            </div>
          </div>

          <div className="bg-card p-5 sm:p-6 rounded-[2rem] border border-border-theme flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-xxs font-black text-slate-500 uppercase tracking-widest">प्रतिबन्धित फाइलहरू</span>
              <span className="text-xl sm:text-2xl font-black text-card-foreground">{restrictedCount}</span>
              <span className="text-xxs font-bold text-rose-500/90 mt-0.5">पुनः वितरणमा निषेध</span>
            </div>
          </div>

          <div className="bg-card p-5 sm:p-6 rounded-[2rem] border border-border-theme flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center flex-shrink-0">
              <FileText size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-xxs font-black text-slate-500 uppercase tracking-widest">अडियो र कागजात</span>
              <span className="text-xl sm:text-2xl font-black text-card-foreground">{audioCount + docCount}</span>
              <span className="text-xxs font-bold text-muted-text mt-0.5">Audio: {audioCount} | Docs: {docCount}</span>
            </div>
          </div>
        </div>

        {/* Upload Form Expansion */}
        <AnimatePresence>
          {showUploadForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card p-6 sm:p-8 rounded-[2.5rem] border border-border-theme flex flex-col gap-6 shadow-xl relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Plus size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-card-foreground">नयाँ मिडिया एसेट थप्नुहोस् (Add New Media Asset)</h3>
                      <p className="text-xxs text-muted-text font-bold">कानुनी सुशासकीय विवरण (Copyright & License Attributes) प्रविष्टि अनिवार्य छ।</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowUploadForm(false)}
                    className="p-2 hover:bg-muted-area rounded-xl transition-all text-muted-text"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Drag & Drop Area */}
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                    dragActive 
                      ? "border-primary bg-primary/5 scale-[0.99]" 
                      : "border-border-theme hover:border-primary/40 bg-muted-area/50"
                  }`}
                >
                  <div className="w-14 h-14 rounded-full bg-muted-area border border-border-theme flex items-center justify-center shadow-inner">
                    <ImageIcon size={26} className="text-muted-text" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-black text-card-foreground">फाइल तान्नुहोस् (Drag & Drop) वा यहाँ क्लिक गर्नुहोस्</span>
                    <span className="text-xxs font-bold text-muted-text uppercase tracking-wider">Images, Video clips, Recitative Audio, Manuscripts (PDF) up to 50MB</span>
                  </div>
                  
                  <input 
                    type="file" 
                    id="media-file-input" 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept="image/*,video/*,audio/*,application/pdf"
                  />
                  <label 
                    htmlFor="media-file-input"
                    className="px-4 py-2 bg-card border border-border-theme rounded-xl text-xxs font-bold hover:bg-muted-area transition-all"
                  >
                    स्थानीय फाइल छान्नुहोस्
                  </label>
                </div>

                {/* Main Form Fields */}
                <form onSubmit={handleCreateAsset} className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-border-theme/60">
                  
                  {/* File type selector */}
                  <div className="md:col-span-12 flex items-center gap-2 bg-muted-area p-1.5 rounded-2xl w-fit border border-border-theme/60">
                    <button
                      type="button"
                      onClick={() => setFormType("image")}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xxs font-black tracking-wider uppercase transition-all ${
                        formType === "image" ? "bg-card text-primary shadow-sm" : "text-muted-text hover:text-card-foreground"
                      }`}
                    >
                      <ImageIcon size={14} /> फोटो (Image)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType("video")}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xxs font-black tracking-wider uppercase transition-all ${
                        formType === "video" ? "bg-card text-primary shadow-sm" : "text-muted-text hover:text-card-foreground"
                      }`}
                    >
                      <Film size={14} /> भिडियो (Video)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType("audio")}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xxs font-black tracking-wider uppercase transition-all ${
                        formType === "audio" ? "bg-card text-primary shadow-sm" : "text-muted-text hover:text-card-foreground"
                      }`}
                    >
                      <Music size={14} /> अडियो (Audio)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType("document")}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xxs font-black tracking-wider uppercase transition-all ${
                        formType === "document" ? "bg-card text-primary shadow-sm" : "text-muted-text hover:text-card-foreground"
                      }`}
                    >
                      <FileText size={14} /> कागजात (Doc)
                    </button>
                  </div>

                  {/* Title & Path */}
                  <div className="md:col-span-6 flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">फाइलको शीर्षक (Asset Title) *</label>
                    <input 
                      type="text" 
                      value={assetForm.title}
                      onChange={(e) => setAssetForm({ ...assetForm, title: e.target.value })}
                      placeholder="उदा: पशुपतिनाथ साँझको महाआरती" 
                      className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none text-card-foreground focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="md:col-span-6 flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">स्टोरेज वा बाह्य लिंक (Storage URL) *</label>
                    <input 
                      type="text" 
                      value={assetForm.storagePath}
                      onChange={(e) => setAssetForm({ ...assetForm, storagePath: e.target.value })}
                      placeholder="उदा: https://images.unsplash.com/... वा भिडियो फाइल युआरएल" 
                      className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none text-card-foreground focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {/* Caption & AltText */}
                  <div className="md:col-span-6 flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">क्याप्सन (Caption / Description)</label>
                    <textarea 
                      value={assetForm.caption}
                      onChange={(e) => setAssetForm({ ...assetForm, caption: e.target.value })}
                      placeholder="समाचारमा छाप्न मिल्ने संक्षिप्त क्याप्सन विवरण..." 
                      className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none text-card-foreground focus:ring-2 focus:ring-primary/20 h-20 resize-none"
                    />
                  </div>

                  <div className="md:col-span-6 flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">अल्ट टेक्स्ट (Alt Text - For Screen Readers)</label>
                    <textarea 
                      value={assetForm.altText}
                      onChange={(e) => setAssetForm({ ...assetForm, altText: e.target.value })}
                      placeholder="दृष्टिबिहीन वा स्क्रिन रिडर प्रयोगकर्ताहरूको लागि वर्णनात्मक अल्ट विवरण..." 
                      className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none text-card-foreground focus:ring-2 focus:ring-primary/20 h-20 resize-none"
                    />
                  </div>

                  {/* Copyright Governance & Licensing */}
                  <div className="md:col-span-3 flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">लाइसेन्स प्रकार (License Type)</label>
                    <select
                      value={assetForm.licenseType}
                      onChange={(e) => setAssetForm({ ...assetForm, licenseType: e.target.value as MediaLicenseType })}
                      className="w-full bg-muted-area border-none rounded-2xl py-3.5 px-4 text-sm font-medium outline-none text-card-foreground appearance-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="owned">स्वामित्वमा रहेको (Owned)</option>
                      <option value="creative_commons">क्रिएटिभ कमन्स (CC)</option>
                      <option value="partner">साझेदार मिडिया (Partner)</option>
                      <option value="sponsored">प्रायोजित (Sponsored)</option>
                      <option value="restricted">प्रतिबन्धित (Restricted / Single Use)</option>
                      <option value="internal">आन्तरिक प्रयोग मात्र (Internal)</option>
                    </select>
                  </div>

                  <div className="md:col-span-3 flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">छायाकार / क्यामेराम्यान</label>
                    <input 
                      type="text" 
                      value={assetForm.photographer}
                      onChange={(e) => setAssetForm({ ...assetForm, photographer: e.target.value })}
                      placeholder="उदा: सागर राणा" 
                      className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none text-card-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="md:col-span-3 flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">प्रतिलिपि अधिकार धनी (Owner)</label>
                    <input 
                      type="text" 
                      value={assetForm.copyrightOwner}
                      onChange={(e) => setAssetForm({ ...assetForm, copyrightOwner: e.target.value })}
                      placeholder="उदा: सनातन मिडिया ग्रुप LLC" 
                      className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none text-card-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="md:col-span-3 flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">लाइसेन्स समाप्ति मिति (Expiry)</label>
                    <input 
                      type="date" 
                      value={assetForm.expirationDate}
                      onChange={(e) => setAssetForm({ ...assetForm, expirationDate: e.target.value })}
                      className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none text-card-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="md:col-span-6 flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">ट्यागहरू (Tags - Comma separated)</label>
                    <input 
                      type="text" 
                      value={assetForm.tagInput}
                      onChange={(e) => setAssetForm({ ...assetForm, tagInput: e.target.value })}
                      placeholder="उदा: मन्दिर, देवघाट, महाआरती, २०२६" 
                      className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none text-card-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="md:col-span-6 flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-500 uppercase tracking-widest">प्रयोग अधिकार शर्तहरू (Usage Rights / Clause)</label>
                    <input 
                      type="text" 
                      value={assetForm.usageRights}
                      onChange={(e) => setAssetForm({ ...assetForm, usageRights: e.target.value })}
                      placeholder="उदा: केवल धार्मिक कभरेजमा मात्र प्रयोग गर्न मिल्ने..." 
                      className="w-full bg-muted-area border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none text-card-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="md:col-span-12 flex justify-end gap-3 pt-4 border-t border-border-theme/40">
                    <button
                      type="button"
                      onClick={() => setShowUploadForm(false)}
                      className="px-6 py-3 bg-muted-area hover:bg-muted-area/80 text-xxs font-black uppercase tracking-widest text-card-foreground rounded-2xl transition-all"
                    >
                      रद्द गर्नुहोस्
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="px-8 py-3 bg-primary text-white text-xxs font-black uppercase tracking-widest rounded-2xl hover:bg-primary/95 transition-all shadow-lg shadow-primary/10 disabled:opacity-50"
                    >
                      {isUploading ? "थपिदैछ..." : "मिडिया लाइब्रेरीमा प्रविष्टि गर्नुहोस्"}
                    </button>
                  </div>

                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls, Filter & Search Console */}
        <div className="bg-card p-6 rounded-[2.5rem] border border-border-theme flex flex-col gap-4 shadow-sm">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            
            {/* Search */}
            <div className="xl:col-span-3 relative">
              <Search className="absolute left-4 top-3.5 text-muted-text" size={18} />
              <input
                type="text"
                placeholder="शीर्षक, ट्याग, फोटोग्राफर..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-muted-area border border-border-theme/60 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold outline-none text-card-foreground placeholder-slate-400 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Mime Filter */}
            <div className="xl:col-span-3 flex items-center gap-1.5 bg-muted-area p-1 rounded-2xl border border-border-theme/60">
              <button
                onClick={() => setMimeFilter("all")}
                className={`flex-1 text-center py-2 rounded-xl text-xxs font-black uppercase tracking-wider transition-all ${
                  mimeFilter === "all" ? "bg-card text-primary shadow-sm" : "text-muted-text hover:text-card-foreground"
                }`}
              >
                सबै
              </button>
              <button
                onClick={() => setMimeFilter("image")}
                className={`flex-1 text-center py-2 rounded-xl text-xxs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                  mimeFilter === "image" ? "bg-card text-primary shadow-sm" : "text-muted-text hover:text-card-foreground"
                }`}
              >
                <ImageIcon size={12} /> फोटो
              </button>
              <button
                onClick={() => setMimeFilter("video")}
                className={`flex-1 text-center py-2 rounded-xl text-xxs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                  mimeFilter === "video" ? "bg-card text-primary shadow-sm" : "text-muted-text hover:text-card-foreground"
                }`}
              >
                <Film size={12} /> भिडियो
              </button>
              <button
                onClick={() => setMimeFilter("audio")}
                className={`flex-1 text-center py-2 rounded-xl text-xxs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                  mimeFilter === "audio" ? "bg-card text-primary shadow-sm" : "text-muted-text hover:text-card-foreground"
                }`}
              >
                <Music size={12} /> अडियो
              </button>
              <button
                onClick={() => setMimeFilter("document")}
                className={`flex-1 text-center py-2 rounded-xl text-xxs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                  mimeFilter === "document" ? "bg-card text-primary shadow-sm" : "text-muted-text hover:text-card-foreground"
                }`}
              >
                <FileText size={12} /> कागजात
              </button>
            </div>

            {/* License Filter */}
            <div className="xl:col-span-2 flex items-center gap-2">
              <Filter size={16} className="text-muted-text flex-shrink-0" />
              <select
                value={licenseFilter}
                onChange={(e) => setLicenseFilter(e.target.value)}
                className="w-full bg-muted-area border border-border-theme/60 rounded-2xl py-3 px-3 text-xs font-bold outline-none text-card-foreground focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                <option value="all">सबै लाइसेन्स (All)</option>
                <option value="owned">स्वामित्वमा (Owned)</option>
                <option value="creative_commons">CC</option>
                <option value="partner">साझेदार (Partner)</option>
                <option value="sponsored">प्रायोजित (Sponsored)</option>
                <option value="restricted">प्रतिबन्धित (Restricted)</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="xl:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-muted-area border border-border-theme/60 rounded-2xl py-3 px-4 text-xs font-bold outline-none text-card-foreground focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                <option value="newest">नयाँ देखि पुरानो</option>
                <option value="oldest">पुरानो देखि नयाँ</option>
                <option value="popularity">बढी लिङ्क (Popular)</option>
              </select>
            </div>

            {/* Trash Bin Toggle */}
            <div className="xl:col-span-2">
              <button
                onClick={() => setShowTrashOnly(!showTrashOnly)}
                className={`w-full flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-xs font-black transition-all border ${
                  showTrashOnly
                    ? "bg-rose-500/15 text-rose-500 border-rose-500/30"
                    : "bg-muted-area text-muted-text border-border-theme/60 hover:text-card-foreground"
                }`}
              >
                <Trash2 size={16} />
                कचरा बक्स ({trashCount})
              </button>
            </div>

          </div>
        </div>

        {/* Media Grid Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <RefreshCw size={40} className="text-primary animate-spin" />
            <p className="text-xs font-black text-muted-text uppercase tracking-widest">मिडिया लाइब्रेरी लोड हुँदैछ...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="bg-card py-28 rounded-[2.5rem] border border-border-theme text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted-area flex items-center justify-center border border-border-theme shadow-inner">
              <Search size={28} className="text-muted-text" />
            </div>
            <div className="flex flex-col gap-1 max-w-md">
              <h3 className="text-base font-black text-card-foreground">मिडिया भेटिएन</h3>
              <p className="text-xs text-muted-text">तपाईंले खोज्नुभएको शीर्षक, लाइसेन्स प्रकार वा ट्यागसँग मिल्दोजुल्दो कुनै फाइल उपलब्ध छैन।</p>
            </div>
            {assets.length === 0 && (
              <button
                onClick={handleSeedDatabase}
                disabled={isUploading}
                className="mt-2 px-6 py-3 bg-primary text-white text-xxs font-black uppercase tracking-widest rounded-2xl hover:bg-primary/95 transition-all shadow-md"
              >
                नमुना एसेटहरू लोड गर्नुहोस् (Seed Demo)
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredAssets.map((asset) => {
                const refTag = `[asset:${asset.id}]`;
                return (
                  <motion.div
                    key={asset.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-card rounded-[2rem] border border-border-theme overflow-hidden flex flex-col group hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
                  >
                    
                    {/* Media Thumbnail Container */}
                    <div className="relative aspect-video bg-muted-area overflow-hidden border-b border-border-theme/40">
                      
                      {/* Thumbnail fallback based on type */}
                      {asset.mimeType === "image" || asset.mimeType === "video" ? (
                        <img 
                          src={asset.storagePath || null} 
                          alt={asset.altText || asset.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-muted-area text-muted-text">
                          <div className="w-12 h-12 rounded-full bg-card border border-border-theme/60 flex items-center justify-center shadow-inner text-primary">
                            {getMimeIcon(asset.mimeType)}
                          </div>
                          <span className="text-xxs font-black tracking-widest uppercase">{asset.mimeType} File</span>
                        </div>
                      )}

                      {/* Floating badging */}
                      <span className="absolute top-3 left-3 px-2 py-1 rounded-xl bg-black/50 backdrop-blur-md text-[10px] text-white font-bold flex items-center gap-1 border border-white/10">
                        {getMimeIcon(asset.mimeType)}
                        <span className="uppercase">{asset.mimeType}</span>
                      </span>

                      <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border backdrop-blur-sm ${getLicenseColor(asset.licenseType)}`}>
                        {asset.licenseType.replace("_", " ")}
                      </span>

                      {/* Quick copy reference code on hover overlay */}
                      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xxs opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleCopyToClipboard(refTag, "एसेट रेफरेन्स कोड कपि भयो!")}
                          title="Copy reference tag for editors"
                          className="p-2.5 bg-card text-card-foreground rounded-2xl hover:scale-110 transition-transform shadow-lg border border-border-theme flex items-center gap-1.5 text-xxs font-bold"
                        >
                          <Copy size={14} /> Ref: {asset.id.slice(0, 5)}...
                        </button>
                        <button
                          onClick={() => setSelectedAsset(asset)}
                          className="p-2.5 bg-primary text-white rounded-2xl hover:scale-110 transition-transform shadow-lg flex items-center gap-1.5 text-xxs font-bold"
                        >
                          <Eye size={14} /> विवरण
                        </button>
                      </div>

                    </div>

                    {/* Metadata summary */}
                    <div className="p-5 flex-grow flex flex-col gap-3 justify-between">
                      <div className="flex flex-col gap-1.5">
                        <h4 className="text-xs font-black text-card-foreground line-clamp-1 leading-relaxed">{asset.title}</h4>
                        <p className="text-xxs text-muted-text line-clamp-2 leading-relaxed h-8">{asset.caption || "कुनै विवरण क्याप्सन थपिएको छैन।"}</p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 h-6 overflow-hidden">
                        {asset.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-muted-area text-[9px] font-bold rounded text-slate-500 border border-border-theme/40">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-border-theme/50 flex items-center justify-between text-[10px] font-bold text-muted-text">
                        <span className="flex items-center gap-1">
                          <Copyright size={10} /> {asset.photographer || "अज्ञात"}
                        </span>
                        <span>{formatDate(asset.createdAt)}</span>
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Selected Asset Detailed View Overlay Panel */}
        <AnimatePresence>
          {selectedAsset && (
            <div className="fixed inset-0 z-[100000] flex items-center justify-end bg-black/40 backdrop-blur-xs">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25 }}
                className="w-full max-w-xl h-full bg-card border-l border-border-theme p-6 sm:p-8 flex flex-col gap-6 overflow-y-auto shadow-2xl"
              >
                
                {/* Header with dismiss & actions */}
                <div className="flex items-center justify-between border-b border-border-theme/60 pb-4">
                  <div className="flex items-center gap-2">
                    <Info size={20} className="text-primary" />
                    <h3 className="text-base font-black text-card-foreground">एसेट मेटाडाटा र स्वामित्व प्रशासन</h3>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAsset(null);
                      setIsEditing(false);
                    }}
                    className="p-2 hover:bg-muted-area rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Main asset view visual */}
                <div className="rounded-2xl overflow-hidden aspect-video bg-muted-area relative border border-border-theme/50">
                  {selectedAsset.mimeType === "image" || selectedAsset.mimeType === "video" ? (
                    <img 
                      src={selectedAsset.storagePath || null} 
                      alt={selectedAsset.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-muted-area text-muted-text">
                      <div className="w-14 h-14 rounded-full bg-card border border-border-theme flex items-center justify-center text-primary">
                        {getMimeIcon(selectedAsset.mimeType)}
                      </div>
                      <span className="text-xxs font-black uppercase tracking-widest">{selectedAsset.mimeType} File</span>
                    </div>
                  )}

                  <span className={`absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${getLicenseColor(selectedAsset.licenseType)}`}>
                    {selectedAsset.licenseType.replace("_", " ")}
                  </span>
                </div>

                {/* Edit Toggle / Form Control */}
                {isEditing ? (
                  <div className="flex flex-col gap-4">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">विवरण सम्पादन गर्नुहोस्</h4>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">शीर्षक (Title) *</label>
                      <input 
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full bg-muted-area border-none rounded-xl py-2.5 px-3.5 text-xs font-bold text-card-foreground"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">क्याप्सन (Caption / Editorial description)</label>
                      <textarea 
                        value={editForm.caption}
                        onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                        className="w-full bg-muted-area border-none rounded-xl py-2.5 px-3.5 text-xs font-bold text-card-foreground h-16 resize-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">अल्ट टेक्स्ट (Alt Text)</label>
                      <textarea 
                        value={editForm.altText}
                        onChange={(e) => setEditForm({ ...editForm, altText: e.target.value })}
                        className="w-full bg-muted-area border-none rounded-xl py-2.5 px-3.5 text-xs font-bold text-card-foreground h-16 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">छायाकार</label>
                        <input 
                          type="text"
                          value={editForm.photographer}
                          onChange={(e) => setEditForm({ ...editForm, photographer: e.target.value })}
                          className="w-full bg-muted-area border-none rounded-xl py-2.5 px-3.5 text-xs font-bold text-card-foreground"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">प्रतिलिपि धनी</label>
                        <input 
                          type="text"
                          value={editForm.copyrightOwner}
                          onChange={(e) => setEditForm({ ...editForm, copyrightOwner: e.target.value })}
                          className="w-full bg-muted-area border-none rounded-xl py-2.5 px-3.5 text-xs font-bold text-card-foreground"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">लाइसेन्स प्रकार</label>
                        <select
                          value={editForm.licenseType}
                          onChange={(e) => setEditForm({ ...editForm, licenseType: e.target.value as MediaLicenseType })}
                          className="w-full bg-muted-area border-none rounded-xl py-2.5 px-3 text-xs font-bold text-card-foreground appearance-none"
                        >
                          <option value="owned">owned</option>
                          <option value="creative_commons">creative_commons</option>
                          <option value="partner">partner</option>
                          <option value="sponsored">sponsored</option>
                          <option value="restricted">restricted</option>
                          <option value="internal">internal</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">समाप्ति मिति</label>
                        <input 
                          type="date"
                          value={editForm.expirationDate}
                          onChange={(e) => setEditForm({ ...editForm, expirationDate: e.target.value })}
                          className="w-full bg-muted-area border-none rounded-xl py-2.5 px-3 text-xs font-bold text-card-foreground"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-3">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-muted-area text-xxs font-black uppercase tracking-wider text-card-foreground rounded-xl"
                      >
                        रद्द गर्नुहोस्
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-5 py-2 bg-primary text-white text-xxs font-black uppercase tracking-wider rounded-xl"
                      >
                        विवरण सुरक्षित गर्नुहोस्
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    
                    {/* Metadata values */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black tracking-widest text-primary uppercase">शीर्षक</span>
                      <h4 className="text-base font-black text-card-foreground">{selectedAsset.title}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-6 bg-muted-area/50 p-4 rounded-2xl border border-border-theme/40 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">फोटोग्राफर / सर्जक</span>
                        <span className="font-bold text-card-foreground">{selectedAsset.photographer || "Unknown"}</span>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">प्रतिलिपि धनी (Owner)</span>
                        <span className="font-bold text-card-foreground">{selectedAsset.copyrightOwner}</span>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">समाप्ति मिति (Expiry)</span>
                        <span className={`font-bold ${selectedAsset.expirationDate ? "text-primary" : "text-slate-400"}`}>
                          {selectedAsset.expirationDate || "Unlimited Access"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">अपलोड मिति</span>
                        <span className="font-bold text-slate-500">{formatDate(selectedAsset.createdAt)}</span>
                      </div>
                    </div>

                    {/* Description Paragraphs */}
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">क्याप्सन (Caption)</span>
                        <p className="text-xs font-bold text-card-foreground leading-relaxed bg-muted-area p-3.5 rounded-2xl border border-dashed border-border-theme/50">
                          {selectedAsset.caption || "कुनै वर्णन थपिएको छैन।"}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">अल्ट टेक्स्ट (Alt Text)</span>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed">
                          {selectedAsset.altText || "पहुँच विवरण अल्ट-टेक्स्ट खाली छ।"}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">उपयोग अधिकार (Usage Rights Clause)</span>
                        <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                          <Info size={14} /> {selectedAsset.usageRights || "कुनै सीमित शर्त छैन।"}
                        </p>
                      </div>
                    </div>

                    {/* Reference Copy Blocks */}
                    <div className="flex flex-col gap-3 bg-muted-area p-5 rounded-[2rem] border border-border-theme">
                      <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">सम्पादकिय सन्दर्भ रेफरेन्स (Editor References)</span>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border-theme text-xxs font-bold">
                          <span className="text-slate-500">Asset Ref Tag:</span>
                          <span className="font-mono text-primary font-black">[asset:{selectedAsset.id}]</span>
                          <button
                            onClick={() => handleCopyToClipboard(`[asset:${selectedAsset.id}]`, "एसेट रेफरेन्स कोड कपि भयो!")}
                            className="p-1 hover:bg-muted-area rounded text-primary"
                          >
                            <Copy size={14} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border-theme text-xxs font-bold">
                          <span className="text-slate-500">Asset Raw URL:</span>
                          <span className="font-mono text-slate-600 truncate max-w-[200px]">{selectedAsset.storagePath}</span>
                          <button
                            onClick={() => handleCopyToClipboard(selectedAsset.storagePath, "एसेट युआरएल कपि भयो!")}
                            className="p-1 hover:bg-muted-area rounded text-primary"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Operational Commands */}
                    <div className="flex items-center gap-3 pt-6 border-t border-border-theme/60 mt-auto">
                      {selectedAsset.deleted ? (
                        <>
                          <button
                            onClick={() => handleRestoreAsset(selectedAsset.id, selectedAsset.title)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500/10 hover:bg-green-500 hover:text-white rounded-2xl text-xxs font-black uppercase tracking-widest text-green-600 transition-all border border-green-500/20"
                          >
                            <RefreshCw size={14} /> पुनःस्थापना (Restore)
                          </button>
                          <button
                            onClick={() => handlePermanentDeleteAsset(selectedAsset.id, selectedAsset.title)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-500/15 hover:bg-rose-500 hover:text-white rounded-2xl text-xxs font-black uppercase tracking-widest text-rose-600 transition-all border border-rose-500/20"
                          >
                            <Trash2 size={14} /> स्थायी मेटाउनुहोस् (Purge)
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditForm({ ...selectedAsset });
                              setIsEditing(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-muted-area hover:bg-muted-area/80 rounded-2xl text-xxs font-black uppercase tracking-widest text-card-foreground border border-border-theme"
                          >
                            <Edit size={14} /> सम्पादन (Edit)
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(selectedAsset.id, selectedAsset.title)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-500/10 hover:bg-rose-500 hover:text-white rounded-2xl text-xxs font-black uppercase tracking-widest text-rose-500 transition-all"
                          >
                            <Trash2 size={14} /> मेटाउनुहोस् (Delete)
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                )}

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}
