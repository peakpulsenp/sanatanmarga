/* eslint-disable no-undef */
/**
 * SANATANMARGA 5.0 BETA — FIREBASE MESSAGING SERVICE WORKER
 * Phase 3A: Web Push & Exact Canonical Deep-Link Window Management
 */
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: "gen-lang-client-0998131570",
  appId: "1:444924863128:web:7fdc5aae43442fa7b7a6ed",
  apiKey: "AIzaSyCGbCHWxrJb9WFZFea5i-5pOlKdTFHDc44",
  authDomain: "gen-lang-client-0998131570.firebaseapp.com",
  messagingSenderId: "444924863128"
});

const messaging = firebase.messaging();

function extractCanonicalTarget(data) {
  if (!data) return '/';
  if (data.canonicalUrl && typeof data.canonicalUrl === 'string') return data.canonicalUrl;
  if (data.url && typeof data.url === 'string') return data.url;
  if (data.link && typeof data.link === 'string') return data.link;

  const entityType = data.entityType || data.targetType;
  const entityId = data.entityId || data.targetId || data.articleId || data.postId;

  if (entityType && entityId) {
    if (entityType === 'article') return '/article/' + encodeURIComponent(entityId);
    if (entityType === 'blog_post') return '/blog/' + encodeURIComponent(entityId);
    if (entityType === 'chautari_post') return '/chautari/post/' + encodeURIComponent(entityId);
    if (entityType === 'event') return '/event/' + encodeURIComponent(entityId);
    if (entityType === 'academy_course') return '/academy/course/' + encodeURIComponent(entityId);
    if (entityType === 'nepal_hub') return '/nepal-hub';
    if (entityType === 'live_dispatch') return '/live/' + encodeURIComponent(entityId);
  return '/target-unavailable?reason=UNRESOLVED_TARGET';
}

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background Push Received:', payload);
  const notificationTitle = payload.notification?.title || 'SanatanMarga 5.0';
  const targetUrl = extractCanonicalTarget(payload.data);

  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.image || '/logo.png',
    badge: '/icons/icon-192.png',
    data: {
      ...payload.data,
      canonicalUrl: targetUrl
    },
    actions: [
      { action: 'open_canonical', title: 'हेर्नुहोस् (Open)' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = extractCanonicalTarget(event.notification.data);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Look for already open client with matching target or origin
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
