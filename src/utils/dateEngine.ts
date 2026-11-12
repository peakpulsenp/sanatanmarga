/**
 * Dynamic Date Engine & Freshness Score Engine for Sanatan Marga News OS v4.0
 * Eliminates all hardcoded years (e.g., 2026, 2083) and handles dynamic BS/AD conversion.
 */

/**
 * Dynamic Date Engine & Freshness Score Engine for Sanatan Marga News OS v4.0
 * Eliminates all hardcoded years (e.g., 2026, 2083) and handles dynamic BS/AD conversion.
 * Strictly respects Asia/Kathmandu (UTC+5:45) calendar day boundaries.
 */

// Nepal timezone offset: +5 hours and 45 minutes = 345 minutes
export const NEPAL_TZ_OFFSET_MINUTES = 345;
export const NEPAL_TZ_OFFSET_MS = NEPAL_TZ_OFFSET_MINUTES * 60 * 1000;

/**
 * Gets a Date object representing the current time shifted into Nepal timezone representation
 */
export function getNepalDate(date: Date = new Date()): Date {
  const utcMs = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);
  return new Date(utcMs + NEPAL_TZ_OFFSET_MS);
}

/**
 * Returns YYYY-MM-DD string for a given date in Asia/Kathmandu timezone
 */
export function getNepalCalendarDateString(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const npDate = getNepalDate(d);
  const year = npDate.getFullYear();
  const month = String(npDate.getMonth() + 1).padStart(2, "0");
  const day = String(npDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Checks if two dates fall on the same calendar day in Asia/Kathmandu timezone
 */
export function isSameNepalCalendarDay(date1: Date | string, date2: Date | string = new Date()): boolean {
  const str1 = getNepalCalendarDateString(date1);
  const str2 = getNepalCalendarDateString(date2);
  return Boolean(str1 && str2 && str1 === str2);
}

/**
 * Gets the start and end Date (in UTC) corresponding to the Nepal calendar day of the reference time
 */
export function getNepalCalendarDayRange(referenceTime: Date = new Date()): { start: Date; end: Date } {
  const npNow = getNepalDate(referenceTime);
  
  // Construct 00:00:00.000 in Nepal time
  const npStartYear = npNow.getFullYear();
  const npStartMonth = npNow.getMonth();
  const npStartDate = npNow.getDate();

  // Convert Nepal midnight back to UTC Date
  // Nepal time is UTC + 5:45 => UTC = Nepal time - 5:45
  const utcStartMs = Date.UTC(npStartYear, npStartMonth, npStartDate, 0, 0, 0) - NEPAL_TZ_OFFSET_MS;
  const utcEndMs = utcStartMs + (24 * 60 * 60 * 1000) - 1;

  return {
    start: new Date(utcStartMs),
    end: new Date(utcEndMs)
  };
}

export function getCurrentBSYear(date = new Date()): number {
  const npDate = getNepalDate(date);
  const adYear = npDate.getFullYear();
  const adMonth = npDate.getMonth(); // 0 = Jan, 3 = Apr
  const adDay = npDate.getDate();
  
  // Bikram Sambat New Year (1st Baisakh) typically starts around April 13-14
  if (adMonth > 3 || (adMonth === 3 && adDay >= 14)) {
    return adYear + 57;
  }
  return adYear + 56;
}

export function getDynamicDateContext() {
  const now = new Date();
  const currentADDate = now.toISOString();
  const currentYear = now.getFullYear();
  const currentBSYear = getCurrentBSYear(now);
  const nepalDateString = getNepalCalendarDateString(now);
  return { now, currentADDate, currentYear, currentBSYear, nepalDateString };
}

/**
 * Deterministic Freshness Score Engine
 * @param hoursOld Age of story in hours
 * @returns Score from 0 to 100
 */
export function calculateFreshness(hoursOld: number): number {
  if (isNaN(hoursOld) || hoursOld < 0) return 95; // Default fresh fallback
  if (hoursOld < 3) return 100;
  if (hoursOld < 6) return 95;
  if (hoursOld < 12) return 90;
  if (hoursOld < 24) return 85;
  if (hoursOld < 48) return 70;
  return 0;
}

/**
 * SHA256 Hashing Utility via Web Crypto API with fallback
 */
export async function computeSHA256(text: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }
  
  // Fallback simple hash for non-crypto environments
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}`;
}

/**
 * Canonical Publication Timestamp Extractor (SanatanMarga Rule)
 * Determines the true publication recency for news ordering.
 * Prefers publication semantics (publishedAt) over arbitrary updatedAt.
 * Gracefully parses Firestore Timestamps, ISO strings, and UNIX epoch numbers.
 */
export function getArticlePublicationTimestamp(article: any): number {
  if (!article) return 0;
  const pub = article.publishedAt || article.canonicalPublishedAt;
  if (pub) {
    if (typeof pub === 'number') return isNaN(pub) ? 0 : pub;
    if (typeof pub.toMillis === 'function') return pub.toMillis();
    if (typeof pub.seconds === 'number') return pub.seconds * 1000;
    const ms = new Date(pub).getTime();
    if (!isNaN(ms)) return ms;
  }
  const created = article.createdAt;
  if (created) {
    if (typeof created === 'number') return isNaN(created) ? 0 : created;
    if (typeof created.toMillis === 'function') return created.toMillis();
    if (typeof created.seconds === 'number') return created.seconds * 1000;
    const ms = new Date(created).getTime();
    if (!isNaN(ms)) return ms;
  }
  return 0;
}


