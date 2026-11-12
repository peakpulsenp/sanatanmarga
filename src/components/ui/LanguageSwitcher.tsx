import React from "react";
import { useLanguage } from "@/src/context/LanguageContext";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  variant?: 'pills' | 'dropdown' | 'minimal';
  className?: string;
}

export default function LanguageSwitcher({ variant = 'minimal', className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`flex items-center ${className}`}>
      {/* Desktop Version */}
      <div className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 border border-border-theme transition-all duration-300 shadow-sm">
        <Globe size={13} className="text-primary shrink-0 animate-spin-slow" />
        <div className="flex items-center text-xs font-black select-none tracking-tight">
          <button
            onClick={() => setLanguage('ne')}
            className={`transition-all duration-200 cursor-pointer ${
              language === 'ne'
                ? 'text-primary font-black scale-105'
                : 'text-muted-text/80 hover:text-foreground font-semibold'
            }`}
          >
            नेपाली
          </button>
          <span className="mx-1.5 text-muted-text/40 font-light">|</span>
          <button
            onClick={() => setLanguage('en')}
            className={`transition-all duration-200 cursor-pointer ${
              language === 'en'
                ? 'text-primary font-black scale-105'
                : 'text-muted-text/80 hover:text-foreground font-semibold'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Mobile Version - Compact Toggle */}
      <button
        onClick={() => setLanguage(language === 'ne' ? 'en' : 'ne')}
        className="inline-flex md:hidden items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 border border-border-theme transition-all duration-300 shadow-sm cursor-pointer select-none"
        title={language === 'ne' ? "Switch to English" : "नेपालीमा परिवर्तन गर्नुहोस्"}
      >
        <Globe size={12} className="text-primary shrink-0" />
        <span className="text-[10px] font-black tracking-tight text-foreground uppercase">
          {language === 'ne' ? 'ने' : 'EN'}
        </span>
      </button>
    </div>
  );
}
