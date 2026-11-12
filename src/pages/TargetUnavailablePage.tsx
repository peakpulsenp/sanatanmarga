import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import SEOHead from "../components/common/SEOHead";
import { AlertTriangle, Home, Compass, Search, MessageSquare, ArrowLeft } from "lucide-react";

export const TargetUnavailablePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason") || "TARGET_NOT_FOUND";
  const entityType = searchParams.get("entityType") || "content";
  const entityId = searchParams.get("entityId") || "";
  const feature = searchParams.get("feature") || "";

  const getReasonDetails = () => {
    switch (reason) {
      case "ENTITY_DELETED":
        return {
          title: "Content No Longer Available",
          titleNe: "सामग्री अब उपलब्ध छैन",
          desc: `The ${entityType.replace(/_/g, " ")} you are looking for has been archived, unpublished, or removed by editorial moderation.`,
          descNe: `तपाईंले खोज्नुभएको सामग्री सम्पादकीय टोलीद्वारा हटाइएको वा संग्रह गरिएको छ।`
        };
      case "FEATURE_DISABLED":
        return {
          title: "Module Temporarily Offline",
          titleNe: "सुविधा हाल बन्द छ",
          desc: `The ${feature || entityType} module is undergoing scheduled maintenance or is currently deactivated.`,
          descNe: `यो मोड्युल हाल मर्मतमा छ वा व्यवस्थापकद्वारा निष्क्रिय गरिएको छ।`
        };
      case "UNAUTHORIZED":
        return {
          title: "Access Restricted",
          titleNe: "पहुँच प्रतिबन्धित",
          desc: "You do not have permission to view this specific destination or editorial review queue.",
          descNe: "यो गन्तव्य हेर्नको लागि तपाईंलाई आवश्यक अनुमति छैन।"
        };
      case "INVALID_TARGET":
        return {
          title: "Invalid Notification Target",
          titleNe: "अमान्य सूचना लिङ्क",
          desc: "The notification payload did not contain a valid destination entity identifier.",
          descNe: "सूचनामा मान्य गन्तव्य पहिचानकर्ता फेला परेन।"
        };
      default:
        return {
          title: "Destination Not Found",
          titleNe: "गन्तव्य फेला परेन",
          desc: `We could not locate the requested ${entityType.replace(/_/g, " ")}. It may have moved or the link expired.`,
          descNe: `अनुरोध गरिएको गन्तव्य फेला पार्न सकिएन।`
        };
    }
  };

  const details = getReasonDetails();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <SEOHead
        title={`${details.title} — SanatanMarga`}
        description="The requested notification target is currently unavailable."
        url="/target-unavailable"
      />
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-12">
        <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded-full text-xs font-mono font-medium mb-3">
            REASON: {reason}
          </span>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">
            {details.title}
          </h1>
          <p className="text-lg font-medium text-amber-600 dark:text-amber-400 mb-4 font-nepali">
            {details.titleNe}
          </p>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mb-2">
            {details.desc}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-6 font-nepali">
            {details.descNe}
          </p>

          {entityId && (
            <div className="bg-slate-100 dark:bg-slate-800/60 rounded-lg p-3 text-xs font-mono text-slate-500 dark:text-slate-400 mb-6 break-all">
              Target Reference: {entityType}:{entityId}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-medium transition shadow-sm"
            >
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </Link>

            <Link
              to="/nepal-hub"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium transition"
            >
              <Compass className="w-4 h-4" />
              <span>Nepal Hub</span>
            </Link>

            <Link
              to="/search"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium transition"
            >
              <Search className="w-4 h-4" />
              <span>Search Library</span>
            </Link>

            <Link
              to="/chautari"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chautari Forum</span>
            </Link>
          </div>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go back to previous page</span>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TargetUnavailablePage;
