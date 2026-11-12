import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  X, 
  Archive, 
  BookOpen, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Download, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Share2, 
  Scroll, 
  History,
  Layers,
  Info
} from "lucide-react";
import { 
  ArchiveRecord, 
  resolveArchiveDate 
} from "@/src/services/archive/archiveTypes";
import { 
  ArchiveKnowledgeResolver, 
  ResolvedKnowledgeLink 
} from "@/src/services/archive/archiveKnowledgeResolver";
import { 
  ArchiveArticleResolver, 
  ResolvedArticleLink 
} from "@/src/services/archive/archiveArticleResolver";
import { DataTruthBadge } from "@/src/components/common/DataTruthBadge";
import { useLanguage } from "@/src/context/LanguageContext";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

export interface ArchiveDetailModalProps {
  record: ArchiveRecord | null;
  onClose: () => void;
}

export default function ArchiveDetailModal({ record, onClose }: ArchiveDetailModalProps) {
  const { language } = useLanguage();
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [resolvedKnowledge, setResolvedKnowledge] = useState<ResolvedKnowledgeLink[]>([]);
  const [resolvedArticles, setResolvedArticles] = useState<ResolvedArticleLink[]>([]);
  const [loadingRelationships, setLoadingRelationships] = useState(false);

  useEffect(() => {
    if (!record) return;

    let isMounted = true;
    setLoadingRelationships(true);

    const resolveLinks = async () => {
      try {
        const [kLinks, aLinks] = await Promise.all([
          ArchiveKnowledgeResolver.resolveKnowledgeIds(record.connectedKnowledgeNodeIds),
          ArchiveArticleResolver.resolveArticleIds(record.relatedArticleIds)
        ]);
        if (isMounted) {
          setResolvedKnowledge(kLinks);
          setResolvedArticles(aLinks);
        }
      } catch (e) {
        console.warn("[ArchiveDetailModal] Link resolution error:", e);
      } finally {
        if (isMounted) setLoadingRelationships(false);
      }
    };

    resolveLinks();

    return () => {
      isMounted = false;
    };
  }, [record?.id]);

  if (!record) return null;

  const dateInfo = resolveArchiveDate(record);

  const handleCopyOcr = () => {
    if (record.ocrText) {
      navigator.clipboard.writeText(record.ocrText);
      setCopiedText(true);
      toast.success("OCR पाठ क्लिपबोर्डमा कपी भयो!");
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handleSharePermalink = () => {
    const url = `${window.location.origin}/archives/${record.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("अभिलेखको स्थायी लिङ्क कपी भयो!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const hasValidDocumentUrl = Boolean(
    record.documentUrl && 
    (record.documentUrl.startsWith("http://") || record.documentUrl.startsWith("https://"))
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-card border border-border-theme rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 relative"
      >
        {/* Header with Title and Close */}
        <div className="flex items-start justify-between gap-4 border-b border-border-theme pb-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider border border-amber-500/20">
                {dateInfo.displayYearNp}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-muted-area text-muted-text text-xs font-bold uppercase">
                {record.era} काल • {record.category}
              </span>
              {record.sgisRecordId && (
                <Link
                  to={`/knowledge?tab=sgis&record=${record.sgisRecordId}`}
                  className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-black border border-purple-500/20 hover:underline flex items-center gap-1"
                >
                  <Scroll size={12} />
                  <span>SGIS पाण्डुलिपि</span>
                </Link>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-black font-display text-foreground">
              {language === "en" ? record.title : record.titleNepali}
            </h2>

            <p className="text-xs text-muted-text font-mono">
              {record.title}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSharePermalink}
              className="p-2 rounded-full hover:bg-muted text-muted-text hover:text-foreground cursor-pointer transition-colors"
              title="स्थायी लिङ्क कपी गर्नुहोस्"
            >
              {copiedLink ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted text-muted-text hover:text-foreground cursor-pointer transition-colors"
              title="बन्द गर्नुहोस्"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Data Truth and Provenance Section */}
        <div className="bg-muted-area/40 border border-border-theme rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-muted-text uppercase tracking-wider">
                सत्यता तथा अभिलेखीय प्रमाण (Archival Provenance)
              </span>
              <p className="text-xs text-foreground font-bold flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>{record.sourceTitle || "राष्ट्रिय अभिलेखालय (National Archives of Nepal)"}</span>
              </p>
            </div>

            <DataTruthBadge
              status="verified"
              provenance="VERIFIED OFFICIAL SOURCE"
              timestamp={record.verifiedAt || record.createdAt}
              sourceName={record.verifiedBy || "Sanatan Knowledge Council"}
              size="sm"
            />
          </div>

          {record.sourceUrls && record.sourceUrls.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-theme/60 text-xs">
              <span className="text-muted-text text-[11px]">स्रोत सन्दर्भ:</span>
              {record.sourceUrls.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline text-[11px] font-bold"
                >
                  <span>{new URL(url).hostname}</span>
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Description & Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-foreground uppercase tracking-wide">
            दस्तावेजको ऐतिहासिक पृष्ठभूमि तथा विवरण
          </h3>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {record.description || (language === "en" ? record.summary : record.summaryNepali)}
          </p>
        </div>

        {/* Document Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-card border border-border-theme rounded-2xl p-4 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-muted-text uppercase">स्थान (Location)</span>
            <p className="font-bold text-foreground">{record.location || "काठमाडौँ, नेपाल"}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-muted-text uppercase">जिल्ला / प्रदेश</span>
            <p className="font-bold text-foreground">{record.district || "काठमाडौँ"}, {record.province || "बागमती"}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-muted-text uppercase">पृष्ठ सङ्ख्या (Pages)</span>
            <p className="font-bold text-foreground">{record.pageCount ? `${record.pageCount} पृष्ठ` : "१ पृष्ठ (अभिलेख)"}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-muted-text uppercase">OCR विश्वसनीयता</span>
            <p className="font-bold text-emerald-600 dark:text-emerald-400">
              {record.ocrConfidence ? `${Math.round(record.ocrConfidence * 100)}%` : "प्रमाणित"}
            </p>
          </div>
        </div>

        {/* Genuine Document Viewer or Safe Fallback */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              <span>मूल डिजिटल दस्तावेज पूर्वावलोकन (Document Preview)</span>
            </h3>

            {hasValidDocumentUrl && (
              <a
                href={record.documentUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download size={12} />
                <span>दस्तावेज डाउनलोड (Download)</span>
              </a>
            )}
          </div>

          {hasValidDocumentUrl ? (
            <div className="border border-border-theme rounded-2xl overflow-hidden bg-muted-area/50 p-2 flex items-center justify-center min-h-[260px] max-h-[420px]">
              <img
                src={record.documentUrl}
                alt={record.title}
                className="max-h-[400px] w-auto object-contain rounded-xl shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-muted-area/30 border border-dashed border-border-theme text-center space-y-2">
              <Info size={24} className="mx-auto text-muted-text" />
              <p className="text-xs font-bold text-foreground">
                मूल डिजिटल दस्तावेज सार्वजनिक रूपमा उपलब्ध छैन।
              </p>
              <p className="text-[11px] text-muted-text max-w-md mx-auto">
                यो अभिलेख राष्ट्रिय अभिलेखालयको सुरक्षा संरक्षण सूचीमा छ। शोधकर्ताहरूले आधिकारिक अनुमति लिएर अभिलेखालयमा अध्ययन गर्न सक्नुहुन्छ।
              </p>
            </div>
          )}
        </div>

        {/* OCR Extracted Text Section */}
        {record.ocrText && (
          <div className="space-y-2 bg-muted-area/30 border border-border-theme rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-card-foreground flex items-center gap-1.5">
                <Scroll size={14} className="text-amber-500" />
                <span>अनुक्रमित मूल पाठ (Sanskrit/Nepali OCR Transcript)</span>
              </span>

              <button
                onClick={handleCopyOcr}
                className="px-2.5 py-1 rounded-lg bg-card border border-border-theme text-muted-text hover:text-foreground text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedText ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span>{copiedText ? "कपी भयो" : "पाठ कपी"}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border-theme font-mono text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
              {record.ocrText}
            </div>
          </div>
        )}

        {/* Connected Ecosystem Sections */}
        <div className="space-y-4 pt-2 border-t border-border-theme">
          <h3 className="text-xs font-black text-muted-text uppercase tracking-wider">
            सम्बन्धित ज्ञान तथा समयरेखा कडीहरू (Connected Knowledge & Timeline)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Knowledge Nodes */}
            <div className="bg-card border border-border-theme rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" />
                <span>नागरिक ज्ञानकोष (Knowledge OS Nodes)</span>
              </span>

              {resolvedKnowledge.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {resolvedKnowledge.map(k => (
                    <Link
                      key={k.id}
                      to={k.route}
                      className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold transition-all inline-flex items-center gap-1"
                    >
                      <span>{k.nameNepali}</span>
                      <ExternalLink size={10} />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-text">कुनै प्रत्यक्ष ज्ञानकोष नोड जोडिएको छैन।</p>
              )}
            </div>

            {/* Timeline Milestones */}
            <div className="bg-card border border-border-theme rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <History size={14} className="text-amber-500" />
                <span>ऐतिहासिक समयरेखा (Timeline Milestones)</span>
              </span>

              {record.relatedTimelineEventIds && record.relatedTimelineEventIds.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {record.relatedTimelineEventIds.map(tId => (
                    <Link
                      key={tId}
                      to={`/timeline?event=${tId}`}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-white text-xs font-bold transition-all inline-flex items-center gap-1"
                    >
                      <span>समयरेखा घटना: {tId.replace("evt_", "").replace(/_/g, " ")}</span>
                      <ExternalLink size={10} />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-text">समयरेखामा छुट्टै घटना सूचीकृत छैन।</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
