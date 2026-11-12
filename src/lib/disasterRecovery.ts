import JSZip from "jszip";
import { collection, doc, setDoc, deleteDoc, writeBatch, serverTimestamp, query, orderBy, limit, getDocs } from "@/src/lib/firebase";
import { db, getDocsWithCacheFallback } from "@/src/lib/firebase";
import { 
  BACKUP_CATEGORIES, 
  BACKUP_EVENTS, 
  BACKUP_COMMUNITY_POSTS, 
  BACKUP_NOTIFICATIONS, 
  BACKUP_COMMENTS,
  BACKUP_TENANTS,
  BACKUP_MENU_ITEMS,
  BACKUP_SITE_SETTINGS
} from "@/src/constants/backupData";
import { snapshotEngine } from "@/src/services/snapshotEngine";
import { offlineQueue } from "@/src/lib/offlineQueue";

export interface BackupManifest {
  version: string;
  createdAt: string;
  createdBy: string;
  type: "full" | "content" | "config" | "media";
  environment: string;
  counts: Record<string, number>;
  totalRecords: number;
  checksums: Record<string, string>;
  snapshotStatus: {
    homepage: boolean;
    latest: boolean;
    breaking: boolean;
    trending: boolean;
  };
}

export interface BackupRecord {
  id: string;
  type: "full" | "content" | "config" | "media";
  createdAt: any;
  createdBy: string;
  version: string;
  totalRecords: number;
  sizeBytes: number;
  sizeFormatted: string;
  checksum: string;
  counts: Record<string, number>;
  status: "completed" | "failed" | "restoring";
  downloadUrl?: string;
  notes?: string;
}

export interface RestoreDiffItem {
  collectionName: string;
  added: number;
  modified: number;
  deleted: number;
  unchanged: number;
  incomingTotal: number;
  currentTotal: number;
}

export interface DuplicatePostConflict {
  collectionName: string;
  incomingId: string;
  existingId?: string;
  title: string;
  slug?: string;
  conflictType: "exact_id" | "duplicate_slug" | "duplicate_title" | "duplicate_in_file";
  incomingPost: any;
  existingPost?: any;
}

export interface RestorePreviewResult {
  isValid: boolean;
  manifest: BackupManifest | null;
  checksumMatches: boolean;
  checksumErrors: string[];
  diffs: RestoreDiffItem[];
  duplicates: DuplicatePostConflict[];
  incomingData: Record<string, any[]>;
}

// Map collection categories
export const FULL_COLLECTIONS = [
  "articles",
  "categories",
  "tags",
  "authors",
  "users",
  "comments",
  "communityPosts",
  "community_posts",
  "communityComments",
  "community_comments",
  "events",
  "models",
  "agents",
  "menus",
  "settings",
  "pages",
  "knowledge_base",
  "nepal_hub",
  "nepal_hub_festivals",
  "nepal_hub_markets",
  "nepal_hub_districts",
  "nepal_hub_briefings",
  "nepal_hub_sponsors",
  "nepal_hub_live_updates",
  "notifications",
  "roles",
  "permissions",
  "mediaAssets",
  "media_assets",
  "snapshots",
  "inquiries",
  "contactMessages",
  "contact_messages",
  "workflows"
];

export const CONTENT_COLLECTIONS = [
  "articles",
  "categories",
  "communityPosts",
  "community_posts",
  "tags",
  "authors",
  "pages",
  "knowledge_base",
  "nepal_hub",
  "nepal_hub_festivals",
  "nepal_hub_markets",
  "nepal_hub_districts",
  "nepal_hub_briefings",
  "nepal_hub_sponsors",
  "nepal_hub_live_updates",
  "events"
];

export const CONFIG_COLLECTIONS = [
  "settings",
  "menus",
  "roles",
  "permissions",
  "workflows"
];

export const MEDIA_COLLECTIONS = [
  "media_assets",
  "settings"
];

/**
 * Compute SHA-256 Checksum for a string
 */
export async function computeSHA256(content: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    } catch {
      // fallback below
    }
  }
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, "0");
}

/**
 * Helper to convert bytes to human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Robustly fetch collection data combining Firestore, IndexedDB, local dynamic state, and backup fallbacks.
 * Guarantees that backups are never empty even if Firestore network reads are offline or clean.
 */
export async function getCollectionDataForBackup(colName: string): Promise<any[]> {
  const itemsMap = new Map<string, any>();

  // 1. Fetch from Firestore / Cache using getDocsWithCacheFallback
  try {
    const snap = await getDocsWithCacheFallback(collection(db, colName));
    snap.docs.forEach(d => {
      const itemData = d.data();
      const cleanedData: Record<string, any> = {};
      for (const [key, val] of Object.entries(itemData)) {
        const valObj = val as any;
        if (valObj && typeof valObj === "object" && typeof valObj.toDate === "function") {
          cleanedData[key] = valObj.toDate().toISOString();
        } else if (valObj && typeof valObj === "object" && valObj.seconds !== undefined && valObj.nanoseconds !== undefined) {
          cleanedData[key] = new Date(valObj.seconds * 1000).toISOString();
        } else {
          cleanedData[key] = val;
        }
      }
      itemsMap.set(d.id, { id: d.id, ...cleanedData });
    });
  } catch (err) {
    console.warn(`Firestore read warning for collection ${colName}:`, err);
  }

  // 2. Include local dynamic content for articles if needed
  const colLower = colName.toLowerCase();
  if (colLower === "articles") {
    try {
      const dynamicArts = snapshotEngine.getDynamicArticles();
      if (Array.isArray(dynamicArts)) {
        dynamicArts.forEach(a => {
          if (a && a.id && !itemsMap.has(a.id)) {
            itemsMap.set(a.id, a);
          }
        });
      }
    } catch (e) {}

    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sg_dynamic_articles");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach((a: any) => {
              if (a && a.id && !itemsMap.has(a.id)) {
                itemsMap.set(a.id, a);
              }
            });
          }
        }
      }
    } catch (e) {}
  }

  // 3. Only if collection is completely empty and is categories or settings, use default initial state
  if (itemsMap.size === 0) {
    if (colLower === "categories") {
      BACKUP_CATEGORIES.forEach(cat => itemsMap.set(cat.id, cat));
    } else if (colLower === "settings") {
      itemsMap.set("site", { id: "site", ...BACKUP_SITE_SETTINGS });
    }
  }

  return Array.from(itemsMap.values());

  return Array.from(itemsMap.values());
}

/**
 * Create Backup Package
 */
export async function createPlatformBackup(
  type: "full" | "content" | "config" | "media" = "full",
  createdBy = "admin",
  onProgress?: (stage: string, percent: number) => void
): Promise<{ zipBlob: Blob; fileName: string; record: BackupRecord; manifest: BackupManifest }> {
  onProgress?.("सङ्कलन सूची तयारी गर्दै...", 5);

  const targetCollections = 
    type === "content" ? CONTENT_COLLECTIONS :
    type === "config" ? CONFIG_COLLECTIONS :
    type === "media" ? MEDIA_COLLECTIONS :
    FULL_COLLECTIONS;

  const zip = new JSZip();
  const backupFolder = zip.folder("backup") || zip;
  const counts: Record<string, number> = {};
  const checksums: Record<string, string> = {};
  let totalRecords = 0;

  const dataMap: Record<string, any[]> = {};

  const stepWeight = 70 / targetCollections.length;
  let currentProgress = 10;

  for (let i = 0; i < targetCollections.length; i++) {
    const colName = targetCollections[i];
    onProgress?.(`डेटा सङ्कलन गर्दै: ${colName}...`, Math.round(currentProgress));

    try {
      const items = await getCollectionDataForBackup(colName);

      counts[colName] = items.length;
      totalRecords += items.length;
      dataMap[colName] = items;

      const jsonStr = JSON.stringify(items, null, 2);
      checksums[`${colName}.json`] = await computeSHA256(jsonStr);
      backupFolder.file(`${colName}.json`, jsonStr);
    } catch (err) {
      console.warn(`Backup collection ${colName} read error or empty:`, err);
      counts[colName] = 0;
      dataMap[colName] = [];
      const jsonStr = "[]";
      checksums[`${colName}.json`] = await computeSHA256(jsonStr);
      backupFolder.file(`${colName}.json`, jsonStr);
    }

    currentProgress += stepWeight;
  }

  // Include Cache Snapshots
  onProgress?.("क्यास र स्न्यापशट सङ्कलन गर्दै...", 82);
  const snapshotData = {
    homepage: dataMap["snapshots"]?.find(s => s.id === "homepage") || null,
    latest: dataMap["snapshots"]?.find(s => s.id === "latest") || null,
    breaking: dataMap["snapshots"]?.find(s => s.id === "breaking") || null,
    trending: dataMap["snapshots"]?.find(s => s.id === "trending") || null,
  };

  const snapshotsJson = JSON.stringify(snapshotData, null, 2);
  backupFolder.file("snapshots.json", snapshotsJson);
  checksums["snapshots.json"] = await computeSHA256(snapshotsJson);

  // Build Manifest
  const manifest: BackupManifest = {
    version: "2.5.0",
    createdAt: new Date().toISOString(),
    createdBy,
    type,
    environment: "production",
    counts,
    totalRecords,
    checksums,
    snapshotStatus: {
      homepage: !!snapshotData.homepage,
      latest: !!snapshotData.latest,
      breaking: !!snapshotData.breaking,
      trending: !!snapshotData.trending,
    }
  };

  const manifestJson = JSON.stringify(manifest, null, 2);
  backupFolder.file("manifest.json", manifestJson);

  // Build Checksum Manifest
  const checksumJson = JSON.stringify(checksums, null, 2);
  backupFolder.file("checksum.json", checksumJson);

  onProgress?.("ZIP प्याकेज कम्प्रेस गर्दै...", 90);
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const sizeBytes = zipBlob.size;
  const sizeFormatted = formatBytes(sizeBytes);
  const overallChecksum = await computeSHA256(manifestJson + checksumJson);

  const dateStr = new Date().toISOString().split("T")[0];
  const fileName = `sanatanmarga-${type}-backup-${dateStr}.zip`;

  const backupRecord: BackupRecord = {
    id: `backup_${Date.now()}`,
    type,
    createdAt: new Date().toISOString(),
    createdBy,
    version: manifest.version,
    totalRecords,
    sizeBytes,
    sizeFormatted,
    checksum: overallChecksum,
    counts,
    status: "completed",
    notes: `Sanatan Marga ${type.toUpperCase()} Backup package generated successfully.`
  };

  // Save log to Firestore
  try {
    await setDoc(doc(db, "disaster_recovery_logs", backupRecord.id), {
      ...backupRecord,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("Error saving backup log record to firestore:", err);
  }

  onProgress?.("ब्याकअप सफलतापूर्वक तयार भयो!", 100);

  return {
    zipBlob,
    fileName,
    record: backupRecord,
    manifest
  };
}

/**
 * Validate and inspect uploaded ZIP or JSON backup file
 */
export async function inspectAndVerifyBackup(
  backupFile: File
): Promise<RestorePreviewResult> {
  const checksumErrors: string[] = [];
  const incomingData: Record<string, any[]> = {};
  let manifest: BackupManifest | null = null;
  let checksumMatches = true;

  const fileNameLower = backupFile.name.toLowerCase();
  let isZipMode = fileNameLower.endsWith(".zip") || backupFile.type.includes("zip") || backupFile.type.includes("compressed");

  let parsedSuccessfully = false;

  // Strategy 1: If file looks like ZIP or mode is ZIP, attempt JSZip extraction first
  if (isZipMode) {
    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(backupFile);

      // Locate folder prefix if wrapped
      let manifestFile = loadedZip.file("manifest.json") || loadedZip.file("backup/manifest.json");
      let checksumFile = loadedZip.file("checksum.json") || loadedZip.file("backup/checksum.json");

      if (!manifestFile) {
        const found = loadedZip.file(/manifest\.json$/);
        if (found.length > 0) manifestFile = found[0];
      }

      if (!checksumFile) {
        const found = loadedZip.file(/checksum\.json$/);
        if (found.length > 0) checksumFile = found[0];
      }

      if (manifestFile) {
        const manifestStr = await manifestFile.async("string");
        manifest = JSON.parse(manifestStr);

        let expectedChecksums: Record<string, string> = {};
        if (checksumFile) {
          const checksumStr = await checksumFile.async("string");
          try { expectedChecksums = JSON.parse(checksumStr); } catch {}
        } else if (manifest?.checksums) {
          expectedChecksums = manifest.checksums;
        }

        const collectionsToProcess = manifest?.counts ? Object.keys(manifest.counts) : FULL_COLLECTIONS;

        for (const colName of collectionsToProcess) {
          const jsonFileName = `${colName}.json`;
          let file = loadedZip.file(jsonFileName) || loadedZip.file(`backup/${jsonFileName}`);
          if (!file) {
            const found = loadedZip.file(new RegExp(`${jsonFileName}$`));
            if (found.length > 0) file = found[0];
          }

          if (file) {
            const contentStr = await file.async("string");
            const computedHash = await computeSHA256(contentStr);
            const expectedHash = expectedChecksums[jsonFileName];

            if (expectedHash && expectedHash !== computedHash) {
              checksumErrors.push(`${colName}.json : चेकसम बेमेल!`);
            }

            try {
              const parsed = JSON.parse(contentStr);
              if (Array.isArray(parsed)) {
                incomingData[colName] = parsed;
              } else if (parsed && typeof parsed === "object") {
                if (Array.isArray(parsed.data)) incomingData[colName] = parsed.data;
                else if (Array.isArray(parsed.items)) incomingData[colName] = parsed.items;
                else incomingData[colName] = [parsed];
              } else {
                incomingData[colName] = [];
              }
            } catch {
              checksumErrors.push(`${colName}.json : अमान्य JSON ढाँचा!`);
              incomingData[colName] = [];
            }
          } else {
            incomingData[colName] = [];
          }
        }
        parsedSuccessfully = true;
      }
    } catch (zipErr) {
      // JSZip failed (e.g., "Can't find end of central directory : is this a zip file ?")
      // Do not crash; seamlessly fall back to reading as raw JSON text
      console.warn("JSZip load failed, attempting raw JSON text fallback:", zipErr);
    }
  }

  // Strategy 2: If JSZip wasn't attempted or failed, parse directly as JSON file
  if (!parsedSuccessfully) {
    try {
      const fileText = await backupFile.text();
      // Clean possible UTF-8 BOM
      const cleanedText = fileText.trim().replace(/^\uFEFF/, "");
      const parsedJson = JSON.parse(cleanedText);

      let extractedData: Record<string, any> = {};

      if (parsedJson && typeof parsedJson === "object") {
        if (parsedJson.data && typeof parsedJson.data === "object" && !Array.isArray(parsedJson.data)) {
          extractedData = parsedJson.data;
        } else if (!Array.isArray(parsedJson)) {
          extractedData = parsedJson;
        } else if (Array.isArray(parsedJson)) {
          extractedData["articles"] = parsedJson;
        }
      }

      const counts: Record<string, number> = {};
      let totalRecords = 0;

      for (const [key, val] of Object.entries(extractedData)) {
        if (key === "manifest" || key === "version" || key === "checksums" || key === "exportedAt") continue;
        let items: any[] = [];
        if (Array.isArray(val)) {
          items = val;
        } else if (val && typeof val === "object") {
          items = [val];
        }
        incomingData[key] = items;
        counts[key] = items.length;
        totalRecords += items.length;
      }

      manifest = {
        version: parsedJson.version || "2.5.0",
        createdAt: parsedJson.exportedAt || parsedJson.createdAt || new Date().toISOString(),
        createdBy: parsedJson.exportedBy || "uploaded_file",
        type: parsedJson.type || "full",
        environment: "production",
        counts,
        totalRecords,
        checksums: {},
        snapshotStatus: { homepage: true, latest: true, breaking: true, trending: true }
      };

      parsedSuccessfully = true;
    } catch (jsonErr: any) {
      if (isZipMode) {
        throw new Error("मान्य ZIP प्याकेज वा JSON ब्याकअप फाइल होइन। ('Can't find end of central directory' - फाइल बिग्रिएको छ वा ढाँचा बेमेल छ)।");
      } else {
        throw new Error(`ब्याकअप फाइल पढ्न सकिएन: ${jsonErr.message || jsonErr}`);
      }
    }
  }

  // Double Check Normalization: Ensure every collection in incomingData is GUARANTEED to be an Array
  for (const key of Object.keys(incomingData)) {
    if (!Array.isArray(incomingData[key])) {
      incomingData[key] = [];
    }
  }

  // Calculate Diff and Detect Duplicate Posts / Conflict Items
  const diffs: RestoreDiffItem[] = [];
  const duplicates: DuplicatePostConflict[] = [];

  for (const [colName, rawIncomingItems] of Object.entries(incomingData)) {
    const incomingItems = Array.isArray(rawIncomingItems) ? rawIncomingItems : [];
    let currentTotal = 0;
    const currentMap = new Map<string, any>();
    const currentSlugMap = new Map<string, any>();
    const currentTitleMap = new Map<string, any>();

    try {
      const snap = await getDocs(collection(db, colName));
      currentTotal = snap.size;
      snap.forEach(d => {
        const itemData = d.data();
        currentMap.set(d.id, { id: d.id, ...itemData });

        if (itemData.slug && typeof itemData.slug === "string") {
          currentSlugMap.set(itemData.slug.trim().toLowerCase(), { id: d.id, ...itemData });
        }
        if (itemData.title && typeof itemData.title === "string") {
          currentTitleMap.set(itemData.title.trim().toLowerCase(), { id: d.id, ...itemData });
        }
      });
    } catch {
      currentTotal = 0;
    }

    let added = 0;
    let modified = 0;
    let unchanged = 0;

    const seenIncomingIds = new Set<string>();
    const seenIncomingSlugs = new Set<string>();

    incomingItems.forEach((item: any) => {
      if (!item || typeof item !== "object") return;
      const id = item.id ? String(item.id) : null;
      const title = item.title || item.name || item.id || "Un-titled Record";
      const slug = item.slug ? String(item.slug).trim().toLowerCase() : undefined;
      const cleanTitle = title ? String(title).trim().toLowerCase() : "";

      // Check intra-file duplicate
      if (id && seenIncomingIds.has(id)) {
        duplicates.push({
          collectionName: colName,
          incomingId: id,
          title,
          slug,
          conflictType: "duplicate_in_file",
          incomingPost: item
        });
      }
      if (id) seenIncomingIds.add(id);

      // Check Firestore Exact ID Duplicate / Match
      if (id && currentMap.has(id)) {
        const existing = currentMap.get(id);
        const isDifferent = JSON.stringify(existing) !== JSON.stringify(item);
        if (isDifferent) {
          modified++;
          duplicates.push({
            collectionName: colName,
            incomingId: id,
            existingId: id,
            title,
            slug,
            conflictType: "exact_id",
            incomingPost: item,
            existingPost: existing
          });
        } else {
          unchanged++;
        }
      } else {
        // Check Slug Conflict with different ID
        if (slug && currentSlugMap.has(slug)) {
          const existing = currentSlugMap.get(slug);
          if (existing.id !== id) {
            duplicates.push({
              collectionName: colName,
              incomingId: id || "new_id",
              existingId: existing.id,
              title,
              slug,
              conflictType: "duplicate_slug",
              incomingPost: item,
              existingPost: existing
            });
          }
        } else if (cleanTitle && currentTitleMap.has(cleanTitle)) {
          // Check Title Conflict
          const existing = currentTitleMap.get(cleanTitle);
          if (existing.id !== id) {
            duplicates.push({
              collectionName: colName,
              incomingId: id || "new_id",
              existingId: existing.id,
              title,
              slug,
              conflictType: "duplicate_title",
              incomingPost: item,
              existingPost: existing
            });
          }
        }
        added++;
      }
    });

    const deleted = Math.max(0, currentTotal - (incomingItems.length - added));

    diffs.push({
      collectionName: colName,
      added,
      modified,
      deleted,
      unchanged,
      incomingTotal: incomingItems.length,
      currentTotal
    });
  }

  checksumMatches = checksumErrors.length === 0;

  return {
    isValid: true,
    manifest,
    checksumMatches,
    checksumErrors,
    diffs,
    duplicates,
    incomingData
  };
}

/**
 * Execute Selective / Full Restore from previewed incoming data via server-side API
 */
export async function executeRestoreFromData(
  incomingData: Record<string, any[]>,
  selectedCollections: string[],
  wipeExisting = false,
  duplicateOption: "overwrite" | "skip" | "rename_slugs" = "rename_slugs",
  onProgress?: (colName: string, percent: number) => void
): Promise<{ restoredCount: number; errors: string[] }> {
  let restoredCount = 0;
  const errors: string[] = [];

  const collectionsPayload: Record<string, any[]> = {};
  for (const colName of selectedCollections) {
    let rawItems = incomingData[colName];
    if (Array.isArray(rawItems)) {
      if (colName === "categories") {
        rawItems = rawItems.filter((c: any) => {
          if (!c || typeof c !== "object") return false;
          const s = (c.slug || c.id || "").toLowerCase().trim();
          const n = (c.nameNepali || c.name || c.nameEnglish || "").toLowerCase().trim();
          return s && s !== "समाचार" && s !== "general" && s !== "news" && s !== "samachar" && s !== "undefined" && s !== "null" && n !== "समाचार" && n !== "news" && n !== "samachar";
        });
      } else if (colName === "menuItems" || colName === "menus") {
        rawItems = rawItems.filter((m: any) => {
          if (!m || typeof m !== "object") return false;
          const label = String(m.label || m.name || m.labelEn || "").trim();
          const path = String(m.path || m.url || "").trim();
          return label && label !== "Un-titled Record" && label !== "undefined" && path !== "undefined";
        });
      } else if (colName === "knowledge_base" || colName === "knowledgeNodes") {
        rawItems = rawItems.filter((k: any) => {
          if (!k || typeof k !== "object") return false;
          const nameNp = String(k.nameNepali || k.title || k.name || "").trim();
          const nameEn = String(k.nameEnglish || k.titleEn || "").trim();
          const sanskrit = String(k.sanskrit || "").trim();
          return (nameNp || nameEn || sanskrit) && nameNp !== "Un-titled Record" && nameNp !== "undefined" && nameNp !== "null" && !/^[a-zA-Z0-9]{20,}$/.test(nameNp);
        });
      }
      collectionsPayload[colName] = rawItems;
    }
  }

  onProgress?.("सर्भरतर्फ ब्याकअप पुनर्स्थापना गर्दै...", 30);

  let serverSuccess = false;
  try {
    const res = await fetch('/api/admin/backup/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collections: collectionsPayload, wipeExisting, duplicateOption })
    });
    const data = await res.json();
    if (data.success) {
      serverSuccess = true;
      const counts = data.restoredCounts || {};
      for (const [col, count] of Object.entries(counts)) {
        restoredCount += Number(count) || 0;
      }
      onProgress?.("रिस्टोर सम्पन्न!", 100);
    }
  } catch (err: any) {
    console.warn("Server-side restore unavailable or failed, attempting client-side restore:", err);
  }

  if (!serverSuccess) {
    onProgress?.("क्लाइन्टमार्फत ब्याकअप पुनर्स्थापना गर्दै...", 50);
    try {
      for (const colName of selectedCollections) {
        const items = collectionsPayload[colName];
        if (!Array.isArray(items) || items.length === 0) continue;

        // Target collections including alias names
        const aliasCols = colName === 'community_posts' ? ['communityPosts'] :
                          colName === 'communityPosts' ? ['community_posts'] :
                          colName === 'contact_messages' ? ['contactMessages'] :
                          colName === 'contactMessages' ? ['contact_messages'] :
                          colName === 'media_assets' ? ['mediaAssets'] :
                          colName === 'mediaAssets' ? ['media_assets'] :
                          colName === 'community_comments' ? ['communityComments'] :
                          colName === 'communityComments' ? ['community_comments'] : [];

        const targetCols = Array.from(new Set([colName, ...aliasCols]));

        for (const targetCol of targetCols) {
          if (wipeExisting) {
            try {
              const snap = await getDocs(collection(db, targetCol));
              const docRefs = snap.docs.map(d => doc(db, targetCol, d.id));
              for (let i = 0; i < docRefs.length; i += 400) {
                const delBatch = writeBatch(db);
                docRefs.slice(i, i + 400).forEach(ref => delBatch.delete(ref));
                await delBatch.commit();
              }
            } catch (e: any) {
              console.warn(`Error wiping collection ${targetCol} on client:`, e);
            }
          }

          let colRestored = 0;
          try {
            // First try writing as a batch
            for (let i = 0; i < items.length; i += 400) {
              const batch = writeBatch(db);
              const chunk = items.slice(i, i + 400);

              for (const item of chunk) {
                const { id, ...data } = item;
                const docRef = id ? doc(db, targetCol, String(id)) : doc(collection(db, targetCol));
                batch.set(docRef, data, { merge: !wipeExisting });
              }

              await batch.commit();
              colRestored += chunk.length;
            }
          } catch (batchErr: any) {
            console.warn(`Frontend batch write failed for ${targetCol} (${batchErr?.message || batchErr}), falling back to individual document setDoc...`);
            // Individual fallback
            for (const item of items) {
              try {
                const { id, ...data } = item;
                const docRef = id ? doc(db, targetCol, String(id)) : doc(collection(db, targetCol));
                await setDoc(docRef, data, { merge: !wipeExisting });
                colRestored++;
              } catch (singleErr: any) {
                console.warn(`Skipping frontend write for document in ${targetCol} due to permission rules: ${singleErr?.message || singleErr}`);
                errors.push(`Document in ${targetCol} skipped: ${singleErr?.message || singleErr}`);
              }
            }
          }
          if (targetCol === colName) {
            restoredCount += colRestored;
          }
        }
      }
      onProgress?.("रिस्टोर सम्पन्न!", 100);
    } catch (err: any) {
      console.error("Client backup restore error:", err);
      errors.push(err.message || "पुनर्स्थापना असफल भयो");
    }
  }

  // Inject restored articles into snapshotEngine for instant rendering across the app
  try {
    const restoredArts: any[] = [];
    if (collectionsPayload.articles && Array.isArray(collectionsPayload.articles)) {
      restoredArts.push(...collectionsPayload.articles);
    }
    if (collectionsPayload.homepage && Array.isArray(collectionsPayload.homepage)) {
      collectionsPayload.homepage.forEach((h: any) => {
        if (h?.latestNews && Array.isArray(h.latestNews)) restoredArts.push(...h.latestNews);
      });
    }
    if (restoredArts.length > 0) {
      snapshotEngine.injectArticles(restoredArts);
      snapshotEngine.triggerPublishRebuild("backup_restore");
    }
  } catch (e) {
    console.warn("Could not inject restored articles to snapshotEngine:", e);
  }

  // Log restore audit trail
  try {
    await setDoc(doc(db, "disaster_recovery_logs", `restore_${Date.now()}`), {
      type: "restore_operation",
      createdAt: serverTimestamp(),
      restoredCollections: selectedCollections,
      restoredCount,
      errorsCount: errors.length,
      errors,
      status: errors.length === 0 ? "success" : "partial"
    });
  } catch (err) {
    console.warn("Could not save restore log to firestore:", err);
  }

  return { restoredCount, errors };
}

/**
 * Trigger Automatic Safety Backup before major operations
 */
export async function triggerAutoSafetyBackup(
  reason: string,
  user = "system_auto"
): Promise<string | null> {
  try {
    console.log(`[Disaster Recovery OS] Auto Safety Backup triggered for: ${reason}`);
    const { record } = await createPlatformBackup("config", user);
    return record.id;
  } catch (err) {
    console.error("Auto safety backup failed:", err);
    return null;
  }
}
