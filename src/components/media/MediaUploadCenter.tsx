import React, { useState, useRef } from "react";
import { Upload, X, Check, Image as ImageIcon, Sparkles, Folder, Tag, AlertCircle, RefreshCw } from "lucide-react";
import { uploadMediaFile, analyzeMediaWithAI } from "../../services/mediaService";
import { MediaAsset } from "../../types/media";

interface MediaUploadCenterProps {
  onUploadSuccess?: (asset: MediaAsset) => void;
  onClose?: () => void;
  defaultTenantId?: string;
  defaultCategory?: string;
}

export default function MediaUploadCenter({
  onUploadSuccess,
  onClose,
  defaultTenantId = "sanatan-media",
  defaultCategory = "articles",
}: MediaUploadCenterProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [tenantId, setTenantId] = useState(defaultTenantId);
  const [category, setCategory] = useState(defaultCategory);
  const [customTags, setCustomTags] = useState("");
  const [autoAiMetadata, setAutoAiMetadata] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [uploadedAssets, setUploadedAssets] = useState<MediaAsset[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/") || f.type.startsWith("video/") || f.type.includes("pdf"));
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setProgress(5);
    setStatusMessage("मिडिया फाइलहरू तयार पारिँदैछ...");

    const tagsArray = customTags
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    const results: MediaAsset[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const stepProgress = Math.round(((i + 1) / selectedFiles.length) * 100);

      setStatusMessage(`अपलोड भइरहेछ (${i + 1}/${selectedFiles.length}): ${file.name}`);

      try {
        let aiResult: any = null;
        if (autoAiMetadata && file.type.startsWith("image/")) {
          // Read base64 for Gemini AI analysis
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          const base64 = await base64Promise;
          
          setStatusMessage(`AI द्वारा तस्बिर विश्लेषण र ट्याग जनरेट भइरहेछ...`);
          aiResult = await analyzeMediaWithAI({ imageBase64: base64, mimeType: file.type });
        }

        const asset = await uploadMediaFile({
          file,
          tenantId,
          category,
          tags: [...tagsArray, ...(aiResult?.tags || []), category, tenantId],
          altText: aiResult?.altTextNepali || file.name.split(".")[0],
          caption: aiResult?.caption || "",
          uploadedBy: "Admin Editor",
          onProgress: (p) => {
            const overall = Math.round(((i + (p / 100)) / selectedFiles.length) * 100);
            setProgress(overall);
          },
        });

        results.push(asset);
        if (onUploadSuccess) {
          onUploadSuccess(asset);
        }
      } catch (error: any) {
        console.error("Upload failed for file:", file.name, error);
      }
    }

    setUploadedAssets(results);
    setUploading(false);
    setProgress(100);
    setStatusMessage(`सफलतापूर्वक ${results.length} मिडिया फाइल(हरू) सञ्चय गरियो!`);
    setSelectedFiles([]);
  };

  return (
    <div className="bg-card text-card-foreground rounded-2xl border border-border-theme p-6 shadow-xl space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border-theme">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Upload size={22} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">Media Asset OS अपलोड सेन्टर</h3>
            <p className="text-xs text-muted-text">Cloudflare R2 Egress-Free Storage + AI ट्यागिङ</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted-area text-muted-text">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Tenant & Category Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
            <Folder size={14} className="text-primary" /> Tenant Isolation Domain
          </label>
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="sanatan-media">Sanatan Media (मुख्य मिडिया)</option>
            <option value="pokhara-metro">Pokhara Metro (पोखरा महानगर)</option>
            <option value="purbanchal-cancer">Purbanchal Cancer Hospital</option>
            <option value="janakpur-submetro">Janakpurdham Sub-Metro</option>
            <option value="lumbini-trust">Lumbini Development Trust</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
            <Folder size={14} className="text-emerald-500" /> Storage Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-muted-area/50 border border-border-theme rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="articles">Articles (समाचार तथा लेखहरू)</option>
            <option value="nepal_hub">Nepal Hub (नेपाल हब सूचनाहरू)</option>
            <option value="knowledge_base">Knowledge OS (ज्ञानकोष सम्पदाहरू)</option>
            <option value="banners">Banners & Ads (विज्ञापन ब्यानरहरू)</option>
            <option value="community">Chautari Community (चौतारी)</option>
            <option value="avatars">User Avatars (प्रयोगकर्ता प्रोफाइल)</option>
          </select>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border-theme hover:border-primary/50 bg-muted-area/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-inner">
          <ImageIcon size={32} />
        </div>
        <h4 className="font-bold text-sm text-foreground">
          यहाँ तस्बिर वा मिडिया फाइलहरू तानेर छाड्नुहोस् (Drag & Drop)
        </h4>
        <p className="text-xs text-muted-text mt-1">
          वा फाइल छनोट गर्न क्लीक गर्नुहोस् (JPG, PNG, WebP, MP4 - Up to 50MB)
        </p>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          <label className="text-xs font-bold text-foreground">छनोट गरिएका फाइलहरू ({selectedFiles.length}):</label>
          {selectedFiles.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-muted-area/50 border border-border-theme text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <ImageIcon size={16} className="text-primary shrink-0" />
                <span className="font-semibold text-foreground truncate">{f.name}</span>
                <span className="text-muted-text text-[10px]">({(f.size / (1024 * 1024)).toFixed(2)} MB)</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="p-1 rounded-md text-red-500 hover:bg-red-500/10"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Options: AI Auto Tagging & Custom Tags */}
      <div className="space-y-3 bg-muted-area/20 p-4 rounded-xl border border-border-theme">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
            <Sparkles size={16} className="text-sacred animate-pulse" /> Gemini AI Auto Alt-Text & Tagging Enable
          </label>
          <input
            type="checkbox"
            checked={autoAiMetadata}
            onChange={(e) => setAutoAiMetadata(e.target.checked)}
            className="w-4 h-4 accent-primary rounded cursor-pointer"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-text mb-1 flex items-center gap-1">
            <Tag size={12} /> थप कस्टम ट्यागहरू (अल्पविराम `,` ले छुट्याउनुहोस्):
          </label>
          <input
            type="text"
            placeholder="e.g. पशुपतिनाथ, मेला, 2026, काठमाडौँ"
            value={customTags}
            onChange={(e) => setCustomTags(e.target.value)}
            className="w-full bg-card border border-border-theme rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Uploading Status Progress */}
      {uploading && (
        <div className="space-y-2 bg-primary/5 p-4 rounded-xl border border-primary/20">
          <div className="flex items-center justify-between text-xs font-bold text-primary">
            <span className="flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin" /> {statusMessage}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-muted-area h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {uploadedAssets.length > 0 && !uploading && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <Check size={16} /> सफलतापूर्वक {uploadedAssets.length} मिडिया फाइल R2 Storage मा अपलोड भयो।
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-muted-text hover:bg-muted-area transition-colors"
          >
            रद्द गर्नुहोस्
          </button>
        )}
        <button
          onClick={startUpload}
          disabled={selectedFiles.length === 0 || uploading}
          className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 transition-all"
        >
          <Upload size={16} />
          {uploading ? "अपलोड हुँदैछ..." : `R2 Storage मा ${selectedFiles.length} फाइल अपलोड गर्नुहोस्`}
        </button>
      </div>
    </div>
  );
}
