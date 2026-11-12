import { getArticlePublicationTimestamp } from "./dateEngine";

/**
 * Canonical Publication Helper for Sanatan Marga News OS
 * Guarantees strict publication status compliance across all public surfaces.
 */
export function isPubliclyPublishedArticle(article: any): boolean {
  if (!article || typeof article !== "object") return false;

  // Never public if soft-deleted, archived, or marked deleted
  if (article.deleted || article.isDeleted || article.archived) {
    return false;
  }

  // Never public if marked ad, sponsored, or raw position placeholder
  if (article.isAd || article.isSponsored || article.position) {
    return false;
  }

  const status = String(article.status || "").toLowerCase().trim();

  // Explicitly forbidden non-public statuses
  const forbiddenStatuses = new Set([
    "draft",
    "pending",
    "pending_review",
    "review",
    "under_review",
    "rejected",
    "deleted",
    "trash",
    "archived",
    "unpublished",
    "drafted",
    "scheduled_future"
  ]);

  if (forbiddenStatuses.has(status)) {
    return false;
  }

  // Permitted public statuses
  const validPublishedStatuses = new Set([
    "published",
    "approved",
    "active",
    "restored",
    "recovered",
    "reviewed",
    "editor-approved",
    "live",
    "published_now"
  ]);

  const isStatusValid = !status || validPublishedStatuses.has(status);
  if (!isStatusValid) return false;

  // Must have a valid publication timestamp
  const timestamp = getArticlePublicationTimestamp(article);
  if (timestamp <= 0) return false;

  // Exclude scheduled future publication dates
  if (timestamp > Date.now() + 60000) {
    return false; // Future scheduled story
  }

  return true;
}

/**
 * Canonical Publication Helper for SGIS Manuscripts
 * Guarantees strict publication status compliance across all public surfaces.
 */
export function isPubliclyPublishedManuscript(manuscript: any): boolean {
  if (!manuscript || typeof manuscript !== "object") return false;

  // Never public if soft-deleted or archived
  if (manuscript.deleted || manuscript.isDeleted || manuscript.archived) {
    return false;
  }

  // Must be published to library
  if (!manuscript.isPublishedToLibrary) {
    return false;
  }

  // Must be scholar-verified or approved canonical text
  const validationStatus = String(manuscript.scholarValidationStatus || "").toLowerCase();
  const isVerified = 
    validationStatus === "editor_approved" || 
    validationStatus === "canonical_text" || 
    manuscript.lifecycleStatus === "VERIFIED" || 
    manuscript.lifecycleStatus === "LIBRARY_PUBLISHED" || 
    manuscript.lifecycleStatus === "RAG_INDEXED";

  if (!isVerified) {
    return false;
  }

  // Must have canonical original text
  if (!manuscript.originalText || manuscript.originalText.trim().length < 5) {
    return false;
  }

  return true;
}

/**
 * Filters an array of articles to return only canonical publicly published articles,
 * sorted by publication timestamp descending.
 */
export function filterPublicArticles(articles: any[]): any[] {
  if (!Array.isArray(articles)) return [];
  return articles
    .filter(isPubliclyPublishedArticle)
    .sort((a, b) => getArticlePublicationTimestamp(b) - getArticlePublicationTimestamp(a));
}

/**
 * Filters an array of manuscripts to return only canonical publicly published items.
 */
export function filterPublicManuscripts(manuscripts: any[]): any[] {
  if (!Array.isArray(manuscripts)) return [];
  return manuscripts.filter(isPubliclyPublishedManuscript);
}
