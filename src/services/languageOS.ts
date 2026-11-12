/**
 * SANATANMARGA 5.0 BETA — PHASE 3D
 * Client Language & Translation OS 5.0
 * 
 * Local-first, offline-capable Roman Nepali input transliteration,
 * protected token detection, mixed-script safety, and scholarly Sanskrit/IAST conversion.
 */

import {
  CanonicalLanguageCode,
  CANONICAL_LANGUAGES,
  LanguageDefinition,
  RomanNepaliMode,
  ProtectedTokenType,
  ProtectedTokenMatch,
  TransliterationCandidate,
  ScholarlyTransliterationResult,
  TranslationRecord,
  LanguageProvenance
} from "../types/language";

// --- CANONICAL ROMAN NEPALI TRANSLITERATION DICTIONARY & RULES ---
const VOWELS: Record<string, string> = {
  a: "अ",
  aa: "आ",
  A: "आ",
  i: "इ",
  ee: "ई",
  I: "ई",
  u: "उ",
  oo: "ऊ",
  U: "ऊ",
  e: "ए",
  ai: "ऐ",
  o: "ओ",
  au: "औ",
  am: "अं",
  ah: "अः",
  ri: "ऋ"
};

const VOWEL_MATRAS: Record<string, string> = {
  a: "",
  aa: "ा",
  A: "ा",
  i: "ि",
  ee: "ी",
  I: "ी",
  u: "ु",
  oo: "ू",
  U: "ू",
  e: "े",
  ai: "ै",
  o: "ो",
  au: "ौ",
  am: "ं",
  ah: "ः",
  ri: "ृ"
};

const CONSONANTS: Record<string, string> = {
  k: "क्",
  kh: "ख्",
  g: "ग्",
  gh: "घ्",
  ng: "ङ्",
  ch: "च्",
  chh: "छ्",
  j: "ज्",
  jh: "झ्",
  yn: "ञ्",
  t: "त्",
  th: "थ्",
  d: "द्",
  dh: "ध्",
  n: "न्",
  T: "ट्",
  Th: "ठ्",
  D: "ड्",
  Dh: "ढ्",
  N: "ण्",
  p: "प्",
  ph: "फ्",
  f: "फ्",
  b: "ब्",
  bh: "भ्",
  m: "म्",
  y: "य्",
  r: "र्",
  l: "ल्",
  v: "व्",
  w: "व्",
  sh: "श्",
  Sh: "ष्",
  s: "स्",
  h: "ह्",
  ksh: "क्ष्",
  tra: "त्र्",
  gy: "ज्ञ्",
  gya: "ज्ञ"
};

const NUMERALS: Record<string, string> = {
  "0": "०",
  "1": "१",
  "2": "२",
  "3": "३",
  "4": "४",
  "5": "५",
  "6": "६",
  "7": "७",
  "8": "८",
  "9": "९"
};

const PUNCTUATION: Record<string, string> = {
  "|": "।",
  "||": "॥"
};

// Common word dictionary for instant precision transliteration
const COMMON_WORD_DICTIONARY: Record<string, string> = {
  namaste: "नमस्ते",
  nepal: "नेपाल",
  nepali: "नेपाली",
  kathmandu: "काठमाडौं",
  sagar: "सागर",
  mero: "मेरो",
  naam: "नाम",
  ho: "हो",
  cha: "छ",
  chha: "छ",
  ma: "म",
  timi: "तिमी",
  tapai: "तपाईं",
  hawa: "हावा",
  pani: "पानी",
  khana: "खाना",
  dhanyabad: "धन्यवाद",
  subhapravat: "शुभप्रभात",
  shubharatri: "शुभरात्री",
  sanatan: "सनातन",
  marga: "मार्ग",
  dharma: "धर्म",
  satya: "सत्य",
  shanti: "शान्ति",
  pashupatinath: "पशुपतिनाथ"
};

export class LanguageOS {
  private activeMode: RomanNepaliMode = "LIVE";
  private currentLanguage: CanonicalLanguageCode = "ne";

  // --- REGISTRY ACCESS ---
  public getSupportedLanguages(): LanguageDefinition[] {
    return Object.values(CANONICAL_LANGUAGES);
  }

  public getLanguageDefinition(code: string): LanguageDefinition | undefined {
    return CANONICAL_LANGUAGES[code as CanonicalLanguageCode];
  }

  public setMode(mode: RomanNepaliMode) {
    this.activeMode = mode;
  }

  public getMode(): RomanNepaliMode {
    return this.activeMode;
  }

  // --- PROTECTED TOKEN DETECTION ---
  /**
   * Deterministically detects tokens that must NEVER be transliterated
   * (e.g. email, URL, passwords, API keys, identifiers, phone numbers, code).
   */
  public detectProtectedToken(token: string): ProtectedTokenMatch | null {
    if (!token || typeof token !== "string") return null;

    const trimmed = token.trim();

    // 1. Email pattern
    if (/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(trimmed)) {
      return { type: "EMAIL", token: trimmed, start: 0, end: trimmed.length };
    }

    // 2. URL / URI pattern
    if (/^(https?:\/\/|www\.|ftp:\/\/|\/[a-zA-Z0-9_\-/]+)/.test(trimmed)) {
      return { type: "URL", token: trimmed, start: 0, end: trimmed.length };
    }

    // 3. API Key / Secret / Hex / Base64 token pattern
    if (/^(sk-[a-zA-Z0-9]{16,}|AIza[a-zA-Z0-9_-]{20,}|bearer\s+[a-zA-Z0-9._-]+|[0-9a-fA-F]{24,})$/i.test(trimmed)) {
      return { type: "API_KEY", token: trimmed, start: 0, end: trimmed.length };
    }

    // 4. Code identifiers / CamelCase / snake_case with dots or brackets
    if (/^[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+(\(.*?\))?$/.test(trimmed) || /^[a-zA-Z0-9_]+::[a-zA-Z0-9_]+$/.test(trimmed)) {
      return { type: "CODE", token: trimmed, start: 0, end: trimmed.length };
    }

    // 5. SKU / Canonical ID (e.g. art-101, usr_alpha_22, rev-881)
    if (/^[a-z]{2,5}[-_][a-z0-9-_]{2,}$/i.test(trimmed)) {
      return { type: "IDENTIFIER", token: trimmed, start: 0, end: trimmed.length };
    }

    // 6. Phone number pattern
    if (/^\+?[0-9]{3,4}[-\s]?[0-9]{6,10}$/.test(trimmed)) {
      return { type: "PHONE", token: trimmed, start: 0, end: trimmed.length };
    }

    // 7. Hashtag
    if (/^#[a-zA-Z0-9_]+$/.test(trimmed)) {
      return { type: "HASHTAG", token: trimmed, start: 0, end: trimmed.length };
    }

    // 8. File path
    if (/^[a-zA-Z0-9_./\\-]+\.[a-zA-Z0-9]{2,4}$/.test(trimmed)) {
      return { type: "FILE_PATH", token: trimmed, start: 0, end: trimmed.length };
    }

    return null;
  }

  // --- LOCAL DETERMINISTIC ROMAN NEPALI TRANSLITERATION ---
  /**
   * Transliterates Roman Nepali text to Devanagari locally and synchronously.
   * Completely offline, zero per-keystroke cloud API calls.
   */
  public transliterateRomanNepali(
    text: string,
    options: {
      mode?: RomanNepaliMode;
      preserveEnglishWords?: boolean;
    } = {}
  ): string {
    const mode = options.mode || this.activeMode;

    if (mode === "OFF" || !text) {
      return text;
    }

    // Split text into whitespace-delimited tokens while keeping whitespace
    const segments = text.split(/(\s+)/);
    const resultSegments: string[] = [];

    for (const segment of segments) {
      if (!segment) continue;

      // Preserve whitespace as-is
      if (/^\s+$/.test(segment)) {
        resultSegments.push(segment);
        continue;
      }

      // Check if entire segment is a protected token (e.g. email, URL, code, API key)
      const directProtected = this.detectProtectedToken(segment);
      if (directProtected) {
        resultSegments.push(segment);
        continue;
      }

      // Separate trailing/leading punctuation
      const punctMatch = segment.match(/^([.,!?;:()\[\]{}"'\\\/<>]*)(.*?)([.,!?;:()\[\]{}"'\\\/<>]*)$/);
      if (punctMatch) {
        const [, leadingPunct, coreToken, trailingPunct] = punctMatch;

        if (!coreToken) {
          resultSegments.push((PUNCTUATION[leadingPunct] || leadingPunct));
          continue;
        }

        // Check if coreToken is protected
        const coreProtected = this.detectProtectedToken(coreToken);
        if (coreProtected) {
          resultSegments.push((PUNCTUATION[leadingPunct] || leadingPunct) + coreToken + (PUNCTUATION[trailingPunct] || trailingPunct));
          continue;
        }

        // Check dictionary
        const lower = coreToken.toLowerCase();
        let transliteratedCore = "";
        if (COMMON_WORD_DICTIONARY[lower]) {
          transliteratedCore = COMMON_WORD_DICTIONARY[lower];
        } else if (/[\u0900-\u097F]/.test(coreToken)) {
          transliteratedCore = coreToken;
        } else {
          transliteratedCore = this.transliterateWord(coreToken);
        }

        resultSegments.push(
          (PUNCTUATION[leadingPunct] || leadingPunct) +
          transliteratedCore +
          (PUNCTUATION[trailingPunct] || trailingPunct)
        );
      } else {
        resultSegments.push(this.transliterateWord(segment));
      }
    }

    return resultSegments.join("");
  }

  private transliterateWord(word: string): string {
    let result = "";
    let i = 0;
    const len = word.length;

    while (i < len) {
      // 1. Numerals
      if (NUMERALS[word[i]]) {
        result += NUMERALS[word[i]];
        i++;
        continue;
      }

      // 2. Multi-char consonants (3 chars: ksh, gya, chh)
      let matched = false;
      if (i + 3 <= len) {
        const tri = word.substring(i, i + 3).toLowerCase();
        if (CONSONANTS[tri]) {
          const base = CONSONANTS[tri];
          i += 3;
          const { vowelMatra, consumed } = this.consumeFollowingVowel(word, i);
          result += this.combineConsonantVowel(base, vowelMatra);
          i += consumed;
          matched = true;
          continue;
        }
      }

      // 3. Multi-char consonants (2 chars: kh, gh, ch, jh, th, dh, ph, bh, sh, Sh, tr, gy)
      if (!matched && i + 2 <= len) {
        const dual = word.substring(i, i + 2);
        const dualLower = dual.toLowerCase();
        const consKey = CONSONANTS[dual] ? dual : CONSONANTS[dualLower] ? dualLower : null;
        if (consKey) {
          const base = CONSONANTS[consKey];
          i += 2;
          const { vowelMatra, consumed } = this.consumeFollowingVowel(word, i);
          result += this.combineConsonantVowel(base, vowelMatra);
          i += consumed;
          matched = true;
          continue;
        }

        // 2-char independent vowels at word start or after space
        if (i === 0 || VOWELS[dualLower]) {
          if (VOWELS[dualLower]) {
            result += VOWELS[dualLower];
            i += 2;
            matched = true;
            continue;
          }
        }
      }

      // 4. Single char consonants
      if (!matched) {
        const single = word[i];
        const singleLower = single.toLowerCase();
        const consKey = CONSONANTS[single] ? single : CONSONANTS[singleLower] ? singleLower : null;

        if (consKey) {
          const base = CONSONANTS[consKey];
          i += 1;
          const { vowelMatra, consumed } = this.consumeFollowingVowel(word, i);
          result += this.combineConsonantVowel(base, vowelMatra);
          i += consumed;
          matched = true;
          continue;
        }

        // Single independent vowel
        if (VOWELS[singleLower]) {
          result += VOWELS[singleLower];
          i += 1;
          matched = true;
          continue;
        }

        // Fallback pass-through character
        result += word[i];
        i++;
      }
    }

    return result;
  }

  private consumeFollowingVowel(word: string, index: number): { vowelMatra: string | null; consumed: number } {
    if (index >= word.length) {
      return { vowelMatra: null, consumed: 0 };
    }

    // 2-char vowels: aa, ee, oo, ai, au, am, ah, ri
    if (index + 2 <= word.length) {
      const dual = word.substring(index, index + 2).toLowerCase();
      if (VOWEL_MATRAS[dual] !== undefined) {
        return { vowelMatra: VOWEL_MATRAS[dual], consumed: 2 };
      }
    }

    // 1-char vowels: a, i, u, e, o
    const single = word[index].toLowerCase();
    if (VOWEL_MATRAS[single] !== undefined) {
      return { vowelMatra: VOWEL_MATRAS[single], consumed: 1 };
    }

    return { vowelMatra: null, consumed: 0 };
  }

  private combineConsonantVowel(halantConsonant: string, matra: string | null): string {
    if (matra === null) {
      // Halant stays (e.g. k -> क्)
      return halantConsonant;
    }
    // Remove halant (्) and append matra
    const baseWithoutHalant = halantConsonant.replace(/्$/, "");
    return baseWithoutHalant + matra;
  }

  // --- SCHOLARLY TRANSLITERATION (DEVANAGARI <-> IAST) ---
  /**
   * Scholarly transliteration for Sanskrit, Vedic texts, SGIS manuscripts, and Knowledge entities.
   * Full fidelity with standard IAST diacritics.
   */
  public convertDevanagariToIAST(text: string): ScholarlyTransliterationResult {
    if (!text) {
      return {
        sourceText: "",
        targetText: "",
        sourceScript: "Devanagari",
        targetScript: "IAST",
        diacriticsPreserved: true,
        standard: "IAST_1912_CANONICAL",
        provenance: "HUMAN_AUTHORED"
      };
    }

    const devToIastMap: Record<string, string> = {
      "अ": "a", "आ": "ā", "इ": "i", "ई": "ī", "उ": "u", "ऊ": "ū",
      "ऋ": "ṛ", "ॠ": "ṝ", "ऌ": "ḷ", "ॡ": "ḹ",
      "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au",
      "ं": "ṃ", "ः": "ḥ", "्": "",
      "ा": "ā", "ि": "i", "ी": "ī", "ु": "u", "ू": "ū",
      "ृ": "ṛ", "ॄ": "ṝ", "ॢ": "ḷ", "ॣ": "ḹ",
      "े": "e", "ै": "ai", "ो": "o", "ौ": "au",
      "क": "ka", "ख": "kha", "ग": "ga", "घ": "gha", "ङ": "ṅa",
      "च": "ca", "छ": "cha", "ज": "ja", "झ": "jha", "ञ": "ña",
      "ट": "ṭa", "ठ": "ṭha", "ड": "ḍa", "ढ": "ḍha", "ण": "ṇa",
      "त": "ta", "थ": "tha", "द": "da", "ध": "dha", "न": "na",
      "प": "pa", "फ": "pha", "ब": "ba", "भ": "bha", "म": "ma",
      "य": "ya", "र": "ra", "ल": "la", "व": "va",
      "श": "śa", "ष": "ṣa", "स": "sa", "ह": "ha",
      "क्ष": "kṣa", "ज्ञ": "jña", "त्र": "tra",
      "।": "|", "॥": "||"
    };

    let result = "";
    let i = 0;
    while (i < text.length) {
      const char = text[i];
      const nextChar = i + 1 < text.length ? text[i + 1] : "";

      // Check if current is consonant followed by halant
      if (nextChar === "्" && devToIastMap[char]) {
        const fullConsonant = devToIastMap[char];
        result += fullConsonant.replace(/a$/, "");
        i += 2;
        continue;
      }

      // Check if consonant is followed by vowel sign
      if (devToIastMap[char] && devToIastMap[nextChar] && ["ा", "ि", "ी", "ु", "ू", "ृ", "े", "ै", "ो", "ौ"].includes(nextChar)) {
        const fullConsonant = devToIastMap[char];
        const base = fullConsonant.replace(/a$/, "");
        const matraIast = devToIastMap[nextChar];
        result += base + matraIast;
        i += 2;
        continue;
      }

      if (devToIastMap[char] !== undefined) {
        result += devToIastMap[char];
      } else {
        result += char;
      }
      i++;
    }

    return {
      sourceText: text,
      targetText: result,
      sourceScript: "Devanagari",
      targetScript: "IAST",
      diacriticsPreserved: true,
      standard: "IAST_1912_CANONICAL",
      provenance: "HUMAN_AUTHORED"
    };
  }

  public convertIASTToDevanagari(text: string): ScholarlyTransliterationResult {
    if (!text) {
      return {
        sourceText: "",
        targetText: "",
        sourceScript: "IAST",
        targetScript: "Devanagari",
        diacriticsPreserved: true,
        standard: "IAST_1912_CANONICAL",
        provenance: "HUMAN_AUTHORED"
      };
    }

    const iastConsonants: Record<string, string> = {
      "kṣ": "क्ष्", "kṣa": "क्ष", "jñ": "ज्ञ्", "jña": "ज्ञ",
      "kh": "ख्", "kha": "ख", "gh": "घ्", "gha": "घ", "ṅ": "ङ्", "ṅa": "ङ",
      "ch": "छ्", "cha": "छ", "jh": "झ्", "jha": "झ", "ñ": "ञ्", "ña": "ञ",
      "ṭh": "ठ्", "ṭha": "ठ", "ḍh": "ढ्", "ḍha": "ढ", "ṇ": "ण्", "ṇa": "ण",
      "th": "थ्", "tha": "थ", "dh": "ध्", "dha": "ध",
      "ph": "फ्", "pha": "फ", "bh": "भ्", "bha": "भ",
      "ś": "श्", "śa": "श", "ṣ": "ष्", "ṣa": "ष",
      "k": "क्", "ka": "क", "g": "ग्", "ga": "ग", "c": "च्", "ca": "च", "j": "ज्", "ja": "ज",
      "ṭ": "ट्", "ṭa": "ट", "ḍ": "ड्", "ḍa": "ड", "t": "त्", "ta": "त", "d": "द्", "da": "द", "n": "न्", "na": "न",
      "p": "प्", "pa": "प", "b": "ब्", "ba": "ब", "m": "म्", "ma": "म",
      "y": "य्", "ya": "य", "r": "र्", "ra": "र", "l": "ल्", "la": "ल", "v": "व्", "va": "व",
      "s": "स्", "sa": "स", "h": "ह्", "ha": "ह"
    };

    const iastVowelMatras: Record<string, string> = {
      "ā": "ा", "i": "ि", "ī": "ी", "u": "ु", "ū": "ू", "ṛ": "ृ", "ṝ": "ॄ", "ḷ": "ॢ",
      "e": "े", "ai": "ै", "o": "ो", "au": "ौ", "ṃ": "ं", "ḥ": "ः"
    };

    const iastIndependentVowels: Record<string, string> = {
      "a": "अ", "ā": "आ", "i": "इ", "ī": "ई", "u": "उ", "ū": "ऊ",
      "ṛ": "ऋ", "ṝ": "ॠ", "ḷ": "ऌ",
      "e": "ए", "ai": "ऐ", "o": "ओ", "au": "औ"
    };

    let result = "";
    let i = 0;
    let lastWasHalant = false;

    while (i < text.length) {
      let matched = false;

      // 1. Check multi-char consonants + vowels
      // Try 3-char, 2-char, 1-char consonant
      for (const len of [3, 2, 1]) {
        if (i + len <= text.length) {
          const sub = text.substring(i, i + len);
          if (iastConsonants[sub]) {
            const consBase = iastConsonants[sub];
            i += len;

            // Check if following character is an IAST vowel matra
            let matraFound = false;
            for (const vlen of [2, 1]) {
              if (i + vlen <= text.length) {
                const vSub = text.substring(i, i + vlen);
                if (iastVowelMatras[vSub]) {
                  const matra = iastVowelMatras[vSub];
                  // Remove halant from consonant base and append matra
                  const baseClean = consBase.replace(/्$/, "");
                  result += baseClean + matra;
                  i += vlen;
                  matraFound = true;
                  lastWasHalant = false;
                  break;
                }
              }
            }

            if (!matraFound) {
              result += consBase;
              lastWasHalant = consBase.endsWith("्");
            }

            matched = true;
            break;
          }
        }
      }

      if (matched) continue;

      // 2. Independent vowels
      for (const len of [2, 1]) {
        if (i + len <= text.length) {
          const sub = text.substring(i, i + len);
          if (iastIndependentVowels[sub]) {
            result += iastIndependentVowels[sub];
            i += len;
            matched = true;
            lastWasHalant = false;
            break;
          }
        }
      }

      if (matched) continue;

      result += text[i];
      lastWasHalant = false;
      i++;
    }

    return {
      sourceText: text,
      targetText: result,
      sourceScript: "IAST",
      targetScript: "Devanagari",
      diacriticsPreserved: true,
      standard: "IAST_1912_CANONICAL",
      provenance: "HUMAN_AUTHORED"
    };
  }

  // --- CLIENT TRANSLATION API WRAPPERS ---
  public async requestTranslation(payload: {
    sourceEntityType: "article" | "knowledge" | "blog" | "chautari" | "event" | "announcement";
    sourceEntityId: string;
    sourceLanguage: CanonicalLanguageCode;
    targetLanguage: CanonicalLanguageCode;
    sourceVersion: number;
    sourceFields: Record<string, string>;
    provenance?: LanguageProvenance;
    tenantId?: string;
  }): Promise<TranslationRecord> {
    const res = await fetch("/api/language/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Translation request failed with status ${res.status}`);
    }

    return await res.json();
  }

  public async getTranslationsForEntity(
    entityType: string,
    entityId: string
  ): Promise<TranslationRecord[]> {
    const res = await fetch(`/api/language/translations/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`);
    if (!res.ok) return [];
    return await res.json();
  }
}

export const languageOS = new LanguageOS();
