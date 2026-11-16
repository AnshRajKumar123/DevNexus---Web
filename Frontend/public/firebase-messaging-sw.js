importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDDgRoIkUPYpCFiCLgExj6UHf96lGgqqs8",
  authDomain: "devnexus-ec954.firebaseapp.com",
  projectId: "devnexus-ec954",
  storageBucket: "devnexus-ec954.firebasestorage.app",
  messagingSenderId: "470483590221",
  appId: "1:470483590221:web:5813e07430d7335237d004"
});

const messaging = firebase.messaging();

// Handle background notifications cleanly
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title || "DevNexus";
  const notificationOptions = {
    body: payload.notification.body || "You have a new message.",
    icon: payload.notification.icon || '/logo.png',
    image: payload.notification.image || undefined,
    data: { url: payload.webpush?.notification?.click_action || '/chat' }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(event.notification.data.url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});