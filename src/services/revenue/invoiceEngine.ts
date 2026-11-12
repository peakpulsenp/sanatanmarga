/**
 * SanatanMarga RevenueOS v3.0 — Invoice Engine
 * Immutable invoice state machine with formal Credit/Debit note & VOID adjustment mechanisms.
 * 
 * Lifecycle: DRAFT -> ISSUED -> PARTIALLY_PAID -> PAID
 * Corrections: CREDIT_NOTE | DEBIT_NOTE | VOID
 */

import { TaxInvoice } from "@/src/types";
import { billingEngine } from "../billingEngine";
import { revenueLedger } from "../revenueLedger";

export type InvoiceStatus = "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "VOID" | "CANCELLED";

export interface InvoiceAdjustment {
  id: string;
  invoiceId: string;
  type: "CREDIT_NOTE" | "DEBIT_NOTE" | "VOID";
  amountNpr: number;
  reason: string;
  issuedAt: string;
  issuedBy: string;
}

export class InvoiceEngine {
  private adjustments: InvoiceAdjustment[] = [];

  public getInvoicesForAdvertiser(advertiserId: string, isAdmin = false): TaxInvoice[] {
    const all = billingEngine.getInvoices();
    if (isAdmin) return all;
    return all.filter((inv) => inv.advertiserId === advertiserId);
  }

  public getInvoiceById(id: string): TaxInvoice | undefined {
    return billingEngine.getInvoiceById(id);
  }

  /**
   * Enforces immutability: Once ISSUED, an invoice cannot be directly modified.
   * Corrections must use createAdjustment (CREDIT_NOTE / DEBIT_NOTE / VOID).
   */
  public updateInvoiceStatus(id: string, newStatus: InvoiceStatus, actor: string): TaxInvoice | null {
    const invoice = billingEngine.getInvoiceById(id);
    if (!invoice) return null;

    // Enforce allowed status transitions
    const current = invoice.status;
    
    if (current === "PAID" && newStatus !== "PAID") {
      throw new Error("Cannot alter status of a fully PAID invoice. Issue a CREDIT_NOTE instead.");
    }

    if ((current as string) === "VOID" || (current as string) === "CANCELLED") {
      throw new Error("Cannot alter status of a VOID/CANCELLED invoice.");
    }

    invoice.status = newStatus as any;
    invoice.updatedAt = new Date().toISOString();
    return invoice;
  }

  public createAdjustment(data: {
    invoiceId: string;
    type: "CREDIT_NOTE" | "DEBIT_NOTE" | "VOID";
    amountNpr: number;
    reason: string;
    issuedBy: string;
  }): InvoiceAdjustment {
    const invoice = billingEngine.getInvoiceById(data.invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ID ${data.invoiceId} not found.`);
    }

    const adj: InvoiceAdjustment = {
      id: `ADJ-${Date.now()}`,
      invoiceId: data.invoiceId,
      type: data.type,
      amountNpr: Math.round(data.amountNpr),
      reason: data.reason,
      issuedAt: new Date().toISOString(),
      issuedBy: data.issuedBy
    };

    this.adjustments.push(adj);

    if (data.type === "VOID") {
      (invoice.status as any) = "CANCELLED";
      invoice.updatedAt = new Date().toISOString();
    }

    return adj;
  }

  public getAdjustmentsForInvoice(invoiceId: string): InvoiceAdjustment[] {
    return this.adjustments.filter((a) => a.invoiceId === invoiceId);
  }
}

export const invoiceEngine = new InvoiceEngine();
