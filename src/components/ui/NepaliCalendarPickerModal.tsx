import React, { useState } from "react";
import { Calendar as CalendarIcon, X, Check, ChevronLeft, ChevronRight, Clock, Sparkles } from "lucide-react";
import NepaliDate from "nepali-datetime";

interface NepaliCalendarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (formattedBsDate: string) => void;
  initialValue?: string;
}

const NEPALI_MONTHS = [
  { name: "वैशाख", value: 0 },
  { name: "जेठ", value: 1 },
  { name: "असार", value: 2 },
  { name: "साउन", value: 3 },
  { name: "भदौ", value: 4 },
  { name: "असोज", value: 5 },
  { name: "कात्तिक", value: 6 },
  { name: "मंसिर", value: 7 },
  { name: "पुस", value: 8 },
  { name: "माघ", value: 9 },
  { name: "फागुन", value: 10 },
  { name: "चैत", value: 11 },
];

const NEPALI_DAYS = ["आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];
const NEPALI_DAYS_SHORT = ["आइत", "सोम", "मङ्गल", "बुध", "बिही", "शुक्र", "शनि"];

const NEPALI_NUMBERS: Record<string, string> = {
  "0": "०", "1": "१", "2": "२", "3": "३", "4": "४", "5": "५", "6": "६", "7": "७", "8": "८", "9": "९"
};

export const toNepaliNum = (num: number | string): string => {
  return String(num).split("").map(c => NEPALI_NUMBERS[c] || c).join("");
};

export default function NepaliCalendarPickerModal({
  isOpen,
  onClose,
  onSelectDate,
  initialValue = ""
}: NepaliCalendarPickerModalProps) {
  const getTodayBs = () => {
    try {
      const nep = new NepaliDate();
      return {
        year: nep.getYear(),
        month: nep.getMonth(),
        day: nep.getDate(),
        dayOfWeek: nep.getDay()
      };
    } catch (e) {
      return { year: 2082, month: 10, day: 12, dayOfWeek: 2 };
    }
  };

  const today = getTodayBs();
  const [selectedYear, setSelectedYear] = useState<number>(today.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(today.month);
  const [selectedDay, setSelectedDay] = useState<number>(today.day);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(today.dayOfWeek);

  if (!isOpen) return null;

  // Generate days in month (approx 30-32 days per BS month)
  const getDaysInBsMonth = (year: number, month: number) => {
    // BS months usually have 30, 31, or 32 days
    const daysMap: Record<number, number[]> = {
      0: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2082 approx
      1: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
    };
    return daysMap[year % 2]?.[month] || 30;
  };

  const maxDays = getDaysInBsMonth(selectedYear, selectedMonth);

  const handleApply = () => {
    const formatted = `२०${toNepaliNum(selectedYear.toString().slice(-2))} ${NEPALI_MONTHS[selectedMonth].name} ${toNepaliNum(selectedDay)}, ${NEPALI_DAYS[selectedDayOfWeek]}`;
    onSelectDate(formatted);
    onClose();
  };

  const handleSelectToday = () => {
    const t = getTodayBs();
    setSelectedYear(t.year);
    setSelectedMonth(t.month);
    setSelectedDay(t.day);
    setSelectedDayOfWeek(t.dayOfWeek);

    const formatted = `२०${toNepaliNum(t.year.toString().slice(-2))} ${NEPALI_MONTHS[t.month].name} ${toNepaliNum(t.day)}, ${NEPALI_DAYS[t.dayOfWeek]}`;
    onSelectDate(formatted);
    onClose();
  };

  const formattedPreview = `२०${toNepaliNum(selectedYear.toString().slice(-2))} ${NEPALI_MONTHS[selectedMonth].name} ${toNepaliNum(selectedDay)}, ${NEPALI_DAYS[selectedDayOfWeek]}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border-theme rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-theme pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <CalendarIcon size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">नेपाली पात्रो क्यालेन्डर (BS Date Picker)</h3>
              <p className="text-xs text-muted-text">विक्रम सम्वत् मिति छनोट गर्नुहोस्</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted-area hover:bg-muted-area/80 text-muted-text hover:text-foreground flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Selected Date Preview Box */}
        <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-amber-500/10 border border-primary/20 rounded-2xl p-4 text-center space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-text flex items-center justify-center gap-1">
            <Sparkles size={12} className="text-amber-500" /> छनोट गरिएको पञ्चाङ्ग मिति (BS)
          </span>
          <div className="text-xl font-black text-primary font-serif">
            {formattedPreview}
          </div>
        </div>

        {/* Year and Month Selectors */}
        <div className="grid grid-cols-2 gap-3">
          {/* BS Year Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-muted-text uppercase">साल (BS Year)</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full bg-muted-area/60 border border-border-theme rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
            >
              {[2080, 2081, 2082, 2083, 2084, 2085, 2086, 2087, 2088, 2089, 2090].map((y) => (
                <option key={y} value={y}>२०{toNepaliNum(y.toString().slice(-2))} (BS {y})</option>
              ))}
            </select>
          </div>

          {/* BS Month Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-muted-text uppercase">महिना (BS Month)</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full bg-muted-area/60 border border-border-theme rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
            >
              {NEPALI_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.name} ({toNepaliNum(m.value + 1)} महिना)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Day of Week Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-black text-muted-text uppercase">बार (Day of Week)</label>
          <div className="grid grid-cols-7 gap-1">
            {NEPALI_DAYS_SHORT.map((d, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDayOfWeek(idx)}
                className={`py-1.5 text-center text-xs font-bold rounded-lg border transition-all ${
                  selectedDayOfWeek === idx
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-muted-area/40 border-border-theme text-muted-text hover:text-foreground"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Days Calendar Grid */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-black text-muted-text uppercase">
            <span>गते (Select Day)</span>
            <span>{NEPALI_MONTHS[selectedMonth].name} २०{toNepaliNum(selectedYear.toString().slice(-2))}</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 max-h-48 overflow-y-auto p-1 bg-muted-area/30 border border-border-theme rounded-2xl">
            {Array.from({ length: maxDays }, (_, i) => i + 1).map((dayNum) => {
              const isSelected = selectedDay === dayNum;
              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => setSelectedDay(dayNum)}
                  className={`h-9 text-xs font-black rounded-xl border flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105"
                      : "bg-card hover:bg-primary/10 border-border-theme text-foreground"
                  }`}
                >
                  {toNepaliNum(dayNum)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-border-theme flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSelectToday}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-black border border-amber-500/20 flex items-center gap-1.5 transition-all"
          >
            <Clock size={14} />
            <span>आजको मिति सेलेक्ट</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-muted-area text-muted-text hover:text-foreground text-xs font-bold border border-border-theme transition-all"
            >
              रद्द गर्नुहोस्
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all"
            >
              <Check size={14} />
              <span>पञ्चाङ्गमा राख्नुहोस्</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
