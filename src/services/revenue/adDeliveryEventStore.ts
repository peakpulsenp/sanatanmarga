/**
 * SanatanMarga RevenueOS v3.0 — Ad Delivery Event Store Bridge
 * Authoritative bridge for delivery event logging and metrics.
 */

export { 
  adDeliveryEventStore,
  AdDeliveryEventStore
} from "../adDeliveryEventStore";

export type {
  AdDeliveryEvent,
  CampaignFinancials as CampaignFinancialSummary
} from "@/src/types";
