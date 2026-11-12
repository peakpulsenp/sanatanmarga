/**
 * SanatanMarga RevenueOS - Financial Ledger & Double-Entry Accounting Service
 * 
 * Deterministic financial source of truth.
 * Replaces loose metric state with immutable ledger transaction logs.
 * 
 * Canonical Pipeline:
 * Campaign Approved -> Rate Calculation -> Tax Invoice Issued -> Payment Received -> Ledger Entry -> Reconciliation
 */

export interface LedgerEntry {
  id: string; // e.g. "LEDGER-2083-001"
  timestamp: string; // ISO String
  fiscalYear: string; // e.g. "2082/83"
  entityType: "invoice_issued" | "payment_received" | "tds_withheld" | "refund" | "bad_debt_writeoff" | "adjustment";
  entityId: string; // e.g. invoice id or payment id
  invoiceNumber: string; // e.g. "SM-INV-2083-0146"
  advertiserId: string;
  advertiserName: string;
  advertiserPan: string;
  account: 
    | "accounts_receivable" 
    | "advertising_revenue" 
    | "vat_liability_payable" 
    | "tds_withholding_receivable" 
    | "cash_bank_nepal";
  entryType: "debit" | "credit";
  amountNpr: number;
  description: string;
  referenceNumber?: string; // Bank voucher / transaction code / eSewa Txn ID
  status: "recorded" | "reconciled" | "audited";
  auditActor: string; // Name/Email of editor or revenue officer
}

export interface FinancialStatementSummary {
  grossBilledRevenueNpr: number;
  netTaxableRevenueNpr: number;
  totalVatLiabilityNpr: number;
  totalTdsWithheldNpr: number;
  cashCollectedNpr: number;
  accountsReceivableNpr: number;
  reconciledEntriesCount: number;
  pendingReconciliationCount: number;
  lastAuditedTimestamp: string;
}

const STORAGE_KEY = "sanatan_revenue_ledger_v1";

export const INITIAL_SAMPLE_LEDGER: LedgerEntry[] = [
  // 1. Ncell Invoice
  {
    id: "LEDGER-2083-001",
    timestamp: "2026-08-01T10:00:00Z",
    fiscalYear: "2082/83",
    entityType: "invoice_issued",
    entityId: "inv-2083-001",
    invoiceNumber: "SM-INV-2083-0146",
    advertiserId: "adv-ncell-01",
    advertiserName: "Ncell Axiata Ltd.",
    advertiserPan: "300054210",
    account: "accounts_receivable",
    entryType: "debit",
    amountNpr: 135600,
    description: "भाद्र महिनाको गृह पृष्ठ ब्यानर तथा ५जी लन्च प्रायोजन बीजक जारी।",
    status: "reconciled",
    auditActor: "Finance Admin (CA Niraj)"
  },
  {
    id: "LEDGER-2083-002",
    timestamp: "2026-08-01T10:00:00Z",
    fiscalYear: "2082/83",
    entityType: "invoice_issued",
    entityId: "inv-2083-001",
    invoiceNumber: "SM-INV-2083-0146",
    advertiserId: "adv-ncell-01",
    advertiserName: "Ncell Axiata Ltd.",
    advertiserPan: "300054210",
    account: "advertising_revenue",
    entryType: "credit",
    amountNpr: 120000,
    description: "करयोग्य विज्ञापन सेवा आय",
    status: "reconciled",
    auditActor: "Finance Admin (CA Niraj)"
  },
  {
    id: "LEDGER-2083-003",
    timestamp: "2026-08-01T10:00:00Z",
    fiscalYear: "2082/83",
    entityType: "invoice_issued",
    entityId: "inv-2083-001",
    invoiceNumber: "SM-INV-2083-0146",
    advertiserId: "adv-ncell-01",
    advertiserName: "Ncell Axiata Ltd.",
    advertiserPan: "300054210",
    account: "vat_liability_payable",
    entryType: "credit",
    amountNpr: 15600,
    description: "१३% मूल्य अभिवृद्धि कर (IRD दायित्व)",
    status: "reconciled",
    auditActor: "Finance Admin (CA Niraj)"
  },
  // Ncell Payment Received
  {
    id: "LEDGER-2083-004",
    timestamp: "2026-08-10T14:30:00Z",
    fiscalYear: "2082/83",
    entityType: "payment_received",
    entityId: "pay-ncell-01",
    invoiceNumber: "SM-INV-2083-0146",
    advertiserId: "adv-ncell-01",
    advertiserName: "Ncell Axiata Ltd.",
    advertiserPan: "300054210",
    account: "cash_bank_nepal",
    entryType: "debit",
    amountNpr: 133800,
    referenceNumber: "NABIL-TXN-8849201",
    description: "नबिल बैंक कर्पोरेट ट्रान्सफर मार्फत प्राप्त भुक्तानी।",
    status: "reconciled",
    auditActor: "Finance Admin (CA Niraj)"
  },
  {
    id: "LEDGER-2083-005",
    timestamp: "2026-08-10T14:30:00Z",
    fiscalYear: "2082/83",
    entityType: "tds_withheld",
    entityId: "pay-ncell-01",
    invoiceNumber: "SM-INV-2083-0146",
    advertiserId: "adv-ncell-01",
    advertiserName: "Ncell Axiata Ltd.",
    advertiserPan: "300054210",
    account: "tds_withholding_receivable",
    entryType: "debit",
    amountNpr: 1800,
    referenceNumber: "IRD-TDS-CERT-4410",
    description: "१.५% अग्रिम कर कट्टी (दफा ८८ अनुसार दाखिला भौचर प्राप्त)।",
    status: "reconciled",
    auditActor: "Finance Admin (CA Niraj)"
  },
  {
    id: "LEDGER-2083-006",
    timestamp: "2026-08-10T14:30:00Z",
    fiscalYear: "2082/83",
    entityType: "payment_received",
    entityId: "pay-ncell-01",
    invoiceNumber: "SM-INV-2083-0146",
    advertiserId: "adv-ncell-01",
    advertiserName: "Ncell Axiata Ltd.",
    advertiserPan: "300054210",
    account: "accounts_receivable",
    entryType: "credit",
    amountNpr: 135600,
    description: "Ncell विज्ञापन खाता चुक्ता (Cleared Receivable)।",
    status: "reconciled",
    auditActor: "Finance Admin (CA Niraj)"
  },

  // 2. Global IME Bank Invoice
  {
    id: "LEDGER-2083-007",
    timestamp: "2026-08-05T11:15:00Z",
    fiscalYear: "2082/83",
    entityType: "invoice_issued",
    entityId: "inv-2083-002",
    invoiceNumber: "SM-INV-2083-0147",
    advertiserId: "adv-globalime-02",
    advertiserName: "Global IME Bank Ltd.",
    advertiserPan: "301984211",
    account: "accounts_receivable",
    entryType: "debit",
    amountNpr: 84750,
    description: "अर्थ तथा सेयर विधा मुख्य प्रायोजन वार्षिक सम्झौता किस्ता।",
    status: "reconciled",
    auditActor: "Finance Admin (CA Niraj)"
  },
  {
    id: "LEDGER-2083-008",
    timestamp: "2026-08-05T11:15:00Z",
    fiscalYear: "2082/83",
    entityType: "invoice_issued",
    entityId: "inv-2083-002",
    invoiceNumber: "SM-INV-2083-0147",
    advertiserId: "adv-globalime-02",
    advertiserName: "Global IME Bank Ltd.",
    advertiserPan: "301984211",
    account: "advertising_revenue",
    entryType: "credit",
    amountNpr: 75000,
    description: "सेयर तथा अर्थ विधा विज्ञापन आय",
    status: "reconciled",
    auditActor: "Finance Admin (CA Niraj)"
  },
  {
    id: "LEDGER-2083-009",
    timestamp: "2026-08-05T11:15:00Z",
    fiscalYear: "2082/83",
    entityType: "invoice_issued",
    entityId: "inv-2083-002",
    invoiceNumber: "SM-INV-2083-0147",
    advertiserId: "adv-globalime-02",
    advertiserName: "Global IME Bank Ltd.",
    advertiserPan: "301984211",
    account: "vat_liability_payable",
    entryType: "credit",
    amountNpr: 9750,
    description: "१३% मूल्य अभिवृद्धि कर (IRD दायित्व)",
    status: "reconciled",
    auditActor: "Finance Admin (CA Niraj)"
  },

  // 3. Pokhara Tourism Board Invoice (Unpaid - Outstanding Receivable)
  {
    id: "LEDGER-2083-010",
    timestamp: "2026-08-12T09:00:00Z",
    fiscalYear: "2082/83",
    entityType: "invoice_issued",
    entityId: "inv-2083-003",
    invoiceNumber: "SM-INV-2083-0148",
    advertiserId: "adv-pokhara-03",
    advertiserName: "Pokhara Tourism Promotion Committee",
    advertiserPan: "602481092",
    account: "accounts_receivable",
    entryType: "debit",
    amountNpr: 50850,
    description: "कास्की तथा गण्डकी प्रदेश पर्यटन हब विशेष डिजिटल प्रवर्धन।",
    status: "recorded",
    auditActor: "Revenue Lead (Sagar R.)"
  },
  {
    id: "LEDGER-2083-011",
    timestamp: "2026-08-12T09:00:00Z",
    fiscalYear: "2082/83",
    entityType: "invoice_issued",
    entityId: "inv-2083-003",
    invoiceNumber: "SM-INV-2083-0148",
    advertiserId: "adv-pokhara-03",
    advertiserName: "Pokhara Tourism Promotion Committee",
    advertiserPan: "602481092",
    account: "advertising_revenue",
    entryType: "credit",
    amountNpr: 45000,
    description: "प्रादेशिक डिजिटल पर्यटन विज्ञापन आय",
    status: "recorded",
    auditActor: "Revenue Lead (Sagar R.)"
  },
  {
    id: "LEDGER-2083-012",
    timestamp: "2026-08-12T09:00:00Z",
    fiscalYear: "2082/83",
    entityType: "invoice_issued",
    entityId: "inv-2083-003",
    invoiceNumber: "SM-INV-2083-0148",
    advertiserId: "adv-pokhara-03",
    advertiserName: "Pokhara Tourism Promotion Committee",
    advertiserPan: "602481092",
    account: "vat_liability_payable",
    entryType: "credit",
    amountNpr: 5850,
    description: "१३% मूल्य अभिवृद्धि कर (IRD दायित्व)",
    status: "recorded",
    auditActor: "Revenue Lead (Sagar R.)"
  }
];

export class RevenueLedgerService {
  private entries: LedgerEntry[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.entries = JSON.parse(saved);
      } else {
        this.entries = INITIAL_SAMPLE_LEDGER;
        this.saveToStorage();
      }
    } catch {
      this.entries = INITIAL_SAMPLE_LEDGER;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch (e) {
      console.warn("Failed to persist revenue ledger:", e);
    }
  }

  public getAllEntries(): LedgerEntry[] {
    return [...this.entries];
  }

  /**
   * Records Invoice Issuance in Double-Entry Ledger
   */
  public recordInvoiceIssued(invoice: {
    id: string;
    invoiceNumber: string;
    advertiserId: string;
    advertiserName: string;
    advertiserPan: string;
    taxableAmountNpr: number;
    vatAmountNpr: number;
    totalPayableNpr: number;
    campaignTitle: string;
    actor: string;
  }): LedgerEntry[] {
    const timestamp = new Date().toISOString();
    const fiscalYear = "2082/83";
    const nextNum = this.entries.length + 1;

    const drAr: LedgerEntry = {
      id: `LEDGER-2083-${nextNum.toString().padStart(3, "0")}`,
      timestamp,
      fiscalYear,
      entityType: "invoice_issued",
      entityId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      advertiserId: invoice.advertiserId,
      advertiserName: invoice.advertiserName,
      advertiserPan: invoice.advertiserPan,
      account: "accounts_receivable",
      entryType: "debit",
      amountNpr: invoice.totalPayableNpr,
      description: `बीजक जारी: ${invoice.campaignTitle}`,
      status: "recorded",
      auditActor: invoice.actor || "Authorized Revenue Officer"
    };

    const crRev: LedgerEntry = {
      id: `LEDGER-2083-${(nextNum + 1).toString().padStart(3, "0")}`,
      timestamp,
      fiscalYear,
      entityType: "invoice_issued",
      entityId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      advertiserId: invoice.advertiserId,
      advertiserName: invoice.advertiserName,
      advertiserPan: invoice.advertiserPan,
      account: "advertising_revenue",
      entryType: "credit",
      amountNpr: invoice.taxableAmountNpr,
      description: `विज्ञापन सेवा आय: ${invoice.campaignTitle}`,
      status: "recorded",
      auditActor: invoice.actor || "Authorized Revenue Officer"
    };

    const crVat: LedgerEntry = {
      id: `LEDGER-2083-${(nextNum + 2).toString().padStart(3, "0")}`,
      timestamp,
      fiscalYear,
      entityType: "invoice_issued",
      entityId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      advertiserId: invoice.advertiserId,
      advertiserName: invoice.advertiserName,
      advertiserPan: invoice.advertiserPan,
      account: "vat_liability_payable",
      entryType: "credit",
      amountNpr: invoice.vatAmountNpr,
      description: `१३% मूल्य अभिवृद्धि कर (IRD दायित्व): ${invoice.invoiceNumber}`,
      status: "recorded",
      auditActor: invoice.actor || "Authorized Revenue Officer"
    };

    const newEntries = [drAr, crRev, crVat];
    this.entries = [...this.entries, ...newEntries];
    this.saveToStorage();
    return newEntries;
  }

  /**
   * Records Payment and TDS Withholding
   */
  public recordPaymentReceived(payment: {
    invoiceId: string;
    invoiceNumber: string;
    advertiserId: string;
    advertiserName: string;
    advertiserPan: string;
    cashAmountNpr: number;
    tdsAmountNpr: number;
    referenceNumber: string;
    actor: string;
  }): LedgerEntry[] {
    const timestamp = new Date().toISOString();
    const fiscalYear = "2082/83";
    const nextNum = this.entries.length + 1;
    const totalCreditAr = payment.cashAmountNpr + payment.tdsAmountNpr;

    const drCash: LedgerEntry = {
      id: `LEDGER-2083-${nextNum.toString().padStart(3, "0")}`,
      timestamp,
      fiscalYear,
      entityType: "payment_received",
      entityId: `pay-${Date.now()}`,
      invoiceNumber: payment.invoiceNumber,
      advertiserId: payment.advertiserId,
      advertiserName: payment.advertiserName,
      advertiserPan: payment.advertiserPan,
      account: "cash_bank_nepal",
      entryType: "debit",
      amountNpr: payment.cashAmountNpr,
      referenceNumber: payment.referenceNumber,
      description: `नगद/बैंक भुक्तानी प्राप्त: ${payment.invoiceNumber}`,
      status: "reconciled",
      auditActor: payment.actor || "Finance Admin"
    };

    const drTds: LedgerEntry = {
      id: `LEDGER-2083-${(nextNum + 1).toString().padStart(3, "0")}`,
      timestamp,
      fiscalYear,
      entityType: "tds_withheld",
      entityId: `pay-${Date.now()}`,
      invoiceNumber: payment.invoiceNumber,
      advertiserId: payment.advertiserId,
      advertiserName: payment.advertiserName,
      advertiserPan: payment.advertiserPan,
      account: "tds_withholding_receivable",
      entryType: "debit",
      amountNpr: payment.tdsAmountNpr,
      referenceNumber: payment.referenceNumber,
      description: `१.५% अग्रिम कर कट्टी (TDS Withheld): ${payment.invoiceNumber}`,
      status: "reconciled",
      auditActor: payment.actor || "Finance Admin"
    };

    const crAr: LedgerEntry = {
      id: `LEDGER-2083-${(nextNum + 2).toString().padStart(3, "0")}`,
      timestamp,
      fiscalYear,
      entityType: "payment_received",
      entityId: `pay-${Date.now()}`,
      invoiceNumber: payment.invoiceNumber,
      advertiserId: payment.advertiserId,
      advertiserName: payment.advertiserName,
      advertiserPan: payment.advertiserPan,
      account: "accounts_receivable",
      entryType: "credit",
      amountNpr: totalCreditAr,
      referenceNumber: payment.referenceNumber,
      description: `भुक्तानी फर्स्यौट (AR Cleared): ${payment.invoiceNumber}`,
      status: "reconciled",
      auditActor: payment.actor || "Finance Admin"
    };

    const newEntries = [drCash, drTds, crAr];
    this.entries = [...this.entries, ...newEntries];
    this.saveToStorage();
    return newEntries;
  }

  /**
   * Deterministic Financial Statement Calculation from Ledger
   */
  public getFinancialStatements(): FinancialStatementSummary {
    let grossBilled = 0;
    let netTaxable = 0;
    let vatLiability = 0;
    let tdsWithheld = 0;
    let cashCollected = 0;
    let arDebit = 0;
    let arCredit = 0;
    let reconciledCount = 0;
    let pendingCount = 0;

    this.entries.forEach(entry => {
      if (entry.status === "reconciled" || entry.status === "audited") {
        reconciledCount++;
      } else {
        pendingCount++;
      }

      if (entry.account === "advertising_revenue" && entry.entryType === "credit") {
        netTaxable += entry.amountNpr;
      }
      if (entry.account === "vat_liability_payable" && entry.entryType === "credit") {
        vatLiability += entry.amountNpr;
      }
      if (entry.account === "tds_withholding_receivable" && entry.entryType === "debit") {
        tdsWithheld += entry.amountNpr;
      }
      if (entry.account === "cash_bank_nepal" && entry.entryType === "debit") {
        cashCollected += entry.amountNpr;
      }
      if (entry.account === "accounts_receivable") {
        if (entry.entryType === "debit") arDebit += entry.amountNpr;
        if (entry.entryType === "credit") arCredit += entry.amountNpr;
      }
    });

    grossBilled = netTaxable + vatLiability;
    const accountsReceivable = Math.max(0, arDebit - arCredit);

    return {
      grossBilledRevenueNpr: grossBilled,
      netTaxableRevenueNpr: netTaxable,
      totalVatLiabilityNpr: vatLiability,
      totalTdsWithheldNpr: tdsWithheld,
      cashCollectedNpr: cashCollected,
      accountsReceivableNpr: accountsReceivable,
      reconciledEntriesCount: reconciledCount,
      pendingReconciliationCount: pendingCount,
      lastAuditedTimestamp: new Date().toISOString()
    };
  }

  public resetLedger() {
    this.entries = INITIAL_SAMPLE_LEDGER;
    this.saveToStorage();
  }
}

export const revenueLedger = new RevenueLedgerService();
