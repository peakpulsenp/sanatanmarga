import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NepaliInput from "@/src/components/ui/NepaliInput";
import { useLanguage } from "@/src/context/LanguageContext";

export default function MinimalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery("");
    }
  };

  return (
    <div className="relative flex items-center" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 lg:p-2 text-foreground hover:text-primary transition-colors rounded-full hover:bg-muted-area/50 ${isOpen ? 'text-primary bg-muted-area/50' : ''}`}
        title={t("search")}
        aria-label={t("search")}
      >
        {isOpen ? <X className="size-5 lg:size-6" /> : <Search className="size-5 lg:size-6" />}
      </button>

      {isOpen && (
        <div className="fixed sm:absolute top-20 sm:top-full left-4 right-4 sm:left-auto sm:right-0 sm:w-96 bg-card border border-border-theme rounded-3xl p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-50">
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-muted-area/30 rounded-2xl p-1">
            <NepaliInput 
              value={query}
              onChange={setQuery}
              placeholder={t("searchPlaceholder")}
              className="w-full bg-transparent px-4 py-2.5 text-sm font-bold outline-none"
              ref={inputRef}
            />
            <button type="submit" className="p-2.5 bg-primary text-white rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20" aria-label={t("search")}>
              <Search size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
