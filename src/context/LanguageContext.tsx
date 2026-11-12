import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Language } from "@/src/i18n/translations";
import { useAuth } from "@/src/lib/auth";
import { db } from "@/src/lib/firebase";
import { doc, setDoc } from "@/src/lib/firebase";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations.ne, fallback?: string) => string;
  getLocalized: <T extends Record<string, any>>(item: T | null | undefined, fieldName: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("sanatan_lang") as Language;
      if (saved === "en" || saved === "ne") return saved;
      // Default to Nepali ('ne')
      return "ne";
    } catch {
      return "ne";
    }
  });

  const setLanguage = React.useCallback(async (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("sanatan_lang", lang);
      document.documentElement.lang = lang;
    } catch (e) {
      console.warn("Could not save language to localStorage:", e);
    }

    if (user && user.uid) {
      try {
        await setDoc(doc(db, "users", user.uid), { preferredLanguage: lang, languageUpdatedAt: Date.now() }, { merge: true });
        const cacheKey = `sutra_user_profile_${user.uid}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          parsed.preferredLanguage = lang;
          localStorage.setItem(cacheKey, JSON.stringify(parsed));
        }
      } catch (err) {
        console.warn("Failed to sync language preference to Firestore:", err);
      }
    }
  }, [user]);

  const toggleLanguage = React.useCallback(() => {
    setLanguageState(prev => {
      const next = prev === "ne" ? "en" : "ne";
      try {
        localStorage.setItem("sanatan_lang", next);
        document.documentElement.lang = next;
      } catch (e) {}
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Sync with logged-in user preference
  useEffect(() => {
    if (user && user.preferredLanguage) {
      const userLang = user.preferredLanguage as Language;
      if (userLang === "en" || userLang === "ne") {
        if (userLang !== language) {
          setLanguageState(userLang);
          try {
            localStorage.setItem("sanatan_lang", userLang);
            document.documentElement.lang = userLang;
          } catch (e) {
            console.warn("Could not save language to localStorage:", e);
          }
        }
      }
    }
  }, [user]);

  const t = React.useCallback((key: keyof typeof translations.ne, fallback?: string): string => {
    const langDict = translations[language] || translations.ne;
    if (langDict[key]) return langDict[key];
    const neDict = translations.ne;
    if (neDict[key]) return neDict[key];
    return fallback || String(key);
  }, [language]);

  /**
   * Intelligently selects localized field based on active language
   * e.g., getLocalized(article, 'title') returns article.title_en if lang='en' and field exists, else article.title
   */
  const getLocalized = React.useCallback(<T extends Record<string, any>>(item: T | null | undefined, fieldName: string): any => {
    if (!item) return "";
    
    if (language === "en") {
      const enValue = item[`${fieldName}_en`] ?? item[`${fieldName}En`];
      if (enValue && typeof enValue === "string" && enValue.trim().length > 0) {
        return enValue;
      }
    } else if (language === "ne") {
      const neValue = item[`${fieldName}_ne`] ?? item[`${fieldName}Ne`];
      if (neValue && typeof neValue === "string" && neValue.trim().length > 0) {
        return neValue;
      }
    }

    return item[fieldName] ?? "";
  }, [language]);

  const contextValue = React.useMemo(() => ({
    language,
    setLanguage,
    toggleLanguage,
    t,
    getLocalized,
  }), [language, setLanguage, toggleLanguage, t, getLocalized]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
