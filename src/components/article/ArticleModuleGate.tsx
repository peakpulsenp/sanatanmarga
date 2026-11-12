import React, { useState, useEffect } from 'react';
import { articleModuleRegistry, ArticleModuleConfig, MembershipTier } from '@/src/services/articleModuleRegistry';
import { useAuth } from '@/src/lib/auth';
import { Lock, Sparkles, ChevronRight, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { featureControlOS } from '@/src/services/featureControlOS';

const MODULE_TO_FEATURE_MAP: Record<string, string> = {
  listenOS: 'article.listen',
  comments: 'article.comments',
  sgisProvenance: 'article.provenance',
  districtImpact: 'article.districtImpact',
  knowledgeGraph: 'article.crossLinks',
  relatedStories: 'article.related',
  ads: 'sidebar.ads',
  newsletter: 'sidebar.newsletter',
  aiSummary: 'ai.summary'
};

interface ArticleModuleGateProps {
  module: keyof ArticleModuleConfig | string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  title?: string;
  description?: string;
}

export default function ArticleModuleGate({
  module,
  children,
  fallback,
  title,
  description
}: ArticleModuleGateProps) {
  const { user } = useAuth();
  const [config, setConfig] = useState<ArticleModuleConfig>(articleModuleRegistry.getConfig());

  useEffect(() => {
    articleModuleRegistry.init();
    const unsubscribe = articleModuleRegistry.subscribe(newConfig => {
      setConfig(newConfig);
    });
    return unsubscribe;
  }, []);

  // 0. Check Feature Control OS governance
  const mappedFeature = MODULE_TO_FEATURE_MAP[String(module)];
  if (mappedFeature && !featureControlOS.isFeatureEnabled(mappedFeature, { role: user?.role })) {
    return fallback ? <>{fallback}</> : null;
  }

  // 1. Is module enabled at the system level?
  const isEnabled = articleModuleRegistry.isModuleEnabled(module);
  if (!isEnabled) {
    return fallback ? <>{fallback}</> : null;
  }

  // 2. Does user have permission for this module tier?
  const hasAccess = articleModuleRegistry.hasAccess(module, user?.role);
  if (hasAccess) {
    return <>{children}</>;
  }

  // 3. If fallback is explicitly provided, render fallback
  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  // 4. Default Premium / Member Locked Callout
  const requiredTier = articleModuleRegistry.getRequiredTier(module);

  return (
    <div className="w-full my-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-card to-primary/10 border border-amber-500/30 shadow-md relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
            {requiredTier === 'premium' ? <Crown size={24} /> : <Lock size={24} />}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                {requiredTier === 'premium' ? "प्रिमियम सुबिधा (Premium)" : "सदस्य सुबिधा (Member Exclusive)"}
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-card-foreground">
              {title || (requiredTier === 'premium' ? "विस्तृत अनुसन्धान तथा विश्लेषण अनलक गर्नुहोस्" : "सदस्यता लगइन आवश्यक छ")}
            </h4>
            <p className="text-xs text-muted-text max-w-lg leading-relaxed">
              {description || (requiredTier === 'premium'
                ? "सनातनमार्ग प्रिमियम सदस्यतामार्फत गहिरो सन्दर्भ, ज्ञानकोष र विस्तृत प्रतिवेदनहरू अध्ययन गर्नुहोस्।"
                : "यस खण्डको पूर्ण पहुँचको लागि कृपया सनातनमार्ग सदस्यतामा निःशुल्क दर्ता गर्नुहोस्।")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {user ? (
            <Link
              to="/settings"
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20"
            >
              <Sparkles size={14} />
              <span>अपग्रेड गर्नुहोस्</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20"
            >
              <Lock size={14} />
              <span>लगइन / दर्ता</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
