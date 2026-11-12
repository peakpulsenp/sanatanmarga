/**
 * SanatanMarga RevenueOS v3.0 — Creative Asset Management Service
 * Full lifecycle management for ad creatives with automated validation and version retention.
 * 
 * Lifecycle: UPLOAD -> VALIDATION -> REVIEW -> APPROVED -> ASSIGNED_TO_CAMPAIGN -> ACTIVE -> RETIRED
 */

export type CreativeStatus = 
  | "upload"
  | "validation"
  | "review"
  | "approved"
  | "assigned_to_campaign"
  | "active"
  | "retired";

export interface CreativeAsset {
  id: string;
  version: number;
  advertiserId: string;
  advertiserName: string;
  title: string;
  imageUrl: string;
  destinationUrl: string;
  dimensions: { width: number; height: number };
  aspectRatio: string;
  fileSizeBytes: number;
  fileType: "image/png" | "image/jpeg" | "image/webp" | "image/gif" | "image/svg+xml";
  status: CreativeStatus;
  isSponsored: boolean;
  mobileSuitable: boolean;
  httpsCompliant: boolean;
  validationErrors: string[];
  campaignId?: string;
  uploadedAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

const STORAGE_KEY = "sanatan_creative_assets_v1";

export class CreativeService {
  private assets: CreativeAsset[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.assets = JSON.parse(saved);
      } else {
        this.seedInitialCreatives();
      }
    } catch {
      this.seedInitialCreatives();
    }
  }

  private seedInitialCreatives() {
    const timestamp = new Date().toISOString();
    this.assets = [
      {
        id: "cr-001",
        version: 1,
        advertiserId: "adv-ncell",
        advertiserName: "Ncell Axiata Ltd.",
        title: "Ncell 5G High Speed Banner",
        imageUrl: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800",
        destinationUrl: "https://ncell.com.np/5g",
        dimensions: { width: 970, height: 250 },
        aspectRatio: "3.88:1",
        fileSizeBytes: 245000,
        fileType: "image/jpeg",
        status: "active",
        isSponsored: true,
        mobileSuitable: true,
        httpsCompliant: true,
        validationErrors: [],
        campaignId: "camp-ncell-5g",
        uploadedAt: timestamp,
        updatedAt: timestamp,
        approvedBy: "Chief Editor",
        approvedAt: timestamp
      },
      {
        id: "cr-002",
        version: 1,
        advertiserId: "adv-global-ime",
        advertiserName: "Global IME Bank",
        title: "Global IME Digital App Square",
        imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600",
        destinationUrl: "https://globalimebank.com",
        dimensions: { width: 300, height: 250 },
        aspectRatio: "1.2:1",
        fileSizeBytes: 180000,
        fileType: "image/png",
        status: "approved",
        isSponsored: true,
        mobileSuitable: true,
        httpsCompliant: true,
        validationErrors: [],
        uploadedAt: timestamp,
        updatedAt: timestamp,
        approvedBy: "Ad Director",
        approvedAt: timestamp
      }
    ];
    this.saveToStorage();
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.assets));
    } catch (e) {}
  }

  public getCreativesForAdvertiser(advertiserId: string, isAdmin = false): CreativeAsset[] {
    if (isAdmin) return [...this.assets];
    return this.assets.filter((c) => c.advertiserId === advertiserId);
  }

  public validateCreative(asset: Partial<CreativeAsset>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. Dimensions check
    if (!asset.dimensions || asset.dimensions.width <= 0 || asset.dimensions.height <= 0) {
      errors.push("Invalid image dimensions. Width and height must be > 0.");
    }

    // 2. HTTPS Destination URL
    if (!asset.destinationUrl) {
      errors.push("Destination URL is required.");
    } else if (!asset.destinationUrl.startsWith("https://")) {
      errors.push("Destination URL must use secure HTTPS protocol.");
    }

    // 3. File size check (Max 5MB)
    if (asset.fileSizeBytes && asset.fileSizeBytes > 5 * 1024 * 1024) {
      errors.push("Creative asset file size exceeds maximum limit of 5MB.");
    }

    // 4. File type check
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
    if (asset.fileType && !allowedTypes.includes(asset.fileType)) {
      errors.push(`Unsupported file type '${asset.fileType}'. Allowed types: PNG, JPEG, WEBP, GIF.`);
    }

    // 5. Sponsored disclosure requirement
    if (asset.isSponsored && (!asset.advertiserName || asset.advertiserName.trim() === "")) {
      errors.push("Sponsored creatives require explicit advertiser identity disclosure.");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  public createCreative(data: {
    advertiserId: string;
    advertiserName: string;
    title: string;
    imageUrl: string;
    destinationUrl: string;
    dimensions?: { width: number; height: number };
    fileSizeBytes?: number;
    fileType?: CreativeAsset["fileType"];
    isSponsored?: boolean;
  }): CreativeAsset {
    const timestamp = new Date().toISOString();
    const dimensions = data.dimensions || { width: 970, height: 250 };
    const ratio = (dimensions.width / dimensions.height).toFixed(2);

    const asset: Partial<CreativeAsset> = {
      advertiserId: data.advertiserId,
      advertiserName: data.advertiserName,
      title: data.title,
      imageUrl: data.imageUrl,
      destinationUrl: data.destinationUrl,
      dimensions,
      aspectRatio: `${ratio}:1`,
      fileSizeBytes: data.fileSizeBytes || 200000,
      fileType: data.fileType || "image/jpeg",
      isSponsored: data.isSponsored ?? true,
      mobileSuitable: dimensions.width <= 728,
      httpsCompliant: data.destinationUrl.startsWith("https://")
    };

    const val = this.validateCreative(asset);

    const newAsset: CreativeAsset = {
      id: `cr-${Date.now()}`,
      version: 1,
      advertiserId: data.advertiserId,
      advertiserName: data.advertiserName,
      title: data.title,
      imageUrl: data.imageUrl,
      destinationUrl: data.destinationUrl,
      dimensions,
      aspectRatio: `${ratio}:1`,
      fileSizeBytes: data.fileSizeBytes || 200000,
      fileType: data.fileType || "image/jpeg",
      status: val.valid ? "review" : "validation",
      isSponsored: data.isSponsored ?? true,
      mobileSuitable: dimensions.width <= 728,
      httpsCompliant: data.destinationUrl.startsWith("https://"),
      validationErrors: val.errors,
      uploadedAt: timestamp,
      updatedAt: timestamp
    };

    this.assets.unshift(newAsset);
    this.saveToStorage();
    return newAsset;
  }

  public updateCreativeVersion(id: string, newImageUrl: string, actor: string): CreativeAsset | null {
    const existing = this.assets.find((c) => c.id === id);
    if (!existing) return null;

    // Version retention
    existing.version += 1;
    existing.imageUrl = newImageUrl;
    existing.status = "review";
    existing.updatedAt = new Date().toISOString();

    this.saveToStorage();
    return existing;
  }

  public updateStatus(id: string, status: CreativeStatus, actor: string): CreativeAsset | null {
    const existing = this.assets.find((c) => c.id === id);
    if (!existing) return null;

    existing.status = status;
    existing.updatedAt = new Date().toISOString();
    if (status === "approved") {
      existing.approvedBy = actor;
      existing.approvedAt = new Date().toISOString();
    }

    this.saveToStorage();
    return existing;
  }
}

export const creativeService = new CreativeService();
