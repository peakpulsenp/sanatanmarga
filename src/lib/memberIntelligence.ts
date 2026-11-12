/**
 * Member Intelligence Engine (MIE)
 * Central platform intelligence library for tracking activity logs, learning events,
 * and dynamic reputation scoring across Sanatan Marga.
 */

export interface ActivityLogItem {
  id?: string;
  uid: string;
  type: 
    | "article_published" 
    | "article_read" 
    | "comment_posted" 
    | "bookmark_added" 
    | "scripture_read" 
    | "scripture_saved" 
    | "profile_updated" 
    | "learning_updated" 
    | "forum_post_created" 
    | "reaction_added"
    | "event_joined";
  title: string;
  category?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}

export interface LearningEventItem {
  id?: string;
  uid: string;
  granthaId: string;
  granthaTitle?: string;
  verseId?: string;
  verseIndex?: number;
  action: "read" | "bookmark" | "completed" | "notes_taken";
  durationSeconds?: number;
  createdAt?: string;
}

export interface UserStats {
  articlesPublished: number;
  communityPosts: number;
  comments: number;
  savedCount: number;
  likesReceived?: number;
  versesRead?: number;
  granthasExplored?: number;
  hoursStudied?: number;
}

export interface ReputationSummary {
  score: number;
  rank: string;
  rankLevel: number;
  badges: string[];
  nextRankThreshold: number;
  progressToNextRank: number;
}

/**
 * Calculates real reputation score, honor rank, and earned badges
 * based on user platform engagement metrics.
 */
export function calculateReputation(
  stats: UserStats,
  learningProgress?: { versesRead?: number; granthasExplored?: number; hoursStudied?: number },
  profileCompleted: boolean = false
): ReputationSummary {
  const articlesCount = stats.articlesPublished || 0;
  const postsCount = stats.communityPosts || 0;
  const commentsCount = stats.comments || 0;
  const savedCount = stats.savedCount || 0;
  const likesReceived = stats.likesReceived || 0;
  const versesRead = (learningProgress?.versesRead ?? stats.versesRead) || 0;
  const granthasExplored = (learningProgress?.granthasExplored ?? stats.granthasExplored) || 0;
  const hoursStudied = (learningProgress?.hoursStudied ?? stats.hoursStudied) || 0;

  // Weighted Reputation Formula
  let score = 
    (articlesCount * 30) +
    (postsCount * 15) +
    (commentsCount * 5) +
    (savedCount * 2) +
    (likesReceived * 3) +
    (versesRead * 1) +
    (granthasExplored * 10) +
    (Math.round(hoursStudied) * 5) +
    (profileCompleted ? 50 : 0) +
    50; // Base welcome bonus

  // Honor Ranks
  let rank = "Knowledge Seeker (ज्ञान अन्वेषक)";
  let rankLevel = 1;
  let nextRankThreshold = 100;

  if (score >= 1500) {
    rank = "Acharya / Senior Scholar (वरिष्ठ मनिषी / आचार्य)";
    rankLevel = 5;
    nextRankThreshold = 3000;
  } else if (score >= 700) {
    rank = "Senior Researcher (अनुसन्धानकर्ता)";
    rankLevel = 4;
    nextRankThreshold = 1500;
  } else if (score >= 300) {
    rank = "Vedic Scholar (ज्ञान साधक)";
    rankLevel = 3;
    nextRankThreshold = 700;
  } else if (score >= 100) {
    rank = "Knowledge Contributor (ज्ञान योगदानकर्ता)";
    rankLevel = 2;
    nextRankThreshold = 300;
  }

  const prevRankThreshold = rankLevel === 1 ? 0 : rankLevel === 2 ? 100 : rankLevel === 3 ? 300 : rankLevel === 4 ? 700 : 1500;
  const progressToNextRank = Math.min(100, Math.round(((score - prevRankThreshold) / (nextRankThreshold - prevRankThreshold)) * 100));

  // Dynamic Badges Earned
  const badges: string[] = ["ज्ञान अन्वेषक"];

  if (postsCount > 0 || commentsCount > 0) {
    badges.push("चौतारी फोरम सदस्य");
  }
  if (versesRead >= 10 || hoursStudied >= 2) {
    badges.push("सरस्वती साधक");
  }
  if (versesRead >= 50 || granthasExplored >= 3) {
    badges.push("शास्त्र संरक्षक");
  }
  if (articlesCount >= 1) {
    badges.push("सनातन लेखक");
  }
  if (articlesCount >= 5) {
    badges.push("वरिष्ठ सम्पादक");
  }
  if (savedCount >= 5) {
    badges.push("ज्ञान संकलक");
  }
  if (score >= 500) {
    badges.push("नियमित ज्ञानी");
  }

  return {
    score,
    rank,
    rankLevel,
    badges,
    nextRankThreshold,
    progressToNextRank: Math.max(0, progressToNextRank)
  };
}

// Client-side deduplication set for rapid event prevention
const recentClientEvents = new Set<string>();

/**
 * Log user activity to MIE platform endpoint with idempotency
 */
export async function logUserActivity(
  uid: string,
  type: ActivityLogItem["type"],
  title: string,
  category?: string,
  metadata?: Record<string, any>,
  customIdempotencyKey?: string
): Promise<boolean> {
  if (!uid || uid === "guest") return false;

  const idempotencyKey = customIdempotencyKey || `${uid}_${type}_${title}_${Math.floor(Date.now() / 15000)}`;

  if (recentClientEvents.has(idempotencyKey)) {
    return true; // Gracefully suppressed duplicate call
  }
  recentClientEvents.add(idempotencyKey);
  if (recentClientEvents.size > 500) {
    const arr = Array.from(recentClientEvents);
    arr.slice(0, 100).forEach(k => recentClientEvents.delete(k));
  }

  try {
    const res = await fetch("/api/user/activity-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        type,
        title,
        category,
        metadata,
        idempotencyKey,
        createdAt: new Date().toISOString()
      })
    });
    const json = await res.json();
    if (json?.success && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("user-activity-logged", { detail: { uid, type, title } }));
    }
    return Boolean(json?.success);
  } catch (err) {
    console.warn("Failed to log user activity:", err);
    return false;
  }
}

/**
 * Log granular learning event (verse read, grantha study) with idempotency
 */
export async function logLearningEvent(
  uid: string,
  granthaId: string,
  granthaTitle: string,
  verseId: string,
  action: LearningEventItem["action"] = "read",
  durationSeconds: number = 60,
  customIdempotencyKey?: string
): Promise<boolean> {
  if (!uid || uid === "guest") return false;

  const idempotencyKey = customIdempotencyKey || `${uid}_learn_${granthaId}_${verseId}_${action}_${Math.floor(Date.now() / 15000)}`;

  if (recentClientEvents.has(idempotencyKey)) {
    return true; // Gracefully suppressed duplicate call
  }
  recentClientEvents.add(idempotencyKey);

  try {
    const res = await fetch("/api/user/learning-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        granthaId,
        granthaTitle,
        verseId,
        action,
        durationSeconds,
        idempotencyKey,
        createdAt: new Date().toISOString()
      })
    });
    const json = await res.json();
    if (json?.success && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("learning-event-logged", { detail: { uid, granthaId, verseId } }));
    }
    return Boolean(json?.success);
  } catch (err) {
    console.warn("Failed to log learning event:", err);
    return false;
  }
}
