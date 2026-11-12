import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CheckCircle, AlertCircle, Info, ShieldAlert, Volume2, Sparkles } from "lucide-react";
import { useAuth } from "@/src/lib/auth";
import { toSafeDate } from "@/src/lib/utils";
import type { Notification } from "@/src/types";
import { toast } from "sonner";
import { useLimitedMode } from "@/src/hooks/useFirestoreQuota";
import { playTempleBellSound } from "@/src/utils/audio";
import { notificationsOS } from "@/src/services/notificationsOS";
import { resolveNotificationTarget, routeNotification } from "@/src/utils/notificationRouter";

interface NotificationBellProps {
  className?: string;
  iconSize?: number;
}

// Global module-level set to deduplicate toasts across multiple mounted NotificationBell instances
const globalNotifiedIds = new Set<string>();
let isGlobalNotificationInitialized = false;

export default function NotificationBell({ className = "", iconSize = 20 }: NotificationBellProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const limitedMode = useLimitedMode();
  const lastNotificationId = useRef<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        let userNotifs: Notification[] = [];

        // 1. If user is logged in, fetch from Notifications OS Private Inbox
        if (user && user.uid) {
          try {
            const inboxRes = await notificationsOS.getUserInbox(user.uid, { limit: 25 });
            if (inboxRes && inboxRes.items) {
              userNotifs = inboxRes.items.map(item => ({
                id: item.id,
                userId: user.uid,
                title: item.title,
                message: item.body,
                type: (item.priority === "critical" ? "error" : item.priority === "high" ? "warning" : "info") as any,
                createdAt: item.createdAt,
                isRead: item.isRead,
                entityType: item.entityType,
                entityId: item.entityId,
                link: item.canonicalUrl
              }));
            }
          } catch (err) {
            console.warn("[NotificationBell] Failed to load user inbox:", err);
          }
        }

        // 2. Fetch public announcements from Notifications OS snapshot cache
        let systemNotifs: Notification[] = [];
        try {
          const publicAnnouncements = await notificationsOS.getPublicAnnouncements({ limit: 15 });
          if (Array.isArray(publicAnnouncements) && publicAnnouncements.length > 0) {
            systemNotifs = publicAnnouncements.map((a: any) => ({
              id: a.id || `ann_${a.entityId}`,
              userId: user?.uid || "guest",
              title: a.title,
              message: a.body || a.message || "",
              type: (a.priority === "critical" ? "error" : a.priority === "high" ? "warning" : "info") as any,
              createdAt: a.createdAt || new Date().toISOString(),
              isRead: false,
              entityType: a.entityType,
              entityId: a.entityId,
              link: a.canonicalUrl
            }));
          }
        } catch (e) {
          console.warn("[NotificationBell] Announcements fetch notice:", e);
        }

        const combined = [...userNotifs, ...systemNotifs];
        setNotifications(combined);

        if (!isGlobalNotificationInitialized) {
          combined.forEach(n => {
            if (n.id) globalNotifiedIds.add(n.id);
          });
          isGlobalNotificationInitialized = true;
          if (combined[0]?.id) {
            lastNotificationId.current = combined[0].id;
          }
        } else {
          const latest = combined[0];
          if (latest && latest.id && !globalNotifiedIds.has(latest.id)) {
            globalNotifiedIds.add(latest.id);
            lastNotificationId.current = latest.id;
            playTempleBellSound();
            toast(latest.title, {
              description: latest.message,
              icon: latest.type === 'success' ? '✅' : latest.type === 'error' ? '❌' : 'ℹ️',
            });
          }
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();

    const unsubscribe = notificationsOS.subscribe(() => {
      fetchNotifications();
    });

    const interval = setInterval(fetchNotifications, Math.max(30000, limitedMode.refreshInterval * 2));

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [user, limitedMode.refreshInterval]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    if (user && user.uid) {
      await notificationsOS.markAllAsRead(user.uid);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
      if (user && user.uid) {
        await notificationsOS.markAsRead(user.uid, n.id);
      }
    }
    setIsOpen(false);
    await routeNotification(n, navigate);
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />;
      case "error":
        return <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell size={iconSize} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[1rem] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                सूचना तथा सन्देश (Notifications)
              </h3>
              {unreadCount > 0 && (
                <span className="bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 text-xs px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} नयाँ
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 font-medium hover:underline"
              >
                सबै पढिएको बनाउनुहोस्
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40 stroke-1" />
                <p className="text-sm">हाल कुनै नयाँ सूचना छैन।</p>
                <p className="text-xs text-slate-400 mt-1">No notifications right now.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 flex gap-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                    !n.isRead ? "bg-orange-50/40 dark:bg-orange-950/10" : ""
                  }`}
                >
                  {getIcon(n.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4
                        className={`text-sm truncate ${
                          !n.isRead
                            ? "font-bold text-slate-900 dark:text-slate-100"
                            : "font-medium text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block font-mono">
                      {toSafeDate(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              to="/my-sanatan?tab=notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition"
            >
              सबै सूचनाहरू हेर्नुहोस् (View Full Inbox) →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
