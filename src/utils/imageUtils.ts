/**
 * Image normalization utility to prevent malformed or relative image URLs
 */
export function normalizeImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string") {
    return "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200";
  }

  const clean = url.trim();
  if (clean.startsWith("photo-")) {
    return `https://images.unsplash.com/${clean}`;
  }

  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("/") || clean.startsWith("data:")) {
    return clean;
  }

  return `https://images.unsplash.com/${clean}`;
}
