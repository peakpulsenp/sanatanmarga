import React, { useState } from "react";
import { Info, ShieldCheck, MapPin, Smartphone, Sparkles, AlertTriangle, Check, X, Building2, Tag } from "lucide-react";
import type { Ad } from "@/src/types";
import { AD_PLACEMENT_REGISTRY } from "@/src/constants/adPlacementRegistry";

interface AdInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: Ad | null;
  category?: string;
  district?: string;
}

export default function AdInfoModal({ isOpen, onClose, ad, category, district }: AdInfoModalProps) {
  const [reported, setReported] = useState(false);
  const [reportReason, setReportReason] = useState("");

  if (!isOpen || !ad) return null;

  const placementConfig = ad.position ? AD_PLACEMENT_REGISTRY[ad.position] : null;

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReported(true);
    setTimeout(() => {
      setReported(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border-theme rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 text-card-foreground relative overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border-theme pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    AD TRANSPARENCY & TRUTH OS
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> प्रमाणित
                  </span>
                </div>
                <h3 className="text-lg font-black text-card-foreground mt-0.5">
                  विज्ञापन पारदर्शिता र विवरण
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-muted-area hover:bg-muted-area/80 text-muted-text hover:text-card-foreground transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Ad Metadata */}
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-muted-area/50 border border-border-theme space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-text font-semibold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" /> विज्ञापनदाता (Advertiser):
                </span>
                <span className="font-black text-card-foreground">{ad.advertiserName || "सनातनमार्ग साझेदार"}</span>
              </div>
              {ad.isSponsored && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-text font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> स्थिति (Status):
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                    प्रायोजित सामग्री (Sponsored Content)
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-text font-semibold flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-500" /> विज्ञापन स्थान (Placement):
                </span>
                <span className="font-bold text-card-foreground">{placementConfig?.label || ad.position}</span>
              </div>
            </div>

            {/* Why You Received This Ad */}
            <div className="space-y-2">
              <h4 className="font-black text-card-foreground flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600" /> किन यो विज्ञापन देखाइएको छ? (Why am I seeing this?)
              </h4>
              <p className="text-muted-text leading-relaxed bg-muted-area/30 p-3 rounded-xl border border-border-theme">
                यो विज्ञापन तपाईंले हेर्दै गर्नुभएको विधा <strong>({category || "सामान्य"})</strong>, स्थान <strong>({district || "नेपाल"})</strong> र प्रयोग गरिएको उपकरणका आधारमा पारदर्शी targeting नियमहरूसँग मेल खाएकोले देखाइएको हो।
              </p>
            </div>

            {/* Privacy & Governance Policy */}
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 space-y-1">
              <div className="flex items-center gap-1.5 font-black text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" /> सनातनमार्ग विज्ञापन सुरक्षा र गोपनीयता ग्यारेन्टी
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                सनातनमार्गले कुनै पनि प्रयोगकर्ताको व्यक्तिगत डाटा बिक्री गर्दैन। प्रिमियम (संरक्षक, साधक, कर्पोरेट) सदस्यहरूलाई पूर्ण रूपमा शून्य विज्ञापन अनुभव प्रदान गरिन्छ।
              </p>
            </div>

            {/* Report Form */}
            {reported ? (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-center flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> विज्ञापन प्रतिवेदन दर्ता भयो। धन्यवाद!
              </div>
            ) : (
              <form onSubmit={handleReport} className="pt-2 border-t border-border-theme space-y-2">
                <label className="font-bold text-card-foreground flex items-center gap-1.5 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> यो विज्ञापन सम्बन्धी गुनासो छ? (Report Ad)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="गुनासो वा कारण लेख्नुहोस्..."
                    className="flex-1 bg-muted-area border border-border-theme rounded-xl px-3 py-1.5 text-xs text-card-foreground focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 cursor-pointer transition-all"
                  >
                    रिपोर्ट
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
  );
}
