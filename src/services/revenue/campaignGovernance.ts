/**
 * SanatanMarga RevenueOS v3.0 — Campaign Governance Engine
 * Validates disclosures, advertiser metadata, budget constraints, and compliance.
 */

import { Ad } from "@/src/types";

export interface GovernanceValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class CampaignGovernance {
  public validateCampaign(campaign: Ad): GovernanceValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Sponsored disclosure requirement
    if (campaign.isSponsored) {
      if (!campaign.advertiserName || campaign.advertiserName.trim() === "") {
        errors.push("प्रायोजित विज्ञापनमा विज्ञापनदाताको स्पष्ट नाम (Advertiser Name) अनिवार्य छ।");
      }
    }

    // 2. Destination URL & HTTPS check
    if (!campaign.linkUrl) {
      errors.push("विज्ञापनको गन्तव्य लिङ्क (Destination URL) खाली छ।");
    } else if (!campaign.linkUrl.startsWith("https://") && !campaign.linkUrl.startsWith("http://")) {
      errors.push("गन्तव्य URL मा 'https://' वा 'http://' प्रोटोकल समावेश हुनुपर्छ।");
    }

    // 3. Asset Image check
    if (!campaign.imageUrl) {
      errors.push("विज्ञापनको ब्यानर तस्बिर (Creative Asset) आवश्यक छ।");
    }

    // 4. Budget check
    if (campaign.budget) {
      if (campaign.budget.totalBudget <= 0) {
        errors.push("अभियानको बजेट ० भन्दा बढी हुनुपर्छ।");
      }
    }

    // 5. Date validation
    if (campaign.startDate && campaign.endDate) {
      if (new Date(campaign.endDate) <= new Date(campaign.startDate)) {
        errors.push("समाप्ति मिति सुरु मिति भन्दा पछाडि हुनुपर्छ।");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  public isSuppressedOrCancelled(campaign: Ad): boolean {
    return (
      (campaign.status as string) === "cancelled" ||
      campaign.status === "rejected" ||
      campaign.status === "paused" ||
      campaign.isActive === false
    );
  }
}

export const campaignGovernance = new CampaignGovernance();
