import React, { useState } from "react";
import { Download, FileCode, FileText, FileArchive, Check, X, Copy } from "lucide-react";
import { toast } from "sonner";
import { SgisGrantha, SgisOSService } from "@/src/services/sgisOSService";

interface Props {
  grantha: SgisGrantha;
  onClose: () => void;
}

export default function SgisExportModal({ grantha, onClose }: Props) {
  const [selectedFormat, setSelectedFormat] = useState<string>("tei_xml");

  const exportData = SgisOSService.exportManuscript(grantha, selectedFormat);

  const handleDownload = () => {
    const blob = new Blob([exportData.content], { type: exportData.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportData.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`फाइल "${exportData.filename}" डाउनलोड गरियो!`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportData.content);
    toast.success("क्लिपबोर्डमा प्रतिलिपि गरियो!");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border-theme rounded-2xl p-6 shadow-2xl max-w-2xl w-full space-y-4 max-h-[90vh] flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-border-theme pb-3">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-primary" />
            <h3 className="text-sm font-black text-foreground">पाण्डुलिपि निर्यात (Export Manuscript)</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted-area text-muted-text cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Format Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: "tei_xml", label: "TEI-XML", icon: FileCode },
            { id: "json", label: "Full JSON", icon: FileCode },
            { id: "markdown", label: "Markdown", icon: FileText },
            { id: "zip_archive", label: "Zip Manifest", icon: FileArchive }
          ].map((f) => {
            const Icon = f.icon;
            const isSelected = selectedFormat === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFormat(f.id)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  isSelected
                    ? "bg-primary/10 border-primary text-primary font-black"
                    : "bg-muted-area/40 border-border-theme text-muted-text hover:text-foreground"
                }`}
              >
                <Icon size={16} />
                <span className="text-xs">{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* Preview Area */}
        <div className="space-y-1.5 flex-1 min-h-0">
          <div className="flex items-center justify-between text-[10px] font-black uppercase text-muted-text">
            <span>फाइल: {exportData.filename}</span>
            <button onClick={handleCopy} className="text-primary hover:underline flex items-center gap-1 cursor-pointer">
              <Copy size={11} /> Copy
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-background border border-border-theme font-mono text-[11px] leading-relaxed text-foreground max-h-64 overflow-auto">
            {exportData.content}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-theme">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border-theme bg-muted-area hover:bg-muted-area/80 text-xs font-bold text-foreground cursor-pointer"
          >
            बन्द गर्नुहोस्
          </button>
          <button
            onClick={handleDownload}
            className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
          >
            <Download size={14} /> डाउनलोड गर्नुहोस्
          </button>
        </div>
      </div>
    </div>
  );
}
