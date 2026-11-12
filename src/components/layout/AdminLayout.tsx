import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Menu, ShieldAlert, LogOut, Sun, Moon } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import { useAuth } from "@/src/lib/auth";
import { adminFetch } from "@/src/lib/adminFetch";
import { useNavigate } from "react-router-dom";
import { AdminSkeleton } from "@/src/components/ui/PageLoaders";
import PendingSyncBadge from "../admin/PendingSyncBadge";
import { useTheme } from "@/src/components/StyleProvider";
import { toast } from "sonner";
import AdminErrorBoundary from "@/src/components/admin/AdminErrorBoundary";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [impersonation, setImpersonation] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const stored = sessionStorage.getItem("sanatan_impersonation");
    if (stored) {
      try {
        setImpersonation(JSON.parse(stored));
      } catch (e) {
        sessionStorage.removeItem("sanatan_impersonation");
      }
    }
  }, []);

  const handleExitImpersonation = async () => {
    try {
      await adminFetch("/api/admin/exit-impersonate", { method: "POST" });
    } catch (e) {
      // ignore
    }
    sessionStorage.removeItem("sanatan_impersonation");
    setImpersonation(null);
    toast.success("Exited impersonation mode");
    window.location.reload();
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      if (width < 1024) {
        setIsCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 1024;

  // Keyboard shortcuts: Cmd/Ctrl+B to toggle sidebar, Escape to close on mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
      } else if (e.key === "Escape" && isMobile && !isCollapsed) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, isCollapsed]);

  if (authLoading) return <AdminSkeleton />;
  const isStaff = user && [
    'super_admin', 'admin', 'editorial_admin', 'chief_editor', 'senior_editor',
    'editor_in_chief', 'managing_editor', 'news_editor', 'editor', 'reporter',
    'fact_checker', 'sgis_scholar', 'manuscript_curator', 'media_producer',
    'radio_producer', 'acharya', 'community_moderator', 'revenue_manager',
    'finance_auditor', 'commerce_manager', 'contributor', 'researcher', 'moderator', 'analyst'
  ].includes(user.role);
  if (!user || !isStaff) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      {/* Impersonation Banner */}
      {impersonation && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-lg border-b border-amber-600 z-[100] sticky top-0">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="animate-pulse text-slate-950" />
            <span>
              Governance Mode: Impersonating <u>{impersonation.targetEmail}</u> ({impersonation.targetRole}) — Read-Only Mode
            </span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="bg-slate-950 text-amber-400 hover:bg-slate-900 px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-colors text-[11px]"
          >
            <LogOut size={13} />
            <span>Exit Impersonation</span>
          </button>
        </div>
      )}

      <div className="flex-1 flex relative">
        <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} windowWidth={windowWidth} />

        {/* Modern Sliding Menu Toggle Button (Visible whenever menu is collapsed on any screen) */}
        {isCollapsed && (
          <div className="fixed top-3 left-3 z-[65] flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsCollapsed(false)}
              className="px-3 py-2 bg-card/95 backdrop-blur-md text-card-foreground rounded-xl shadow-xl hover:scale-105 active:scale-95 hover:border-primary/50 transition-all border border-border-theme cursor-pointer flex items-center gap-2 group"
              title="मेनु खोल्नुहोस् (Open Navigation Menu - Ctrl+B)"
              aria-label="Open Navigation Menu"
            >
              <Menu size={18} className="text-primary group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black tracking-wide text-card-foreground">मेनु (Menu)</span>
            </button>
          </div>
        )}

        {/* Top-Right Floating Controls (Sync Status) */}
        <div className="fixed top-3 right-4 z-[65] flex items-center gap-2">
          <PendingSyncBadge />
        </div>

        {/* Main Content */}
        <motion.main 
          initial={false}
          animate={{ 
            marginLeft: isMobile ? "0px" : (isCollapsed ? "80px" : "280px"),
          }}
          className={`flex-grow transition-all duration-300 ease-in-out min-h-screen w-full overflow-x-hidden ${
            isMobile ? "pt-16" : ""
          }`}
        >
          <AdminErrorBoundary>
            {children}
          </AdminErrorBoundary>
        </motion.main>
      </div>
    </div>
  );
}
