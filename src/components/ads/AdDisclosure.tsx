import React, { useState } from "react";
import { Sparkles, ShieldCheck, Info } from "lucide-react";
import type { Ad } from "@/src/types";
import AdInfoModal from "./AdInfoModal";

interface AdDisclosureProps {
  ad: Ad;
  category?: string;
  district?: string;
  className?: string;
}

export default function AdDisclosure({ ad, category, district, className = "" }: AdDisclosureProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const nepaliDisclosureText = ad.sponsorship?.disclosureText?.ne || "प्रायोजित सामग्री";
  const advertiserName = ad.advertiserName || "सनातनमार्ग साझेदार";

  return (
    <>
      <div className={`flex items-center justify-between gap-2 w-full ${className}`}>
        {/* Disclosure Tag */}
        <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
          {ad.isSponsored ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-black text-amber-300">[{nepaliDisclosureText}]</span>
              <span className="opacity-90">• {advertiserName}</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>विज्ञापन • {advertiserName}</span>
            </>
          )}
        </div>

        {/* Ad Transparency / Info Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsModalOpen(true);
          }}
          title="विज्ञापन बारेमा (Ad Info & Transparency)"
          className="bg-black/70 hover:bg-black/90 text-white/90 hover:text-amber-300 backdrop-blur-md text-xxs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer shadow-sm border border-white/10 shrink-0"
        >
          <Info className="w-3 h-3 text-amber-400" />
          <span>ⓘ विज्ञापन बारेमा</span>
        </button>
      </div>

      {isModalOpen && (
        <AdInfoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          ad={ad}
          category={category}
          district={district}
        />
      )}
    </>
  );
}
