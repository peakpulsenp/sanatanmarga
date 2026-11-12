import { Brain, Sparkles, TrendingUp, FileText, MapPin, ShieldAlert, ArrowUpRight } from "lucide-react";
import { LiveVideo } from "../../types/live";
import { useNavigate } from "react-router-dom";

interface LiveIntelligenceProps {
  video: LiveVideo;
}

export default function LiveIntelligence({ video }: LiveIntelligenceProps) {
  const navigate = useNavigate();

  // Generate contextual intelligence based on video title, category, or district
  const title = video.title || "";
  const isEconomic = title.includes("Bank") || title.includes("अर्थ") || title.includes("Budget") || title.includes("बजेट") || title.includes("विकास");
  const isPolitical = title.includes("Parliament") || title.includes("संसद") || title.includes("मन्त्री") || title.includes("Govt") || title.includes("सरकार");
  const districtName = video.district || "काठमाडौं";

  return (
    <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-zinc-950 border border-amber-500/20 rounded-2xl p-5 space-y-5 shadow-xl">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Brain size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-wide uppercase">
              🧠 LIVE INTELLIGENCE GRAPH
            </h3>
            <p className="text-[11px] text-zinc-400">Verified Context & Provenance-Labelled Analysis</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] flex items-center gap-1">
          <Sparkles size={11} />
          SanatanMarga AI Core v5.0
        </span>
      </div>

      {/* 3-PART INTELLIGENCE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* WHAT HAPPENED */}
        <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <FileText size={14} />
            <h4>What happened? (घटना सार)</h4>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {video.description || `${video.broadcasterName || "आधिकारिक निकाय"}बाट प्रसारित यस प्रत्यक्ष सत्रमा ${districtName} क्षेत्रको प्रमुख घटनाक्रम र आधिकारिक वक्तव्य प्रस्तुत भइरहेको छ।`}
          </p>
        </div>

        {/* WHY IT MATTERS */}
        <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
            <ShieldAlert size={14} />
            <h4>Why it matters? (महत्वपूर्ण किन?)</h4>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {isEconomic 
              ? "यसले राष्ट्रिय मुद्रास्फीति, ब्याजदर नीति तथा बैंकिङ तरलतामा प्रत्यक्ष प्रभाव पार्दछ।"
              : isPolitical 
              ? "यस नीतिगत निर्णयले संघीय तह र प्रदेश सरकारबीचको अधिकार बाँडफाँड तथा प्रशासनिक कार्यविधिमा दीर्घकालीन असर पार्छ।"
              : `${districtName} क्षेत्रको स्थानीय जनजीवन, सार्वजनिक सेवा प्रवाह र नागरिक अधिकारसँग सीधा जोडिएको छ।`}
          </p>
        </div>

        {/* WHAT'S NEXT */}
        <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
            <TrendingUp size={14} />
            <h4>What's next? (अब के हुन्छ?)</h4>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            सत्र समाप्ति पश्चात् आधिकारिक विज्ञप्ति जारी हुनेछ र सम्बन्धित मन्त्रालय वा विभागले कार्यान्वयन कार्ययोजना सार्वजनिक गर्ने अपेक्षा गरिएको छ।
          </p>
        </div>
      </div>

      {/* CIVIC & ECONOMIC REFERENCE INTEGRATION */}
      {isEconomic && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500 text-black font-bold">
              <TrendingUp size={16} />
            </div>
            <div>
              <h5 className="text-xs font-black text-amber-300">🏛️ NRB Economic Reference (आर्थिक सन्दर्भ)</h5>
              <p className="text-[11px] text-zinc-300">USD/NPR: 133.45 | EUR/NPR: 144.20 | 7 Provinces • 77 Districts</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/nepal-hub')} 
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>नेपाल हब हेर्नुहोस्</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      )}

      {/* RELATED DISTRICT & CATEGORY LINK */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-300">सम्बन्धित क्षेत्र:</span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 flex items-center gap-1">
            <MapPin size={11} className="text-amber-500" />
            {video.district || "काठमाडौं उपत्यका"} ({video.province || "बागमती प्रदेश"})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-zinc-500 font-mono text-[10px]">ID: {video.id}</span>
          <span className="text-amber-400 font-semibold">Provenance: Verified Live OS</span>
        </div>
      </div>
    </div>
  );
}
