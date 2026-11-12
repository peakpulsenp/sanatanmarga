/**
 * SanatanMarga RevenueOS - Campaign Delivery Pacing Engine
 * 
 * Tracks contracted delivery goals vs actual real-time impressions.
 * Computes pacing percentage, delivery run-rate, projected completion date,
 * and automated traffic allocation recommendations.
 */

import { Ad } from "@/src/types";

export interface CampaignPacingReport {
  campaignId: string;
  campaignTitle: string;
  advertiserName: string;
  position: string;
  startDate: string;
  endDate: string;
  totalDurationDays: number;
  elapsedDays: number;
  remainingDays: number;
  timeElapsedPct: number;
  
  targetImpressions: number;
  actualImpressions: number;
  expectedImpressionsToDate: number;
  
  pacingPct: number; // e.g. 96.4%
  pacingStatus: "on_pace" | "under_delivering" | "over_delivering" | "completed" | "scheduled";
  pacingStatusLabelNe: string;
  pacingStatusLabelEn: string;
  pacingColor: string; // Tailwind class
  
  currentDailyRunRate: number; // Impressions delivered per day
  requiredDailyRunRate: number; // Impressions needed per day to meet contract
  projectedEndImpressions: number;
  projectedCompletionPct: number;
  
  recommendationNe: string;
  recommendationEn: string;
}

export function calculateCampaignPacing(ad: Ad, currentDateIso?: string): CampaignPacingReport {
  const now = currentDateIso ? new Date(currentDateIso) : new Date();
  const start = new Date(ad.startDate);
  const end = new Date(ad.endDate);
  
  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay));
  
  let elapsedDays = 0;
  if (now.getTime() > start.getTime()) {
    elapsedDays = Math.min(totalDays, Math.max(1, Math.round((now.getTime() - start.getTime()) / msPerDay)));
  }
  const remainingDays = Math.max(0, totalDays - elapsedDays);
  const timeElapsedPct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  // Determine Target Impressions from budget or CPM
  let targetImpressions = 100000; // Default target benchmark
  if (ad.budget?.totalBudget && ad.budget?.pricingModel === "cpm") {
    const cpm = Number(ad.budget.cpmRate || 200);
    targetImpressions = Math.round((Number(ad.budget.totalBudget) / cpm) * 1000);
  } else if (ad.budget?.totalBudget) {
    // Flat estimate
    targetImpressions = Math.round((Number(ad.budget.totalBudget) / 250) * 1000);
  }

  const actualImpressions = Number(ad.impressions || 0);
  const targetDailyRate = targetImpressions / totalDays;
  const expectedImpressionsToDate = Math.round(targetDailyRate * elapsedDays);

  let pacingPct = 100;
  if (expectedImpressionsToDate > 0) {
    pacingPct = Number(((actualImpressions / expectedImpressionsToDate) * 100).toFixed(1));
  }

  // Pacing status evaluation
  let pacingStatus: CampaignPacingReport["pacingStatus"] = "on_pace";
  let pacingStatusLabelNe = "तालिका अनुसार (On Pace)";
  let pacingStatusLabelEn = "On Pace";
  let pacingColor = "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
  let recommendationNe = "अभियान सामान्य गतिमा सञ्चालित छ। कुनै परिमार्जन आवश्यक छैन।";
  let recommendationEn = "Campaign is delivering smoothly on schedule. No adjustment needed.";

  if (now.getTime() < start.getTime()) {
    pacingStatus = "scheduled";
    pacingStatusLabelNe = "तालिकाबद्ध (Scheduled)";
    pacingStatusLabelEn = "Scheduled";
    pacingColor = "text-blue-600 bg-blue-500/10 border-blue-500/20";
    recommendationNe = "अभियान तोकिएको मितिमा स्वचालित रूपमा सुरु हुनेछ।";
    recommendationEn = "Campaign is slated to start automatically on the scheduled date.";
  } else if (actualImpressions >= targetImpressions || remainingDays === 0) {
    pacingStatus = "completed";
    pacingStatusLabelNe = "सम्पन्न (Completed)";
    pacingStatusLabelEn = "Completed";
    pacingColor = "text-purple-600 bg-purple-500/10 border-purple-500/20";
    recommendationNe = "सम्झौता अनुसारको डेलिभरी १००% पूरा भयो। अन्तिम कार्यसम्पादन अडिट रिपोर्ट तयार छ।";
    recommendationEn = "Target impressions delivered in full. Audit report generated.";
  } else if (pacingPct < 90) {
    pacingStatus = "under_delivering";
    pacingStatusLabelNe = "डेलिभरी ढिलाइ (Under-delivering)";
    pacingStatusLabelEn = "Under-delivering";
    pacingColor = "text-amber-600 bg-amber-500/10 border-amber-500/20";
    recommendationNe = "डेलिभरी गति सुस्त छ। प्राथमिकता (Priority Weight) र फ्रिक्वेन्सी क्याप बढाउन सिफारिस गरिन्छ।";
    recommendationEn = "Delivery is lagging behind schedule. Consider boosting priority weight and frequency cap.";
  } else if (pacingPct > 110) {
    pacingStatus = "over_delivering";
    pacingStatusLabelNe = "तीव्र डेलिभरी (Over-delivering)";
    pacingStatusLabelEn = "Over-delivering";
    pacingColor = "text-blue-600 bg-blue-500/10 border-blue-500/20";
    recommendationNe = "अपेक्षित भन्दा छिटो अवलोकन प्राप्त भइरहेको छ। बजेट लामो समयसम्म वितरण गर्न गति समायोजन गर्नुहोस्।";
    recommendationEn = "Delivering faster than scheduled. Adjust weight to pace budget evenly across remaining days.";
  }

  const currentDailyRunRate = Math.round(actualImpressions / Math.max(elapsedDays, 1));
  const remainingImp = Math.max(0, targetImpressions - actualImpressions);
  const requiredDailyRunRate = Math.round(remainingImp / Math.max(remainingDays, 1));
  const projectedEndImpressions = Math.round(currentDailyRunRate * totalDays);
  const projectedCompletionPct = Math.round((projectedEndImpressions / targetImpressions) * 100);

  return {
    campaignId: ad.id,
    campaignTitle: ad.title || "Untitled Campaign",
    advertiserName: ad.advertiserName || "Commercial Partner",
    position: ad.position,
    startDate: ad.startDate,
    endDate: ad.endDate,
    totalDurationDays: totalDays,
    elapsedDays,
    remainingDays,
    timeElapsedPct,
    targetImpressions,
    actualImpressions,
    expectedImpressionsToDate,
    pacingPct,
    pacingStatus,
    pacingStatusLabelNe,
    pacingStatusLabelEn,
    pacingColor,
    currentDailyRunRate,
    requiredDailyRunRate,
    projectedEndImpressions,
    projectedCompletionPct,
    recommendationNe,
    recommendationEn
  };
}
