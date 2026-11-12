/**
 * Temporal Knowledge OS & Current Facts Registry
 * 
 * SanatanMarga Level-1 Editorial Authority Engine.
 * Provides time-aware, deterministic resolution for office-holders, political leadership,
 * institutional roles, and government figures across Nepal.
 * 
 * INVARIANT: AI model pre-trained memory MUST NEVER override an authoritative current fact.
 */

export interface TemporalFactRecord {
  factId: string;
  entity: string;
  canonicalName: string;
  displayName: {
    ne: string;
    en: string;
  };
  role: string;
  roleNe: string;
  effectiveStart: string; // ISO timestamp string e.g. "2026-03-27T00:00:00+05:45"
  effectiveEnd: string | null; // ISO timestamp or null if active
  authority: string;
  status: "active" | "historical";
  aliases?: string[];
}

export interface ManifestFactItem {
  factId: string;
  subject: string;
  subjectNe: string;
  value: string;
  valueNe: string;
  validFrom: string;
  validTo: string | null;
  source: string;
  authority: "authoritative";
  status: "active" | "historical";
}

export interface PreGenerationFactManifest {
  referenceDate: string;
  generatedAt: string;
  authorityHierarchy: string[];
  currentFacts: ManifestFactItem[];
}

export const CURRENT_FACTS_REGISTRY: TemporalFactRecord[] = [
  // PRIME MINISTER OF NEPAL
  {
    factId: "gov.pm.nepal.active",
    entity: "prime_minister_of_nepal",
    canonicalName: "Balendra Shah",
    displayName: {
      ne: "बालेन्द्र शाह",
      en: "Balendra Shah"
    },
    role: "Prime Minister of Nepal",
    roleNe: "नेपालको प्रधानमन्त्री",
    effectiveStart: "2026-03-27T00:00:00+05:45",
    effectiveEnd: null,
    authority: "Current Facts Registry / Official Nepal Gazette Vol 76",
    status: "active",
    aliases: ["balendra shah", "balen shah", "balen", "बालेन शाह", "बालेन्द्र शाह", "प्रधानमन्त्री बालेन", "प्रधानमन्त्री बालेन्द्र"]
  },
  {
    factId: "gov.pm.nepal.oli",
    entity: "prime_minister_of_nepal",
    canonicalName: "Khadga Prasad Sharma Oli",
    displayName: {
      ne: "केपी शर्मा ओली",
      en: "K.P. Sharma Oli"
    },
    role: "Former Prime Minister of Nepal",
    roleNe: "नेपालको पूर्व प्रधानमन्त्री",
    effectiveStart: "2024-07-15T00:00:00+05:45",
    effectiveEnd: "2026-03-26T23:59:59+05:45",
    authority: "Current Facts Registry / Historical Gazette Archive",
    status: "historical",
    aliases: ["kp oli", "kp sharma oli", "केपी ओली", "केपी शर्मा ओली", "खड्गप्रसाद ओली"]
  },
  {
    factId: "gov.pm.nepal.prachanda",
    entity: "prime_minister_of_nepal",
    canonicalName: "Pushpa Kamal Dahal",
    displayName: {
      ne: "पुष्पकमल दाहाल 'प्रचण्ड'",
      en: "Pushpa Kamal Dahal (Prachanda)"
    },
    role: "Former Prime Minister of Nepal",
    roleNe: "नेपालको पूर्व प्रधानमन्त्री",
    effectiveStart: "2022-12-26T00:00:00+05:45",
    effectiveEnd: "2024-07-14T23:59:59+05:45",
    authority: "Current Facts Registry / Historical Gazette Archive",
    status: "historical",
    aliases: ["prachanda", "pushpa kamal dahal", "प्रचण्ड", "पुष्पकमल दाहाल"]
  },

  // PRESIDENT OF NEPAL
  {
    factId: "gov.president.nepal.active",
    entity: "president_of_nepal",
    canonicalName: "Ram Chandra Poudel",
    displayName: {
      ne: "रामचन्द्र पौडेल",
      en: "Ram Chandra Poudel"
    },
    role: "President of Nepal",
    roleNe: "नेपालको राष्ट्रपति",
    effectiveStart: "2023-03-13T00:00:00+05:45",
    effectiveEnd: null,
    authority: "Current Facts Registry / Office of the President (Shreetal Niwas)",
    status: "active",
    aliases: ["ram chandra paudel", "ramchandra paudel", "रामचन्द्र पौडेल", "राष्ट्रपति पौडेल"]
  },
  {
    factId: "gov.president.nepal.bhandari",
    entity: "president_of_nepal",
    canonicalName: "Bidya Devi Bhandari",
    displayName: {
      ne: "विद्यादेवी भण्डारी",
      en: "Bidya Devi Bhandari"
    },
    role: "Former President of Nepal",
    roleNe: "नेपालको पूर्व राष्ट्रपति",
    effectiveStart: "2015-10-29T00:00:00+05:45",
    effectiveEnd: "2023-03-12T23:59:59+05:45",
    authority: "Current Facts Registry",
    status: "historical",
    aliases: ["bidya bhandari", "विद्यादेवी भण्डारी"]
  },

  // CHIEF JUSTICE OF NEPAL
  {
    factId: "gov.chief_justice.nepal.active",
    entity: "chief_justice_of_nepal",
    canonicalName: "Prakash Man Singh Raut",
    displayName: {
      ne: "प्रकाशमान सिंह राउत",
      en: "Prakash Man Singh Raut"
    },
    role: "Chief Justice of Nepal",
    roleNe: "नेपालको प्रधानन्यायाधीश",
    effectiveStart: "2024-10-06T00:00:00+05:45",
    effectiveEnd: null,
    authority: "Current Facts Registry / Supreme Court of Nepal",
    status: "active",
    aliases: ["prakash man singh raut", "प्रकाशमान सिंह राउत", "प्रधानन्यायाधीश राउत"]
  },

  // SPEAKER OF HOUSE OF REPRESENTATIVES
  {
    factId: "gov.speaker.nepal.active",
    entity: "speaker_of_house",
    canonicalName: "Dev Raj Ghimire",
    displayName: {
      ne: "देवराज घिमिरे",
      en: "Dev Raj Ghimire"
    },
    role: "Speaker of the House of Representatives",
    roleNe: "प्रतिनिधिसभाका सभामुख",
    effectiveStart: "2023-01-19T00:00:00+05:45",
    effectiveEnd: null,
    authority: "Current Facts Registry / Federal Parliament Secretariat",
    status: "active",
    aliases: ["dev raj ghimire", "देवराज घिमिरे", "सभामुख घिमिरे"]
  },

  // FINANCE MINISTER OF NEPAL
  {
    factId: "gov.finance_minister.nepal.active",
    entity: "finance_minister_of_nepal",
    canonicalName: "Bishnu Prasad Paudel",
    displayName: {
      ne: "विष्णुप्रसाद पौडेल",
      en: "Bishnu Prasad Paudel"
    },
    role: "Finance Minister of Nepal",
    roleNe: "नेपालको अर्थमन्त्री",
    effectiveStart: "2024-07-15T00:00:00+05:45",
    effectiveEnd: null,
    authority: "Current Facts Registry / Ministry of Finance",
    status: "active",
    aliases: ["bishnu paudel", "विष्णु पौडेल", "विष्णुप्रसाद पौडेल", "अर्थमन्त्री पौडेल"]
  },

  // HOME MINISTER OF NEPAL
  {
    factId: "gov.home_minister.nepal.active",
    entity: "home_minister_of_nepal",
    canonicalName: "Ramesh Lekhak",
    displayName: {
      ne: "रमेश लेखक",
      en: "Ramesh Lekhak"
    },
    role: "Home Minister of Nepal",
    roleNe: "नेपालको गृह मन्त्री",
    effectiveStart: "2024-07-15T00:00:00+05:45",
    effectiveEnd: null,
    authority: "Current Facts Registry / Ministry of Home Affairs",
    status: "active",
    aliases: ["ramesh lekhak", "रमेश लेखक", "गृह मन्त्री लेखक"]
  },

  // MAYOR OF KATHMANDU
  {
    factId: "gov.mayor.kathmandu.active",
    entity: "mayor_of_kathmandu",
    canonicalName: "Sunita Dangol",
    displayName: {
      ne: "सुनिता डङ्गोल (कार्यवाहक)",
      en: "Sunita Dangol (Acting Mayor)"
    },
    role: "Acting Mayor of Kathmandu Metropolitan City",
    roleNe: "काठमाडौँ महानगरपालिकाका कार्यवाहक प्रमुख",
    effectiveStart: "2026-01-18T00:00:00+05:45",
    effectiveEnd: null,
    authority: "Current Facts Registry / KMC Municipal Secretariat",
    status: "active",
    aliases: ["sunita dangol", "सुनिता डङ्गोल", "कार्यवाहक मेयर सुनिता डङ्गोल"]
  },
  {
    factId: "gov.mayor.kathmandu.balen",
    entity: "mayor_of_kathmandu",
    canonicalName: "Balendra Shah",
    displayName: {
      ne: "बालेन्द्र शाह",
      en: "Balendra Shah"
    },
    role: "Former Mayor of Kathmandu Metropolitan City",
    roleNe: "काठमाडौँ महानगरपालिकाका पूर्व प्रमुख (मेयर)",
    effectiveStart: "2022-05-30T00:00:00+05:45",
    effectiveEnd: "2026-01-18T00:00:00+05:45",
    authority: "Current Facts Registry / Election Commission Records 2022",
    status: "historical",
    aliases: ["balen mayor", "मेयर बालेन"]
  },

  // GOVERNOR OF NEPAL RASTRA BANK
  {
    factId: "gov.governor.nrb.active",
    entity: "nepal_rastra_bank_governor",
    canonicalName: "Maha Prasad Adhikari",
    displayName: {
      ne: "महाप्रसाद अधिकारी",
      en: "Maha Prasad Adhikari"
    },
    role: "Governor of Nepal Rastra Bank",
    roleNe: "नेपाल राष्ट्र बैंकका गभर्नर",
    effectiveStart: "2020-04-06T00:00:00+05:45",
    effectiveEnd: null,
    authority: "Current Facts Registry / Nepal Rastra Bank Secretariat",
    status: "active",
    aliases: ["maha prasad adhikari", "महाप्रसाद अधिकारी", "गभर्नर अधिकारी"]
  }
];

export class TemporalKnowledgeOS {
  private static registry: TemporalFactRecord[] = [...CURRENT_FACTS_REGISTRY];

  /**
   * FACT AUTHORITY HIERARCHY (Level 1 to Level 5)
   */
  public static readonly FACT_AUTHORITY_HIERARCHY = [
    "LEVEL 1: Temporal Knowledge OS (Current Facts Registry) - AUTHORITATIVE",
    "LEVEL 2: Verified primary source (Official Gazette / Government Release)",
    "LEVEL 3: Verified secondary source (Tier-1 Media Outlets)",
    "LEVEL 4: Discovery evidence (Web Scrapes / Search Snippets)",
    "LEVEL 5: AI model pre-trained knowledge (Model memory)"
  ];

  /**
   * Helper to parse date string or Date object into comparison timestamp
   */
  private static parseDate(refDate?: string | Date): Date {
    if (!refDate) return new Date("2026-08-26T00:00:00+05:45");
    if (refDate instanceof Date) return refDate;
    
    // YYYY-MM-DD simple parsing
    if (/^\d{4}-\d{2}-\d{2}$/.test(refDate)) {
      return new Date(`${refDate}T00:00:00+05:45`);
    }
    const parsed = new Date(refDate);
    return isNaN(parsed.getTime()) ? new Date("2026-08-26T00:00:00+05:45") : parsed;
  }

  /**
   * Resolves the valid TemporalFactRecord for a given entity key and reference date.
   * Deterministically returns the active/historical record valid for that date.
   */
  public static resolveFact(entityKey: string, referenceDate?: string | Date): TemporalFactRecord | null {
    if (!entityKey) return null;
    const cleanKey = entityKey.trim().toLowerCase();
    const targetDate = this.parseDate(referenceDate);

    const candidates = this.registry.filter(rec => rec.entity.toLowerCase() === cleanKey);
    if (candidates.length === 0) return null;

    for (const record of candidates) {
      const start = new Date(record.effectiveStart);
      const end = record.effectiveEnd ? new Date(record.effectiveEnd) : null;

      const isAfterStart = targetDate >= start;
      const isBeforeEnd = !end || targetDate <= end;

      if (isAfterStart && isBeforeEnd) {
        return record;
      }
    }

    return null;
  }

  /**
   * Resolves who holds a specific office title at a given reference date.
   */
  public static resolveOfficeHolder(officeTitle: string, referenceDate?: string | Date): TemporalFactRecord | null {
    if (!officeTitle) return null;
    const cleanTitle = officeTitle.toLowerCase().trim();
    const targetDate = this.parseDate(referenceDate);

    for (const record of this.registry) {
      const match = 
        record.role.toLowerCase().includes(cleanTitle) ||
        record.roleNe.toLowerCase().includes(cleanTitle) ||
        cleanTitle.includes(record.role.toLowerCase()) ||
        cleanTitle.includes(record.roleNe.toLowerCase());

      if (match) {
        const start = new Date(record.effectiveStart);
        const end = record.effectiveEnd ? new Date(record.effectiveEnd) : null;

        if (targetDate >= start && (!end || targetDate <= end)) {
          return record;
        }
      }
    }

    // Direct key fallback for common office queries
    if (cleanTitle.includes("prime minister") || cleanTitle.includes("प्रधानमन्त्री")) {
      return this.resolveFact("prime_minister_of_nepal", targetDate);
    }
    if (cleanTitle.includes("president") || cleanTitle.includes("राष्ट्रपति")) {
      return this.resolveFact("president_of_nepal", targetDate);
    }
    if (cleanTitle.includes("chief justice") || cleanTitle.includes("प्रधानन्यायाधीश")) {
      return this.resolveFact("chief_justice_of_nepal", targetDate);
    }
    if (cleanTitle.includes("finance minister") || cleanTitle.includes("अर्थमन्त्री")) {
      return this.resolveFact("finance_minister_of_nepal", targetDate);
    }
    if (cleanTitle.includes("home minister") || cleanTitle.includes("गृह मन्त्री") || cleanTitle.includes("गृहमंत्री")) {
      return this.resolveFact("home_minister_of_nepal", targetDate);
    }

    return null;
  }

  /**
   * Generates a Pre-Generation Fact Manifest for an article reference date.
   * This machine-readable manifest is stored with the article.
   */
  public static getPreGenerationFactManifest(referenceDate?: string | Date): PreGenerationFactManifest {
    const dateObj = this.parseDate(referenceDate);
    const dateStr = dateObj.toISOString().split('T')[0];

    const entityKeys = Array.from(new Set(this.registry.map(r => r.entity)));
    const currentFacts: ManifestFactItem[] = [];

    for (const entityKey of entityKeys) {
      const resolved = this.resolveFact(entityKey, dateObj);
      if (resolved) {
        currentFacts.push({
          factId: resolved.factId,
          subject: resolved.role,
          subjectNe: resolved.roleNe,
          value: resolved.canonicalName,
          valueNe: resolved.displayName.ne,
          validFrom: resolved.effectiveStart.split('T')[0],
          validTo: resolved.effectiveEnd ? resolved.effectiveEnd.split('T')[0] : null,
          source: resolved.authority,
          authority: "authoritative",
          status: resolved.status
        });
      }
    }

    return {
      referenceDate: dateStr,
      generatedAt: new Date().toISOString(),
      authorityHierarchy: this.FACT_AUTHORITY_HIERARCHY,
      currentFacts
    };
  }

  /**
   * Generates a strict Level 1 Authoritative Current Facts prompt block for Gemini generation.
   * Explicitly separates Temporal Ground Truth from Source Evidence.
   */
  public static generatePromptFactContext(referenceDate?: string | Date): string {
    const dateObj = this.parseDate(referenceDate);
    const dateStr = dateObj.toISOString().split('T')[0];
    const manifest = this.getPreGenerationFactManifest(dateObj);

    const factLines = manifest.currentFacts.map(f => (
      `- ${f.subject} (${f.subjectNe}): ${f.value} (${f.valueNe}) [Valid: ${f.validFrom} → ${f.validTo || "present"}]`
    )).join("\n");

    return `================================================================================
LEVEL 1 AUTHORITATIVE CURRENT FACTS (TEMPORAL KNOWLEDGE OS)
Reference Date: ${dateStr}
Authority: SanatanMarga Temporal Knowledge OS (Level 1 Authority)

MANDATE & INSTRUCTION:
1. The following registry values are AUTHORITATIVE for reference date ${dateStr}.
2. Do NOT substitute another person based on pre-trained model memory or web search snippets.
3. Level 1 Temporal Knowledge OS overrides ALL model memory and secondary sources.

AUTHORITATIVE CURRENT FACTS:
${factLines}
================================================================================`;
  }

  /**
   * Retrieves all registry items for inspection or administrative audit.
   */
  public static getAllRecords(): TemporalFactRecord[] {
    return this.registry;
  }
}
