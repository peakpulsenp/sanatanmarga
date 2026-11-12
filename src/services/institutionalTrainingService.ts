export interface InstitutionalPartner {
  id: string;
  name: string;
  nameNepali: string;
  badge: string;
  logoText: string;
  tagline: string;
  taglineNepali: string;
  themeColor: string;
  accentBg: string;
  requiredCompliancePercent: number;
  focalDomains: string[];
  departmentRoster: {
    deptName: string;
    requiredHeadcount: number;
    certifiedHeadcount: number;
    expiringHeadcount: number;
    expiredHeadcount: number;
  }[];
  customNotice?: string;
  officialSealText: string;
}

export const INSTITUTIONAL_PARTNERS: Record<string, InstitutionalPartner> = {
  "sanatanmarga-central": {
    id: "sanatanmarga-central",
    name: "SanatanMarga Central Academy",
    nameNepali: "सनातन मार्ग केन्द्रीय तालिम प्रतिष्ठान",
    badge: "GLOBAL HQ",
    logoText: "SM",
    tagline: "Autonomous Media, Civilizational Intelligence & Governance Academy",
    taglineNepali: "स्वायत्त मिडिया, सभ्यतागत प्रज्ञा तथा सुशासन प्रतिष्ठान",
    themeColor: "from-amber-600 to-stone-900",
    accentBg: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    requiredCompliancePercent: 90,
    focalDomains: ["Journalism", "SGIS", "Governance", "SnapshotOS", "MediaOS"],
    officialSealText: "SANATANMARGA CENTRAL ACCREDITATION COUNCIL",
    departmentRoster: [
      { deptName: "AI Newsroom & Editorial Desk", requiredHeadcount: 24, certifiedHeadcount: 22, expiringHeadcount: 2, expiredHeadcount: 0 },
      { deptName: "SGIS Epigraphy & Archive Vault", requiredHeadcount: 12, certifiedHeadcount: 11, expiringHeadcount: 1, expiredHeadcount: 0 },
      { deptName: "Governance & Four-Eyes Directorate", requiredHeadcount: 8, certifiedHeadcount: 8, expiringHeadcount: 0, expiredHeadcount: 0 },
      { deptName: "Platform Resiliency & Infrastructure", requiredHeadcount: 10, certifiedHeadcount: 9, expiringHeadcount: 1, expiredHeadcount: 0 },
      { deptName: "Radio & Media Broadcasting Unit", requiredHeadcount: 15, certifiedHeadcount: 13, expiringHeadcount: 2, expiredHeadcount: 0 },
      { deptName: "Civilizational Academy Faculty", requiredHeadcount: 14, certifiedHeadcount: 12, expiringHeadcount: 1, expiredHeadcount: 1 }
    ]
  },
  "pokhara-metro": {
    id: "pokhara-metro",
    name: "Pokhara Metropolitan Media & Governance Academy",
    nameNepali: "पोखरा महानगरपालिका सञ्चार तथा सुशासन प्रतिष्ठान",
    badge: "MUNICIPAL GOVERNANCE",
    logoText: "PMC",
    tagline: "Municipal Citizen Information, Transparency & Crisis Comms Training",
    taglineNepali: "स्थानीय सरकार जनसूचना, पारदर्शिता तथा संकट सञ्चार तालिम",
    themeColor: "from-sky-700 to-indigo-950",
    accentBg: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    requiredCompliancePercent: 95,
    focalDomains: ["Local Governance", "Citizen Sourcing", "Emergency Broadcast", "Public Transparency"],
    officialSealText: "POKHARA METROPOLITAN CITY PUBLIC ACCREDITATION WING",
    customNotice: "All municipal media spokespersons and ward information officers must complete the Tier-1 Public Gazette Sourcing Course.",
    departmentRoster: [
      { deptName: "Ward Information & Spokesperson Officers (33 Wards)", requiredHeadcount: 33, certifiedHeadcount: 29, expiringHeadcount: 3, expiredHeadcount: 1 },
      { deptName: "Municipal Media & Press Relations Cell", requiredHeadcount: 12, certifiedHeadcount: 11, expiringHeadcount: 1, expiredHeadcount: 0 },
      { deptName: "Disaster Risk & Emergency Siren Broadcasters", requiredHeadcount: 16, certifiedHeadcount: 16, expiringHeadcount: 0, expiredHeadcount: 0 },
      { deptName: "E-Governance & Local Data Integrity Team", requiredHeadcount: 8, certifiedHeadcount: 7, expiringHeadcount: 1, expiredHeadcount: 0 }
    ]
  },
  "lumbini-trust": {
    id: "lumbini-trust",
    name: "Lumbini Development Trust Epigraphy & Archives Institute",
    nameNepali: "लुम्बिनी विकास कोष अनुसन्धान तथा अभिलेख प्रतिष्ठान",
    badge: "HERITAGE & EPIGRAPHY",
    logoText: "LDT",
    tagline: "Asokan Inscriptions, Brahmi Epigraphy & Sacred Site Preservation",
    taglineNepali: "अशोक स्तम्भ अभिलेख, ब्राह्मी लिपि तथा सम्पदा संरक्षण",
    themeColor: "from-amber-700 to-emerald-950",
    accentBg: "bg-amber-600/10 text-amber-400 border-amber-600/30",
    requiredCompliancePercent: 92,
    focalDomains: ["Brahmi Script", "Multispectral UV/IR Scanning", "Epigraphic Archiving", "Heritage Tourism"],
    officialSealText: "LUMBINI SACRED GARDEN RESEARCH & EPIGRAPHY COUNCIL",
    customNotice: "Certified epigraphists possess digital signing authority for Asokan pillar and Licchavi script transcriptions.",
    departmentRoster: [
      { deptName: "Epigraphic Inscription Research Unit", requiredHeadcount: 10, certifiedHeadcount: 9, expiringHeadcount: 1, expiredHeadcount: 0 },
      { deptName: "Parchment & Birch Bark Preservation Lab", requiredHeadcount: 8, certifiedHeadcount: 8, expiringHeadcount: 0, expiredHeadcount: 0 },
      { deptName: "International Heritage Scholars Desk", requiredHeadcount: 14, certifiedHeadcount: 11, expiringHeadcount: 2, expiredHeadcount: 1 }
    ]
  },
  "tu-journalism": {
    id: "tu-journalism",
    name: "Tribhuvan University Investigative Journalism Lab",
    nameNepali: "त्रिभुवन विश्वविद्यालय खोज पत्रकारिता तथा डिजिटल मिडिया ल्याब",
    badge: "UNIVERSITY ACCREDITED",
    logoText: "TU",
    tagline: "Postgraduate Curriculum in Algorithmic Media & Civilizational Ethics",
    taglineNepali: "एल्गोरिथमिक मिडिया तथा सभ्यतागत आचारसंहिता स्नातकोत्तर पाठ्यक्रम",
    themeColor: "from-blue-800 to-slate-950",
    accentBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    requiredCompliancePercent: 88,
    focalDomains: ["Investigative Journalism", "Data Verification", "Media Law", "Algorithmic Bias"],
    officialSealText: "TRIBHUVAN UNIVERSITY FACULTY OF JOURNALISM & MASS COMMS",
    departmentRoster: [
      { deptName: "Department of Mass Communication Faculty", requiredHeadcount: 18, certifiedHeadcount: 17, expiringHeadcount: 1, expiredHeadcount: 0 },
      { deptName: "Graduate Research Fellows (Class of 2026)", requiredHeadcount: 42, certifiedHeadcount: 36, expiringHeadcount: 4, expiredHeadcount: 2 },
      { deptName: "Digital Fact-Checking & OSINT Team", requiredHeadcount: 15, certifiedHeadcount: 14, expiringHeadcount: 1, expiredHeadcount: 0 }
    ]
  },
  "pashupati-padt": {
    id: "pashupati-padt",
    name: "Pashupati Area Heritage & Manuscript Vault",
    nameNepali: "पशुपति क्षेत्र विकास कोष अभिलेखालय तथा वैदिक प्रतिष्ठान",
    badge: "VEDIC HERITAGE",
    logoText: "PADT",
    tagline: "Tantric Inscriptions, Palm-Leaf Manuscripts & Ritual Protocol Archiving",
    taglineNepali: "ताडपत्र पाण्डुलिपि, तान्त्रिक अभिलेख तथा परम्परागत विधि संरक्षण",
    themeColor: "from-red-800 to-stone-950",
    accentBg: "bg-red-500/10 text-red-400 border-red-500/30",
    requiredCompliancePercent: 95,
    focalDomains: ["Devanagari/Newari Scripts", "Ritual Protocols", "Sacred Temple Records", "Manuscript Digitization"],
    officialSealText: "PASHUPATINATH HERITAGE VAULT & PALEOGRAPHY ARCHIVE",
    departmentRoster: [
      { deptName: "Manuscript Conservators & Sanskrit Epigraphists", requiredHeadcount: 12, certifiedHeadcount: 11, expiringHeadcount: 1, expiredHeadcount: 0 },
      { deptName: "Temple Protocol & Festival Archiving Wing", requiredHeadcount: 15, certifiedHeadcount: 14, expiringHeadcount: 1, expiredHeadcount: 0 },
      { deptName: "Sacred Artifacts Digital Ledger Officers", requiredHeadcount: 9, certifiedHeadcount: 9, expiringHeadcount: 0, expiredHeadcount: 0 }
    ]
  }
};

export const CURRENT_INSTITUTION_KEY = "sanatanmarga_active_institution";

export function getActiveInstitution(): InstitutionalPartner {
  try {
    const saved = localStorage.getItem(CURRENT_INSTITUTION_KEY);
    if (saved && INSTITUTIONAL_PARTNERS[saved]) {
      return INSTITUTIONAL_PARTNERS[saved];
    }
  } catch (e) {
    // Ignore storage errors
  }
  return INSTITUTIONAL_PARTNERS["sanatanmarga-central"];
}

export function setActiveInstitution(id: string): InstitutionalPartner {
  if (INSTITUTIONAL_PARTNERS[id]) {
    try {
      localStorage.setItem(CURRENT_INSTITUTION_KEY, id);
    } catch (e) {
      // Ignore
    }
    return INSTITUTIONAL_PARTNERS[id];
  }
  return INSTITUTIONAL_PARTNERS["sanatanmarga-central"];
}
