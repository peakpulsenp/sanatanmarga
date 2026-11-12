import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toSafeDate(date: any): Date {
  if (!date) return new Date();
  // Handle Firestore Timestamp
  if (typeof date.toDate === 'function') {
    try { return date.toDate(); } catch (e) {}
  }
  // Handle seconds/nanoseconds object (Firestore plain objects / admin DB)
  if (date.seconds !== undefined) {
    return new Date(date.seconds * 1000);
  }
  if (date._seconds !== undefined) {
    return new Date(date._seconds * 1000);
  }
  if (typeof date === 'string') {
    // WebKit Safari fix: normalize "YYYY-MM-DD HH:MM:SS" to standard ISO "YYYY-MM-DDTHH:MM:SS"
    const normalized = date.trim().replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}(?::\d{2})?)/, '$1T$2');
    const parsed = new Date(normalized);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function parseTimestamp(date: any): number {
  if (!date) return 0;
  if (typeof date === 'number') return date;
  if (typeof date === 'string') {
    // WebKit Safari fix: normalize space to T for reliable ISO 8601 parsing
    const normalized = date.trim().replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}(?::\d{2})?)/, '$1T$2');
    const time = Date.parse(normalized);
    return isNaN(time) ? 0 : time;
  }
  if (typeof date === 'object') {
    if (typeof date.toDate === 'function') {
      try { return date.toDate().getTime(); } catch (e) {}
    }
    if (typeof date.seconds === 'number') {
      return date.seconds * 1000;
    }
    if (typeof date._seconds === 'number') {
      return date._seconds * 1000;
    }
    if (date instanceof Date) {
      return date.getTime();
    }
  }
  const time = new Date(date).getTime();
  return isNaN(time) ? 0 : time;
}

export function formatDate(date: any, lang: string = "ne") {
  try {
    const locale = lang === "en" ? "en-US" : "ne-NP";
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(toSafeDate(date));
  } catch (e) {
    return lang === "en" ? "Unknown Date" : "अज्ञात मिति";
  }
}

export function getCategoryColor(categoryId: string) {
  const colors: Record<string, string> = {
    politics: "bg-blue-600",
    desh: "bg-red-600",
    pradesh: "bg-green-600",
    bishwo: "bg-indigo-600",
    sports: "bg-orange-600",
    entertainment: "bg-pink-600",
    economy: "bg-emerald-600",
    tech: "bg-slate-800",
    health: "bg-cyan-600",
    education: "bg-amber-600",
    opinion: "bg-violet-600",
    interview: "bg-rose-600",
    literature: "bg-yellow-600",
    video: "bg-red-700",
  };
  return colors[categoryId] || "bg-primary";
}

export function toNepaliDigits(num: number | string): string {
  const nepaliDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(num).replace(/[0-9]/g, (w) => nepaliDigits[parseInt(w, 10)] || w);
}

export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(m => m.toLowerCase()) : [];
}

/**
 * Canonical text search normalizer.
 * Safely converts unknown values to normalized lowercase searchable string.
 * Never throws on null, undefined, or unexpected shapes.
 */
export function normalizeSearchText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim().toLowerCase();
  if (typeof value === "number" || typeof value === "boolean") return String(value).toLowerCase();
  return "";
}
