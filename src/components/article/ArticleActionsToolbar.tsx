import React from 'react';
import { 
  Volume2, VolumeX, Bookmark, BookmarkCheck, Share2, 
  Maximize2, Type, Sparkles 
} from 'lucide-react';
import { ReadingTheme } from '@/src/context/ReadingPreferencesContext';

interface ArticleActionsToolbarProps {
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onOpenShare: () => void;
  onToggleFocusMode?: () => void;
  fontScaleStep: number;
  fontScalePercentage?: string;
  onFontScaleChange: (delta: number) => void;
  currentTheme?: ReadingTheme;
  onThemeChange?: (theme: ReadingTheme) => void;
  isAudioPlaying?: boolean;
  onToggleAudio?: () => void;
  language?: 'en' | 'ne';
  className?: string;
}

export default function ArticleActionsToolbar({
  isBookmarked,
  onToggleBookmark,
  onOpenShare,
  onToggleFocusMode,
  fontScaleStep,
  fontScalePercentage,
  onFontScaleChange,
  currentTheme,
  onThemeChange,
  isAudioPlaying = false,
  onToggleAudio,
  language = 'ne',
  className = ""
}: ArticleActionsToolbarProps) {
  const displayPercentage = fontScalePercentage || (
    fontScaleStep === 0 ? "100%" : fontScaleStep === 1 ? "120%" : fontScaleStep === 2 ? "140%" : "90%"
  );

  return (
    <div 
      className={`w-full bg-card/95 backdrop-blur-md rounded-2xl border border-border-theme p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs transition-colors ${className}`}
      id="article-actions-toolbar"
    >
      {/* Left: Quick Interaction Cluster */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        
        {/* Listen / Audio Trigger */}
        {onToggleAudio && (
          <button
            onClick={onToggleAudio}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isAudioPlaying 
                ? "bg-amber-500 text-white animate-pulse" 
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
            title={language === 'en' ? "Listen to Article" : "समाचार सुन्नुहोस्"}
            id="toolbar-listen-btn"
          >
            {isAudioPlaying ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>{isAudioPlaying ? (language === 'en' ? "Playing" : "बज्दैछ") : (language === 'en' ? "Listen" : "सुन्नुहोस्")}</span>
          </button>
        )}

        {/* Font Scaling [A-] [A+] */}
        <div className="flex items-center bg-muted-area p-0.5 rounded-xl border border-border-theme text-xs font-bold" id="toolbar-font-controls">
          <button
            onClick={() => onFontScaleChange(-1)}
            className="px-2.5 py-1.5 rounded-lg text-muted-text hover:text-foreground hover:bg-card transition-all cursor-pointer select-none active:scale-95"
            title={language === 'en' ? "Smaller Text" : "अक्षर सानो बनाउनुहोस्"}
            id="toolbar-font-decrease"
          >
            A-
          </button>
          <span className="px-1.5 text-[10px] font-mono text-muted-text font-bold select-none min-w-[38px] text-center" id="toolbar-font-indicator">
            {displayPercentage}
          </span>
          <button
            onClick={() => onFontScaleChange(1)}
            className="px-2.5 py-1.5 rounded-lg text-muted-text hover:text-foreground hover:bg-card transition-all cursor-pointer select-none active:scale-95"
            title={language === 'en' ? "Larger Text" : "अक्षर ठूलो बनाउनुहोस्"}
            id="toolbar-font-increase"
          >
            A+
          </button>
        </div>

        {/* Optional Theme Switcher in Normal mode toolbar if onThemeChange provided */}
        {onThemeChange && currentTheme && (
          <div className="hidden sm:flex items-center bg-muted-area p-0.5 rounded-xl border border-border-theme text-xs font-bold">
            <button
              onClick={() => onThemeChange('clean')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                currentTheme === 'clean' ? 'bg-card text-primary shadow-xs font-black' : 'text-muted-text hover:text-foreground'
              }`}
              title="Clean Light Theme"
            >
              Clean
            </button>
            <button
              onClick={() => onThemeChange('parchment')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                currentTheme === 'parchment' ? 'bg-card text-amber-700 dark:text-amber-400 shadow-xs font-black' : 'text-muted-text hover:text-foreground'
              }`}
              title="Parchment Theme"
            >
              Parchment
            </button>
            <button
              onClick={() => onThemeChange('night')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                currentTheme === 'night' ? 'bg-card text-amber-400 shadow-xs font-black' : 'text-muted-text hover:text-foreground'
              }`}
              title="Night Theme"
            >
              Night
            </button>
          </div>
        )}
      </div>

      {/* Right: Bookmark & Social Share Cluster */}
      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
        
        {/* Bookmark Action */}
        <button
          onClick={onToggleBookmark}
          className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
            isBookmarked 
              ? "bg-amber-500 text-white" 
              : "bg-muted-area text-foreground hover:bg-muted-area/80 border border-border-theme"
          }`}
          title={isBookmarked ? (language === 'en' ? "Saved in Bookmarks" : "बुकमार्क सुरक्षित") : (language === 'en' ? "Bookmark" : "बुकमार्क")}
          id="toolbar-bookmark-btn"
        >
          {isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          <span className="hidden sm:inline">
            {isBookmarked ? (language === 'en' ? "Saved" : "सुरक्षित") : (language === 'en' ? "Bookmark" : "बुकमार्क")}
          </span>
        </button>

        {/* Social Share Action (Always Prominent) */}
        <button
          onClick={onOpenShare}
          className="px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          title={language === 'en' ? "Share this Story" : "समाचार सेयर गर्नुहोस्"}
          id="toolbar-share-btn"
        >
          <Share2 size={15} />
          <span>{language === 'en' ? "Share" : "सेयर"}</span>
        </button>

        {/* Focus Mode Action Toggle */}
        {onToggleFocusMode && (
          <button
            onClick={onToggleFocusMode}
            className="p-2 rounded-xl bg-muted-area text-muted-text hover:text-foreground hover:bg-card border border-border-theme transition-all cursor-pointer"
            title={language === 'en' ? "Focus Reading Mode" : "ध्यानपूर्वक पढाइ मोड"}
            id="toolbar-focus-btn"
          >
            <Maximize2 size={15} />
          </button>
        )}

      </div>
    </div>
  );
}

