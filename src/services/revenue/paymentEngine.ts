/**
 * SanatanMarga RevenueOS v3.0 — Payment Engine
 * Manages payment receipts with atomic double-entry ledger posting and 1.5% TDS withholding treatment.
 */

import { PaymentReceipt } from "@/src/types";
import { billingEngine } from "./billingEngine";
import { revenueLedger } from "./revenueLedgerService";

export interface PaymentRecord {
  id: string;
  advertiserId: string;
  invoiceId: string;
  amount: number; // Gross Total (Cash + TDS)
  paymentDate: string;
  paymentMethod: "bank_transfer" | "esewa" | "khalti" | "cheque" | "connect_ips";
  referenceNumber: string;
  tdsAmount: number;
  netAmount: number; // Cash received
  status: "VERIFIED" | "PENDING" | "REJECTED";
  createdAt: string;
}

export class PaymentEngine {
  public getPaymentsForAdvertiser(advertiserId: string, isAdmin = false): PaymentReceipt[] {
    const all = billingEngine.getPayments();
    if (isAdmin) return all;
    return all.filter((p) => p.advertiserId === advertiserId);
  }

  public recordPaymentAtomically(data: {
    invoiceId: string;
    amount: number;
    cashAmount: number;
    tdsAmount: number;
    paymentMethod: "bank_transfer" | "esewa" | "khalti" | "cheque" | "connect_ips";
    referenceNumber: string;
    verifiedBy: string;
  }): PaymentReceipt | null {
    // Atomic execution with billingEngine & double-entry revenueLedger
    return billingEngine.recordPayment({
      invoiceId: data.invoiceId,
      amountNpr: data.amount,
      cashAmountNpr: data.cashAmount,
      tdsAmountNpr: data.tdsAmount,
      paymentMethod: data.paymentMethod as any,
      transactionReference: data.referenceNumber,
      verifiedBy: data.verifiedBy
    });
  }
}

export const paymentEngine = new PaymentEngine();
