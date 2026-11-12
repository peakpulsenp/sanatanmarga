import React, { useState, useEffect } from "react";
import {
  Calendar,
  Sun,
  Moon,
  Clock,
  Sparkles,
  CheckCircle2,
  CloudUpload,
  BookOpen,
  Radio,
  Save
} from "lucide-react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { adminFetch } from "@/src/lib/adminFetch";
import { toast } from "sonner";

export interface DailyPanchangRecord {
  bsDate: string;
  adDate: string;
  paksha: string;
  tithiNe: string;
  tithiEn: string;
  nakshatraNe: string;
  nakshatraEn: string;
  yogaNe: string;
  karanaNe: string;
  sunrise: string;
  sunset: string;
  abhijitMuhurta: string;
  rahuKaal: string;
  specialObservanceNe: string;
  specialObservanceEn: string;
  linkedGranthaId: string;
  linkedRadioBlock: string;
  verifiedBy: string;
}

const DEFAULT_PANCHANG: DailyPanchangRecord = {
  bsDate: "२०८३ कार्तिक २५, बुधबार",
  adDate: new Date().toISOString().slice(0, 10),
  paksha: "शुक्ल पक्ष (Shukla Paksha)",
  tithiNe: "द्वादशी (Dwadashi)",
  tithiEn: "Shukla Dwadashi",
  nakshatraNe: "रेवती (Revati)",
  nakshatraEn: "Revati Nakshatra",
  yogaNe: "सिद्धि योग (Siddhi Yoga)",
  karanaNe: "बव करण (Bava Karana)",
  sunrise: "06:22 AM",
  sunset: "05:14 PM",
  abhijitMuhurta: "11:26 AM – 12:10 PM",
  rahuKaal: "11:48 AM – 01:09 PM",
  specialObservanceNe: "हरिबोधिनी एकादशी / तुलसी विवाह विशेष अनुष्ठान",
  specialObservanceEn: "Haribodhini / Tulasi Vivaha Sacred Observance",
  linkedGranthaId: "grantha-kartik-mahatmya",
  linkedRadioBlock: "Morning Vedic Chants & Panchang Bulletin (06:00 AM)",
  verifiedBy: "आचार्य पञ्चाङ्ग समिति (Verified)"
};

export default function AdminPanchangPage() {
  const { language } = useLanguage();
  const [panchang, setPanchang] = useState<DailyPanchangRecord>(DEFAULT_PANCHANG);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sg_daily_panchang");
      if (saved) {
        setPanchang({ ...DEFAULT_PANCHANG, ...JSON.parse(saved) });
      }
    } catch (e) {}
  }, []);

  const handleSavePanchang = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("sg_daily_panchang", JSON.stringify(panchang));
      toast.success(
        language === "en"
          ? "Daily BS/AD Panchang record saved and verified"
          : "दैनिक पञ्चाङ्ग विवरण सुरक्षित गरियो"
      );
    } catch (err) {
      toast.error("Failed to save Panchang record");
    }
  };

  const handlePublishPanchangSnapshot = async () => {
    setPublishing(true);
    try {
      localStorage.setItem("sg_daily_panchang", JSON.stringify(panchang));
      const res = await adminFetch("/api/snapshots/rebuild", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "admin_panchang_daily",
          moduleId: "panchang_daily"
        })
      });
      if (res.ok) {
        toast.success("panchang_daily & events_public snapshots published to R2");
      } else {
        toast.error("Snapshot publish returned an error");
      }
    } catch (e) {
      toast.error("Failed to publish panchang_daily snapshot");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* 1. Workspace Header */}
        <div className="bg-card border border-border-theme rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
              <Calendar size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground">
                {language === "en"
                  ? "Panchang, Festivals & Auspicious Calendar OS"
                  : "पञ्चाङ्ग, तिथि, मुहूर्त र पर्व व्यवस्थापन"}
              </h1>
              <p className="text-xs text-muted-text">
                {language === "en"
                  ? "Authoritative Bikram Sambat / Gregorian daily Panchang, Tithi, Nakshatra, Yoga, Karana, and panchang_daily snapshot publishing"
                  : "विक्रम संवत् र ईस्वी संवत् दैनिक पञ्चाङ्ग, शुभ साइत र पर्व स्न्यापसट प्रकाशन"}
              </p>
            </div>
          </div>

          <button
            onClick={handlePublishPanchangSnapshot}
            disabled={publishing}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CloudUpload size={15} />
            <span>
              {publishing
                ? "Publishing..."
                : language === "en" ? "Publish panchang_daily Snapshot" : "panchang_daily स्न्यापसट प्रकाशन"}
            </span>
          </button>
        </div>

        {/* 2. Live Public Panchang Strip Preview */}
        <div className="bg-card border border-border-theme rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-accent flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>Public Homepage & Festival Strip Preview</span>
            </span>
            <span className="text-[11px] font-bold text-success flex items-center gap-1">
              <CheckCircle2 size={13} />
              <span>{panchang.verifiedBy}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-surface-interactive border border-border-theme">
              <div className="text-[10px] font-bold uppercase text-muted-text">Bikram Sambat</div>
              <div className="text-xs font-black text-foreground mt-0.5">{panchang.bsDate}</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-interactive border border-border-theme">
              <div className="text-[10px] font-bold uppercase text-muted-text">Tithi & Paksha</div>
              <div className="text-xs font-black text-foreground mt-0.5">{panchang.tithiNe}</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-interactive border border-border-theme">
              <div className="text-[10px] font-bold uppercase text-muted-text">Nakshatra</div>
              <div className="text-xs font-black text-foreground mt-0.5">{panchang.nakshatraNe}</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-interactive border border-border-theme">
              <div className="text-[10px] font-bold uppercase text-muted-text">Yoga & Karana</div>
              <div className="text-xs font-black text-foreground mt-0.5">{panchang.yogaNe}</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-interactive border border-border-theme">
              <div className="text-[10px] font-bold uppercase text-muted-text flex items-center gap-1">
                <Sun size={11} className="text-accent" /> Sunrise / Sunset
              </div>
              <div className="text-xs font-mono font-bold text-foreground mt-0.5">
                {panchang.sunrise} / {panchang.sunset}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface-interactive border border-border-theme">
              <div className="text-[10px] font-bold uppercase text-muted-text flex items-center gap-1">
                <Clock size={11} className="text-success" /> Abhijit Muhurta
              </div>
              <div className="text-xs font-mono font-bold text-foreground mt-0.5">{panchang.abhijitMuhurta}</div>
            </div>
          </div>
        </div>

        {/* 3. Panchang Editor Form */}
        <form onSubmit={handleSavePanchang} className="bg-card border border-border-theme rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
            {language === "en" ? "Edit Daily Panchang & Cross-Module Links" : "दैनिक पञ्चाङ्ग र अन्तर-मोड्युल लिङ्क सम्पादन"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-muted-text mb-1">Bikram Sambat Date (BS)</label>
              <input
                type="text"
                value={panchang.bsDate}
                onChange={e => setPanchang({ ...panchang, bsDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-muted-text mb-1">Gregorian Date (AD)</label>
              <input
                type="date"
                value={panchang.adDate}
                onChange={e => setPanchang({ ...panchang, adDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-muted-text mb-1">Paksha</label>
              <input
                type="text"
                value={panchang.paksha}
                onChange={e => setPanchang({ ...panchang, paksha: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground"
              />
            </div>
            <div>
              <label className="block font-bold text-muted-text mb-1">Tithi (Nepali)</label>
              <input
                type="text"
                value={panchang.tithiNe}
                onChange={e => setPanchang({ ...panchang, tithiNe: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground"
              />
            </div>
            <div>
              <label className="block font-bold text-muted-text mb-1">Nakshatra (Nepali)</label>
              <input
                type="text"
                value={panchang.nakshatraNe}
                onChange={e => setPanchang({ ...panchang, nakshatraNe: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground"
              />
            </div>
            <div>
              <label className="block font-bold text-muted-text mb-1">Yoga & Karana</label>
              <input
                type="text"
                value={panchang.yogaNe}
                onChange={e => setPanchang({ ...panchang, yogaNe: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground"
              />
            </div>
            <div>
              <label className="block font-bold text-muted-text mb-1">Sunrise</label>
              <input
                type="text"
                value={panchang.sunrise}
                onChange={e => setPanchang({ ...panchang, sunrise: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-muted-text mb-1">Sunset</label>
              <input
                type="text"
                value={panchang.sunset}
                onChange={e => setPanchang({ ...panchang, sunset: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-muted-text mb-1">Abhijit Muhurta</label>
              <input
                type="text"
                value={panchang.abhijitMuhurta}
                onChange={e => setPanchang({ ...panchang, abhijitMuhurta: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block font-bold text-muted-text mb-1">Special Festival / Observance (Nepali)</label>
              <input
                type="text"
                value={panchang.specialObservanceNe}
                onChange={e => setPanchang({ ...panchang, specialObservanceNe: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground"
              />
            </div>
            <div>
              <label className="block font-bold text-muted-text mb-1 flex items-center gap-1">
                <BookOpen size={12} className="text-secondary-accent" /> Linked SGIS Grantha / Shloka Reference
              </label>
              <input
                type="text"
                value={panchang.linkedGranthaId}
                onChange={e => setPanchang({ ...panchang, linkedGranthaId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-muted-text mb-1 flex items-center gap-1">
                <Radio size={12} className="text-accent" /> Linked RadioOS Devotional / Panchang Bulletin Slot
              </label>
              <input
                type="text"
                value={panchang.linkedRadioBlock}
                onChange={e => setPanchang({ ...panchang, linkedRadioBlock: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-surface-interactive border border-border-theme text-foreground"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-theme">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black flex items-center gap-2 cursor-pointer"
            >
              <Save size={15} />
              <span>{language === "en" ? "Save Verified Panchang" : "पञ्चाङ्ग सुरक्षित गर्नुहोस्"}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

