import { db } from "../lib/firebase";
import { collection, addDoc } from "@/src/lib/firebase";

export interface IntelligenceNotification {
  title: string;
  message: string;
  type: "festival" | "forex" | "notice" | "weather";
  link?: string;
}

export async function sendIntelligenceNotification(notification: IntelligenceNotification) {
  try {
    // Save to Firestore notifications collection so it appears in bell dropdowns and triggers push
    if (db) {
      await addDoc(collection(db, "notifications"), {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        link: notification.link || "/nepal-hub",
        createdAt: new Date().toISOString(),
        isRead: false,
        isGlobal: true
      });
    }

    // Trigger browser notification if permission granted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/logo.png"
      });
    }

    console.log("Notification Intelligence Dispatched:", notification.title);
    return true;
  } catch (error) {
    console.error("Failed to dispatch intelligence notification:", error);
    return false;
  }
}

export function runAutomaticIntelligenceChecks() {
  // Check if we already notified today
  const lastCheckKey = "sanatan_intel_notified_date";
  const todayStr = new Date().toDateString();
  const lastChecked = localStorage.getItem(lastCheckKey);

  if (lastChecked === todayStr) return; // Already checked today

  // Simulate automated triggers based on live intelligence
  setTimeout(() => {
    sendIntelligenceNotification({
      title: "🪔 आगामी पर्व सूचना: नागपञ्चमी भोलि",
      message: "भोलि साउन शुक्ल पञ्चमी अर्थात् नागपञ्चमी पर्व मनाइँदैछ। पशुपति र नागदहमा विशेष पूजाको तयारी।",
      type: "festival",
      link: "/nepal-hub"
    });

    sendIntelligenceNotification({
      title: "💱 नेपाल राष्ट्र बैंक विनिमय दर अपडेट",
      message: "अमेरिकी डलरको विनिमय दर १३५.२० पुगेको छ। विवरण Nepal Hub मा हेर्नुहोस्।",
      type: "forex",
      link: "/nepal-hub"
    });
  }, 4000);

  localStorage.setItem(lastCheckKey, todayStr);
}
