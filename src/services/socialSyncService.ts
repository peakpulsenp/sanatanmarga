import { collection, getDocs, doc, setDoc } from "@/src/lib/firebase";
import { db } from "@/src/lib/firebase";
import { defaultSocialAccounts, defaultSocialPosts } from "@/src/data/defaultSocialData";

const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 Hours
const LAST_SYNC_KEY = "sanatan_last_social_24h_sync";

export async function checkAndSyncSocialChannelsAndPosts(force: boolean = false) {
  try {
    const lastSync = localStorage.getItem(LAST_SYNC_KEY);
    const now = Date.now();

    if (!force && lastSync && now - parseInt(lastSync) < SYNC_INTERVAL_MS) {
      // Synced within last 24 hours
      return { success: true, synced: false, message: "Already synced within 24 hours." };
    }

    console.log("Starting 24h automated social channel profile & post updates sync...");

    // 1. Sync / Seed default social accounts with verified profile pictures
    for (const acc of defaultSocialAccounts) {
      try {
        const ref = doc(db, "socialAccounts", acc.id);
        await setDoc(ref, {
          ...acc,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn("Failed syncing account:", acc.id, e);
      }
    }

    // 2. Sync / Seed default social posts / videos / podcasts into सनातन फिड, भिडियो तथा पडकास्टहरू
    for (const post of defaultSocialPosts) {
      try {
        const ref = doc(db, "socialPosts", post.id);
        await setDoc(ref, {
          ...post,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn("Failed syncing post:", post.id, e);
      }
    }

    localStorage.setItem(LAST_SYNC_KEY, now.toString());
    console.log("24h social channels and post updates synced successfully.");
    return { success: true, synced: true, message: "Successfully synced 24h social profiles & posts." };
  } catch (err) {
    console.error("Error in 24h social sync:", err);
    return { success: false, synced: false, error: err };
  }
}
