const STORAGE_KEY = 'devnexus_notifications';

export const getNotifications = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const saveNotifications = (list) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('devnexus-notifications-updated'));
};

export const pushNotification = ({ type, title, message, createdBy, path = '/' }) => {
    const existing = getNotifications();
    const newItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type, // 'inquiry' | 'website' | 'project' | 'link' | 'calendar'
        title,
        message,
        createdBy: createdBy || 'Team Member',
        path,
        read: false,
        createdAt: new Date().toISOString()
    };
    const updated = [newItem, ...existing].slice(0, 100);
    saveNotifications(updated);
    return newItem;
};

export const markNotificationRead = (id) => {
    const updated = getNotifications().map(n => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
};

export const markAllNotificationsRead = () => {
    const updated = getNotifications().map(n => ({ ...n, read: true }));
    saveNotifications(updated);
};

export const deleteNotification = (id) => {
    const updated = getNotifications().filter(n => n.id !== id);
    saveNotifications(updated);
};

export const clearAllNotifications = () => {
    saveNotifications([]);
};

export const getUnreadNotificationCount = () => {
    return getNotifications().filter(n => !n.read).length;
};