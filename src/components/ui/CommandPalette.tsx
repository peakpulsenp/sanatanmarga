import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Sparkles, 
  FileText, 
  Home, 
  BookOpen, 
  DollarSign, 
  Activity, 
  Users, 
  Settings, 
  Sun, 
  Moon, 
  Plus, 
  Command, 
  X, 
  ChevronRight, 
  ShieldAlert, 
  Newspaper, 
  Bell, 
  Terminal, 
  Zap,
  Flame,
  Radio
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "@/src/components/StyleProvider";
import { useAuth } from "@/src/lib/auth";
import { useTenant } from "@/src/lib/tenantContext";
import { Building2, Crown, Code, Rocket, Compass } from "lucide-react";
import NepaliInput from "@/src/components/ui/NepaliInput";

interface CommandItem {
  id: string;
  title: string;
  icon: any;
  action: () => void;
  color?: string;
  shortcut?: string;
  show?: boolean;
}

interface CommandGroup {
  category: string;
  items: CommandItem[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAiGenerator?: () => void;
}

export default function CommandPalette({ isOpen, onClose, onOpenAiGenerator }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user } = useAuth();
  const { activeTenant, allTenants, switchTenant } = useTenant();
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isEditor = user?.role === 'editor' || user?.role === 'chief_editor' || isAdmin;

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global keydown shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or state
          window.dispatchEvent(new CustomEvent('toggle-command-palette'));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const commandGroups: CommandGroup[] = [
    {
      category: "द्रुत कार्यहरू (Quick Actions)",
      items: [
        {
          id: "ai-news",
          title: "AI समाचार जनरेटर (AI Generator)",
          icon: Sparkles,
          shortcut: "Ctrl+G",
          color: "text-sacred bg-sacred/10",
          action: () => {
            onClose();
            if (onOpenAiGenerator) onOpenAiGenerator();
            else navigate("/admin/editor");
          },
          show: isEditor
        },
        {
          id: "new-article",
          title: "नयाँ समाचार ड्राफ्ट (Create Article)",
          icon: Plus,
          shortcut: "Ctrl+N",
          color: "text-primary bg-primary/10",
          action: () => {
            onClose();
            navigate("/admin/editor");
          },
          show: isEditor
        },
        {
          id: "toggle-theme",
          title: isDarkMode ? "लाइट मोडमा फेर्नुहोस् (Light Mode)" : "डार्क मोडमा फेर्नुहोस् (Dark Mode)",
          icon: isDarkMode ? Sun : Moon,
          color: "text-amber-500 bg-amber-500/10",
          action: () => {
            toggleDarkMode();
            onClose();
          }
        }
      ]
    },
    {
      category: "सञ्चालन प्रणाली (Operating Systems)",
      items: [
        {
          id: "knowledge-os",
          title: "सरस्वती ज्ञान प्रणाली (Knowledge OS / Entity Graph)",
          icon: BookOpen,
          color: "text-emerald-500 bg-emerald-500/10",
          action: () => {
            onClose();
            navigate("/knowledge");
          }
        },
        {
          id: "executive-os",
          title: "कार्यकारी कमान्ड सेन्टर (Executive Command)",
          icon: Activity,
          color: "text-purple-500 bg-purple-500/10",
          action: () => {
            onClose();
            navigate("/admin/executive");
          },
          show: isAdmin
        },
        {
          id: "revenue-os",
          title: "रेभेन्यु तथा प्रायोजक OS (Revenue OS)",
          icon: DollarSign,
          color: "text-emerald-600 bg-emerald-600/10",
          action: () => {
            onClose();
            navigate("/admin/revenue");
          },
          show: isAdmin
        },
        {
          id: "media-os",
          title: "मिडिया अप्स V2 (Media OS)",
          icon: Zap,
          color: "text-blue-500 bg-blue-500/10",
          action: () => {
            onClose();
            navigate("/admin/media-os");
          },
          show: isAdmin
        },
        {
          id: "tenant-federation",
          title: "टेनान्ट सञ्जाल V3.0 (Tenant Federation OS)",
          icon: Building2,
          color: "text-amber-500 bg-amber-500/10",
          action: () => {
            onClose();
            navigate("/admin/tenants");
          },
          show: isAdmin
        },
        {
          id: "workflow-automation",
          title: "कार्यप्रवाह स्वचालन (Institutional Workflow OS)",
          icon: Zap,
          color: "text-emerald-500 bg-emerald-500/10",
          action: () => {
            onClose();
            navigate("/admin/workflows");
          },
          show: isAdmin
        },
        {
          id: "developer-api-keys",
          title: "विकासकर्ता API Keys (REST/GraphQL Platform)",
          icon: Code,
          color: "text-blue-500 bg-blue-500/10",
          action: () => {
            onClose();
            navigate("/admin/developer-api");
          },
          show: isAdmin
        },
        {
          id: "tenant-onboarding",
          title: "टेनान्ट स्वतः-दर्ता पोर्टाल (Self-Service Onboarding)",
          icon: Rocket,
          color: "text-purple-500 bg-purple-500/10",
          action: () => {
            onClose();
            navigate("/onboarding");
          },
          show: true
        }
      ]
    },
    {
      category: `संस्थागत टेनान्टहरू (Active: ${activeTenant.name})`,
      items: allTenants.map(t => ({
        id: `tenant-switch-${t.id}`,
        title: `टेनान्ट फेर्नुहोस्: ${t.name} (@${t.subdomain})`,
        icon: Building2,
        color: t.id === activeTenant.id ? "text-amber-500 bg-amber-500/20" : "text-muted-text bg-muted-area",
        action: () => {
          switchTenant(t.id);
          onClose();
        }
      }))
    },
    {
      category: "नेभिगेसन (Navigation)",
      items: [
        {
          id: "my-sanatan",
          title: "मेरो सनातन (My Sanatan - Personalized Intelligence Feed)",
          icon: Sparkles,
          color: "text-amber-500 bg-amber-500/10",
          action: () => {
            onClose();
            navigate("/my-sanatan");
          }
        },
        {
          id: "storylines",
          title: "विकासशील शृङ्खलाहरू (Developing Storylines & Timelines)",
          icon: Flame,
          color: "text-red-500 bg-red-500/10",
          action: () => {
            onClose();
            navigate("/storylines");
          }
        },
        {
          id: "command-center",
          title: "सम्पादकीय कमान्ड सेन्टर (Editorial Command Center)",
          icon: Command,
          color: "text-blue-500 bg-blue-500/10",
          action: () => {
            onClose();
            navigate("/admin/command-center");
          },
          show: isEditor
        },
        {
          id: "nepal-hub",
          title: "नेपाल इन्टेलिजन्स हब (Nepal Hub - पात्रो, पञ्चाङ्ग, बजार)",
          icon: Compass,
          color: "text-amber-500 bg-amber-500/10",
          action: () => {
            onClose();
            navigate("/nepal-hub");
          }
        },
        {
          id: "home",
          title: "गृह पृष्ठ (Home)",
          icon: Home,
          action: () => {
            onClose();
            navigate("/");
          }
        },
        {
          id: "search",
          title: "खोज तथा ट्रेन्डिङ (Search News)",
          icon: Search,
          action: () => {
            onClose();
            navigate("/search");
          }
        },
        {
          id: "admin-articles",
          title: "समाचार सूची (Articles Manager)",
          icon: Newspaper,
          action: () => {
            onClose();
            navigate("/admin/articles");
          },
          show: isEditor
        },
        {
          id: "admin-ops",
          title: "अपरेशन्स सेन्टर (Operations Center)",
          icon: Terminal,
          action: () => {
            onClose();
            navigate("/admin/operations");
          },
          show: isAdmin
        }
      ]
    }
  ];

  // Flatten items for keyboard navigation
  const allFilteredItems = commandGroups.flatMap(g => 
    g.items.filter(i => (i.show !== false) && (
      i.title.toLowerCase().includes(query.toLowerCase()) ||
      g.category.toLowerCase().includes(query.toLowerCase())
    ))
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, allFilteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allFilteredItems.length) % Math.max(1, allFilteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allFilteredItems[selectedIndex]) {
        allFilteredItems[selectedIndex].action();
      } else if (query.trim()) {
        onClose();
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-start justify-center pt-16 sm:pt-24 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          onKeyDown={handleKeyDown}
          className="relative w-full max-w-2xl bg-card text-card-foreground rounded-3xl border border-border-theme shadow-2xl overflow-hidden z-10"
        >
          {/* Search Header Input */}
          <div className="relative flex items-center px-5 py-4 border-b border-border-theme/80 bg-muted-area/30">
            <Search className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
            <NepaliInput
              ref={inputRef}
              value={query}
              onChange={(val) => {
                setQuery(val);
                setSelectedIndex(0);
              }}
              placeholder="खोज्नुहोस् वा कमान्ड टाइप गर्नुहोस्... (उदा: 'samachar', 'namaste')"
              className="w-full bg-transparent text-card-foreground placeholder:text-muted-foreground focus:outline-none text-base font-medium pr-16"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="p-1 rounded-full text-muted-foreground hover:text-foreground mr-2"
              >
                <X size={16} />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-bold text-muted-foreground bg-muted-area border border-border-theme rounded-lg">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-[60vh] overflow-y-auto p-3 custom-scrollbar">
            {allFilteredItems.length === 0 ? (
              <div className="p-8 text-center text-muted-text space-y-3">
                <Search className="w-10 h-10 mx-auto opacity-30 text-primary" />
                <p className="text-sm font-semibold">कुनै कमान्ड भेटिएन "{query}"</p>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/search?q=${encodeURIComponent(query)}`);
                  }}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md"
                >
                  " {query} " को लागि पुरा खोज्नुहोस्
                </button>
              </div>
            ) : (
              commandGroups.map((group, groupIdx) => {
                const groupItems = group.items.filter(i => (i.show !== false) && (
                  i.title.toLowerCase().includes(query.toLowerCase()) ||
                  group.category.toLowerCase().includes(query.toLowerCase())
                ));

                if (groupItems.length === 0) return null;

                return (
                  <div key={groupIdx} className="mb-4">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      {group.category}
                    </div>
                    <div className="space-y-1 mt-1">
                      {groupItems.map((item, itemIdx) => {
                        const globalIdx = Array.isArray(allFilteredItems) ? allFilteredItems.indexOf(item) : 0;
                        const isSelected = globalIdx === selectedIndex;
                        const Icon = item.icon;

                        return (
                          <div
                            key={`${item.id || 'cmd'}-${itemIdx}`}
                            onClick={() => item.action()}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                            className={`flex items-center justify-between px-3.5 py-3 rounded-2xl cursor-pointer transition-all ${
                              isSelected
                                ? "bg-primary/10 border border-primary/30 text-card-foreground shadow-sm"
                                : "hover:bg-muted-area/60 text-card-foreground/90 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl ${item.color || "bg-muted-area text-muted-text"}`}>
                                <Icon size={18} />
                              </div>
                              <span className="text-sm font-bold">{item.title}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {item.shortcut && (
                                <span className="text-[10px] font-mono bg-muted-area border border-border-theme px-2 py-0.5 rounded-md text-muted-text font-bold">
                                  {item.shortcut}
                                </span>
                              )}
                              <ChevronRight size={16} className={`transition-transform ${isSelected ? "text-primary translate-x-1" : "text-muted-text/40"}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts hint */}
          <div className="px-5 py-2.5 bg-muted-area/50 border-t border-border-theme flex items-center justify-between text-[11px] text-muted-text font-medium">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-card border border-border-theme rounded text-[10px] font-mono">↑↓</kbd> चयन
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-card border border-border-theme rounded text-[10px] font-mono">↵</kbd> खोल्नुहोस्
              </span>
            </div>
            <div className="flex items-center gap-1 font-bold text-primary">
              <Command size={12} /> Sanatan Media Sutra OS
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
