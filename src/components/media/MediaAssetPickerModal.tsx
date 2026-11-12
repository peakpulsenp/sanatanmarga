import React, { useState, useEffect } from "react";
import { X, Search, Upload, Image as ImageIcon, Check, Filter, Folder, RefreshCw } from "lucide-react";
import { MediaAsset } from "../../types/media";
import { fetchMediaAssets } from "../../services/mediaService";
import MediaUploadCenter from "./MediaUploadCenter";

interface MediaAssetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
  tenantId?: string;
  category?: string;
  title?: string;
}

export default function MediaAssetPickerModal({
  isOpen,
  onClose,
  onSelect,
  tenantId = "all",
  category = "all",
  title = "Media Asset OS बाट मिडिया छनोट गर्नुहोस्",
}: MediaAssetPickerModalProps) {
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState(tenantId);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAssets();
    }
  }, [isOpen, selectedTenant, selectedCategory]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await fetchMediaAssets({
        tenantId: selectedTenant,
        category: selectedCategory,
        search,
        limitCount: 40,
      });
      setAssets(data);
    } catch (e) {
      console.error("Failed to load picker assets:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAssets();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-card text-card-foreground rounded-2xl border border-border-theme w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border-theme flex items-center justify-between bg-muted-area/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <ImageIcon size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">{title}</h3>
              <p className="text-xs text-muted-text">Cloudflare R2 Direct Upload & Storage Federation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted-area text-muted-text">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation & Filters */}
        <div className="p-4 border-b border-border-theme flex flex-col sm:flex-row items-center justify-between gap-3 bg-card">
          <div className="flex items-center gap-2 bg-muted-area/50 p-1 rounded-xl border border-border-theme w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("library")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "library"
                  ? "bg-card text-foreground shadow-sm border border-border-theme"
                  : "text-muted-text hover:text-foreground"
              }`}
            >
              मिडिया लाइब्रेरी (R2 Storage)
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "upload"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-text hover:text-foreground"
              }`}
            >
              <Upload size={14} /> नयाँ फाइल अपलोड
            </button>
          </div>

          {activeTab === "library" && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
                <input
                  type="text"
                  placeholder="खोज्नुहोस्..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-muted-area/50 border border-border-theme rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </form>

              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="bg-muted-area/50 border border-border-theme rounded-xl px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none"
              >
                <option value="all">सबै Tenant</option>
                <option value="sanatan-media">Sanatan Media</option>
                <option value="pokhara-metro">Pokhara Metro</option>
                <option value="purbanchal-cancer">Purbanchal Cancer</option>
              </select>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto flex-1 min-h-[350px]">
          {activeTab === "upload" ? (
            <MediaUploadCenter
              defaultTenantId={selectedTenant === "all" ? "sanatan-media" : selectedTenant}
              defaultCategory={selectedCategory === "all" ? "articles" : selectedCategory}
              onUploadSuccess={(asset) => {
                onSelect(asset);
                onClose();
              }}
            />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-text space-y-2">
              <RefreshCw size={24} className="animate-spin text-primary" />
              <p className="text-xs font-semibold">R2 Storage बाट मिडिया फाइलहरू लोड हुँदैछन्...</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <ImageIcon size={40} className="mx-auto text-muted-text/50" />
              <p className="text-xs font-bold text-muted-text">कुनै मिडिया सम्पत्ति भेटिएन।</p>
              <button
                onClick={() => setActiveTab("upload")}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90"
              >
                पहिलो फाइल अपलोड गर्नुहोस्
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {assets.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`group relative rounded-2xl border overflow-hidden cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary bg-primary/5 scale-[1.02]"
                        : "border-border-theme hover:border-primary/50 bg-card"
                    }`}
                  >
                    <div className="aspect-video bg-slate-950/20 overflow-hidden relative">
                      <img
                        src={asset.thumbnailUrl || asset.url || null}
                        alt={asset.altText || asset.fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      {asset.isR2 && (
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[9px] font-black text-amber-400 backdrop-blur-sm">
                          R2
                        </span>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                            <Check size={18} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 space-y-1">
                      <p className="font-bold text-xs text-foreground truncate">{asset.altText || asset.fileName}</p>
                      <div className="flex items-center justify-between text-[10px] text-muted-text">
                        <span>{asset.tenantId}</span>
                        <span>{(asset.size / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Select Action */}
        {activeTab === "library" && (
          <div className="p-4 border-t border-border-theme bg-muted-area/20 flex items-center justify-between">
            <p className="text-xs text-muted-text">
              {selectedAsset ? `छनोट गरिएको: ${selectedAsset.fileName}` : "कृपया एउटा मिडिया फाइल छनोट गर्नुहोस्"}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-text hover:bg-muted-area"
              >
                रद्द
              </button>
              <button
                disabled={!selectedAsset}
                onClick={() => {
                  if (selectedAsset) {
                    onSelect(selectedAsset);
                    onClose();
                  }
                }}
                className="px-6 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md"
              >
                यो मिडिया प्रयोग गर्नुहोस्
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
