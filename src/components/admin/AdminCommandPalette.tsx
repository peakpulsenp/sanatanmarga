import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Zap, ArrowRight, PenTool, Inbox, Image, Sliders, Shield } from "lucide-react";
import { useAuth } from "@/src/lib/auth";
import { usePermissions } from "@/src/context/PermissionsContext";
import { useFeatureControl } from "@/src/context/FeatureControlContext";
import { ADMIN_MODULES, evaluateAdminModuleAccess, AdminModule } from "@/src/admin/adminModuleRegistry";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminCommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Build context
  const context = {
    role: user?.role,
    permissions: user ? [
      ...(hasPermission("news.create") ? ["news.create"] : []),
      ...(hasPermission("news.edit") ? ["news.edit"] : []),
      ...(hasPermission("news.publish") ? ["news.publish"] : []),
      ...(hasPermission("media.upload") ? ["media.upload"] : []),
      ...(hasPermission("settings.manage") ? ["settings.manage"] : []),
      ...(hasPermission("users.manage") ? ["users.manage"] : []),
      ...(hasPermission("governance.manage") ? ["governance.manage"] : [])
    ] : [],
    isSuperAdmin: user?.role === "super_admin",
    tenantId: "global"
  };

  // Filter permitted modules
  const permittedModules: AdminModule[] = ADMIN_MODULES.filter(mod => {
    const access = evaluateAdminModuleAccess(mod, context);
    return access.decision === "VISIBLE";
  });

  const filteredModules = query.trim()
    ? permittedModules.filter(m =>
        m.label.toLowerCase().includes(query.toLowerCase()) ||
        m.description.toLowerCase().includes(query.toLowerCase()) ||
        m.searchKeywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
      )
    : permittedModules.slice(0, 8);

  // Safe Action Shortcuts
  const safeActions = [
    {
      id: "act_new_article",
      title: "New Article",
      description: "Open article editor to write fresh news",
      route: "/admin/editor",
      icon: PenTool,
      requiredPerm: "news.create"
    },
    {
      id: "act_review_inbox",
      title: "Review Inbox",
      description: "View pending drafts and verification queues",
      route: "/admin/review",
      icon: Inbox,
      requiredPerm: "news.edit"
    },
    {
      id: "act_media_library",
      title: "Media Library",
      description: "Browse uploaded images, podcasts and audio",
      route: "/admin/media-assets",
      icon: Image,
      requiredPerm: "media.upload"
    },
    {
      id: "act_feature_control",
      title: "Feature Control OS",
      description: "Inspect active feature flags and rollout state",
      route: "/admin/feature-control",
      icon: Sliders,
      requiredPerm: "settings.manage"
    }
  ].filter(act => !act.requiredPerm || hasPermission(act.requiredPerm) || user?.role === "super_admin");

  const totalItems = filteredModules.length + (query ? 0 : safeActions.length);

  const handleSelect = (route: string) => {
    onClose();
    navigate(route);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, totalItems));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalItems) % Math.max(1, totalItems));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex < filteredModules.length) {
        handleSelect(filteredModules[selectedIndex].route);
      } else {
        const actionIdx = selectedIndex - filteredModules.length;
        if (safeActions[actionIdx]) {
          handleSelect(safeActions[actionIdx].route);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div 
        className="relative w-full max-w-xl bg-card border border-border-theme rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[75vh]"
        role="dialog"
        aria-modal="true"
        aria-label="Admin Command Palette"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-border-theme bg-muted-area/30">
          <Search size={18} className="text-muted-text shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search admin modules, workflows, or press ESC..."
            className="w-full py-4 bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-text focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="p-1 hover:bg-muted-area rounded-lg text-muted-text hover:text-foreground cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
          <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted-area border border-border-theme text-muted-text ml-2">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredModules.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-muted-text">
                Modules ({filteredModules.length})
              </div>
              {filteredModules.map((mod, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={mod.moduleId}
                    onClick={() => handleSelect(mod.route)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected ? "bg-primary text-white" : "hover:bg-muted-area text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                        <Zap size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {mod.label}
                        </div>
                        <div className={`text-[11px] truncate ${isSelected ? "text-white/80" : "text-muted-text"}`}>
                          {mod.description}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ml-2 ${
                      isSelected ? "bg-white/20 text-white" : "bg-muted-area text-muted-text border border-border-theme"
                    }`}>
                      {mod.domain}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!query && safeActions.length > 0 && (
            <div className="pt-2">
              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-muted-text">
                Quick Safe Actions
              </div>
              {safeActions.map((act, actIdx) => {
                const overallIdx = filteredModules.length + actIdx;
                const isSelected = selectedIndex === overallIdx;
                const Icon = act.icon;
                return (
                  <button
                    key={act.id}
                    onClick={() => handleSelect(act.route)}
                    onMouseEnter={() => setSelectedIndex(overallIdx)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected ? "bg-primary text-white" : "hover:bg-muted-area text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-amber-500/10 text-amber-500"}`}>
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {act.title}
                        </div>
                        <div className={`text-[11px] truncate ${isSelected ? "text-white/80" : "text-muted-text"}`}>
                          {act.description}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={13} className={isSelected ? "text-white" : "text-muted-text"} />
                  </button>
                );
              })}
            </div>
          )}

          {filteredModules.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-text">
              कुनै मोड्युल भेटिएन (No permitted modules found)
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border-theme bg-muted-area/20 flex items-center justify-between text-[11px] text-muted-text">
          <div className="flex items-center gap-2">
            <span>↑↓ चयन</span>
            <span>↵ खोल्नुहोस्</span>
            <span>ESC बन्द</span>
          </div>
          <span className="font-semibold text-primary">Sanatan Command Center</span>
        </div>
      </div>
    </div>
  );
}
