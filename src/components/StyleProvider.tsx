import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { doc } from "@/src/lib/firebase";
import { db, safeOnSnapshot } from "@/src/lib/firebase";

export interface SiteSettings {
  settingsVersion?: number;
  lastUpdated?: string;
  logoUrl: string;
  logoVerticalUrl?: string;
  siteName: string;
  siteTagline: string;
  brandSlogan: string;
  siteDescription: string;
  siteDescription_en?: string;
  siteName_en?: string;
  siteTagline_en?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  address_en?: string;
  copyrightText?: string;
  footerText?: string;
  developerText?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  aboutUs?: string;
  aboutUs_en?: string;
  contactUs?: string;
  contactUs_en?: string;
  termsContent?: string;
  termsContent_en?: string;
  privacyContent?: string;
  privacyContent_en?: string;
  liveVideoUrl?: string;
  liveVideoType?: "youtube" | "facebook";
  sponsoredAds?: (string | { text: string; link?: string })[];
  adSenseClient?: string;
  adSenseSlot?: string;
  splashBgColor?: string;
}

interface ThemeSettings {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  cornerRadius: number;
  categoryHeroRadius: number;
  postCardRadius?: number;
  tickerSpeed?: number;
}

interface ThemeContextType extends ThemeSettings {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (val: boolean) => void;
  siteSettings: SiteSettings;
}

const defaultTheme: ThemeSettings = {
  primaryColor: "#111C2D",
  accentColor: "#C58A3A",
  fontFamily: "Noto Sans Devanagari",
  cornerRadius: 12,
  categoryHeroRadius: 20,
  postCardRadius: 16,
  tickerSpeed: 30,
};

const defaultSiteSettings: SiteSettings = {
  logoUrl: "/logo.svg",
  logoVerticalUrl: "/logo-vertical.png",
  siteName: "सनातन मार्ग",
  siteTagline: "Media & News Portal",
  brandSlogan: "सत्य, तथ्य र निष्पक्ष समाचार",
  siteDescription: "सत्य, तथ्य र निष्पक्ष समाचार पोर्टल",
  contactEmail: "info@sanatanmarga.com",
  contactPhone: "+977-9705125527",
  address: "काठमाडौं, नेपाल",
  copyrightText: "© २०२६ Sanatan Marga। सर्वाधिकार सुरक्षित।",
  facebookUrl: "https://www.facebook.com/Sanatanmarga",
  twitterUrl: "https://x.com/Sanatanmarga",
  instagramUrl: "https://www.instagram.com/omsanatanmarga/",
  youtubeUrl: "https://www.youtube.com/@omSanatanMarga",
  developerText: "Milijuli Solutions",
};

const ThemeContext = createContext<ThemeContextType>({
  ...defaultTheme,
  isDarkMode: false,
  toggleDarkMode: () => {},
  setDarkMode: () => {},
  siteSettings: defaultSiteSettings,
});

export function StyleProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("sg_site_theme");
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...defaultTheme, ...parsed };
        }
      } catch (e) {}
    }
    return defaultTheme;
  });

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("sg_site_settings");
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...defaultSiteSettings, ...parsed };
        }
      } catch (e) {}
    }
    return defaultSiteSettings;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      localStorage.setItem('theme', newVal ? 'dark' : 'light');
      return newVal;
    });
  }, []);

  const setDarkMode = useCallback((val: boolean) => {
    setIsDarkMode(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', val ? 'dark' : 'light');
    }
  }, []);

  const updateSiteSettingsState = (data: any) => {
    if (!data) return;

    if (data.theme && typeof data.theme === "object") {
      const fetchedTheme = data.theme;
      setTheme(prev => {
        const updatedTheme: ThemeSettings = {
          primaryColor: fetchedTheme.primaryColor || prev.primaryColor,
          accentColor: fetchedTheme.accentColor || prev.accentColor,
          fontFamily: fetchedTheme.fontFamily || prev.fontFamily,
          cornerRadius: typeof fetchedTheme.cornerRadius === "number" ? fetchedTheme.cornerRadius : prev.cornerRadius,
          categoryHeroRadius: typeof fetchedTheme.categoryHeroRadius === "number" ? fetchedTheme.categoryHeroRadius : prev.categoryHeroRadius,
          postCardRadius: typeof fetchedTheme.postCardRadius === "number" ? fetchedTheme.postCardRadius : prev.postCardRadius,
          tickerSpeed: typeof fetchedTheme.tickerSpeed === "number" ? fetchedTheme.tickerSpeed : prev.tickerSpeed,
        };
        try {
          localStorage.setItem("sg_site_theme", JSON.stringify(updatedTheme));
        } catch (e) {}
        return updatedTheme;
      });
    } else if (data.cornerRadius !== undefined || data.primaryColor !== undefined) {
      setTheme(prev => {
        const updated: ThemeSettings = {
          ...prev,
          primaryColor: data.primaryColor || prev.primaryColor,
          accentColor: data.accentColor || prev.accentColor,
          cornerRadius: typeof data.cornerRadius === "number" ? data.cornerRadius : prev.cornerRadius,
          categoryHeroRadius: typeof data.categoryHeroRadius === "number" ? data.categoryHeroRadius : prev.categoryHeroRadius,
          postCardRadius: typeof data.postCardRadius === "number" ? data.postCardRadius : prev.postCardRadius,
          tickerSpeed: typeof data.tickerSpeed === "number" ? data.tickerSpeed : prev.tickerSpeed,
        };
        try {
          localStorage.setItem("sg_site_theme", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }

    setSiteSettings(prev => {
      const merged: SiteSettings = {
        ...prev,
        settingsVersion: typeof data.settingsVersion === "number" ? data.settingsVersion : (prev.settingsVersion || 1),
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        logoUrl: data.logoUrl || prev.logoUrl,
        logoVerticalUrl: data.logoVerticalUrl || prev.logoVerticalUrl,
        siteName: data.siteName || prev.siteName,
        siteTagline: data.siteTagline || prev.siteTagline,
        brandSlogan: data.brandSlogan || prev.brandSlogan,
        siteDescription: data.siteDescription || prev.siteDescription,
        contactEmail: data.contactEmail || prev.contactEmail,
        contactPhone: data.contactPhone || prev.contactPhone,
        address: data.address || prev.address,
        copyrightText: data.copyrightText || prev.copyrightText,
        footerText: data.footerText !== undefined ? data.footerText : prev.footerText,
        developerText: data.developerText || prev.developerText,
        facebookUrl: data.facebookUrl || prev.facebookUrl,
        twitterUrl: data.twitterUrl || prev.twitterUrl,
        instagramUrl: data.instagramUrl || prev.instagramUrl,
        youtubeUrl: data.youtubeUrl || prev.youtubeUrl,
        aboutUs: data.aboutUs !== undefined ? data.aboutUs : prev.aboutUs,
        contactUs: data.contactUs !== undefined ? data.contactUs : prev.contactUs,
        termsContent: data.termsContent !== undefined ? data.termsContent : prev.termsContent,
        privacyContent: data.privacyContent !== undefined ? data.privacyContent : prev.privacyContent,
        liveVideoUrl: data.liveVideoUrl !== undefined ? data.liveVideoUrl : prev.liveVideoUrl,
        liveVideoType: data.liveVideoType || prev.liveVideoType,
        sponsoredAds: Array.isArray(data.sponsoredAds) ? data.sponsoredAds : prev.sponsoredAds,
        adSenseClient: data.adSenseClient !== undefined ? data.adSenseClient : prev.adSenseClient,
        adSenseSlot: data.adSenseSlot !== undefined ? data.adSenseSlot : prev.adSenseSlot,
        splashBgColor: data.splashBgColor || prev.splashBgColor,
      };

      try {
        localStorage.setItem("sg_site_settings", JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });
  };

  useEffect(() => {
    const docRef = doc(db, "settings", "site");
    const unsubscribe = safeOnSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          updateSiteSettingsState(docSnap.data());
        }
      },
      "settings/site"
    );

    const handleSettingsUpdated = (e: any) => {
      if (e?.detail) {
        updateSiteSettingsState(e.detail);
      } else {
        try {
          const stored = localStorage.getItem("sg_site_settings");
          if (stored) updateSiteSettingsState(JSON.parse(stored));
        } catch (err) {}
      }
    };

    window.addEventListener("site-settings-updated", handleSettingsUpdated);
    window.addEventListener("snapshot-rebuilt", handleSettingsUpdated);

    return () => {
      window.removeEventListener("site-settings-updated", handleSettingsUpdated);
      window.removeEventListener("snapshot-rebuilt", handleSettingsUpdated);
      try {
        if (typeof unsubscribe === "function") unsubscribe();
      } catch (e) {
        console.warn("StyleProvider cleanup error:", e);
      }
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const root = document.documentElement;
    const effectivePrimary =
      isDarkMode && (theme.primaryColor === "#111C2D" || theme.primaryColor === "#121926")
        ? "#C58A3A"
        : theme.primaryColor;
    const effectiveAccent =
      isDarkMode && theme.accentColor === "#C58A3A"
        ? "#D8A152"
        : theme.accentColor;

    root.style.setProperty("--primary", effectivePrimary);
    root.style.setProperty("--color-primary", effectivePrimary);
    root.style.setProperty("--accent", effectiveAccent);
    root.style.setProperty("--color-accent", effectiveAccent);

    const globalRadius = typeof theme.cornerRadius === "number" ? theme.cornerRadius : 12;
    
    // Explicitly exempted components (Category Hero, Post Card) retain their designated values if set
    const catHeroRadius = typeof theme.categoryHeroRadius === "number" 
      ? theme.categoryHeroRadius 
      : (globalRadius === 12 ? 20 : globalRadius);
      
    const postCardRadius = typeof theme.postCardRadius === "number" 
      ? theme.postCardRadius 
      : (globalRadius === 12 ? 16 : globalRadius);

    root.style.setProperty("--app-radius", `${globalRadius}px`);
    root.style.setProperty("--app-radius-sm", `${Math.max(4, Math.round(globalRadius * 0.5))}px`);
    root.style.setProperty("--app-radius-md", `${Math.max(6, Math.round(globalRadius * 0.66))}px`);
    root.style.setProperty("--app-radius-lg", `${Math.max(8, Math.round(globalRadius * 0.85))}px`);
    root.style.setProperty("--app-radius-xl", `${globalRadius}px`);
    root.style.setProperty("--app-radius-2xl", `${Math.max(12, Math.round(globalRadius * 1.33))}px`);
    root.style.setProperty("--app-radius-3xl", `${Math.max(16, Math.round(globalRadius * 1.66))}px`);
    root.style.setProperty("--app-radius-4xl", `${Math.max(20, Math.round(globalRadius * 2))}px`);
    root.style.setProperty("--app-category-hero-radius", `${catHeroRadius}px`);
    root.style.setProperty("--app-post-card-radius", `${postCardRadius}px`);
    root.style.setProperty("--app-ticker-speed", `${theme.tickerSpeed ?? 30}s`);
  }, [theme, isDarkMode]);

  const contextValue = useMemo(() => ({
    ...theme,
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
    siteSettings
  }), [theme, isDarkMode, toggleDarkMode, setDarkMode, siteSettings]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
export const useSiteSettings = () => useContext(ThemeContext).siteSettings;
export const useSettings = () => useContext(ThemeContext);
