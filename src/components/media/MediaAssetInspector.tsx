import React, { useState, useEffect } from "react";
import { X, Copy, Check, Trash2, ExternalLink, Sparkles, Folder, Tag, ShieldCheck, FileText, Layers, RefreshCw } from "lucide-react";
import { MediaAsset } from "../../types/media";
import { analyzeMediaWithAI, deleteMediaAsset } from "../../services/mediaService";
import { toast } from "sonner";

interface MediaAssetInspectorProps {
  asset: MediaAsset | null;
  onClose: () => void;
  onAssetDeleted?: (id: string) => void;
  onAssetUpdated?: (updated: MediaAsset) => void;
}

export default function MediaAssetInspector({
  asset,
  onClose,
  onAssetDeleted,
  onAssetUpdated,
}: MediaAssetInspectorProps) {
  const [copied, setCopied] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [altText, setAltText] = useState(asset?.altText || "");
  const [caption, setCaption] = useState(asset?.caption || "");

  useEffect(() => {
    if (asset) {
      setAltText(asset.altText || "");
      setCaption(asset.caption || "");
    }
  }, [asset]);

  if (!asset) return null;

  const copyUrl = () => {
    navigator.clipboard.writeText(asset.url);
    setCopied(true);
    toast.success("मिडिया लिंक प्रतिलिपि गरियो!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAiRefine = async () => {
    setAnalyzing(true);
    try {
      const aiResult = await analyzeMediaWithAI({ imageUrl: asset.url });
      setAltText(aiResult.altTextNepali || aiResult.altTextEnglish);
      setCaption(aiResult.caption);
      
      const updatedAsset = {
        ...asset,
        altText: aiResult.altTextNepali || aiResult.altTextEnglish,
        caption: aiResult.caption,
        tags: Array.from(new Set([...asset.tags, ...(aiResult.tags || [])])),
      };

      if (onAssetUpdated) {
        onAssetUpdated(updatedAsset);
      }
      toast.success("AI द्वारा Alt Text र ट्याग अद्यावधिक गरियो!");
    } catch (error) {
      toast.error("AI विश्लेषण असफल भयो");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("के तपाईं यो मिडिया सम्पत्ति स्थायी रूपमा हटाउन चाहनुहुन्छ?")) return;
    setDeleting(true);
    try {
      const ok = await deleteMediaAsset(asset.id);
      if (ok) {
        toast.success("मिडिया फाइल सफलतापूर्वक हटाइयो");
        if (onAssetDeleted) onAssetDeleted(asset.id);
        onClose();
      } else {
        toast.error("हटाउन सकिएन");
      }
    } catch (e) {
      toast.error("हटाउँदा त्रुटि भयो");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-md flex justify-end">
      <div className="w-full max-w-md bg-card text-card-foreground h-full overflow-y-auto border-l border-border-theme shadow-2xl p-6 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border-theme">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                asset.isR2 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
              }`}>
                {asset.isR2 ? "Cloudflare R2" : "Server Local"}
              </span>
              <span className="text-xs font-bold text-muted-text truncate max-w-[150px]">{asset.fileName}</span>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted-area text-muted-text">
              <X size={18} />
            </button>
          </div>

          {/* Large Image Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950/40 border border-border-theme group max-h-64 flex items-center justify-center">
            <img
              src={asset.url || null}
              alt={asset.altText || asset.fileName}
              className="max-h-60 w-auto object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
            <a
              href={asset.url}
              target="_blank"
              rel="noreferrer"
              className="absolute top-2 right-2 p-2 bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
              title="पूर्णाकारमा हेर्नुहोस्"
            >
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Quick Copy Link Bar */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted-area/50 border border-border-theme">
            <input
              type="text"
              readOnly
              value={asset.url}
              className="w-full bg-transparent text-xs font-mono text-muted-text focus:outline-none truncate"
            />
            <button
              onClick={copyUrl}
              className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shrink-0 flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "प्रतिलिपि भयो" : "लिंक कपी"}
            </button>
          </div>

          {/* Storage Metadata */}
          <div className="space-y-3 bg-muted-area/20 p-4 rounded-2xl border border-border-theme text-xs">
            <h4 className="font-bold text-foreground flex items-center gap-1.5 text-xs">
              <Folder size={14} className="text-primary" /> Storage Isolation Metadata
            </h4>
            
            <div className="grid grid-cols-2 gap-2 text-muted-text">
              <div>
                <span className="block font-semibold text-foreground/70">Tenant ID:</span>
                <span className="font-mono text-foreground font-bold">{asset.tenantId}</span>
              </div>
              <div>
                <span className="block font-semibold text-foreground/70">Category:</span>
                <span className="font-mono text-foreground font-bold">{asset.category}</span>
              </div>
              <div>
                <span className="block font-semibold text-foreground/70">File Size:</span>
                <span className="font-bold text-foreground">{(asset.size / 1024).toFixed(1)} KB</span>
              </div>
              <div>
                <span className="block font-semibold text-foreground/70">MIME Type:</span>
                <span className="font-mono text-foreground">{asset.mimeType}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border-theme/50">
              <span className="block font-semibold text-foreground/70 mb-0.5">Object Key (R2 Structure):</span>
              <span className="font-mono text-[11px] text-primary break-all bg-card p-1.5 rounded-lg border border-border-theme block">
                {asset.objectKey}
              </span>
            </div>
          </div>

          {/* Alt Text & Caption Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileText size={14} className="text-primary" /> Alt Text & accessibility (दृष्टिहीन/SEO)
              </label>
              <button
                onClick={handleAiRefine}
                disabled={analyzing}
                className="text-[10px] font-bold text-sacred hover:underline flex items-center gap-1"
              >
                <Sparkles size={12} className={analyzing ? "animate-spin" : ""} />
                {analyzing ? "विश्लेषण हुँदैछ..." : "Gemini AI Alt Text"}
              </button>
            </div>

            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="तस्बिरको वर्णन (Alt Text)"
              className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="क्याप्सन तथा सांस्कृतिक विवरण..."
              className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Tag size={14} className="text-emerald-500" /> ट्यागहरू (Tags)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {asset.tags?.map((t, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-semibold">
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* Usage Tracking (Prevents Accidental Deletion) */}
          <div className="space-y-2 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 text-xs">
            <h4 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Layers size={14} /> Usage Tracking (प्रयोग गरिएको ठाउँहरू)
            </h4>
            {asset.usedIn && asset.usedIn.length > 0 ? (
              <div className="space-y-1">
                {asset.usedIn.map((u, i) => (
                  <div key={i} className="flex items-center justify-between bg-card p-2 rounded-xl border border-border-theme">
                    <span className="font-bold text-foreground truncate max-w-[200px]">{u.title}</span>
                    <span className="px-2 py-0.5 bg-muted-area text-[10px] font-bold rounded-md uppercase">
                      {u.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-text text-[11px]">
                यो मिडिया फाइल हालसम्म कुनै सामग्रीमा जोडिएको छैन। सुरक्षित रूपमा हटाउन सकिन्छ।
              </p>
            )}
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="pt-4 border-t border-border-theme flex items-center justify-between">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} />
            {deleting ? "हटाउँदैछ..." : "हटाउनुहोस्"}
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-md"
          >
            बन्द गर्नुहोस्
          </button>
        </div>
      </div>
    </div>
  );
}
