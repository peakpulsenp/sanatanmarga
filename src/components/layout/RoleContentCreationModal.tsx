import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Newspaper, Sparkles, MessageSquare, Calendar, 
  Crown, Megaphone, Radio, Zap, Shield, UserCheck, 
  LogIn, ChevronRight, PenTool, Flame, ArrowUpRight 
} from "lucide-react";
import { useAuth } from "@/src/lib/auth";
import { useLanguage } from "@/src/context/LanguageContext";

interface RoleContentCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCommunityPost: (initialData?: { title?: string; category?: string }) => void;
  onOpenAiGenerator: () => void;
}

export default function RoleContentCreationModal({
  isOpen,
  onClose,
  onOpenCommunityPost,
  onOpenAiGenerator,
}: RoleContentCreationModalProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const role = user?.role || "guest";
  const isAdmin = role === "admin" || role === "super_admin";
  const isEditor = role === "editor" || role === "chief_editor" || role === "journalist" || role === "reporter";
  const isRegisteredUser = Boolean(user && !isAdmin && !isEditor);
  const isGuest = !user;

  const handleAction = (callback: () => void) => {
    onClose();
    callback();
  };

  const getRoleBadge = () => {
    if (isAdmin) {
      return {
        label: role === "super_admin" ? "सुपर एडमिन (Super Admin)" : "एडमिन (Admin)",
        color: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
        icon: Shield
      };
    }
    if (isEditor) {
      return {
        label: "सम्पादक / पत्रकार (Editorial Team)",
        color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
        icon: PenTool
      };
    }
    if (isRegisteredUser) {
      return {
        label: "प्रमाणित पाठक (Verified Member)",
        color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        icon: UserCheck
      };
    }
    return {
      label: "अतिथि पाठक (Guest Reader)",
      color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      icon: UserCheck
    };
  };

  const roleBadge = getRoleBadge();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md cursor-pointer"
        />

        {/* Modal / Sheet Container */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          className="relative w-full max-w-xl bg-card text-card-foreground rounded-t-3xl sm:rounded-3xl border border-border-theme shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="p-5 pb-4 border-b border-border-theme/70 flex items-center justify-between bg-muted-area/30">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-amber-500 text-white flex items-center justify-center shadow-md">
                  <Zap size={22} className="fill-white" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-card-foreground leading-tight">
                  {language === "en" ? "Create & Publish Content" : "सामग्री सिर्जना तथा पोष्ट"}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${roleBadge.color}`}>
                    <roleBadge.icon size={10} />
                    <span>{roleBadge.label}</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted-area text-muted-foreground hover:text-card-foreground transition-colors cursor-pointer"
              title="बन्द गर्नुहोस्"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Options */}
          <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar flex-1">
            <div className="space-y-1">
              <span className="text-xxs font-black uppercase tracking-wider text-muted-foreground block">
                {language === "en" ? "Select what you want to create" : "तपाईंको भूमिका अनुसार उपलब्ध कार्यहरू"}
              </span>
            </div>

            {/* ==============================================================
                1. ADMIN & SUPER ADMIN ACTIONS
                ============================================================== */}
            {isAdmin && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Publish News Article */}
                  <button
                    onClick={() => handleAction(() => navigate("/admin/editor"))}
                    className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/30 hover:border-primary text-left transition-all group flex items-start gap-3 cursor-pointer shadow-xs hover:shadow-md"
                  >
                    <div className="p-2.5 rounded-xl bg-primary text-white shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      <Newspaper size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-black text-card-foreground group-hover:text-primary transition-colors">
                          नयाँ समाचार प्रकाशन
                        </h4>
                        <ArrowUpRight size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        पूर्ण न्यूजरुम सम्पादक, कभर फोटो, कोटि र अडियो व्यवस्थापन
                      </p>
                    </div>
                  </button>

                  {/* AI Story Generator */}
                  <button
                    onClick={() => handleAction(onOpenAiGenerator)}
                    className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 hover:border-amber-500 text-left transition-all group flex items-start gap-3 cursor-pointer shadow-xs hover:shadow-md"
                  >
                    <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      <Sparkles size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-black text-card-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          AI स्मार्ट समाचार
                        </h4>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300">
                          Gemini 2.5
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        शीर्षक वा तथ्यबाट अनुसन्धानसहितको पूर्ण समाचार ड्राफ्ट
                      </p>
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* Community Discussion */}
                  <button
                    onClick={() => handleAction(() => onOpenCommunityPost())}
                    className="p-3 rounded-2xl bg-card hover:bg-muted-area border border-border-theme hover:border-primary/40 text-left transition-all flex flex-col justify-between gap-2 cursor-pointer group"
                  >
                    <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 w-fit group-hover:scale-110 transition-transform">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-card-foreground">चौतारी छलफल</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">सामुदायिक फोरम पोस्ट</p>
                    </div>
                  </button>

                  {/* Create Event */}
                  <button
                    onClick={() => handleAction(() => navigate("/admin/events/new"))}
                    className="p-3 rounded-2xl bg-card hover:bg-muted-area border border-border-theme hover:border-primary/40 text-left transition-all flex flex-col justify-between gap-2 cursor-pointer group"
                  >
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit group-hover:scale-110 transition-transform">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-card-foreground">कार्यक्रम / उत्सव</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">क्यालेन्डर इभेन्ट</p>
                    </div>
                  </button>

                  {/* Talent & Model */}
                  <button
                    onClick={() => handleAction(() => navigate("/admin/models"))}
                    className="p-3 rounded-2xl bg-card hover:bg-muted-area border border-border-theme hover:border-primary/40 text-left transition-all flex flex-col justify-between gap-2 cursor-pointer group"
                  >
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit group-hover:scale-110 transition-transform">
                      <Crown size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-card-foreground">प्रतिभा प्रोफाइल</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">मोडेल तथा कलाकार</p>
                    </div>
                  </button>

                  {/* Ads & Campaign */}
                  <button
                    onClick={() => handleAction(() => navigate("/admin/ads"))}
                    className="p-3 rounded-2xl bg-card hover:bg-muted-area border border-border-theme hover:border-primary/40 text-left transition-all flex flex-col justify-between gap-2 cursor-pointer group"
                  >
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 w-fit group-hover:scale-110 transition-transform">
                      <Megaphone size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-card-foreground">विज्ञापन अभियान</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">ब्यानर तथा प्रायोजक</p>
                    </div>
                  </button>

                  {/* Radio / Audio Story */}
                  <button
                    onClick={() => handleAction(() => navigate("/admin/media"))}
                    className="p-3 rounded-2xl bg-card hover:bg-muted-area border border-border-theme hover:border-primary/40 text-left transition-all flex flex-col justify-between gap-2 cursor-pointer group"
                  >
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 w-fit group-hover:scale-110 transition-transform">
                      <Radio size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-card-foreground">श्रव्य प्रसारण</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">ListenOS बुलेटिन</p>
                    </div>
                  </button>

                  {/* Breaking News Quick */}
                  <button
                    onClick={() => handleAction(() => navigate("/admin/editor?breaking=true"))}
                    className="p-3 rounded-2xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/30 text-left transition-all flex flex-col justify-between gap-2 cursor-pointer group"
                  >
                    <div className="p-2 rounded-xl bg-red-500 text-white w-fit group-hover:scale-110 transition-transform">
                      <Flame size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-red-600 dark:text-red-400">ब्रेकिङ न्युज</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">ताजा अलर्ट स्ट्रिप</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ==============================================================
                2. EDITORIAL / JOURNALIST ACTIONS
                ============================================================== */}
            {isEditor && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleAction(() => navigate("/admin/editor"))}
                    className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/30 hover:border-primary text-left transition-all group flex items-start gap-3 cursor-pointer"
                  >
                    <div className="p-2.5 rounded-xl bg-primary text-white shrink-0 group-hover:scale-105 transition-transform">
                      <Newspaper size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-black text-card-foreground group-hover:text-primary transition-colors">
                        नयाँ समाचार सम्पादन
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        न्यूजरुम डेस्क, सम्पादकीय समीक्षा र प्रकाशन
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAction(onOpenAiGenerator)}
                    className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 hover:border-amber-500 text-left transition-all group flex items-start gap-3 cursor-pointer"
                  >
                    <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 group-hover:scale-105 transition-transform">
                      <Sparkles size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-black text-card-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        AI समाचार जेनेरेटर
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        शीर्षकबाट द्रुत तथ्यपरक मस्यौदा निर्माण
                      </p>
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => handleAction(() => onOpenCommunityPost())}
                    className="p-3 rounded-2xl bg-card hover:bg-muted-area border border-border-theme hover:border-primary/40 text-left transition-all flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600">
                      <MessageSquare size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-card-foreground">चौतारी पोस्ट</h4>
                      <p className="text-[10px] text-muted-foreground">फोरममा सूचना वा विचार</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAction(() => navigate("/admin/events/new"))}
                    className="p-3 rounded-2xl bg-card hover:bg-muted-area border border-border-theme hover:border-primary/40 text-left transition-all flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-card-foreground">कार्यक्रम थप्नुहोस्</h4>
                      <p className="text-[10px] text-muted-foreground">इभेन्ट तथा चाडपर्व</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ==============================================================
                3. REGISTERED USER / MEMBER ACTIONS
                ============================================================== */}
            {isRegisteredUser && (
              <div className="space-y-2.5">
                <button
                  onClick={() => handleAction(() => onOpenCommunityPost())}
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-transparent border border-primary/30 hover:border-primary text-left transition-all group flex items-start gap-3.5 cursor-pointer shadow-xs hover:shadow-md"
                >
                  <div className="p-3 rounded-xl bg-primary text-white shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                    <MessageSquare size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-card-foreground group-hover:text-primary transition-colors">
                        चौतारीमा नयाँ छलफल सुरु गर्नुहोस्
                      </h4>
                      <ChevronRight size={16} className="text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      आफ्नो जिज्ञासा, स्थानीय समस्या, विचार वा अनुभव समुदायसँग साझा गर्नुहोस्
                    </p>
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleAction(() => onOpenCommunityPost({ category: "नागरिक रिपोर्ट" }))}
                    className="p-3.5 rounded-2xl bg-card hover:bg-muted-area border border-border-theme hover:border-primary/40 text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer group"
                  >
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit group-hover:scale-110 transition-transform">
                      <Megaphone size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-card-foreground">नागरिक रिपोर्ट / टिप</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">स्थानीय समाचार सूचना पठाउनुहोस्</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAction(() => navigate("/events"))}
                    className="p-3.5 rounded-2xl bg-card hover:bg-muted-area border border-border-theme hover:border-primary/40 text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer group"
                  >
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit group-hover:scale-110 transition-transform">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-card-foreground">कार्यक्रम दर्ता</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">सामुदायिक तथा स्थानीय उत्सव</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAction(() => navigate("/models"))}
                    className="p-3.5 rounded-2xl bg-card hover:bg-muted-area border border-border-theme hover:border-primary/40 text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer group"
                  >
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit group-hover:scale-110 transition-transform">
                      <Crown size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-card-foreground">कलाकार / प्रतिभा प्रोफाइल</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">आफ्नो पोर्टफोलियो दर्ता गर्नुहोस्</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAction(() => onOpenCommunityPost({ category: "विचार / ब्लग" }))}
                    className="p-3.5 rounded-2xl bg-card hover:bg-muted-area border border-border-theme hover:border-primary/40 text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer group"
                  >
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit group-hover:scale-110 transition-transform">
                      <PenTool size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-card-foreground">विचार तथा लेख</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">सम्पादकलाई लेख पठाउनुहोस्</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ==============================================================
                4. GUEST / UNAUTHENTICATED ACTIONS
                ============================================================== */}
            {isGuest && (
              <div className="space-y-3">
                <button
                  onClick={() => handleAction(() => onOpenCommunityPost())}
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-transparent border border-primary/30 hover:border-primary text-left transition-all group flex items-start gap-3.5 cursor-pointer shadow-xs hover:shadow-md"
                >
                  <div className="p-3 rounded-xl bg-primary text-white shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                    <MessageSquare size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-card-foreground group-hover:text-primary transition-colors">
                        चौतारीमा छलफल सुरु गर्नुहोस्
                      </h4>
                      <ChevronRight size={16} className="text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      आफ्नो जिज्ञासा, नागरिक टिप वा विचार समुदायसँग सिधै साझा गर्नुहोस्
                    </p>
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleAction(() => onOpenCommunityPost({ category: "नागरिक रिपोर्ट" }))}
                    className="p-3.5 rounded-2xl bg-card hover:bg-muted-area border border-border-theme hover:border-primary/40 text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer group"
                  >
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit group-hover:scale-110 transition-transform">
                      <Megaphone size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-card-foreground">नागरिक समाचार सूचना</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">स्थानीय घटना वा सूचना पठाउनुहोस्</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAction(() => navigate("/events"))}
                    className="p-3.5 rounded-2xl bg-card hover:bg-muted-area border border-border-theme hover:border-primary/40 text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer group"
                  >
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit group-hover:scale-110 transition-transform">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-card-foreground">कार्यक्रम दर्ता</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">स्थानीय उत्सव तथा भेला</p>
                    </div>
                  </button>
                </div>

                {/* Login Prompt Banner */}
                <div className="p-4 rounded-2xl bg-muted-area/60 border border-border-theme flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <LogIn size={18} className="text-primary shrink-0" />
                    <div>
                      <p className="font-bold text-card-foreground">सम्पादकीय वा विशेष अधिकार चाहिन्छ?</p>
                      <p className="text-[11px] text-muted-foreground">लगइन गरी आफ्नो लेखक वा पत्रकार ड्यासबोर्ड खोल्नुहोस्</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAction(() => navigate("/login"))}
                    className="px-3.5 py-1.5 rounded-full bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-all shrink-0 cursor-pointer shadow-xs"
                  >
                    लगइन
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
