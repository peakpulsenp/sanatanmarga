import { messaging, auth, db } from "./firebase";
import { getToken, onMessage } from "./messagingClient";
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  setDoc, 
  query, 
  where 
} from "@/src/lib/firebase";
import axios from "axios";
import type { NotificationTemplate, NotificationTargetType } from "../types";
import { getNotificationDeepLink, resolveNotificationTarget, routeNotification, verifyNotificationTargetExistence } from "../utils/notificationRouter";

export { getNotificationDeepLink, resolveNotificationTarget, routeNotification, verifyNotificationTargetExistence };

/**
 * Request notification permission and save FCM token to user profile
 */
export async function initializeNotifications() {
  if (typeof window === 'undefined' || !messaging) return;

  const vapidKey = (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY?.trim();
  if (!vapidKey) {
    console.info("[FCM] VITE_FIREBASE_VAPID_KEY not configured. Web push registration skipped.");
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, { vapidKey });

      if (token && auth?.currentUser) {
        console.log("FCM Token acquired:", token);
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token)
        });
      }
    }
  } catch (error) {
    console.warn("[FCM] Web push registration warning:", error);
  }
}

/**
 * Handle incoming messages when the app is in the foreground
 */
export function onMessageListener() {
  if (!messaging) return;
  return onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);
  });
}

interface BroadcastPayload {
  title: string;
  body: string;
  imageUrl?: string;
  link?: string;
}

/**
 * Trigger a broadcast notification via the backend API
 */
export async function broadcastNotification(payload: BroadcastPayload) {
  try {
    const response = await axios.post("/api/broadcast", payload);
    return response.data;
  } catch (error) {
    console.error("Broadcast failed:", error);
    return { success: false, error };
  }
}

// ---------------- SPRINT B: NOTIFICATION OS FOUNDATION ----------------

export const DEFAULT_TEMPLATES: Omit<NotificationTemplate, "id">[] = [
  {
    code: "ASSIGNMENT_CREATED",
    title: "नयाँ असाइनमेन्ट: {title}",
    body: "तपाईंलाई नयाँ समाचार खोज/लेखनको जिम्मेवारी दिइएको छ। समयसीमा: {deadline}",
    category: "workflow",
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    code: "ASSIGNMENT_DUE",
    title: "समयसीमा अनुस्मारक: {title}",
    body: "तपाईंको समाचार असाइनमेन्ट बुझाउने समयसीमा {deadline} सम्म छ। कृपया समयमै बुझाउनुहोला।",
    category: "workflow",
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    code: "ASSIGNMENT_COMPLETED",
    title: "असाइनमेन्ट सम्पन्न: {title}",
    body: "पत्रकार {reporterName} ले तोकिएको समाचार असाइनमेन्ट सम्पन्न गर्नुभएको छ।",
    category: "editorial",
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    code: "ARTICLE_SUBMITTED",
    title: "समीक्षाको लागि समाचार: {title}",
    body: "लेखक {authorName} ले नयाँ समाचार समीक्षाको लागि पेश गर्नुभएको छ।",
    category: "editorial",
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    code: "ARTICLE_APPROVED",
    title: "समाचार स्वीकृत: {title}",
    body: "तपाईंले पेश गर्नुभएको समाचार सम्पादक मण्डलबाट स्वीकृत भएको छ।",
    category: "editorial",
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    code: "ARTICLE_REJECTED",
    title: "समाचार अस्वीकृत: {title}",
    body: "तपाईंको समाचारमा केही सुधार आवश्यक देखिएकोले अस्वीकृत गरिएको छ। विवरण हेर्नुहोस्।",
    category: "editorial",
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    code: "ARTICLE_PUBLISHED",
    title: "समाचार प्रकाशित: {title}",
    body: "तपाईंको समाचार सफलतापूर्वक अनलाइन संस्करणमा प्रकाशित गरिएको छ।",
    category: "editorial",
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    code: "SYSTEM_ERROR",
    title: "प्रणाली चेतावनी: त्रुटि फेला पर्यो",
    body: "सर्भर वा एप्लिकेसनमा प्राविधिक त्रुटि देखा परेको छ: {error}",
    category: "system",
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    code: "GEMINI_FAILURE",
    title: "Gemini AI विच्छेद",
    body: "Gemini AI को-पाइलट सेवा पहुँच गर्न समस्या भइरहेको छ।",
    category: "system",
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    code: "DATABASE_FAILURE",
    title: "डेटाबेस जडान समस्या",
    body: "क्लाउड फायरस्टोर वा डेटाबेसमा पहुँच गर्दा अवरोध सिर्जना भएको छ।",
    category: "system",
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    code: "HEALTH_CHECK_FAILURE",
    title: "सेवा स्तर ह्रास (Service Degraded)",
    body: "स्वास्थ्य जाँचमा केही महत्वपूर्ण प्रणाली गेटवेहरू निष्क्रिय भेटिएका छन्।",
    category: "system",
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    code: "REPLY_RECEIVED",
    title: "टिप्पणी प्राप्त भयो",
    body: "{userName} ले तपाईंको चौतारी पोष्टमा टिप्पणी थप्नुभएको छ।",
    category: "community",
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    code: "POST_REPORTED",
    title: "चौतारी पोष्ट रिपोर्ट गरिएको छ",
    body: "पोष्ट '{title}' लाई नियम विपरित भएको भन्दै रिपोर्ट गरिएको छ। समीक्षा आवश्यक छ।",
    category: "community",
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    code: "MODERATOR_ACTION",
    title: "सञ्चालक कदम (Moderator Action)",
    body: "चौतारी सञ्चालकद्वारा तपाईंको पोष्ट वा प्रतिक्रियामा नियम बमोजिम कारबाही गरिएको छ।",
    category: "community",
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    code: "CAMPAIGN_STARTED",
    title: "विज्ञापन अभियान सक्रिय: {name}",
    body: "तपाईंको नयाँ विज्ञापन अभियान आजदेखि दर्शकहरूका लागि सक्रिय गरिएको छ।",
    category: "business",
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    code: "CAMPAIGN_ENDED",
    title: "विज्ञापन अभियान सम्पन्न: {name}",
    body: "तपाईंको विज्ञापन अभियानको तोकिएको अवधि सकिएकोले सम्पन्न भएको छ।",
    category: "business",
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    code: "BUDGET_THRESHOLD_REACHED",
    title: "बजेट सीमा चेतावनी: {name}",
    body: "तपाईंको विज्ञापन अभियानले ९०% बजेट सीमा पार गरेको छ।",
    category: "business",
    isActive: true,
    updatedAt: new Date().toISOString()
  }
];

/**
 * Seed default notification templates if they do not exist
 */
export async function seedNotificationTemplates() {
  try {
    const templatesCol = collection(db, "notificationTemplates");
    const snapshot = await getDocs(templatesCol);
    
    if (snapshot.empty) {
      console.log("Seeding default notification templates...");
      for (const t of DEFAULT_TEMPLATES) {
        await addDoc(templatesCol, t);
      }
      console.log("Notification templates seeded successfully!");
    }
  } catch (error) {
    console.error("Error seeding notification templates:", error);
  }
}

/**
 * Create a direct in-app notification document
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error" | "workflow" | "editorial" | "system" | "community" | "business",
  extraData?: Record<string, any>
) {
  try {
    const notifCol = collection(db, "notifications");
    await addDoc(notifCol, {
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
      ...extraData
    });
  } catch (err) {
    console.error("Failed to create in-app notification:", err);
  }
}

/**
 * Dispatch notification using Template resolver and User Preferences check
 */
export async function triggerNotificationFromTemplate(
  templateCode: string,
  userId: string,
  templateVariables: Record<string, string>,
  extraData?: Record<string, any>
) {
  try {
    // 1. Fetch template from database or fallback to default
    const templatesCol = collection(db, "notificationTemplates");
    const q = query(templatesCol, where("code", "==", templateCode));
    const snapshot = await getDocs(q);
    
    let template: Omit<NotificationTemplate, "id"> | null = null;
    
    if (!snapshot.empty) {
      template = snapshot.docs[0].data() as Omit<NotificationTemplate, "id">;
    } else {
      // Find fallback in hardcoded list
      const fallback = DEFAULT_TEMPLATES.find(t => t.code === templateCode);
      if (fallback) template = fallback;
    }

    if (!template || !template.isActive) {
      console.warn(`Template ${templateCode} is not found or inactive.`);
      return;
    }

    // 2. Check User Preferences
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    let preferences = {
      workflow: true,
      editorial: true,
      system: true,
      community: true,
      business: true
    };

    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.notificationPreferences) {
        preferences = { ...preferences, ...userData.notificationPreferences };
      }
    }

    // If preference is disabled for this template category, skip
    const category = template.category;
    if (!preferences[category]) {
      console.log(`Notification skipped: User ${userId} disabled ${category} alerts.`);
      return;
    }

    // 3. Resolve Placeholders
    let resolvedTitle = template.title;
    let resolvedBody = template.body;

    Object.entries(templateVariables).forEach(([key, val]) => {
      resolvedTitle = resolvedTitle.replace(new RegExp(`{${key}}`, "g"), val);
      resolvedBody = resolvedBody.replace(new RegExp(`{${key}}`, "g"), val);
    });

    // 4. Write Notification document to Firestore
    await createNotification(userId, resolvedTitle, resolvedBody, template.category, extraData);

    // 5. Send telemetry/delivery logging
    console.log(`Notification sent to User ${userId}: "${resolvedTitle}"`);
  } catch (error) {
    console.error(`Error triggering notification ${templateCode}:`, error);
  }
}

/**
 * Factory helper: Create a notification when an article is published.
 * Guarantees entityType="article", entityId=article.id, and targetRoute="/article/:id"
 */
export async function createArticlePublishedNotification(
  userId: string,
  article: { id: string; title: string; authorId?: string }
) {
  return createNotification(
    userId,
    "समाचार प्रकाशित",
    `तपाईंको समाचार "${article.title}" सफलतापूर्वक प्रकाशित गरिएको छ।`,
    "editorial",
    {
      entityType: "article",
      entityId: article.id,
      articleId: article.id,
      targetRoute: `/article/${article.id}`,
      targetType: "article"
    }
  );
}

/**
 * Factory helper: Create a notification for Community/Chautari posts
 */
export async function createCommunityPostNotification(
  userId: string,
  post: { id: string; title: string }
) {
  return createNotification(
    userId,
    "नयाँ चौतारी पोष्ट",
    `पोष्ट "${post.title}" चौतारीमा प्रकाशित भएको छ।`,
    "community",
    {
      entityType: "community_post",
      entityId: post.id,
      postId: post.id,
      targetRoute: `/community/post/${post.id}`,
      targetType: "chautari_post"
    }
  );
}

/**
 * Factory helper: Create a notification for Academy Courses
 */
export async function createCourseNotification(
  userId: string,
  course: { id: string; title: string }
) {
  return createNotification(
    userId,
    "नयाँ पाठ्यक्रम",
    `नयाँ पाठ्यक्रम "${course.title}" एकेडेमीमा उपलब्ध छ।`,
    "workflow",
    {
      entityType: "course",
      entityId: course.id,
      courseId: course.id,
      targetRoute: `/academy/course/${course.id}`,
      targetType: "course"
    }
  );
}

/**
 * Factory helper: Create a Breaking News notification targeting exact article
 */
export async function createBreakingNewsNotification(
  article: { id: string; title: string; summary?: string }
) {
  return broadcastNotification({
    title: `ताजा समाचार: ${article.title}`,
    body: article.summary || article.title,
    link: `/article/${article.id}`
  });
}

/**
 * Factory helper: Create an Event reminder notification
 */
export async function createEventNotification(
  userId: string,
  event: { id: string; title: string; date?: string }
) {
  return createNotification(
    userId,
    "कार्यक्रम अनुस्मारक",
    `कार्यक्रम "${event.title}" आगामी समयमा सञ्चालन हुँदैछ।`,
    "workflow",
    {
      entityType: "event",
      entityId: event.id,
      eventId: event.id,
      targetRoute: `/events/${event.id}`,
      targetType: "event"
    }
  );
}

/**
 * Factory helper: Create Knowledge update notification
 */
export async function createKnowledgeNotification(
  userId: string,
  entity: { id: string; title: string }
) {
  return createNotification(
    userId,
    "ज्ञानकोष अध्यावधिक",
    `ज्ञानकोष सामग्री "${entity.title}" अध्यावधिक गरिएको छ।`,
    "editorial",
    {
      entityType: "knowledge_entity",
      entityId: entity.id,
      targetRoute: `/knowledge/entity/${entity.id}`,
      targetType: "knowledge_entity"
    }
  );
}

