/**
 * SanatanMarga RevenueOS - Configurable Tax Rule Engine
 * 
 * Compliant with Nepal Inland Revenue Department (IRD) standards.
 * Dynamic rule structure with jurisdiction, effective dates, applicable categories,
 * and immutable disclaimers.
 * 
 * ARCHITECTURAL RULE:
 * Tax calculations are strictly deterministic TypeScript formulas.
 * AI models are NEVER used to calculate taxes, invoices, or financial ledgers.
 */

export interface TaxRule {
  id: string;
  nameEn: string;
  nameNe: string;
  code: string;
  jurisdiction: string; // e.g. "Nepal (IRD)"
  ratePct: number; // e.g. 13 for 13%
  effectiveFrom: string; // "2024-07-16" (Shrawan 1, 2081)
  effectiveUntil?: string;
  applicableTo: ("digital_advertising" | "sponsorship" | "events" | "membership" | "all")[];
  enabled: boolean;
  legalReferenceEn: string;
  legalReferenceNe: string;
  category: "vat" | "tds_withholding" | "service_tax" | "digital_service_tax";
  descriptionNe: string;
}

export const DEFAULT_TAX_RULES: TaxRule[] = [
  {
    id: "tax-vat-13",
    nameEn: "Nepal Standard Value Added Tax (VAT)",
    nameNe: "मूल्य अभिवृद्धि कर (१३% भ्याट)",
    code: "VAT-13",
    jurisdiction: "Nepal (Inland Revenue Department)",
    ratePct: 13,
    effectiveFrom: "2018-07-16",
    applicableTo: ["all"],
    enabled: true,
    legalReferenceEn: "Value Added Tax Act 2052, Schedule 1 / IRD Guidelines for Digital Media",
    legalReferenceNe: "मूल्य अभिवृद्धि कर ऐन २०५२ तथा आन्तरिक राजस्व विभाग निर्देशिका",
    category: "vat",
    descriptionNe: "नेपालभित्र सञ्चालित सबै डिजिटल विज्ञापन तथा प्रायोजन सेवाहरूमा अनिवार्य १३% भ्याट लागू हुन्छ।"
  },
  {
    id: "tax-tds-15",
    nameEn: "Advance Income Tax Withholding (TDS)",
    nameNe: "अग्रिम आयकर कट्टी (१.५% टीडीएस)",
    code: "TDS-1.5",
    jurisdiction: "Nepal (Inland Revenue Department)",
    ratePct: 1.5,
    effectiveFrom: "2022-07-17",
    applicableTo: ["digital_advertising", "sponsorship"],
    enabled: true,
    legalReferenceEn: "Income Tax Act 2058, Section 88(1)(ka) - Advertisement Services Withholding",
    legalReferenceNe: "आयकर ऐन २०५८ को दफा ८८(१)(क) - विज्ञापन सेवा बापत १.५% अग्रिम कर कट्टी",
    category: "tds_withholding",
    descriptionNe: "दर्तावाला कर्पोरेट विज्ञापनदाताले भुक्तानी गर्दा १.५% टीडीएस कट्टी गरी दाखिला भौचर उपलब्ध गराउनुपर्छ।"
  },
  {
    id: "tax-dst-foreign-2",
    nameEn: "Digital Services Tax (Foreign Entities)",
    nameNe: "विदेशी संस्था डिजिटल सेवा कर (२% DST)",
    code: "DST-2",
    jurisdiction: "Nepal (Cross-Border Digital Services)",
    ratePct: 2,
    effectiveFrom: "2023-07-17",
    applicableTo: ["digital_advertising"],
    enabled: false, // Optional for foreign non-resident advertisers
    legalReferenceEn: "Finance Act 2080, Section 20 - Non-Resident Digital Service Tax",
    legalReferenceNe: "आर्थिक ऐन २०८० को दफा २० - गैर-बासिन्दा डिजिटल सेवा कर",
    category: "digital_service_tax",
    descriptionNe: "नेपाल बाहिर दर्ता भएका अन्तर्राष्ट्रिय विज्ञापनदाताहरूको लागि २% डिजिटल सेवा कर।"
  }
];

export interface TaxCalculationResult {
  taxableAmountNpr: number;
  vatRatePct: number;
  vatAmountNpr: number;
  tdsRatePct: number;
  tdsAmountNpr: number;
  totalGrossPayableNpr: number;
  netReceivableNpr: number;
  appliedRules: TaxRule[];
  disclaimerNe: string;
  disclaimerEn: string;
}

/**
 * Deterministic Tax Calculator
 */
export function calculateCommercialTax(
  taxableAmount: number,
  serviceType: "digital_advertising" | "sponsorship" | "membership" | "all" = "digital_advertising",
  customRules?: TaxRule[]
): TaxCalculationResult {
  const rules = customRules || DEFAULT_TAX_RULES;
  const activeRules = rules.filter(r => 
    r.enabled && 
    (r.applicableTo.includes("all") || r.applicableTo.includes(serviceType))
  );

  const vatRule = activeRules.find(r => r.category === "vat");
  const tdsRule = activeRules.find(r => r.category === "tds_withholding");

  const vatRate = vatRule ? vatRule.ratePct : 13;
  const tdsRate = tdsRule ? tdsRule.ratePct : 1.5;

  const vatAmount = Math.round(taxableAmount * (vatRate / 100));
  const tdsAmount = Math.round(taxableAmount * (tdsRate / 100));
  const totalGrossPayable = taxableAmount + vatAmount;
  const netReceivable = totalGrossPayable - tdsAmount;

  return {
    taxableAmountNpr: taxableAmount,
    vatRatePct: vatRate,
    vatAmountNpr: vatAmount,
    tdsRatePct: tdsRate,
    tdsAmountNpr: tdsAmount,
    totalGrossPayableNpr: totalGrossPayable,
    netReceivableNpr: netReceivable,
    appliedRules: activeRules,
    disclaimerNe: "कर गणना हालको प्रणाली नियम अनुसार संरचित छ (प्रमाणित लेखा परीक्षक / कर सल्लाहकारबाट अन्तिम प्रमाणीकरण आवश्यक)।",
    disclaimerEn: "Tax calculation configured according to current system rules (subject to professional verification by licensed tax practitioner)."
  };
}
