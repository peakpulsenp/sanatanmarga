/**
 * SanatanMarga RevenueOS v3.0 — Billing, Tax Invoicing & Payment OS
 * 
 * Manages official VAT tax invoices (13%), 1.5% TDS withholding certificates,
 * and double-entry synchronization with Revenue Ledger v3.0.
 */

import { TaxInvoice, PaymentReceipt } from "@/src/types";
import { advertiserRegistry } from "./advertiserRegistry";
import { revenueLedger } from "./revenueLedger";
import { db } from "@/src/lib/firebase";
import { doc, setDoc } from "@/src/lib/firebase";

export const SAMPLE_TAX_INVOICES: TaxInvoice[] = [
  {
    id: "inv-2083-001",
    invoiceNumber: "SM-INV-2083-0146",
    campaignId: "camp-ncell-5g",
    campaignTitle: "Ncell 5G Nepal Ultra Speed Launch Banner",
    advertiserId: "adv-ncell",
    advertiserName: "एनसेल एक्सियाटा लिमिटेड (Ncell Axiata Ltd.)",
    advertiserPan: "300123456",
    advertiserAddress: "एकान्तकुना, ललितपुर, नेपाल",
    taxableAmountNpr: 120000,
    vatRatePct: 13,
    vatAmountNpr: 15600,
    tdsRatePct: 1.5,
    tdsAmountNpr: 1800,
    totalPayableNpr: 135600,
    netReceivableNpr: 133800,
    status: "PAID",
    dueDate: "2026-08-15",
    issuedAt: "2026-08-01T10:00:00Z",
    paidAt: "2026-08-10T14:30:00Z",
    notes: "गृह पृष्ठ मुख्य प्रायोजन तथा ५जी लन्च अभियान बीजक।",
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-10T14:30:00Z"
  },
  {
    id: "inv-2083-002",
    invoiceNumber: "SM-INV-2083-0147",
    campaignId: "camp-global-ime",
    campaignTitle: "Global IME Digital Banking Mobile App Sponsor",
    advertiserId: "adv-global-ime",
    advertiserName: "ग्लोबल आईएमई बैंक लिमिटेड (Global IME Bank Ltd.)",
    advertiserPan: "301555666",
    advertiserAddress: "कमलादी, काठमाडौँ",
    taxableAmountNpr: 75000,
    vatRatePct: 13,
    vatAmountNpr: 9750,
    tdsRatePct: 1.5,
    tdsAmountNpr: 1125,
    totalPayableNpr: 84750,
    netReceivableNpr: 83625,
    status: "ISSUED",
    dueDate: "2026-09-05",
    issuedAt: "2026-08-05T11:15:00Z",
    notes: "अर्थ तथा सेयर विधा प्रायोजन प्रथम किस्ता।",
    createdAt: "2026-08-05T11:15:00Z",
    updatedAt: "2026-08-05T11:15:00Z"
  },
  {
    id: "inv-2083-003",
    invoiceNumber: "SM-INV-2083-0148",
    campaignId: "camp-pokhara-tour",
    campaignTitle: "Visit Pokhara Year 2026 Digital Destination Banner",
    advertiserId: "adv-pokhara-tourism",
    advertiserName: "पोखरा पर्यटन बोर्ड (Pokhara Tourism Board)",
    advertiserPan: "600444333",
    advertiserAddress: "लेकसाइड, पोखरा, कास्की",
    taxableAmountNpr: 45000,
    vatRatePct: 13,
    vatAmountNpr: 5850,
    tdsRatePct: 1.5,
    tdsAmountNpr: 675,
    totalPayableNpr: 50850,
    netReceivableNpr: 50175,
    status: "ISSUED",
    dueDate: "2026-09-12",
    issuedAt: "2026-08-12T09:00:00Z",
    notes: "कास्की तथा गण्डकी प्रदेश पर्यटन हब विशेष डिजिटल प्रवर्धन।",
    createdAt: "2026-08-12T09:00:00Z",
    updatedAt: "2026-08-12T09:00:00Z"
  }
];

export const SAMPLE_PAYMENTS: PaymentReceipt[] = [
  {
    id: "pay-2083-001",
    paymentId: "PAY-2083-001",
    invoiceId: "inv-2083-001",
    invoiceNumber: "SM-INV-2083-0146",
    advertiserId: "adv-ncell",
    advertiserName: "एनसेल एक्सियाटा लिमिटेड (Ncell Axiata Ltd.)",
    advertiserPan: "300123456",
    amountNpr: 135600,
    cashAmountNpr: 133800,
    tdsAmountNpr: 1800,
    currency: "NPR",
    paymentMethod: "bank_transfer",
    transactionReference: "NABIL-TXN-8849201",
    paidAt: "2026-08-10T14:30:00Z",
    verifiedBy: "Finance Admin (CA Niraj)",
    verifiedAt: "2026-08-10T15:00:00Z",
    status: "VERIFIED",
    createdAt: "2026-08-10T14:30:00Z"
  }
];

export class BillingEngine {
  private invoices: TaxInvoice[] = SAMPLE_TAX_INVOICES;
  private payments: PaymentReceipt[] = SAMPLE_PAYMENTS;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const invRaw = localStorage.getItem("sanatan_tax_invoices");
      if (invRaw) this.invoices = JSON.parse(invRaw);

      const payRaw = localStorage.getItem("sanatan_payment_receipts");
      if (payRaw) this.payments = JSON.parse(payRaw);
    } catch {}
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("sanatan_tax_invoices", JSON.stringify(this.invoices));
      localStorage.setItem("sanatan_payment_receipts", JSON.stringify(this.payments));
    } catch {}
  }

  public getInvoices(): TaxInvoice[] {
    return this.invoices;
  }

  public getInvoiceById(id: string): TaxInvoice | undefined {
    return this.invoices.find(i => i.id === id);
  }

  public getPayments(): PaymentReceipt[] {
    return this.payments;
  }

  public calculateInvoice(data: {
    baseAmount: number;
    vatRate?: number;
    tdsRate?: number;
    campaignId?: string;
    advertiserId?: string;
    billingCycle?: string;
  }) {
    const vatRate = data.vatRate !== undefined ? data.vatRate : 13;
    const tdsRate = data.tdsRate !== undefined ? data.tdsRate : 1.5;
    const grossAmount = Math.round(data.baseAmount);
    const vatAmount = Math.round(grossAmount * (vatRate / 100));
    const tdsAmount = Math.round(grossAmount * (tdsRate / 100));
    const totalPayable = grossAmount + vatAmount;
    const netPayable = totalPayable;
    const tdsReceivableCredit = tdsAmount;

    return {
      grossAmount,
      vatRate,
      vatAmount,
      tdsRate,
      tdsAmount,
      totalPayable,
      netPayable,
      tdsReceivableCredit
    };
  }

  /**
   * Issues a official Tax Invoice (13% VAT, 1.5% TDS)
   * Automatically updates double-entry Revenue Ledger v3
   */
  public createInvoice(data: {
    campaignId: string;
    campaignTitle: string;
    advertiserId: string;
    advertiserName: string;
    advertiserPan: string;
    advertiserAddress?: string;
    taxableAmountNpr: number;
    dueDate: string;
    notes?: string;
    auditActor?: string;
  }): TaxInvoice {
    const vatRate = 13;
    const tdsRate = 1.5;
    const taxable = Math.round(data.taxableAmountNpr);
    const vatAmount = Math.round(taxable * (vatRate / 100));
    const tdsAmount = Math.round(taxable * (tdsRate / 100));
    const totalPayable = taxable + vatAmount;
    const netReceivable = totalPayable - tdsAmount;

    const count = this.invoices.length + 1;
    const invoiceNumber = `SM-INV-2083-0${148 + count}`;

    const newInvoice: TaxInvoice = {
      id: `inv-2083-${count.toString().padStart(3, "0")}`,
      invoiceNumber,
      campaignId: data.campaignId,
      campaignTitle: data.campaignTitle,
      advertiserId: data.advertiserId,
      advertiserName: data.advertiserName,
      advertiserPan: data.advertiserPan,
      advertiserAddress: data.advertiserAddress || "काठमाडौँ, नेपाल",
      taxableAmountNpr: taxable,
      vatRatePct: vatRate,
      vatAmountNpr: vatAmount,
      tdsRatePct: tdsRate,
      tdsAmountNpr: tdsAmount,
      totalPayableNpr: totalPayable,
      netReceivableNpr: netReceivable,
      status: "ISSUED",
      dueDate: data.dueDate,
      issuedAt: new Date().toISOString(),
      notes: data.notes || "विज्ञापन सेवा बीजक जारी।",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.invoices.unshift(newInvoice);
    this.saveToStorage();

    // Double-Entry Ledger Registration
    try {
      revenueLedger.recordInvoiceIssued({
        id: newInvoice.id,
        invoiceNumber: newInvoice.invoiceNumber,
        advertiserId: newInvoice.advertiserId,
        advertiserName: newInvoice.advertiserName,
        advertiserPan: newInvoice.advertiserPan,
        taxableAmountNpr: newInvoice.taxableAmountNpr,
        vatAmountNpr: newInvoice.vatAmountNpr,
        totalPayableNpr: newInvoice.totalPayableNpr,
        campaignTitle: newInvoice.campaignTitle,
        actor: data.auditActor || "Billing Admin"
      });
    } catch {}

    if (db) {
      setDoc(doc(db, "taxInvoices", newInvoice.id), newInvoice).catch(() => {});
    }

    return newInvoice;
  }

  /**
   * Records a Verified Payment & TDS Withholding Certificate
   */
  public recordPayment(data: {
    invoiceId: string;
    amountNpr: number;
    cashAmountNpr: number;
    tdsAmountNpr: number;
    paymentMethod: PaymentReceipt["paymentMethod"];
    transactionReference: string;
    verifiedBy: string;
  }): PaymentReceipt | null {
    const invoice = this.getInvoiceById(data.invoiceId);
    if (!invoice) return null;

    const payCount = this.payments.length + 1;
    const paymentId = `PAY-2083-${payCount.toString().padStart(3, "0")}`;
    const timestamp = new Date().toISOString();

    const newPayment: PaymentReceipt = {
      id: `pay-${Date.now()}`,
      paymentId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      advertiserId: invoice.advertiserId,
      advertiserName: invoice.advertiserName,
      advertiserPan: invoice.advertiserPan,
      amountNpr: data.amountNpr,
      cashAmountNpr: data.cashAmountNpr,
      tdsAmountNpr: data.tdsAmountNpr,
      currency: "NPR",
      paymentMethod: data.paymentMethod,
      transactionReference: data.transactionReference,
      paidAt: timestamp,
      verifiedBy: data.verifiedBy,
      verifiedAt: timestamp,
      status: "VERIFIED",
      createdAt: timestamp
    };

    this.payments.unshift(newPayment);

    // Update Invoice status to PAID
    invoice.status = "PAID";
    invoice.paidAt = timestamp;
    invoice.updatedAt = timestamp;

    this.saveToStorage();

    // Double-Entry Ledger Sync for Cash & TDS
    try {
      revenueLedger.recordPaymentReceived({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        advertiserId: invoice.advertiserId,
        advertiserName: invoice.advertiserName,
        advertiserPan: invoice.advertiserPan,
        cashAmountNpr: data.cashAmountNpr,
        tdsAmountNpr: data.tdsAmountNpr,
        referenceNumber: data.transactionReference,
        actor: data.verifiedBy
      });
    } catch {}

    if (db) {
      setDoc(doc(db, "paymentReceipts", newPayment.id), newPayment).catch(() => {});
      setDoc(doc(db, "taxInvoices", invoice.id), invoice, { merge: true }).catch(() => {});
    }

    return newPayment;
  }
}

export const billingEngine = new BillingEngine();
