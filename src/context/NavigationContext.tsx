import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";

export type PageContextType = 
  | "homepage" 
  | "article" 
  | "latest" 
  | "category" 
  | "listen" 
  | "admin" 
  | "community" 
  | "general";

export interface ArticleContextData {
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  category?: string;
  featuredImage?: string;
  language?: "ne" | "en";
  publishedAt?: string;
}

export interface CategoryContextData {
  id?: string;
  name: string;
  slug: string;
}

export interface StoryContextItem {
  id: string;
  title: string;
  category?: string;
  hasAudio?: boolean;
}

export interface ContextualNavData {
  type?: PageContextType;
  articleData?: ArticleContextData;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onShare?: () => void;
  onShareToChautari?: () => void;
  categories?: CategoryContextData[];
  articles?: StoryContextItem[];
  totalAvailableArticles?: number;
  onOpenTopics?: () => void;
  activeSectionId?: string;
  readingProgress?: number;
  fontSize?: "sm" | "md" | "lg" | "xl";
  setFontSize?: (size: "sm" | "md" | "lg" | "xl") => void;
}

export type NavOverlayType = 
  | "none" 
  | "contextual" 
  | "more_public" 
  | "more_admin" 
  | "notifications" 
  | "sections";

interface NavigationContextType {
  activeOverlay: NavOverlayType;
  setActiveOverlay: (overlay: NavOverlayType) => void;
  openContextualDrawer: (preferredTab?: NavOverlayType) => void;
  closeDrawer: () => void;
  contextData: ContextualNavData;
  setContextData: React.Dispatch<React.SetStateAction<ContextualNavData>>;
  registerContextData: (data: Partial<ContextualNavData>) => void;
  clearContextData: () => void;
  fontSize: "sm" | "md" | "lg" | "xl";
  setFontSize: (size: "sm" | "md" | "lg" | "xl") => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeOverlay, setActiveOverlay] = useState<NavOverlayType>("none");
  const [contextData, setContextData] = useState<ContextualNavData>({ type: "general" });
  const [fontSize, setFontSizeState] = useState<"sm" | "md" | "lg" | "xl">(() => {
    try {
      return (localStorage.getItem("sanatan_reader_font_size") as any) || "md";
    } catch {
      return "md";
    }
  });

  const location = useLocation();

  // Callbacks ref store to isolate inline function reference instability from context state
  const callbacksRef = React.useRef<{
    onToggleBookmark?: () => void;
    onShare?: () => void;
    onShareToChautari?: () => void;
    onOpenTopics?: () => void;
  }>({});

  const setFontSize = React.useCallback((size: "sm" | "md" | "lg" | "xl") => {
    setFontSizeState(size);
    try {
      localStorage.setItem("sanatan_reader_font_size", size);
      document.documentElement.setAttribute("data-reader-font-size", size);
      window.dispatchEvent(new CustomEvent("reader-font-size-changed", { detail: { size } }));
    } catch (e) {
      // Non-blocking
    }
  }, []);

  // Development render loop watchdog & diagnostics (Reset per location change)
  const renderCount = React.useRef(0);
  renderCount.current += 1;

  // Close overlay automatically on location change & reset per-route render watchdog
  useEffect(() => {
    setActiveOverlay(prev => prev === "none" ? prev : "none");
    renderCount.current = 0;
  }, [location.pathname]);

  if (renderCount.current > 15 && typeof import.meta !== "undefined" && (import.meta as any).env?.DEV) {
    console.warn(`[NavigationProvider] Render budget warning on path "${location.pathname}" (${renderCount.current} renders).`);
  }

  const openContextualDrawer = React.useCallback((preferredTab: NavOverlayType = "contextual") => {
    setActiveOverlay(preferredTab);
  }, []);

  const closeDrawer = React.useCallback(() => {
    setActiveOverlay(prev => prev === "none" ? prev : "none");
  }, []);

  const registerContextData = React.useCallback((data: Partial<ContextualNavData>) => {
    if (!data || Object.keys(data).length === 0) return;

    // 1. Silently capture dynamic callbacks in ref store without forcing state updates
    if (data.onToggleBookmark) callbacksRef.current.onToggleBookmark = data.onToggleBookmark;
    if (data.onShare) callbacksRef.current.onShare = data.onShare;
    if (data.onShareToChautari) callbacksRef.current.onShareToChautari = data.onShareToChautari;
    if (data.onOpenTopics) callbacksRef.current.onOpenTopics = data.onOpenTopics;

    setContextData(prev => {
      // 2. Check type change
      if (data.type && data.type !== prev.type) {
        return { ...prev, ...data };
      }

      // 3. Check article data change
      if (data.articleData !== undefined) {
        const prevArt = prev.articleData;
        const nextArt = data.articleData;
        if (prevArt?.id !== nextArt?.id || prevArt?.title !== nextArt?.title) {
          return { ...prev, ...data };
        }
      }

      // 4. Check categories length and items
      if (data.categories !== undefined) {
        const prevCats = prev.categories || [];
        const nextCats = data.categories || [];
        if (prevCats.length !== nextCats.length || prevCats[0]?.slug !== nextCats[0]?.slug) {
          return { ...prev, ...data };
        }
      }

      // 5. Check articles length and items
      if (data.articles !== undefined) {
        const prevArts = prev.articles || [];
        const nextArts = data.articles || [];
        if (prevArts.length !== nextArts.length || prevArts[0]?.id !== nextArts[0]?.id) {
          return { ...prev, ...data };
        }
      }

      // 6. Scalar properties comparison
      const scalarKeys: (keyof ContextualNavData)[] = [
        'isBookmarked', 
        'totalAvailableArticles', 
        'activeSectionId',
        'readingProgress'
      ];
      
      let hasScalarChange = false;
      for (const k of scalarKeys) {
        if (data[k] !== undefined && data[k] !== prev[k]) {
          hasScalarChange = true;
          break;
        }
      }

      if (hasScalarChange) {
        return { ...prev, ...data };
      }

      // Data is unchanged - retain previous state reference
      return prev;
    });
  }, []);

  const clearContextData = React.useCallback(() => {
    setContextData(prev => prev.type === "general" ? prev : { type: "general" });
  }, []);

  // Listen to custom events for opening navigation drawer
  useEffect(() => {
    const handleOpenDrawer = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: NavOverlayType }>;
      setActiveOverlay(customEvent.detail?.tab || "contextual");
    };

    const handleCloseDrawer = () => {
      setActiveOverlay(prev => prev === "none" ? prev : "none");
    };

    const handleSetContext = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<ContextualNavData>>;
      if (customEvent.detail) {
        registerContextData(customEvent.detail);
      }
    };

    window.addEventListener("open-navigation-drawer", handleOpenDrawer);
    window.addEventListener("close-all-drawers", handleCloseDrawer);
    window.addEventListener("set-navigation-context", handleSetContext);

    return () => {
      window.removeEventListener("open-navigation-drawer", handleOpenDrawer);
      window.removeEventListener("close-all-drawers", handleCloseDrawer);
      window.removeEventListener("set-navigation-context", handleSetContext);
    };
  }, [registerContextData]);

  const contextValue = React.useMemo(() => ({
    activeOverlay,
    setActiveOverlay,
    openContextualDrawer,
    closeDrawer,
    contextData,
    setContextData,
    registerContextData,
    clearContextData,
    fontSize,
    setFontSize,
  }), [
    activeOverlay,
    contextData,
    fontSize,
    openContextualDrawer,
    closeDrawer,
    registerContextData,
    clearContextData,
  ]);

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}

/**
 * Convenience hook for pages to register their contextual actions.
 * Cleans up automatically when the component unmounts.
 */
export function useContextualNav(data: Partial<ContextualNavData>, deps: any[] = []) {
  const { registerContextData } = useNavigation();
  const prevDataRef = React.useRef<Partial<ContextualNavData>>({});

  useEffect(() => {
    const prev = prevDataRef.current;
    let hasChanged = false;

    if (data.type !== prev.type) hasChanged = true;
    if (data.activeSectionId !== prev.activeSectionId) hasChanged = true;
    if (data.isBookmarked !== prev.isBookmarked) hasChanged = true;
    if (data.readingProgress !== prev.readingProgress) hasChanged = true;
    if (data.articleData?.id !== prev.articleData?.id) hasChanged = true;
    if (data.categories?.length !== prev.categories?.length) hasChanged = true;
    if (data.articles?.length !== prev.articles?.length) hasChanged = true;

    // Only update if there are material data differences, protecting against inline callback re-render loops
    if (hasChanged || Object.keys(prev).length === 0) {
      registerContextData(data);
      prevDataRef.current = data;
    }
  }, deps);
}
