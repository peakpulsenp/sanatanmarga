import { MediaAsset, MediaUploadPayload, PresignResponse } from "../types/media";
import { db, getDocsWithCacheFallback } from "../lib/firebase";
import { collection, doc, setDoc, deleteDoc, query, where, orderBy, limit as firestoreLimit } from "@/src/lib/firebase";
import { snapshotEngine } from "@/src/services/snapshotEngine";

export async function fetchStorageConfig(): Promise<{
  isR2Configured: boolean;
  bucket: string;
  storageType: string;
}> {
  try {
    const res = await fetch("/api/media/config");
    const data = await res.json();
    return data;
  } catch (error) {
    return {
      isR2Configured: false,
      bucket: "sanatanos-assets",
      storageType: "Local Server Storage",
    };
  }
}

export async function uploadMediaFile({
  file,
  tenantId = "sanatan-media",
  category = "articles",
  tags = [],
  altText = "",
  caption = "",
  uploadedBy = "Admin",
  onProgress,
}: {
  file: File;
  tenantId?: string;
  category?: string;
  tags?: string[];
  altText?: string;
  caption?: string;
  uploadedBy?: string;
  onProgress?: (progress: number) => void;
}): Promise<MediaAsset> {
  // Step 1: Request Presigned URL or Direct Upload instruction
  try {
    if (onProgress) onProgress(10);

    const presignRes = await fetch("/api/media/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        category,
        fileName: file.name,
        mimeType: file.type || "image/jpeg",
        size: file.size,
      }),
    });

    const presignData: PresignResponse = await presignRes.json();

    if (onProgress) onProgress(30);

    if (presignData.isR2 && presignData.uploadUrl) {
      // Direct R2 Put Upload
      const uploadRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`R2 Upload failed with status ${uploadRes.status}`);
      }

      if (onProgress) onProgress(80);

      // Complete registration
      const completeRes = await fetch("/api/media/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          category,
          fileName: file.name,
          originalName: file.name,
          url: presignData.publicUrl,
          thumbnailUrl: presignData.publicUrl,
          objectKey: presignData.objectKey,
          isR2: true,
          mimeType: file.type,
          size: file.size,
          tags: tags.length > 0 ? tags : [category, tenantId],
          altText: altText || file.name.split(".")[0],
          caption,
          uploadedBy,
        }),
      });

      const completeData = await completeRes.json();
      if (onProgress) onProgress(100);
      return completeData.asset;
    } else {
      // Fallback Direct Express Multipart Upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantId", tenantId);
      formData.append("category", category);
      formData.append("tags", JSON.stringify(tags.length > 0 ? tags : [category, tenantId]));
      formData.append("altText", altText || file.name.split(".")[0]);
      formData.append("caption", caption);
      formData.append("uploadedBy", uploadedBy);

      const directRes = await fetch("/api/media/upload-direct", {
        method: "POST",
        body: formData,
      });

      const directData = await directRes.json();
      if (!directRes.ok || !directData.success) {
        throw new Error(directData.error || "Direct upload failed");
      }

      if (onProgress) onProgress(100);

      // Save to client Firestore and Snapshot OS if present
      if (directData.asset) {
        try {
          snapshotEngine.injectMediaAssets([directData.asset]);
          if (db) {
            await setDoc(doc(db, "mediaAssets", directData.asset.id), directData.asset, { merge: true });
          }
        } catch (e) {
          console.warn("Client Firestore sync error:", e);
        }
      }

      return directData.asset;
    }
  } catch (error: any) {
    console.error("Media upload failed, using client data URL fallback:", error);

    // Fallback convert to Data URL for client testing
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const assetId = `asset_${Date.now()}`;
        const fallbackAsset: MediaAsset = {
          id: assetId,
          tenantId,
          category,
          fileName: file.name,
          originalName: file.name,
          url: dataUrl,
          thumbnailUrl: dataUrl,
          objectKey: `tenants/${tenantId}/${category}/${Date.now()}_${file.name}`,
          isR2: false,
          mimeType: file.type || "image/jpeg",
          size: file.size,
          tags: tags.length > 0 ? tags : [category, tenantId],
          altText: altText || file.name.split(".")[0],
          caption,
          uploadedBy,
          status: "ready",
          createdAt: new Date().toISOString(),
          usedIn: [],
        };

        try {
          snapshotEngine.injectMediaAssets([fallbackAsset]);
          if (db) {
            await setDoc(doc(db, "mediaAssets", assetId), fallbackAsset, { merge: true });
          }
        } catch (e) {
          console.warn("Failed to write to client Firestore:", e);
        }
        if (onProgress) onProgress(100);
        resolve(fallbackAsset);
      };
      reader.readAsDataURL(file);
    });
  }
}

export async function fetchMediaAssets({
  tenantId = "all",
  category = "all",
  tag = "",
  search = "",
  limitCount = 50,
}: {
  tenantId?: string;
  category?: string;
  tag?: string;
  search?: string;
  limitCount?: number;
} = {}): Promise<MediaAsset[]> {
  try {
    const params = new URLSearchParams();
    if (tenantId) params.append("tenantId", tenantId);
    if (category) params.append("category", category);
    if (tag) params.append("tag", tag);
    if (search) params.append("search", search);
    if (limitCount) params.append("limit", String(limitCount));

    const res = await fetch(`/api/media?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.assets && data.assets.length > 0) {
        return data.assets;
      }
    }
  } catch (error) {
    console.warn("API list media failed, trying Firestore client SDK:", error);
  }

  // Fallback to Firestore client SDK
  if (db) {
    try {
      const assetsRef = collection(db, "mediaAssets");
      const snapshot = await getDocsWithCacheFallback(assetsRef, "media_assets_list");
      let list: MediaAsset[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MediaAsset));

      if (tenantId && tenantId !== "all") {
        list = list.filter(a => a.tenantId === tenantId);
      }
      if (category && category !== "all") {
        list = list.filter(a => a.category === category);
      }
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(a => 
          a.fileName?.toLowerCase().includes(q) ||
          a.originalName?.toLowerCase().includes(q) ||
          a.altText?.toLowerCase().includes(q) ||
          a.tags?.some(t => t.toLowerCase().includes(q))
        );
      }

      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return list.slice(0, limitCount);
    } catch (e: any) {
      if (!e?.message?.includes('resource-exhausted')) {
        console.error("Firestore list media error:", e);
      }
    }
  }

  // Snapshot OS fallback
  try {
    const snapshotAssets = await snapshotEngine.getMediaSnapshot();
    if (snapshotAssets && snapshotAssets.length > 0) {
      let list = [...snapshotAssets];
      if (tenantId && tenantId !== "all") list = list.filter(a => a.tenantId === tenantId);
      if (category && category !== "all") list = list.filter(a => a.category === category);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(a => 
          a.fileName?.toLowerCase().includes(q) ||
          a.originalName?.toLowerCase().includes(q) ||
          a.altText?.toLowerCase().includes(q)
        );
      }
      return list.slice(0, limitCount);
    }
  } catch (e) {}

  // Default seed assets if empty
  return getSeedMediaAssets();
}

export async function fetchMediaAnalytics(): Promise<any> {
  try {
    const res = await fetch("/api/media/analytics");
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data.analytics;
    }
  } catch (error) {
    console.error("Fetch media analytics error:", error);
  }
  return null;
}

export async function updateMediaAsset(assetId: string, updates: Partial<MediaAsset>): Promise<boolean> {
  try {
    const res = await fetch(`/api/media/${assetId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      return true;
    }
  } catch (error) {
    console.error("Update media error:", error);
  }
  return false;
}

export interface BatchActionResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  failedIds: string[];
  errors: Record<string, string>;
}

export async function executeBatchMediaAction(
  action: "delete" | "set_category" | "add_tags" | "archive",
  assetIds: string[],
  payload: Record<string, any> = {}
): Promise<BatchActionResult> {
  try {
    const res = await fetch("/api/media/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, assetIds, payload }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: Boolean(data.success),
        processedCount: data.processedCount || 0,
        failedCount: data.failedCount || 0,
        failedIds: data.failedIds || [],
        errors: data.errors || {},
      };
    } else {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        processedCount: 0,
        failedCount: assetIds.length,
        failedIds: assetIds,
        errors: { _global: errData.error || "Batch request failed on server" },
      };
    }
  } catch (error: any) {
    console.error("Batch media action error:", error);
    return {
      success: false,
      processedCount: 0,
      failedCount: assetIds.length,
      failedIds: assetIds,
      errors: { _global: error.message || "Network error during batch operation" },
    };
  }
}

export async function deleteMediaAsset(assetId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/media/${assetId}`, { method: "DELETE" });
    if (res.ok) {
      if (db) {
        try {
          await deleteDoc(doc(db, "mediaAssets", assetId));
        } catch (e) {}
      }
      return true;
    }
  } catch (error) {
    console.error("Delete media error:", error);
  }

  if (db) {
    try {
      await deleteDoc(doc(db, "mediaAssets", assetId));
      return true;
    } catch (e) {
      console.error("Client delete error:", e);
    }
  }
  return false;
}

export async function analyzeMediaWithAI({
  imageUrl,
  imageBase64,
  mimeType,
}: {
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
}): Promise<{
  altTextNepali: string;
  altTextEnglish: string;
  caption: string;
  tags: string[];
  category: string;
}> {
  try {
    const res = await fetch("/api/media/ai-analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, imageBase64, mimeType }),
    });

    const data = await res.json();
    if (data.success && data.aiAnalysis) {
      return data.aiAnalysis;
    }
  } catch (error) {
    console.error("AI analyze error:", error);
  }

  return {
    altTextNepali: "नेपाल सांस्कृतिक र धार्मिक सम्पदा तस्बिर",
    altTextEnglish: "Nepal cultural and heritage media asset",
    caption: "सनातन मार्ग मिडिया सम्पत्ति",
    tags: ["नेपाल", "Nepal", "Heritage", "SanatanOS"],
    category: "articles",
  };
}

export function getSeedMediaAssets(): MediaAsset[] {
  return [
    {
      id: "asset_seed_1",
      tenantId: "sanatan-media",
      category: "articles",
      fileName: "pashupatinath_evening_aarti.webp",
      originalName: "Pashupatinath Aarti 2026.jpg",
      url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=1200",
      thumbnailUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=300",
      objectKey: "tenants/sanatan-media/articles/1721800000_pashupatinath.webp",
      isR2: true,
      mimeType: "image/webp",
      size: 452100,
      width: 1920,
      height: 1080,
      tags: ["पशुपतिनाथ", "Aarti", "काठमाडौँ", "Heritage", "Shiva"],
      altText: "पशुपतिनाथ मन्दिर बागमती सन्ध्या आरती दृश्य",
      caption: "पशुपतिनाथ मन्दिर परिसरमा आयोजित विशेष सन्ध्या आरती",
      uploadedBy: "सम्पादक",
      status: "ready",
      createdAt: new Date().toISOString(),
      usedIn: [
        { type: "article", id: "art_1", title: "पशुपतिनाथ मन्दिरमा विशेष साउने सोमबार पूजा तयारी" },
        { type: "nepal_hub", id: "nepal_fest_1", title: "साउने सोमबार मेला" }
      ]
    },
    {
      id: "asset_seed_2",
      tenantId: "pokhara-metro",
      category: "notices",
      fileName: "fewa_lake_conservation_banner.webp",
      originalName: "Fewa Lake Cover.jpg",
      url: "https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?auto=format&fit=crop&q=80&w=1200",
      thumbnailUrl: "https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?auto=format&fit=crop&q=80&w=300",
      objectKey: "tenants/pokhara-metro/notices/1721800100_fewa.webp",
      isR2: true,
      mimeType: "image/webp",
      size: 382000,
      width: 1600,
      height: 900,
      tags: ["पोखरा", "फेवाताल", "गण्डकी", "पर्यटन", "Notice"],
      altText: "पोखरा फेवाताल र माछापुच्छ्रे हिमश्रृंखलाको मनोरम दृश्य",
      caption: "पोखरा महानगरपालिका फेवाताल किनार मापदण्ड तथा वातावरणीय संरक्षण कार्यक्रम",
      uploadedBy: "पोखरा सूचना अधिकारी",
      status: "ready",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      usedIn: [
        { type: "nepal_hub", id: "notice_12", title: "फेवाताल वातावरण संरक्षण मापदण्ड सूचना" }
      ]
    },
    {
      id: "asset_seed_3",
      tenantId: "purbanchal-cancer",
      category: "banners",
      fileName: "cancer_awareness_camp_biratnagar.webp",
      originalName: "Free Health Camp Cover.png",
      url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200",
      thumbnailUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=300",
      objectKey: "tenants/purbanchal-cancer/banners/1721800200_health.webp",
      isR2: false,
      mimeType: "image/webp",
      size: 290100,
      width: 1200,
      height: 630,
      tags: ["स्वास्थ्य", "पूर्वाञ्चल", "निःशुल्क शिविर", "विराटनगर"],
      altText: "पूर्वाञ्चल क्यान्सर अस्पताल निःशुल्क स्वास्थ्य शिविर ब्यानर",
      caption: "विराटनगरमा आयोजित विशेष स्तन तथा पाठेघर क्यान्सर परीक्षण शिविर",
      uploadedBy: "स्वास्थ्य संयोजक",
      status: "ready",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      usedIn: []
    }
  ];
}
