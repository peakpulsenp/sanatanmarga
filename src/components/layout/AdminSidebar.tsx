import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Zap,
  Search,
  Command,
  Sun,
  Moon,
  Folder,
  FileText,
  Image,
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  DollarSign,
  Cpu,
  Sliders,
  Inbox,
  PenTool,
  Tag,
  Layout,
  Compass,
  Radio,
  Volume2,
  MapPin,
  Clock,
  Archive,
  MessageSquare,
  ShieldAlert,
  Share2,
  Camera,
  ShoppingBag,
  TrendingUp,
  Megaphone,
  BarChart3,
  Bell,
  Mail,
  Globe,
  Workflow,
  LifeBuoy,
  Activity,
  Building2,
  ShieldCheck,
  Settings,
  Layers,
  Headphones,
  CheckCircle2,
  Crown,
  Tv
} from "lucide-react";
import { signOut } from "@/src/lib/authClient";
import { auth } from "@/src/lib/firebase";
import { adminFetch } from "@/src/lib/adminFetch";
import { useAuth } from "@/src/lib/auth";
import { useLanguage } from "@/src/context/LanguageContext";
import { usePermissions } from "@/src/context/PermissionsContext";
import { useTheme } from "@/src/components/StyleProvider";
import { useFeatureControl } from "@/src/context/FeatureControlContext";
import {
  ADMIN_DOMAINS,
  getVisibleAdminNavigation,
  AdminDomain,
  AdminModule
} from "@/src/admin/adminModuleRegistry";
import AdminCommandPalette from "@/src/components/admin/AdminCommandPalette";

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  windowWidth: number;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Zap,
  Inbox,
  FileText,
  Image,
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  DollarSign,
  Cpu,
  Sliders,
  Folder,
  PenTool,
  Tag,
  Layout,
  Compass,
  Radio,
  Volume2,
  MapPin,
  Clock,
  Archive,
  MessageSquare,
  ShieldAlert,
  Share2,
  Camera,
  ShoppingBag,
  TrendingUp,
  Megaphone,
  BarChart3,
  Bell,
  Mail,
  Globe,
  Workflow,
  LifeBuoy,
  Activity,
  Building2,
  ShieldCheck,
  Settings,
  Layers,
  Headphones,
  CheckCircle2,
  Crown,
  Tv
};

export default function AdminSidebar({ isCollapsed, setIsCollapsed, windowWidth }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { hasPermission } = usePermissions();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { getAllFeatures, getEffectiveState } = useFeatureControl();

  const isMobile = windowWidth < 1024;
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({
    COMMAND_CENTER: true,
    EDITORIAL: true,
    PLATFORM: true
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [reviewCount, setReviewCount] = useState<number | null>(null);

  // Fetch real command center summary badge
  useEffect(() => {
    let mounted = true;
    adminFetch("/api/admin/command-center")
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (mounted && data?.reviews?.pendingCount !== undefined) {
          setReviewCount(data.reviews.pendingCount);
        }
      })
      .catch(() => { });
    return () => { mounted = false; };
  }, [location.pathname]);

  // Build context for evaluator
  const context = {
    role: user?.role,
    permissions: user ? [
      ...(hasPermission("news.create") ? ["news.create"] : []),
      ...(hasPermission("news.edit") ? ["news.edit"] : []),
      ...(hasPermission("news.publish") ? ["news.publish"] : []),
      ...(hasPermission("news.override") ? ["news.override"] : []),
      ...(hasPermission("media.upload") ? ["media.upload"] : []),
      ...(hasPermission("radio.manage") ? ["radio.manage"] : []),
      ...(hasPermission("sponsors.manage") ? ["sponsors.manage"] : []),
      ...(hasPermission("events.edit") ? ["events.edit"] : []),
      ...(hasPermission("revenue.view") ? ["revenue.view"] : []),
      ...(hasPermission("ads.manage") ? ["ads.manage"] : []),
      ...(hasPermission("community.moderate") ? ["community.moderate"] : []),
      ...(hasPermission("settings.manage") ? ["settings.manage"] : []),
      ...(hasPermission("users.manage") ? ["users.manage"] : []),
      ...(hasPermission("governance.manage") ? ["governance.manage"] : [])
    ] : [],
    isSuperAdmin: user?.role === "super_admin",
    tenantId: "global",
    featureStates: Object.fromEntries(
      (getAllFeatures ? getAllFeatures() : []).map(f => [f.id, getEffectiveState ? getEffectiveState(f.id) : "public"])
    )
  };

  const navigationTree = getVisibleAdminNavigation(context);
  const activeDomains = (Object.keys(ADMIN_DOMAINS) as AdminDomain[])
    .filter(d => (navigationTree[d] || []).length > 0)
    .sort((a, b) => ADMIN_DOMAINS[a].order - ADMIN_DOMAINS[b].order);

  // Auto-expand active domain
  useEffect(() => {
    for (const [dom, mods] of Object.entries(navigationTree)) {
      if (mods.some(m => location.pathname === m.route || (m.legacyAliases && m.legacyAliases.includes(location.pathname)))) {
        setExpandedDomains(prev => ({ ...prev, [dom]: true }));
      }
    }
  }, [location.pathname]);

  const toggleDomain = (domain: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedDomains(prev => ({ ...prev, [domain]: !prev[domain] }));
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <>
      <AdminCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Backdrop overlay for mobile drawer */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[59] transition-opacity animate-in fade-in"
          onClick={() => setIsCollapsed(true)}
          aria-label="Close menu backdrop"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen z-[60] bg-card border-r border-border-theme transition-all duration-300 flex flex-col shadow-lg ${isMobile
          ? isCollapsed ? "-translate-x-full" : "translate-x-0 w-72 shadow-2xl"
          : isCollapsed ? "w-20" : "w-68"
          }`}
      >
        {/* Brand Header */}
        <div className={`h-16 flex items-center border-b border-border-theme shrink-0 ${isCollapsed && !isMobile ? "px-2 justify-center" : "px-4 justify-between"}`}>
          {isCollapsed && !isMobile ? (
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 flex items-center justify-center text-primary transition-all cursor-pointer group"
              title="मेनु खोल्नुहोस् (Expand Sidebar)"
              aria-label="Expand Sidebar"
            >
              <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <>
              <Link to="/admin" className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black shrink-0">
                  <Zap size={18} />
                </div>
                <div className="min-w-0">
                  <h1 className="font-black text-sm text-card-foreground tracking-tight truncate">
                    {language === "en" ? "Sanatan Command" : "सनातन कमान्ड"}
                  </h1>
                  <span className="text-[10px] text-primary font-bold tracking-wider uppercase block">
                    Control Center 5.0
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-1">
                <button
                  onClick={toggleDarkMode}
                  className="p-1.5 rounded-lg hover:bg-muted-area text-muted-text hover:text-foreground transition-colors cursor-pointer"
                  title={isDarkMode ? "Light Mode" : "Dark Mode"}
                  aria-label="Toggle Theme"
                >
                  {isDarkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-muted-text" />}
                </button>

                <button
                  onClick={() => setIsCollapsed(true)}
                  className="p-1.5 rounded-lg hover:bg-muted-area text-muted-text hover:text-foreground transition-colors cursor-pointer"
                  title="मेनु बन्द गर्नुहोस् (Close Sidebar)"
                  aria-label="Close Sidebar"
                >
                  {isMobile ? <X size={18} /> : <ChevronLeft size={18} />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Public Home Portal Link */}
        {(!isCollapsed || isMobile) ? (
          <div className="px-3 pt-3">
            <Link
              to="/"
              className="w-full px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold flex items-center justify-between transition-colors group cursor-pointer"
              title="गृहपृष्ठ हेर्नुहोस् (Go to Public Home)"
            >
              <span className="flex items-center gap-2">
                <Home size={15} className="group-hover:scale-110 transition-transform" />
                <span>गृहपृष्ठ (Public Home)</span>
              </span>
              <ChevronRight size={13} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        ) : (
          <div className="px-2 pt-3 flex justify-center">
            <Link
              to="/"
              className="w-10 h-10 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 flex items-center justify-center transition-colors cursor-pointer"
              title="गृहपृष्ठ (Home)"
            >
              <Home size={18} />
            </Link>
          </div>
        )}

        {/* Command Palette Quick Trigger Button */}
        {(!isCollapsed || isMobile) && (
          <div className="px-3 pt-3">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="w-full px-3 py-2 bg-muted-area hover:bg-muted-area/80 border border-border-theme rounded-xl text-xs text-muted-text hover:text-foreground flex items-center justify-between transition-colors cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <Search size={14} className="text-muted-text group-hover:text-primary transition-colors" />
                <span>Search / Commands</span>
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-card border border-border-theme font-bold text-muted-text">
                <Command size={10} /> K
              </kbd>
            </button>
          </div>
        )}

        {/* Dynamic Navigation Domains */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
          {activeDomains.map(domainKey => {
            const domainMeta = ADMIN_DOMAINS[domainKey];
            const modules = navigationTree[domainKey] || [];
            const isExpanded = expandedDomains[domainKey] !== false;

            return (
              <div key={domainKey} className="space-y-1">
                {(!isCollapsed || isMobile) && (
                  <button
                    onClick={(e) => toggleDomain(domainKey, e)}
                    className="w-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-muted-text hover:text-foreground flex items-center justify-between cursor-pointer rounded-lg hover:bg-muted-area/40 transition-colors"
                  >
                    <span>{language === "en" ? domainMeta.labelEn : domainMeta.labelNe}</span>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}

                {(isExpanded || isCollapsed) && (
                  <div className="space-y-0.5">
                    {modules.map(mod => {
                      const isActive = location.pathname === mod.route || (mod.legacyAliases && mod.legacyAliases.includes(location.pathname));
                      const IconComponent = ICON_MAP[mod.icon] || Zap;
                      const hasBadge = mod.badgeProviderKey === "PENDING_REVIEWS" && typeof reviewCount === "number" && reviewCount > 0;

                      return (
                        <Link
                          key={mod.moduleId}
                          to={mod.route}
                          onClick={() => {
                            if (isMobile) setIsCollapsed(true);
                          }}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${isActive
                            ? "bg-primary text-white shadow-xs font-black"
                            : "text-muted-text hover:text-foreground hover:bg-muted-area"
                            } ${isCollapsed && !isMobile ? "justify-center px-0" : ""}`}
                          title={mod.label}
                        >
                          <IconComponent size={16} className={`shrink-0 ${isActive ? "text-white" : "text-primary/70"}`} />
                          {(!isCollapsed || isMobile) && (
                            <span className="truncate flex-1">
                              {language === "en" ? mod.localizedLabel?.en || mod.label : mod.localizedLabel?.ne || mod.label}
                            </span>
                          )}

                          {hasBadge && (!isCollapsed || isMobile) && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black shrink-0 ${isActive ? "bg-white text-primary" : "bg-rose-500 text-white"
                              }`}>
                              {reviewCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-border-theme shrink-0 bg-muted-area/20">
          <div className={`flex items-center gap-2.5 ${isCollapsed && !isMobile ? "justify-center" : "justify-between"}`}>
            {(!isCollapsed || isMobile) && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-foreground truncate">
                  {user?.displayName || user?.email?.split("@")[0] || "Admin Staff"}
                </div>
                <div className="text-[10px] font-bold text-primary truncate uppercase tracking-wider">
                  {user?.role || "staff"}
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-text hover:text-rose-500 transition-colors cursor-pointer"
              title="लग आउट (Sign Out)"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
