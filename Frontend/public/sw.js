self.addEventListener('push', function(event) {
    // Parse the incoming push payload from the backend
    const data = event.data ? event.data.json() : {};

    const options = {
        body: data.message || "You have a new message.",
        icon: data.senderAvatar || '/vite.svg', // Fallback to your default app icon
        badge: '/vite.svg', // Small monochrome icon for Android status bar
        vibrate: [200, 100, 200],
        data: { url: '/chat' } // Where to navigate when clicked
    };

    event.waitUntil(
        self.registration.showNotification(data.senderName || "DevNexus", options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            // Check if a tab is already open to the chat URL, focus it if so
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(event.notification.data.url) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise, open a new tab/window
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});