/**
 * SanatanMarga RevenueOS v3.0 — Financial Reconciliation OS
 * Automated reconciliation between Campaign Contracts, Delivery Events, Invoices, Payments, and Revenue Ledger.
 */

import { Ad } from "@/src/types";
import { adAnalyticsEngine } from "./adAnalyticsEngine";
import { billingEngine } from "./billingEngine";
import { revenueLedger } from "./revenueLedgerService";

export interface ReconciliationStatus {
  campaignId: string;
  contractValue: number;
  deliveredValue: number;
  invoicedValue: number;
  collectedValue: number;
  tdsWithheldValue: number;
  outstandingValue: number;
  remainingBudgetValue: number;
  ledgerBalanced: boolean;
  reconciliationPassed: boolean;
  violations: string[];
}

export class RevenueReconciliationEngine {
  public reconcileCampaign(campaign: Ad): ReconciliationStatus {
    const violations: string[] = [];
    const contractValue = Math.round(Number(campaign.budget?.totalBudget || 10000));
    
    // Performance analytics spend
    const metrics = adAnalyticsEngine.getCampaignMetrics(campaign);
    const deliveredValue = metrics.totalSpend;

    // Invoices for this campaign
    const invoices = billingEngine.getInvoices().filter((inv) => inv.campaignId === campaign.id);
    const invoicedValue = invoices.reduce((sum, inv) => sum + inv.totalPayableNpr, 0);

    // Payments for this campaign
    const payments = billingEngine.getPayments().filter((p) => {
      const inv = invoices.find((i) => i.id === p.invoiceId);
      return Boolean(inv);
    });

    const collectedValue = payments.reduce((sum, p) => sum + p.cashAmountNpr, 0);
    const tdsWithheldValue = payments.reduce((sum, p) => sum + p.tdsAmountNpr, 0);
    const totalPaid = collectedValue + tdsWithheldValue;

    const outstandingValue = Math.max(0, invoicedValue - totalPaid);
    const remainingBudgetValue = Math.max(0, contractValue - deliveredValue);

    // 1. Delivered <= Contracted
    if (deliveredValue > contractValue + 1) {
      violations.push(`Delivered value (रू ${deliveredValue}) exceeds contract ceiling (रू ${contractValue})`);
    }

    // 2. Invoiced <= Contracted
    if (invoicedValue > contractValue + 1) {
      violations.push(`Invoiced value (रू ${invoicedValue}) exceeds contract ceiling (रू ${contractValue})`);
    }

    // 3. Collected <= Invoiced
    if (totalPaid > invoicedValue + 1) {
      violations.push(`Total collected + TDS (रू ${totalPaid}) exceeds invoiced value (रू ${invoicedValue})`);
    }

    // 4. Outstanding >= 0
    if (outstandingValue < 0) {
      violations.push(`Outstanding value cannot be negative: ${outstandingValue}`);
    }

    // 5. Remaining Budget >= 0
    if (remainingBudgetValue < 0) {
      violations.push(`Remaining budget cannot be negative: ${remainingBudgetValue}`);
    }

    // 6. Ledger Debits = Ledger Credits check
    const ledgerEntries = revenueLedger.getAllEntries();
    let totalDebits = 0;
    let totalCredits = 0;
    ledgerEntries.forEach((e) => {
      if (e.entryType === "debit") totalDebits += e.amountNpr;
      if (e.entryType === "credit") totalCredits += e.amountNpr;
    });
    const ledgerBalanced = Math.abs(totalDebits - totalCredits) === 0;
    if (!ledgerBalanced) {
      violations.push(`Double-Entry Ledger imbalance detected: Debits (रू ${totalDebits}) != Credits (रू ${totalCredits})`);
    }

    // 7. Cancelled/suppressed campaign check
    if (((campaign.status as string) === "cancelled" || campaign.status === "rejected" || !campaign.isActive) && campaign.updatedAt) {
      // Check if delivery events exist AFTER updatedAt cancellation time
      const cancelTime = new Date(campaign.updatedAt).getTime();
      const eventsAfterCancel = adAnalyticsEngine.getCampaignMetrics(campaign).dailyTrend.filter(d => new Date(d.date).getTime() > cancelTime);
      if (eventsAfterCancel.some(e => e.spend > 0)) {
        violations.push(`Delivery spend detected after campaign cancellation/suppression date`);
      }
    }

    return {
      campaignId: campaign.id,
      contractValue,
      deliveredValue,
      invoicedValue,
      collectedValue,
      tdsWithheldValue,
      outstandingValue,
      remainingBudgetValue,
      ledgerBalanced,
      reconciliationPassed: violations.length === 0,
      violations
    };
  }
}

export const revenueReconciliationEngine = new RevenueReconciliationEngine();
