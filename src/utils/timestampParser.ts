/**
 * Multi-Lingual Timestamp Parser & Date Normalization Engine
 * Handles Nepali relative dates, Devanagari numerals, Bikram Sambat (BS), 
 * English relative dates, OpenGraph/RSS dates, and ISO timestamps with zero data loss.
 */

export interface ParsedTimestampResult {
  isoString: string;
  ageMinutes: number;
  ageHours: number;
  freshnessScore: number;
  freshnessStatus: 'FRESH' | 'SEMI_FRESH' | 'STALE';
  isParsedSuccessfully: boolean;
  parseMethod: 'nepali_relative' | 'english_relative' | 'bikram_sambat' | 'standard_iso' | 'time_anchor' | 'no_timestamp' | 'fallback_recent';
  originalInput: string;
  rejectionReason?: string;
}

const NEPALI_DIGITS: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

const BS_MONTH_MAP: Record<string, number> = {
  // 0-indexed month offset in standard calendar (approximate mapping)
  'बैशाख': 3, 'वैशाख': 3, 'baisakh': 3,
  'जेठ': 4, 'ज्येष्ठ': 4, 'jestha': 4, 'jeth': 4,
  'असार': 5, 'आषाढ': 5, 'asar': 5, 'ashadh': 5,
  'साउन': 6, 'श्रावण': 6, 'saun': 6, 'shrawan': 6,
  'भदौ': 7, 'भाद्र': 7, 'bhadra': 7, 'bhadau': 7,
  'असोज': 8, 'आश्विन': 8, 'asoj': 8, 'ashwin': 8,
  'कात्तिक': 9, 'कार्तिक': 9, 'kartik': 9, 'kattik': 9,
  'मंसिर': 10, 'मार्ग': 10, 'mangsir': 10, 'marga': 10,
  'पुस': 11, 'पौष': 11, 'poush': 11, 'pus': 11,
  'माघ': 0, 'magh': 0,
  'फागुन': 1, 'फाल्गुन': 1, 'falgun': 1, 'fagun': 1,
  'चैत': 2, 'चैत्र': 2, 'chaitra': 2, 'chait': 2
};

/**
 * Converts all Devanagari numerals in a string to standard Latin numbers
 */
export function convertNepaliDigitsToEnglish(str: string): string {
  if (!str) return "";
  return str.replace(/[०-९]/g, (digit) => NEPALI_DIGITS[digit] || digit);
}

/**
 * Robust, fault-tolerant parser for all Nepali and international news timestamps
 */
export function parseNewsTimestamp(rawInput?: string, referenceTime = new Date()): ParsedTimestampResult {
  const now = referenceTime;
  const nowMs = now.getTime();

  if (!rawInput || typeof rawInput !== "string" || !rawInput.trim()) {
    return {
      isoString: "",
      ageMinutes: 999999,
      ageHours: 999999,
      freshnessScore: 0,
      freshnessStatus: 'STALE',
      isParsedSuccessfully: false,
      parseMethod: 'no_timestamp',
      originalInput: rawInput || "",
      rejectionReason: 'REJECT_NO_VERIFIABLE_PUBLISH_DATE'
    };
  }

  const rawClean = rawInput.trim();
  const normalizedText = convertNepaliDigitsToEnglish(rawClean).toLowerCase();

  let targetDate: Date | null = null;
  let method: ParsedTimestampResult['parseMethod'] = 'standard_iso';

  // 1. Check Nepali relative phrases
  if (
    normalizedText.includes("अगाडि") || 
    normalizedText.includes("अगाडी") || 
    normalizedText.includes("अघि")
  ) {
    method = 'nepali_relative';
    if (normalizedText.includes("मिनेट")) {
      const match = normalizedText.match(/(\d+)\s*मिनेट/);
      targetDate = new Date(nowMs - (match ? parseInt(match[1], 10) : 15) * 60 * 1000);
    } else if (normalizedText.includes("घण्टा") || normalizedText.includes("घन्टा")) {
      const match = normalizedText.match(/(\d+)\s*(घण्टा|घन्टा)/);
      targetDate = new Date(nowMs - (match ? parseInt(match[1], 10) : 2) * 3600 * 1000);
    } else if (normalizedText.includes("दिन")) {
      const match = normalizedText.match(/(\d+)\s*दिन/);
      targetDate = new Date(nowMs - (match ? parseInt(match[1], 10) : 1) * 24 * 3600 * 1000);
    }
  } else if (
    normalizedText.includes("भर्खरै") || 
    normalizedText.includes("भर्खर") ||
    normalizedText.includes("अहिले") ||
    normalizedText.includes("आज") ||
    normalizedText.includes("हिजो")
  ) {
    return {
      isoString: "",
      ageMinutes: 999999,
      ageHours: 999999,
      freshnessScore: 0,
      freshnessStatus: 'STALE',
      isParsedSuccessfully: false,
      parseMethod: 'nepali_relative',
      originalInput: rawClean,
      rejectionReason: 'REJECT_AMBIGUOUS_RELATIVE_TIMESTAMP'
    };
  }

  // 2. Check English relative phrases
  const minuteMatch = normalizedText.match(/(\d+)\s*(minutes?|mins?|m)\s*ago/);
  const hourMatch = normalizedText.match(/(\d+)\s*(hours?|hrs?|h)\s*ago/);
  const dayMatch = normalizedText.match(/(\d+)\s*(days?|d)\s*ago/);

  if (minuteMatch || hourMatch || dayMatch || normalizedText === "just now" || normalizedText === "moments ago") {
    method = 'english_relative';
    if (minuteMatch) targetDate = new Date(nowMs - parseInt(minuteMatch[1], 10) * 60 * 1000);
    else if (hourMatch) targetDate = new Date(nowMs - parseInt(hourMatch[1], 10) * 3600 * 1000);
    else if (dayMatch) targetDate = new Date(nowMs - parseInt(dayMatch[1], 10) * 24 * 3600 * 1000);
    else targetDate = new Date(nowMs - 5 * 60 * 1000);
  } else if (normalizedText === "today" || normalizedText === "yesterday") {
    return {
      isoString: "",
      ageMinutes: 999999,
      ageHours: 999999,
      freshnessScore: 0,
      freshnessStatus: 'STALE',
      isParsedSuccessfully: false,
      parseMethod: 'english_relative',
      originalInput: rawClean,
      rejectionReason: 'REJECT_AMBIGUOUS_RELATIVE_TIMESTAMP'
    };
  }

  // 3. Check Bikram Sambat Date Formats (e.g. "२०८१ भदौ ९" or "2081-05-10" or "२०८३ बैशाख १५")
  if (!targetDate) {
    for (const [nepMonth, monthIndex] of Object.entries(BS_MONTH_MAP)) {
      if (normalizedText.includes(nepMonth)) {
        method = 'bikram_sambat';
        const yearMatch = normalizedText.match(/208\d|207\d|209\d/);
        const dayMatch = normalizedText.match(/\b([1-9]|[12]\d|3[0-2])\b/);

        // Strict: If year is missing in Bikram Sambat date, cannot assume current year
        if (!yearMatch) {
          return {
            isoString: "",
            ageMinutes: 999999,
            ageHours: 999999,
            freshnessScore: 0,
            freshnessStatus: 'STALE',
            isParsedSuccessfully: false,
            parseMethod: 'bikram_sambat',
            originalInput: rawClean,
            rejectionReason: 'REJECT_NO_VERIFIABLE_PUBLISH_DATE'
          };
        }

        const bsYear = parseInt(yearMatch[0], 10);
        const bsDay = dayMatch ? parseInt(dayMatch[1], 10) : 15;
        // BS year is approximately 56-57 years ahead of AD.
        // For Magh(0), Falgun(1), Chaitra(2), the AD year is bsYear - 56.
        // For Baisakh(3) to Poush(11), the AD year is bsYear - 57.
        const approxADYear = monthIndex < 3 ? bsYear - 56 : bsYear - 57;

        targetDate = new Date(approxADYear, monthIndex, bsDay, 12, 0, 0);
        break;
      }
    }
  }

  // 4. Check time-only formats (e.g. "11:45 AM", "११:३०", "14:20")
  if (!targetDate && /^\d{1,2}:\d{2}(\s*(am|pm))?$/i.test(normalizedText)) {
    method = 'time_anchor';
    const timeMatch = normalizedText.match(/(\d{1,2}):(\d{2})(\s*(am|pm))?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const meridian = timeMatch[4] ? timeMatch[4].toLowerCase() : null;
      if (meridian === "pm" && hours < 12) hours += 12;
      if (meridian === "am" && hours === 12) hours = 0;

      targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
      // If time is later than now by > 1 hour, assume it was yesterday
      if (targetDate.getTime() > nowMs + 3600000) {
        targetDate = new Date(targetDate.getTime() - 24 * 3600 * 1000);
      }
    }
  }

  // 5. Standard ISO / RFC / JavaScript Date parsing
  if (!targetDate) {
    const directDate = new Date(rawClean);
    if (!isNaN(directDate.getTime())) {
      targetDate = directDate;
      method = 'standard_iso';
    }
  }

  // If still invalid
  if (!targetDate || isNaN(targetDate.getTime())) {
    return {
      isoString: "",
      ageMinutes: 999999,
      ageHours: 999999,
      freshnessScore: 0,
      freshnessStatus: 'STALE',
      isParsedSuccessfully: false,
      parseMethod: method,
      originalInput: rawClean,
      rejectionReason: 'REJECT_NO_VERIFIABLE_PUBLISH_DATE'
    };
  }

  // Guard against future clock skew (allow max 1 hour drift)
  let finalTimeMs = targetDate.getTime();
  if (finalTimeMs > nowMs + 60 * 60 * 1000) {
    return {
      isoString: targetDate.toISOString(),
      ageMinutes: 0,
      ageHours: 0,
      freshnessScore: 0,
      freshnessStatus: 'STALE',
      isParsedSuccessfully: false,
      parseMethod: method,
      originalInput: rawClean,
      rejectionReason: 'FUTURE_TIMESTAMP_DRIFT'
    };
  } else if (finalTimeMs > nowMs) {
    // Minor clock drift <= 1h clamped to now - 1 min
    finalTimeMs = nowMs - 60 * 1000;
  }

  const ageMs = Math.max(0, nowMs - finalTimeMs);
  const ageMinutes = Math.floor(ageMs / 60000);
  const ageHours = Math.floor(ageMinutes / 60);

  let freshnessScore = 0;
  let freshnessStatus: 'FRESH' | 'SEMI_FRESH' | 'STALE' = 'STALE';
  let rejectionReason: string | undefined = undefined;

  // Strict 72-Hour Editorial Freshness Gate:
  // <= 6 hours: FRESH (90-100)
  // <= 24 hours: FRESH (75-89)
  // <= 72 hours: SEMI_FRESH (40-74)
  // > 72 hours: STALE (0) -> REJECT
  if (ageHours <= 6) {
    freshnessScore = Math.max(90, 100 - Math.floor(ageMinutes / 36));
    freshnessStatus = 'FRESH';
  } else if (ageHours <= 24) {
    freshnessScore = Math.max(75, 89 - Math.floor((ageHours - 6) * 0.75));
    freshnessStatus = 'FRESH';
  } else if (ageHours <= 72) {
    freshnessScore = Math.max(40, 74 - Math.floor((ageHours - 24) * 0.7));
    freshnessStatus = 'SEMI_FRESH';
  } else {
    freshnessScore = 0;
    freshnessStatus = 'STALE';
    rejectionReason = 'STALE_SOURCE_72H';
  }

  return {
    isoString: new Date(finalTimeMs).toISOString(),
    ageMinutes,
    ageHours,
    freshnessScore,
    freshnessStatus,
    isParsedSuccessfully: freshnessStatus !== 'STALE' || !rejectionReason,
    parseMethod: method,
    originalInput: rawClean,
    rejectionReason
  };
}
