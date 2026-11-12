import { useState, useEffect } from "react";
import { MapPin, Sliders, CheckCircle2, Globe, Bookmark, Sparkles } from "lucide-react";
import { useLanguage } from "@/src/context/LanguageContext";

export interface UserNepalPreferences {
  province: string;
  district: string;
  language: "ne" | "en";
  interests: string[];
}

export function useNepalPreferences() {
  const [preferences, setPreferences] = useState<UserNepalPreferences>(() => {
    try {
      const saved = localStorage.getItem("sanatan_nepal_preferences");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      province: "बागमती प्रदेश",
      district: "काठमाडौँ",
      language: "ne",
      interests: ["festivals", "notices", "market", "weather"]
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem("sanatan_nepal_preferences", JSON.stringify(preferences));
    } catch (e) {}
  }, [preferences]);

  return { preferences, setPreferences };
}

export default function PersonalizedNepalHubBanner({ preferences, setPreferences }: { preferences: UserNepalPreferences; setPreferences: (p: UserNepalPreferences) => void }) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const provincesNe = [
    "कोशी प्रदेश",
    "मधेश प्रदेश",
    "बागमती प्रदेश",
    "गण्डकी प्रदेश",
    "लुम्बिनी प्रदेश",
    "कर्णाली प्रदेश",
    "सुदूरपश्चिम प्रदेश"
  ];

  const provincesEn: Record<string, string> = {
    "कोशी प्रदेश": "Koshi Province",
    "मधेश प्रदेश": "Madhesh Province",
    "बागमती प्रदेश": "Bagmati Province",
    "गण्डकी प्रदेश": "Gandaki Province",
    "लुम्बिनी प्रदेश": "Lumbini Province",
    "कर्णाली प्रदेश": "Karnali Province",
    "सुदूरपश्चिम प्रदेश": "Sudurpashchim Province"
  };

  const districtsByProvince: Record<string, string[]> = {
    "कोशी प्रदेश": ["विराटनगर", "इलाम", "झापा", "सुनसरी"],
    "मधेश प्रदेश": ["जनकपुरधाम", "वीरगन्ज", "राजविराज", "सर्लाही"],
    "बागमती प्रदेश": ["काठमाडौँ", "ललितपुर", "भक्तपुर", "चितवन", "धादिङ"],
    "गण्डकी प्रदेश": ["पोखरा", "बागलुङ", "गोरखा", "तनहुँ"],
    "लुम्बिनी प्रदेश": ["बुटवल", "भैरहवा", "नेपालगन्ज", "दाङ"],
    "कर्णाली प्रदेश": ["सुर्खेत", "जुम्ला", "कालिकोट"],
    "सुदूरपश्चिम प्रदेश": ["धनगढी", "महेन्द्रनगर", "डडेलधुरा"]
  };

  const districtNamesEn: Record<string, string> = {
    "विराटनगर": "Biratnagar",
    "इलाम": "Ilam",
    "झापा": "Jhapa",
    "सुनसरी": "Sunsari",
    "जनकपुरधाम": "Janakpurdham",
    "वीरगन्ज": "Birgunj",
    "राजविराज": "Rajbiraj",
    "सर्लाही": "Sarlahi",
    "काठमाडौँ": "Kathmandu",
    "ललितपुर": "Lalitpur",
    "भक्तपुर": "Bhaktapur",
    "चितवन": "Chitwan",
    "धादिङ": "Dhading",
    "पोखरा": "Pokhara",
    "बागलुङ": "Baglung",
    "गोरखा": "Gorkha",
    "तनहुँ": "Tanahun",
    "बुटवल": "Butwal",
    "भैरहवा": "Bhairahawa",
    "नेपालगन्ज": "Nepalgunj",
    "दाङ": "Dang",
    "सुर्खेत": "Surkhet",
    "जुम्ला": "Jumla",
    "कालिकोट": "Kalikot",
    "धनगढी": "Dhangadhi",
    "महेन्द्रनगर": "Mahendranagar",
    "डडेलधुरा": "Dadeldhura"
  };

  const handleSave = (newProv: string, newDist: string) => {
    setPreferences({
      ...preferences,
      province: newProv,
      district: newDist
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsOpen(false);
    }, 1200);

    // Scroll to content section smoothly when any unit is clicked
    const target = document.getElementById("district-intelligence-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const popularUnits = [
    { province: "बागमती प्रदेश", district: "काठमाडौँ", labelNe: "काठमाडौँ (बागमती)", labelEn: "Kathmandu (Bagmati)" },
    { province: "गण्डकी प्रदेश", district: "पोखरा", labelNe: "पोखरा (गण्डकी)", labelEn: "Pokhara (Gandaki)" },
    { province: "मधेश प्रदेश", district: "जनकपुरधाम", labelNe: "जनकपुरधाम (मधेश)", labelEn: "Janakpurdham (Madhesh)" },
    { province: "लुम्बिनी प्रदेश", district: "बुटवल", labelNe: "बुटवल (लुम्बिनी)", labelEn: "Butwal (Lumbini)" }
  ];

  return (
    <div className="bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/5 border border-primary/20 rounded-3xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary text-white shadow-md">
            <MapPin size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                PERSONALIZED INTELLIGENCE OS
              </span>
              {savedSuccess && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> {language === 'en' ? "Saved!" : "सुरक्षित गरियो!"}
                </span>
              )}
            </div>
            <h3 className="text-base font-black text-card-foreground mt-0.5">
              {language === 'en' ? "Your Region: " : "तपाईंको क्षेत्र: "}
              <span className="text-primary underline">
                {language === 'en' ? (districtNamesEn[preferences.district] || preferences.district) : preferences.district}, {language === 'en' ? (provincesEn[preferences.province] || preferences.province) : preferences.province}
              </span>
            </h3>
            <p className="text-xs text-muted-text">
              {language === 'en'
                ? "Local weather, municipality notices, and regional festivals tailored to your selection."
                : "तपाईंको छनोट अनुसार स्थानीय मौसम, पालिका सूचना तथा पर्वहरू स्वचालित रूपमा देखाइएको छ।"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="button-fancy !py-2.5 !px-5 text-xs flex items-center gap-1.5 shrink-0"
        >
          <Sliders size={14} /> {language === 'en' ? "Change Region" : "क्षेत्र परिवर्तन गर्नुहोस्"}
        </button>
      </div>

      {/* QUICK SELECT IDENTIFIED UNITS (पहिचान गरिएका एकाइहरू) */}
      <div className="mt-3 pt-3 border-t border-primary/10 flex flex-wrap items-center gap-2">
        <span 
          className="text-[11px] font-bold text-muted-text cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
          onClick={() => {
            const target = document.getElementById("district-intelligence-section") || document.getElementById("connected-events-section");
            if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          {language === 'en' ? "Quick Select Region ↓:" : "पहिचान गरिएका एकाइहरू ↓:"}
        </span>
        {popularUnits.map((u) => {
          const isSelected = preferences.district === u.district;
          return (
            <button
              key={u.district}
              onClick={() => handleSave(u.province, u.district)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                isSelected
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-card border border-border-theme text-card-foreground hover:border-primary/50"
              }`}
            >
              <MapPin size={12} className={isSelected ? "text-white" : "text-primary"} />
              <span>{language === 'en' ? u.labelEn : u.labelNe}</span>
            </button>
          );
        })}
      </div>

      {/* EXPANDABLE MODAL / DRAWER */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-border-theme/60 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
          <div>
            <label className="text-xs font-bold text-card-foreground block mb-1">
              {language === 'en' ? "Select Province:" : "प्रदेश छान्नुहोस् (Province):"}
            </label>
            <select
              value={preferences.province}
              onChange={e => {
                const prov = e.target.value;
                const firstDist = districtsByProvince[prov]?.[0] || "काठमाडौँ";
                handleSave(prov, firstDist);
              }}
              className="w-full p-2.5 rounded-xl bg-card border border-border-theme text-card-foreground font-bold text-xs outline-none"
            >
              {provincesNe.map(p => (
                <option key={p} value={p}>
                  {language === 'en' ? (provincesEn[p] || p) : p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-card-foreground block mb-1">
              {language === 'en' ? "Select District:" : "जिल्ला/नगर छान्नुहोस् (District):"}
            </label>
            <select
              value={preferences.district}
              onChange={e => handleSave(preferences.province, e.target.value)}
              className="w-full p-2.5 rounded-xl bg-card border border-border-theme text-card-foreground font-bold text-xs outline-none"
            >
              {(districtsByProvince[preferences.province] || ["काठमाडौँ"]).map(d => (
                <option key={d} value={d}>
                  {language === 'en' ? (districtNamesEn[d] || d) : d}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
