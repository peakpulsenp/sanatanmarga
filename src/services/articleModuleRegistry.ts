import { db, doc, getDoc, setDoc } from '@/src/lib/firebase';

export type MembershipTier = 'free' | 'member' | 'premium';

export interface ArticleModuleConfig {
  shareTools: boolean;
  reactions: boolean;
  comments: boolean;
  relatedStories: boolean;
  sgisProvenance: boolean;
  districtImpact: boolean;
  knowledgeGraph: boolean;
  listenOS: boolean;
  newsletter: boolean;
  aiSummary: boolean;
  transparencyDrawer: boolean;
  authorCard: boolean;
  readingMode: boolean;
  ads: boolean;
  recommendedContent: boolean;
  intelligenceRail: boolean;
  academy_video_ads: boolean;
  academy_sponsor_overlay: boolean;
  academy_sponsor_card: boolean;
  academy_ad_free: boolean;
}

export const DEFAULT_MODULE_CONFIG: ArticleModuleConfig = {
  shareTools: true,
  reactions: true,
  comments: true,
  relatedStories: true,
  sgisProvenance: true,
  districtImpact: true,
  knowledgeGraph: true,
  listenOS: true,
  newsletter: true,
  aiSummary: true,
  transparencyDrawer: true,
  authorCard: true,
  readingMode: true,
  ads: true,
  recommendedContent: true,
  intelligenceRail: true,
  academy_video_ads: true,
  academy_sponsor_overlay: true,
  academy_sponsor_card: true,
  academy_ad_free: true,
};

export const DEFAULT_TIER_RULES: Record<keyof ArticleModuleConfig, MembershipTier> = {
  shareTools: 'free',
  reactions: 'free',
  comments: 'free',
  relatedStories: 'free',
  newsletter: 'free',
  listenOS: 'free',
  sgisProvenance: 'free',
  districtImpact: 'free',
  transparencyDrawer: 'free',
  knowledgeGraph: 'free',
  authorCard: 'free',
  readingMode: 'free',
  ads: 'free',
  recommendedContent: 'free',
  aiSummary: 'member',
  intelligenceRail: 'premium',
  academy_video_ads: 'free',
  academy_sponsor_overlay: 'free',
  academy_sponsor_card: 'free',
  academy_ad_free: 'premium',
};

// Key alias normalization map for user flexibility
const MODULE_ALIAS_MAP: Record<string, keyof ArticleModuleConfig> = {
  share_toolbar: 'shareTools',
  listen_os: 'listenOS',
  sgis_provenance: 'sgisProvenance',
  district_intelligence: 'districtImpact',
  district_impact: 'districtImpact',
  author_card: 'authorCard',
  source_transparency: 'transparencyDrawer',
  reading_mode: 'readingMode',
  related_stories: 'relatedStories',
  recommended_content: 'recommendedContent',
  intelligence_rail: 'intelligenceRail',
};

function normalizeModuleName(name: string): keyof ArticleModuleConfig {
  if (MODULE_ALIAS_MAP[name]) return MODULE_ALIAS_MAP[name];
  return name as keyof ArticleModuleConfig;
}

class ArticleModuleRegistry {
  private config: ArticleModuleConfig = { ...DEFAULT_MODULE_CONFIG };
  private tierRules: Record<keyof ArticleModuleConfig, MembershipTier> = { ...DEFAULT_TIER_RULES };
  private listeners: Set<(config: ArticleModuleConfig) => void> = new Set();
  private initialized = false;

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('sanatan_article_module_config');
      if (stored) {
        this.config = { ...DEFAULT_MODULE_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn("Failed to load module config from local storage", e);
    }
  }

  public async init() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const docRef = doc(db, 'settings', 'articleModules');
      const docSnap = await getDoc(docRef).catch(() => null);
      if (docSnap && docSnap.exists()) {
        const data = docSnap.data();
        this.config = { ...DEFAULT_MODULE_CONFIG, ...(data.modules || {}) };
        if (data.tierRules) {
          this.tierRules = { ...DEFAULT_TIER_RULES, ...data.tierRules };
        }
        localStorage.setItem('sanatan_article_module_config', JSON.stringify(this.config));
        this.notify();
      }
    } catch (err) {
      console.warn("[ArticleModuleRegistry] Using default or cached module configs", err);
    }
  }

  public getConfig(): ArticleModuleConfig {
    return { ...this.config };
  }

  public isModuleEnabled(moduleName: string): boolean {
    const canonicalKey = normalizeModuleName(moduleName);
    return this.config[canonicalKey] !== false;
  }

  public getRequiredTier(moduleName: string): MembershipTier {
    const canonicalKey = normalizeModuleName(moduleName);
    return this.tierRules[canonicalKey] || 'free';
  }

  public hasAccess(moduleName: string, userRoleOrTier?: string): boolean {
    const canonicalKey = normalizeModuleName(moduleName);
    if (!this.isModuleEnabled(canonicalKey)) return false;

    // Super admin & admin always have full access
    if (userRoleOrTier === 'admin' || userRoleOrTier === 'super_admin' || userRoleOrTier === 'editor') return true;

    const required = this.getRequiredTier(canonicalKey);
    if (required === 'free') return true;

    const currentTier: MembershipTier = 
      userRoleOrTier === 'premium' ? 'premium' :
      (userRoleOrTier === 'member' || userRoleOrTier === 'user') ? 'member' : 'free';

    if (required === 'member') {
      return currentTier === 'member' || currentTier === 'premium';
    }
    if (required === 'premium') {
      return currentTier === 'premium';
    }
    return true;
  }

  public async updateModuleConfig(newConfig: Partial<ArticleModuleConfig>) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('sanatan_article_module_config', JSON.stringify(this.config));
    this.notify();

    try {
      const docRef = doc(db, 'settings', 'articleModules');
      await setDoc(docRef, { 
        modules: this.config,
        tierRules: this.tierRules,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn("Failed to persist module config to Firestore", e);
    }
  }

  public subscribe(cb: (config: ArticleModuleConfig) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.config));
  }
}

export const articleModuleRegistry = new ArticleModuleRegistry();
