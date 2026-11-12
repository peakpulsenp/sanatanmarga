import type { Article } from "@/src/types";

export interface PublicArticleDto {
  id: string;
  slug?: string;
  canonicalUrl: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  content: string;
  categoryId: string;
  categorySlug?: string;
  categoryName?: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  authorPhoto?: string;
  publishedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  featuredImage?: string;
  heroAlt?: string;
  status: string;
  isBreaking?: boolean;
  isFeatured?: boolean;
  isSponsored?: boolean;
  sponsorName?: string;
  sponsorLogo?: string;
  sponsorUrl?: string;
  videoUrl?: string;
  views: number;
  tags?: string[];
  districts?: string[];
  language?: string;
  correctionState?: {
    isCorrected: boolean;
    correctedAt?: string;
    correctionNote?: string;
  };
  provenance?: {
    verified: boolean;
    verifiedAt?: string;
    verifiedBy?: string;
  };
  sources?: (string | { name?: string; title?: string; url?: string; publisher?: string })[];
  sourcePublishers?: string[];
  sourceUrls?: string[];
  title_en?: string;
  excerpt_en?: string;
  content_en?: string;
}

const PUBLIC_ALLOWED_STATUSES = new Set(["published", "live", "approved"]);

/**
 * Checks whether an article record has public publication status.
 * Rejects drafts, scheduled, under_review, rejected, retracted, and deleted records.
 */
export function isArticlePubliclyVisible(article: any): boolean {
  if (!article || !article.id) return false;
  if (article.deleted === true) return false;

  const status = String(article.status || "").toLowerCase().trim();
  if (!PUBLIC_ALLOWED_STATUSES.has(status)) return false;

  const editorialStatus = String(article.editorialStatus || "").toLowerCase().trim();
  if (editorialStatus === "retracted" || editorialStatus === "rejected") return false;

  // Scheduled future publishing check: if publishAt is in future (> 5 mins grace), not visible yet
  if (article.publishAt) {
    const pubTime = new Date(article.publishAt).getTime();
    if (!isNaN(pubTime) && pubTime > Date.now() + 5 * 60 * 1000) {
      return false;
    }
  }

  return true;
}

/**
 * Formats a single canonical article URL.
 */
export function getCanonicalArticleUrl(articleOrId: any): string {
  const id = typeof articleOrId === "string" ? articleOrId : articleOrId?.id || "";
  return `/article/${id}`;
}

/**
 * Sanitizes and projects an internal Article model into a pristine PublicArticleDto.
 * Strips out all internal AI generation prompts, raw candidate stats,
 * internal hallucination scores, unpublished workflow notes, and secrets.
 */
export function toPublicArticleDto(article: any): PublicArticleDto | null {
  if (!article || !article.id) return null;
  if (!isArticlePubliclyVisible(article)) return null;

  const canonicalUrl = getCanonicalArticleUrl(article);

  const dto: PublicArticleDto = {
    id: String(article.id),
    slug: article.slug || undefined,
    canonicalUrl,
    title: String(article.title || ""),
    subtitle: article.subtitle || article.editorialHeadline || undefined,
    excerpt: article.excerpt || (article.content ? article.content.replace(/<[^>]*>/g, '').slice(0, 160) : ""),
    content: String(article.content || ""),
    categoryId: String(article.categoryId || ""),
    categorySlug: article.categorySlug || undefined,
    categoryName: article.categoryName || undefined,
    authorId: String(article.authorId || article.author || "sanatan_newsroom"),
    authorName: String(article.authorName || article.author || "सम्पादकीय डेस्क (Editorial Desk)"),
    authorRole: article.authorRole || undefined,
    authorPhoto: article.authorPhoto || article.authorAvatar || undefined,
    publishedAt: article.canonicalPublishedAt || article.publishedAt || article.createdAt || undefined,
    updatedAt: article.updatedAt || article.modifiedAt || undefined,
    createdAt: article.createdAt || undefined,
    featuredImage: article.featuredImage || article.imageUrl || undefined,
    heroAlt: article.heroAlt || article.title || undefined,
    status: "published",
    isBreaking: Boolean(article.isBreaking),
    isFeatured: Boolean(article.isFeatured),
    isSponsored: Boolean(article.isSponsored),
    sponsorName: article.sponsorName || undefined,
    sponsorLogo: article.sponsorLogo || undefined,
    sponsorUrl: article.sponsorUrl || undefined,
    videoUrl: article.videoUrl || undefined,
    views: typeof article.views === "number" ? article.views : 0,
    tags: Array.isArray(article.tags) ? article.tags : [],
    districts: Array.isArray(article.districts) ? article.districts : [],
    language: article.language || "ne",
    title_en: article.title_en || article.titleEn || undefined,
    excerpt_en: article.excerpt_en || article.excerptEn || undefined,
    content_en: article.content_en || article.contentEn || undefined,
    sourcePublishers: Array.isArray(article.sourcePublishers) ? article.sourcePublishers : undefined,
    sourceUrls: Array.isArray(article.sourceUrls) ? article.sourceUrls : undefined,
    sources: Array.isArray(article.sources) ? article.sources : undefined,
  };

  if (article.provenance) {
    dto.provenance = {
      verified: Boolean(article.provenance.verified),
      verifiedAt: article.provenance.verifiedAt || article.publishedAt || article.createdAt,
      verifiedBy: article.provenance.verifiedBy || "सनातनमार्ग तथ्य जाँच डेस्क",
    };
  }

  if (article.isCorrected || article.correctionState || article.correctionNote) {
    dto.correctionState = {
      isCorrected: true,
      correctedAt: article.correctedAt || article.updatedAt,
      correctionNote: article.correctionNote || (article.correctionState && article.correctionState.correctionNote) || undefined
    };
  }

  return dto;
}
