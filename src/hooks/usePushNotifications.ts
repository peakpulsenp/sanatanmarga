import { useState, useEffect } from 'react';
import { getToken, onMessage } from '../lib/messagingClient';
import { messaging, db, auth, doc, updateDoc, arrayUnion } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { notificationsOS } from '../services/notificationsOS';

const isNotificationSupported = typeof window !== 'undefined' && 'Notification' in window;

export function usePushNotifications() {
  const { user } = useAuth();
  const vapidKey = (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY?.trim() || null;
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>(
    isNotificationSupported ? window.Notification.permission : 'default'
  );

  useEffect(() => {
    if (!messaging) return;

    // Handle foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[usePushNotifications] Foreground push received:', payload);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!messaging || !isNotificationSupported || !vapidKey || !user) return;
    
    const initializeExistingToken = async () => {
      if (isNotificationSupported && window.Notification.permission === 'granted' && auth?.currentUser) {
        try {
          const currentToken = await getToken(messaging, { vapidKey });
          if (currentToken && currentToken !== token) {
            setToken(currentToken);
            await saveTokenToUser(currentToken);
          }
        } catch (e) {
          console.warn("[FCM] Auto-fetching existing token warning:", e);
        }
      }
    };

    initializeExistingToken();
  }, [user, token, vapidKey]);

  const requestPermission = async () => {
    if (!messaging || !isNotificationSupported) return null;
    if (!vapidKey) {
      console.info("[FCM] VITE_FIREBASE_VAPID_KEY not configured. Web push requires valid VAPID credentials.");
      return null;
    }

    try {
      const status = await window.Notification.requestPermission();
      setPermission(status);

      if (status === 'granted') {
        const currentToken = await getToken(messaging, { 
          vapidKey 
        });
        
        if (currentToken) {
          setToken(currentToken);
          await saveTokenToUser(currentToken);
          return currentToken;
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      }
    } catch (err) {
      console.error('An error occurred while retrieving token: ', err);
    }
    return null;
  };

  const saveTokenToUser = async (fcmToken: string) => {
    if (!auth.currentUser) return;

    try {
      // 1. Sync with Notifications OS backend Device Registry
      await notificationsOS.registerPushDevice({
        userId: auth.currentUser.uid,
        deviceToken: fcmToken,
        platform: "web",
        topics: ["announcements", "articles", "events"]
      });

      // 2. Sync to Firestore user document
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(fcmToken)
      });
    } catch (err) {
      console.error('Error saving FCM token to user: ', err);
    }
  };

  const unregisterToken = async () => {
    if (token) {
      await notificationsOS.unregisterPushDevice(user?.uid, token);
      setToken(null);
    }
  };

  return { 
    token, 
    permission, 
    requestPermission, 
    unregisterToken,
    isSupported: !!messaging && isNotificationSupported
  };
}
