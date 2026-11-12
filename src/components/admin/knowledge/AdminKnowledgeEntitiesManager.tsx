import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  Filter, 
  Layers, 
  MapPin, 
  BookOpen, 
  X, 
  Save, 
  PlusCircle, 
  MinusCircle, 
  FileText, 
  Image as ImageIcon,
  Tag,
  Calendar,
  Eye,
  Check,
  Zap,
  Archive,
  History
} from "lucide-react";
import { 
  KnowledgeEntity, 
  KnowledgeCategory, 
  KnowledgeStatus, 
  KnowledgeVerificationStatus,
  canManageKnowledge 
} from "@/src/types/knowledge";
import { useAuth } from "@/src/lib/auth";
import { KnowledgeRepository } from "@/src/services/knowledge/knowledgeRepository";
import { knowledgeSnapshotService } from "@/src/services/knowledge/knowledgeSnapshotService";
import { knowledgeGraphEngine } from "@/src/services/knowledge/knowledgeGraphEngine";
import MediaAssetPickerModal from "@/src/components/media/MediaAssetPickerModal";
import { toast } from "sonner";

export default function AdminKnowledgeEntitiesManager() {
  const { user } = useAuth();
  const [entities, setEntities] = useState<KnowledgeEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isRebuildingSnapshot, setIsRebuildingSnapshot] = useState(false);

  // Edit / Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    canonicalId: string;
    nameNepali: string;
    nameEnglish: string;
    sanskrit: string;
    aliases: string;
    category: KnowledgeCategory;
    district: string;
    province: string;
    historicalPeriod: string;
    description: string;
    imageUrl: string;
    status: KnowledgeStatus;
    verificationStatus: KnowledgeVerificationStatus;
    sourceTitle: string;
    sourceOrg: string;
    sourceUrls: string;
    verifiedBy: string;
    verificationNotes: string;
    attributesList: { key: string; value: string }[];
    sgisDocumentIds: string;
    scriptureReferenceIds: string;
  }>({
    canonicalId: "",
    nameNepali: "",
    nameEnglish: "",
    sanskrit: "",
    aliases: "",
    category: "temple",
    district: "",
    province: "",
    historicalPeriod: "",
    description: "",
    imageUrl: "",
    status: "draft",
    verificationStatus: "unverified",
    sourceTitle: "SanatanMarga Editorial Registry",
    sourceOrg: "SanatanMarga Knowledge Council",
    sourceUrls: "https://sanatanmarga.org",
    verifiedBy: user?.displayName || user?.email || "Admin",
    verificationNotes: "",
    attributesList: [{ key: "", value: "" }],
    sgisDocumentIds: "",
    scriptureReferenceIds: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      await knowledgeGraphEngine.load({ publicOnly: false });
      const { entities: loaded } = await knowledgeSnapshotService.getEntities({ allowFallback: true, publicOnly: false });
      setEntities(loaded);
    } catch (e) {
      console.error("[AdminKnowledge] Error loading entities:", e);
      toast.error("ज्ञानकोष लोड गर्न समस्या भयो");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      canonicalId: "",
      nameNepali: "",
      nameEnglish: "",
      sanskrit: "",
      aliases: "",
      category: "temple",
      district: "",
      province: "",
      historicalPeriod: "",
      description: "",
      imageUrl: "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=2070&auto=format&fit=crop",
      status: "draft",
      verificationStatus: "unverified",
      sourceTitle: "SanatanMarga Editorial Registry",
      sourceOrg: "SanatanMarga Knowledge Council",
      sourceUrls: "https://sanatanmarga.org",
      verifiedBy: user?.displayName || user?.email || "Admin",
      verificationNotes: "",
      attributesList: [{ key: "मुख्य विशेषता", value: "" }],
      sgisDocumentIds: "",
      scriptureReferenceIds: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entity: KnowledgeEntity) => {
    setEditingId(entity.id);
    const attrList = Object.entries(entity.keyAttributes || {}).map(([key, value]) => ({ key, value }));
    if (attrList.length === 0) attrList.push({ key: "", value: "" });

    setFormData({
      canonicalId: entity.canonicalId || entity.id,
      nameNepali: entity.nameNepali || "",
      nameEnglish: entity.nameEnglish || "",
      sanskrit: entity.sanskrit || "",
      aliases: (entity.aliases || []).join(", "),
      category: entity.category || "temple",
      district: entity.district || "",
      province: entity.province || "",
      historicalPeriod: entity.historicalPeriod || "",
      description: entity.description || "",
      imageUrl: entity.imageUrl || "",
      status: entity.status || "draft",
      verificationStatus: entity.verificationStatus || "unverified",
      sourceTitle: entity.provenance?.sourceTitle || "SanatanMarga Editorial Registry",
      sourceOrg: entity.provenance?.sourceOrg || "SanatanMarga Knowledge Council",
      sourceUrls: (entity.provenance?.sourceUrls || []).join(", "),
      verifiedBy: entity.provenance?.verifiedBy || user?.displayName || "Admin",
      verificationNotes: entity.provenance?.notes || "",
      attributesList: attrList,
      sgisDocumentIds: (entity.sgisDocumentIds || []).join(", "),
      scriptureReferenceIds: (entity.scriptureReferenceIds || []).join(", ")
    });
    setIsModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageKnowledge(user)) {
      toast.error("अनुमति अस्वीकृत: एडमिन अधिकार आवश्यक छ");
      return;
    }

    if (!formData.nameNepali.trim()) {
      toast.error("कृपया नेपाली नाम प्रविष्ट गर्नुहोस्");
      return;
    }

    const keyAttributes: Record<string, string> = {};
    formData.attributesList.forEach(attr => {
      if (attr.key.trim() && attr.value.trim()) {
        keyAttributes[attr.key.trim()] = attr.value.trim();
      }
    });

    const aliases = formData.aliases.split(",").map(s => s.trim()).filter(Boolean);
    const sourceUrls = formData.sourceUrls.split(",").map(s => s.trim()).filter(Boolean);
    const sgisDocumentIds = formData.sgisDocumentIds.split(",").map(s => s.trim()).filter(Boolean);
    const scriptureReferenceIds = formData.scriptureReferenceIds.split(",").map(s => s.trim()).filter(Boolean);

    const payload: Partial<KnowledgeEntity> = {
      canonicalId: formData.canonicalId.trim() || (formData.nameEnglish ? formData.nameEnglish.toLowerCase().replace(/[^a-z0-9]+/g, "-") : `entity-${Date.now()}`),
      nameNepali: formData.nameNepali.trim(),
      nameEnglish: formData.nameEnglish.trim(),
      sanskrit: formData.sanskrit.trim() || undefined,
      aliases,
      category: formData.category,
      district: formData.district.trim() || undefined,
      province: formData.province.trim() || undefined,
      historicalPeriod: formData.historicalPeriod.trim() || undefined,
      description: formData.description.trim(),
      imageUrl: formData.imageUrl.trim() || "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=2070&auto=format&fit=crop",
      status: formData.status,
      verificationStatus: formData.verificationStatus,
      keyAttributes,
      relatedEntities: [],
      sgisDocumentIds,
      scriptureReferenceIds,
      provenance: {
        sourceTitle: formData.sourceTitle.trim(),
        sourceOrg: formData.sourceOrg.trim(),
        sourceUrls,
        verifiedBy: formData.verifiedBy.trim(),
        verifiedAt: new Date().toISOString(),
        notes: formData.verificationNotes.trim(),
        confidence: 0.99
      }
    };

    if (editingId) {
      const res = await KnowledgeRepository.updateEntity(editingId, payload, user);
      if (res.success) {
        toast.success("ज्ञान बिन्दु सफलतापूर्वक अपडेट गरियो!");
        setIsModalOpen(false);
        loadData();
      } else {
        toast.error(`अपडेट असफल: ${res.error}`);
      }
    } else {
      const res = await KnowledgeRepository.createEntity(payload as any, user);
      if (res.success) {
        toast.success("नयाँ ज्ञान बिन्दु सफलतापूर्वक सिर्जना गरियो!");
        setIsModalOpen(false);
        loadData();
      } else {
        toast.error(`सिर्जना असफल: ${res.error}`);
      }
    }
  };

  const handleQuickStatusChange = async (entity: KnowledgeEntity, newStatus: KnowledgeStatus) => {
    if (!canManageKnowledge(user)) return;
    const res = await KnowledgeRepository.publishEntity(entity.id, newStatus, user);
    if (res.success) {
      toast.success(`स्थिति परिवर्तन: ${newStatus}`);
      loadData();
    } else {
      toast.error(`त्रुटि: ${res.error}`);
    }
  };

  const handleQuickVerificationToggle = async (entity: KnowledgeEntity) => {
    if (!canManageKnowledge(user)) return;
    const newVer = entity.verificationStatus === "verified" ? "unverified" : "verified";
    const res = await KnowledgeRepository.verifyEntity(entity.id, newVer, `Toggled by ${user?.email}`, user);
    if (res.success) {
      toast.success(`प्रमाणीकरण स्थिति: ${newVer}`);
      loadData();
    } else {
      toast.error(`त्रुटि: ${res.error}`);
    }
  };

  const handleRebuildSnapshot = async () => {
    setIsRebuildingSnapshot(true);
    try {
      knowledgeSnapshotService.invalidate();
      await loadData();
      toast.success("Snapshot OS Invalidation & Memory Cache Rebuilt!");
    } catch (e) {
      toast.error("Snapshot रिबिल्ड असफल भयो");
    } finally {
      setIsRebuildingSnapshot(false);
    }
  };

  // Metrics
  const total = entities.length;
  const published = entities.filter(e => e.status === "published").length;
  const verified = entities.filter(e => e.verificationStatus === "verified").length;
  const pending = entities.filter(e => e.status === "pending_review").length;
  const draft = entities.filter(e => e.status === "draft").length;

  const filtered = entities.filter(e => {
    const matchesSearch = !searchTerm.trim() || 
      e.nameNepali.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.nameEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.district && e.district.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border-theme space-y-1">
          <span className="text-xxs text-muted-text font-bold uppercase">कुल ज्ञान बिन्दु</span>
          <p className="text-2xl font-black font-mono text-card-foreground">{total}</p>
          <span className="text-[10px] text-muted-text">Entities in OS</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
          <span className="text-xxs text-emerald-600 font-bold uppercase">प्रकाशित (Published)</span>
          <p className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">{published}</p>
          <span className="text-[10px] text-emerald-600">सार्वजनिक रूपमा उपलब्ध</span>
        </div>

        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-1">
          <span className="text-xxs text-sky-600 font-bold uppercase">प्रमाणित (Verified)</span>
          <p className="text-2xl font-black font-mono text-sky-700 dark:text-sky-400">{verified}</p>
          <span className="text-[10px] text-sky-600">स्रोत प्रमाणित</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
          <span className="text-xxs text-amber-600 font-bold uppercase">समीक्षामा (Pending)</span>
          <p className="text-2xl font-black font-mono text-amber-700 dark:text-amber-400">{pending}</p>
          <span className="text-[10px] text-amber-600">समीक्षा बाँकी</span>
        </div>

        <div className="p-4 rounded-2xl bg-muted-area border border-border-theme space-y-1">
          <span className="text-xxs text-muted-text font-bold uppercase">मस्यौदा (Draft)</span>
          <p className="text-2xl font-black font-mono text-muted-text">{draft}</p>
          <span className="text-[10px] text-muted-text">अप्रकाशित</span>
        </div>
      </div>

      {/* Action Bar: Search, Filters & Create Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border-theme">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-text" />
            <input
              type="text"
              placeholder="नाम, आइडी वा जिल्ला खोज्नुहोस्..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-muted-area border border-border-theme rounded-xl text-xs font-medium focus:border-primary outline-hidden"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-muted-area border border-border-theme rounded-xl text-xs font-bold"
          >
            <option value="all">सबै स्थिति (All Status)</option>
            <option value="published">Published</option>
            <option value="pending_review">Pending Review</option>
            <option value="verified">Verified</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-muted-area border border-border-theme rounded-xl text-xs font-bold"
          >
            <option value="all">सबै श्रेणी (All Categories)</option>
            <option value="temple">मन्दिर (Temple)</option>
            <option value="scripture">ग्रन्थ (Scripture)</option>
            <option value="festival">चाडपर्व (Festival)</option>
            <option value="figure">व्यक्तित्व (Figure)</option>
            <option value="heritage">सम्पदा (Heritage)</option>
            <option value="organization">संस्था (Organization)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRebuildSnapshot}
            disabled={isRebuildingSnapshot}
            className="px-3 py-2 bg-muted-area hover:bg-card border border-border-theme rounded-xl text-xs font-bold text-card-foreground flex items-center gap-1.5 cursor-pointer"
          >
            <Zap size={14} className={isRebuildingSnapshot ? "animate-spin text-amber-500" : "text-amber-500"} />
            <span>{isRebuildingSnapshot ? "Rebuilding..." : "Rebuild Snapshot"}</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-primary/90 cursor-pointer"
          >
            <Plus size={14} />
            <span>नयाँ ज्ञान बिन्दु (Create Entity)</span>
          </button>
        </div>
      </div>

      {/* Entities Table */}
      <div className="bg-card border border-border-theme rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-muted-text text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            ज्ञानकोष लोड हुँदैछ...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-text text-sm">
            कुनै ज्ञान बिन्दु फेला परेन।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted-area/50 border-b border-border-theme text-muted-text font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">ज्ञान बिन्दु (Entity)</th>
                  <th className="p-3.5">श्रेणी / स्थान</th>
                  <th className="p-3.5">Canonical ID</th>
                  <th className="p-3.5">प्रमाणीकरण</th>
                  <th className="p-3.5">स्थिति</th>
                  <th className="p-3.5">संस्करण</th>
                  <th className="p-3.5 text-right">कार्यहरू (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme">
                {filtered.map(entity => (
                  <tr key={entity.id} className="hover:bg-muted-area/30 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={entity.imageUrl || "https://images.unsplash.com/photo-1609137144869-37367123d57f?q=80&w=2070&auto=format&fit=crop"}
                          alt={entity.nameNepali}
                          className="w-10 h-10 rounded-xl object-cover border border-border-theme shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-card-foreground block truncate">{entity.nameNepali}</span>
                          <span className="text-xxs text-muted-text block truncate">{entity.nameEnglish}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-muted-area text-foreground border border-border-theme text-[10px] font-bold uppercase block w-max">
                        {entity.category}
                      </span>
                      {entity.district && (
                        <span className="text-xxs text-muted-text flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="text-primary" /> {entity.district}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 font-mono text-xxs text-muted-text">
                      {entity.canonicalId || entity.id}
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => handleQuickVerificationToggle(entity)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all ${
                          entity.verificationStatus === "verified"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        }`}
                        title="प्रमाणीकरण परिवर्तन गर्नुहोस्"
                      >
                        <ShieldCheck size={12} />
                        {entity.verificationStatus === "verified" ? "VERIFIED" : "UNVERIFIED"}
                      </button>
                    </td>

                    <td className="p-3.5">
                      <select
                        value={entity.status}
                        onChange={e => handleQuickStatusChange(entity, e.target.value as KnowledgeStatus)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase font-mono cursor-pointer border ${
                          entity.status === "published"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : entity.status === "pending_review"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : entity.status === "archived"
                            ? "bg-red-500/10 text-red-600 border-red-500/20"
                            : "bg-muted-area text-muted-text border-border-theme"
                        }`}
                      >
                        <option value="draft">DRAFT</option>
                        <option value="pending_review">PENDING</option>
                        <option value="verified">VERIFIED</option>
                        <option value="published">PUBLISHED</option>
                        <option value="deprecated">DEPRECATED</option>
                        <option value="archived">ARCHIVED</option>
                      </select>
                    </td>

                    <td className="p-3.5 font-mono text-xxs text-muted-text">
                      v{entity.version || 1}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(entity)}
                          className="p-1.5 rounded-lg bg-muted-area hover:bg-card border border-border-theme text-foreground hover:text-primary cursor-pointer"
                          title="सम्पादन गर्नुहोस्"
                        >
                          <Edit3 size={13} />
                        </button>
                        <a
                          href={`/knowledge?entity=${entity.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-muted-area hover:bg-card border border-border-theme text-foreground hover:text-primary"
                          title="सार्वजनिक दृश्य"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border-theme rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border-theme">
              <div>
                <h3 className="text-lg font-black text-card-foreground">
                  {editingId ? "ज्ञान बिन्दु सम्पादन (Edit Knowledge Entity)" : "नयाँ ज्ञान बिन्दु सिर्जना (Create Knowledge Entity)"}
                </h3>
                <p className="text-xs text-muted-text">
                  Knowledge OS Governance & Provenance Specification
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-muted-area hover:bg-card border border-border-theme text-muted-text hover:text-card-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-muted-text mb-1">नेपाली नाम (Nepali Name) *</label>
                  <input
                    type="text"
                    required
                    value={formData.nameNepali}
                    onChange={e => setFormData({ ...formData, nameNepali: e.target.value })}
                    placeholder="e.g. श्री पशुपतिनाथ मन्दिर"
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-muted-text mb-1">अंग्रेजी नाम (English Name)</label>
                  <input
                    type="text"
                    value={formData.nameEnglish}
                    onChange={e => setFormData({ ...formData, nameEnglish: e.target.value })}
                    placeholder="e.g. Pashupatinath Temple"
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-muted-text mb-1">Canonical ID (Unique)</label>
                  <input
                    type="text"
                    value={formData.canonicalId}
                    onChange={e => setFormData({ ...formData, canonicalId: e.target.value })}
                    placeholder="e.g. pashupatinath"
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-muted-text mb-1">संस्कृत नाम (Sanskrit)</label>
                  <input
                    type="text"
                    value={formData.sanskrit}
                    onChange={e => setFormData({ ...formData, sanskrit: e.target.value })}
                    placeholder="e.g. श्रीपशुपतिनाथः"
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-muted-text mb-1">श्रेणी (Category) *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as KnowledgeCategory })}
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="temple">मन्दिर / धाम (Temple)</option>
                    <option value="scripture">वैदिक ग्रन्थ (Scripture)</option>
                    <option value="festival">चाडपर्व (Festival)</option>
                    <option value="figure">व्यक्तित्व (Figure)</option>
                    <option value="heritage">सांस्कृतिक सम्पदा (Heritage)</option>
                    <option value="organization">संस्था (Organization)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-muted-text mb-1">जिल्ला (District)</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                    placeholder="e.g. काठमाडौँ"
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-muted-text mb-1">प्रदेश (Province)</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={e => setFormData({ ...formData, province: e.target.value })}
                    placeholder="e.g. बागमती प्रदेश"
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-muted-text mb-1">ऐतिहासिक कालखण्ड (Period)</label>
                  <input
                    type="text"
                    value={formData.historicalPeriod}
                    onChange={e => setFormData({ ...formData, historicalPeriod: e.target.value })}
                    placeholder="e.g. पाँचौँ शताब्दी"
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-muted-text mb-1">पर्यायवाची नामहरू (Aliases, Comma-separated)</label>
                <input
                  type="text"
                  value={formData.aliases}
                  onChange={e => setFormData({ ...formData, aliases: e.target.value })}
                  placeholder="e.g. पशुपति, Pashupati, श्री पशुपति"
                  className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-muted-text mb-1">विवरण (Description) *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ज्ञान बिन्दुको विस्तृत विवरण..."
                  className="w-full bg-muted-area border border-border-theme rounded-xl p-3 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-muted-text mb-1">तस्बिर URL (Image URL)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="px-3 py-2 bg-muted-area hover:bg-card border border-border-theme rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ImageIcon size={14} />
                    <span>ग्यालरी</span>
                  </button>
                </div>
              </div>

              {/* Provenance Section */}
              <div className="p-4 rounded-2xl bg-muted-area/40 border border-border-theme space-y-3">
                <span className="font-bold text-card-foreground flex items-center gap-1.5 text-xs">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  प्रमाणिकता तथा स्रोत (Truth Provenance Specification)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xxs font-bold text-muted-text mb-1">स्रोत निकाय (Source Org)</label>
                    <input
                      type="text"
                      value={formData.sourceOrg}
                      onChange={e => setFormData({ ...formData, sourceOrg: e.target.value })}
                      placeholder="e.g. Department of Archaeology"
                      className="w-full bg-card border border-border-theme rounded-xl px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-muted-text mb-1">प्रमाणीकरणकर्ता (Verified By)</label>
                    <input
                      type="text"
                      value={formData.verifiedBy}
                      onChange={e => setFormData({ ...formData, verifiedBy: e.target.value })}
                      placeholder="e.g. Scholar Council"
                      className="w-full bg-card border border-border-theme rounded-xl px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-muted-text mb-1">स्रोत URL हरू (Source URLs, Comma-separated)</label>
                  <input
                    type="text"
                    value={formData.sourceUrls}
                    onChange={e => setFormData({ ...formData, sourceUrls: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-card border border-border-theme rounded-xl px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Status & Governance Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-muted-text mb-1">प्रकाशन स्थिति (Publication Status)</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as KnowledgeStatus })}
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="draft">Draft (मस्यौदा)</option>
                    <option value="pending_review">Pending Review (समीक्षामा)</option>
                    <option value="verified">Verified (प्रमाणित)</option>
                    <option value="published">Published (सार्वजनिक प्रकाशित)</option>
                    <option value="archived">Archived (संग्रहित)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-muted-text mb-1">सत्यता प्रमाणीकरण (Verification Status)</label>
                  <select
                    value={formData.verificationStatus}
                    onChange={e => setFormData({ ...formData, verificationStatus: e.target.value as KnowledgeVerificationStatus })}
                    className="w-full bg-muted-area border border-border-theme rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="unverified">Unverified (अपुष्ट)</option>
                    <option value="reviewed">Reviewed (समीक्षित)</option>
                    <option value="verified">Verified (प्रमाणित)</option>
                  </select>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-theme">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-muted-area hover:bg-card border border-border-theme rounded-xl font-bold text-card-foreground cursor-pointer"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md hover:bg-primary/90 cursor-pointer"
                >
                  <Save size={14} />
                  <span>{editingId ? "अपडेट सुरक्षित गर्नुहोस्" : "सिर्जना गर्नुहोस्"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Asset Picker Modal */}
      {isMediaPickerOpen && (
        <MediaAssetPickerModal
          isOpen={isMediaPickerOpen}
          onClose={() => setIsMediaPickerOpen(false)}
          onSelect={(asset: any) => {
            const url = typeof asset === "string" ? asset : (asset?.url || "");
            setFormData({ ...formData, imageUrl: url });
            setIsMediaPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}
