import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "../components/StyleProvider";

export type ReadingTheme = "clean" | "parchment" | "night";
export type ReadingFontSize = "small" | "medium" | "large" | "xlarge";

export interface ReadingPreferences {
  theme: ReadingTheme;
  fontSize: ReadingFontSize;
}

export interface ReadingThemeTokens {
  name: string;
  nameNe: string;
  canvasClass: string;
  textClass: string;
  cardClass: string;
  mutedClass: string;
  mutedTextClass: string;
  borderClass: string;
  quoteBgClass: string;
  leadBgClass: string;
  accentClass: string;
  toolbarBgClass: string;
  cssVars: Record<string, string>;
}

export interface ReadingFontTokens {
  label: string;
  percentage: string;
  step: number;
  bodyClass: string;
  h1Class: string;
  h2Class: string;
  h3Class: string;
  leadClass: string;
  quoteClass: string;
  tableClass: string;
  provenanceClass: string;
  metaClass: string;
}

export const READING_THEME_TOKENS: Record<ReadingTheme, ReadingThemeTokens> = {
  clean: {
    name: "Clean Light",
    nameNe: "सफा उज्यालो",
    canvasClass: "bg-[#FAF8F5] text-[#121110]",
    textClass: "text-[#121110]",
    cardClass: "bg-white text-[#121110]",
    mutedClass: "bg-[#F3ECE6]",
    mutedTextClass: "text-[#685F58]",
    borderClass: "border-[#E8E2D8]",
    quoteBgClass: "bg-[#F3ECE6]/70",
    leadBgClass: "bg-amber-500/10 text-[#121110]",
    accentClass: "text-[#D9381E]",
    toolbarBgClass: "bg-white/95 text-[#121110]",
    cssVars: {
      "--reading-bg": "#FAF8F5",
      "--reading-fg": "#121110",
      "--reading-card": "#ffffff",
      "--reading-muted": "#F3ECE6",
      "--reading-muted-fg": "#685F58",
      "--reading-border": "#E8E2D8",
      "--reading-accent": "#D9381E",
    }
  },
  parchment: {
    name: "Parchment",
    nameNe: "प्राचीन पाण्डुलिपि",
    canvasClass: "bg-[#FBF7EE] dark:bg-[#1E1914] text-[#2C2416] dark:text-[#EDE4D3]",
    textClass: "text-[#2C2416] dark:text-[#EDE4D3]",
    cardClass: "bg-[#F4EEDF] dark:bg-[#27211B]",
    mutedClass: "bg-[#EFE8D6] dark:bg-[#312B23]",
    mutedTextClass: "text-[#706453] dark:text-[#B8AE9E]",
    borderClass: "border-[#DFD5C0] dark:border-[#453D32]",
    quoteBgClass: "bg-[#EFE8D6]/80 dark:bg-[#312B23]/80",
    leadBgClass: "bg-[#EFE8D6] text-[#2C2416] dark:bg-[#312B23] dark:text-[#EDE4D3]",
    accentClass: "text-[#C2410C]",
    toolbarBgClass: "bg-[#F4EEDF]/95 dark:bg-[#27211B]/95",
    cssVars: {
      "--reading-bg": "#FBF7EE",
      "--reading-fg": "#2C2416",
      "--reading-card": "#F4EEDF",
      "--reading-muted": "#EFE8D6",
      "--reading-muted-fg": "#706453",
      "--reading-border": "#DFD5C0",
    }
  },
  night: {
    name: "Night Mode",
    nameNe: "रात्रि दृश्य",
    canvasClass: "bg-[#0F0F11] text-[#E4E4E7]",
    textClass: "text-[#E4E4E7]",
    cardClass: "bg-[#18181B]",
    mutedClass: "bg-[#27272A]",
    mutedTextClass: "text-[#A1A1AA]",
    borderClass: "border-[#27272A]",
    quoteBgClass: "bg-[#27272A]/70",
    leadBgClass: "bg-[#27272A] text-[#E4E4E7]",
    accentClass: "text-[#F5A623]",
    toolbarBgClass: "bg-[#18181B]/95",
    cssVars: {
      "--reading-bg": "#0F0F11",
      "--reading-fg": "#E4E4E7",
      "--reading-card": "#18181B",
      "--reading-muted": "#27272A",
      "--reading-muted-fg": "#A1A1AA",
      "--reading-border": "#27272A",
    }
  }
};

export const READING_FONT_TOKENS: Record<ReadingFontSize, ReadingFontTokens> = {
  small: {
    label: "Small",
    percentage: "90%",
    step: -1,
    bodyClass: "text-[15px] sm:text-base leading-[1.8]",
    h1Class: "text-2xl sm:text-3xl md:text-4xl",
    h2Class: "text-xl sm:text-2xl",
    h3Class: "text-lg sm:text-xl",
    leadClass: "text-sm sm:text-base",
    quoteClass: "text-base sm:text-lg",
    tableClass: "text-xs sm:text-sm",
    provenanceClass: "text-xs",
    metaClass: "text-[11px]",
  },
  medium: {
    label: "Medium",
    percentage: "100%",
    step: 0,
    bodyClass: "text-base sm:text-lg leading-[1.9]",
    h1Class: "text-2xl sm:text-3xl md:text-5xl",
    h2Class: "text-2xl sm:text-3xl",
    h3Class: "text-xl sm:text-2xl",
    leadClass: "text-base sm:text-lg",
    quoteClass: "text-lg sm:text-xl",
    tableClass: "text-xs sm:text-sm",
    provenanceClass: "text-xs sm:text-sm",
    metaClass: "text-xs",
  },
  large: {
    label: "Large",
    percentage: "120%",
    step: 1,
    bodyClass: "text-lg sm:text-xl leading-[2.0]",
    h1Class: "text-3xl sm:text-4xl md:text-6xl",
    h2Class: "text-2xl sm:text-3xl md:text-4xl",
    h3Class: "text-xl sm:text-2xl md:text-3xl",
    leadClass: "text-lg sm:text-xl",
    quoteClass: "text-xl sm:text-2xl",
    tableClass: "text-sm sm:text-base",
    provenanceClass: "text-sm sm:text-base",
    metaClass: "text-xs sm:text-sm",
  },
  xlarge: {
    label: "Extra Large",
    percentage: "140%",
    step: 2,
    bodyClass: "text-xl sm:text-2xl leading-[2.1]",
    h1Class: "text-4xl sm:text-5xl md:text-7xl",
    h2Class: "text-3xl sm:text-4xl md:text-5xl",
    h3Class: "text-2xl sm:text-3xl md:text-4xl",
    leadClass: "text-xl sm:text-2xl",
    quoteClass: "text-2xl sm:text-3xl",
    tableClass: "text-base sm:text-lg",
    provenanceClass: "text-base sm:text-lg",
    metaClass: "text-sm sm:text-base",
  },
};

const FONT_SIZE_STEPS: ReadingFontSize[] = ["small", "medium", "large", "xlarge"];
export const STORAGE_KEY = "sanatan_reading_preferences_v1";

interface ReadingPreferencesContextType {
  theme: ReadingTheme;
  fontSize: ReadingFontSize;
  setTheme: (theme: ReadingTheme) => void;
  setFontSize: (fontSize: ReadingFontSize) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  isFocusMode: boolean;
  setIsFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
  toggleFocusMode: () => void;
  fontScalePercentage: string;
  fontScaleStep: number;
  themeTokens: ReadingThemeTokens;
  fontTokens: ReadingFontTokens;
}

const defaultPreferences: ReadingPreferences = {
  theme: "clean",
  fontSize: "medium",
};

const ReadingPreferencesContext = createContext<ReadingPreferencesContextType>({
  theme: "clean",
  fontSize: "medium",
  setTheme: () => {},
  setFontSize: () => {},
  increaseFontSize: () => {},
  decreaseFontSize: () => {},
  isFocusMode: false,
  setIsFocusMode: () => {},
  toggleFocusMode: () => {},
  fontScalePercentage: "100%",
  fontScaleStep: 0,
  themeTokens: READING_THEME_TOKENS.clean,
  fontTokens: READING_FONT_TOKENS.medium,
});

function sanitizeTheme(val: any): ReadingTheme {
  if (val === "parchment" || val === "night" || val === "clean") {
    return val;
  }
  // Backwards compatibility for 'default' -> 'clean'
  if (val === "default") return "clean";
  return "clean";
}

function sanitizeFontSize(val: any): ReadingFontSize {
  if (val === "small" || val === "medium" || val === "large" || val === "xlarge") {
    return val;
  }
  // Number to step mapping if stored as step number
  if (val === -1) return "small";
  if (val === 0) return "medium";
  if (val === 1) return "large";
  if (val === 2) return "xlarge";
  return "medium";
}

export function ReadingPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<ReadingPreferences>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            theme: sanitizeTheme(parsed.theme),
            fontSize: sanitizeFontSize(parsed.fontSize),
          };
        }
      } catch (e) {
        console.warn("Failed to load reading preferences from storage:", e);
      }
    }
    return defaultPreferences;
  });

  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const { isDarkMode, setDarkMode } = useTheme();

  const savePreferences = useCallback((newPrefs: ReadingPreferences) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
        window.dispatchEvent(new CustomEvent("reading-preferences-updated", { detail: newPrefs }));
      } catch (e) {
        console.warn("Failed to save reading preferences to storage:", e);
      }
    }
  }, []);

  const setTheme = useCallback((theme: ReadingTheme) => {
    const validTheme = sanitizeTheme(theme);
    setPreferences(prev => {
      const next = { ...prev, theme: validTheme };
      savePreferences(next);
      return next;
    });
    if (validTheme === "clean" || validTheme === "parchment") {
      setDarkMode(false);
    } else if (validTheme === "night") {
      setDarkMode(true);
    }
  }, [savePreferences, setDarkMode]);

  // Sync global isDarkMode toggles (e.g. from header) to reading theme without feedback loops
  useEffect(() => {
    setPreferences(prev => {
      if (isDarkMode && prev.theme !== "night") {
        const next = { ...prev, theme: "night" as ReadingTheme };
        savePreferences(next);
        return next;
      }
      if (!isDarkMode && prev.theme === "night") {
        const next = { ...prev, theme: "clean" as ReadingTheme };
        savePreferences(next);
        return next;
      }
      return prev;
    });
  }, [isDarkMode, savePreferences]);

  const setFontSize = useCallback((fontSize: ReadingFontSize) => {
    const validFontSize = sanitizeFontSize(fontSize);
    setPreferences(prev => {
      const next = { ...prev, fontSize: validFontSize };
      savePreferences(next);
      return next;
    });
  }, [savePreferences]);

  const increaseFontSize = useCallback(() => {
    setPreferences(prev => {
      const currentIndex = FONT_SIZE_STEPS.indexOf(prev.fontSize);
      const nextIndex = Math.min(FONT_SIZE_STEPS.length - 1, currentIndex + 1);
      const next = { ...prev, fontSize: FONT_SIZE_STEPS[nextIndex] };
      savePreferences(next);
      return next;
    });
  }, [savePreferences]);

  const decreaseFontSize = useCallback(() => {
    setPreferences(prev => {
      const currentIndex = FONT_SIZE_STEPS.indexOf(prev.fontSize);
      const nextIndex = Math.max(0, currentIndex - 1);
      const next = { ...prev, fontSize: FONT_SIZE_STEPS[nextIndex] };
      savePreferences(next);
      return next;
    });
  }, [savePreferences]);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => !prev);
  }, []);

  // Listen for storage events across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setPreferences({
            theme: sanitizeTheme(parsed.theme),
            fontSize: sanitizeFontSize(parsed.fontSize),
          });
        } catch {}
      }
    };

    const handleCustomEvent = (e: any) => {
      if (e.detail) {
        setPreferences({
          theme: sanitizeTheme(e.detail.theme),
          fontSize: sanitizeFontSize(e.detail.fontSize),
        });
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("reading-preferences-updated", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("reading-preferences-updated", handleCustomEvent);
    };
  }, []);

  const themeTokens = useMemo(() => {
    return READING_THEME_TOKENS[preferences.theme] || READING_THEME_TOKENS.clean;
  }, [preferences.theme]);

  const fontTokens = useMemo(() => {
    return READING_FONT_TOKENS[preferences.fontSize] || READING_FONT_TOKENS.medium;
  }, [preferences.fontSize]);

  const value = useMemo(() => ({
    theme: preferences.theme,
    fontSize: preferences.fontSize,
    setTheme,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    isFocusMode,
    setIsFocusMode,
    toggleFocusMode,
    fontScalePercentage: fontTokens.percentage,
    fontScaleStep: fontTokens.step,
    themeTokens,
    fontTokens,
  }), [preferences, setTheme, setFontSize, increaseFontSize, decreaseFontSize, isFocusMode, toggleFocusMode, themeTokens, fontTokens]);

  return (
    <ReadingPreferencesContext.Provider value={value}>
      {children}
    </ReadingPreferencesContext.Provider>
  );
}

export const useReadingPreferences = () => useContext(ReadingPreferencesContext);
