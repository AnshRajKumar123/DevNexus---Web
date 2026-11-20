const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/notifications`;

const emitUpdate = () => {
    window.dispatchEvent(new CustomEvent('devnexus-notifications-updated'));
};

export const getNotifications = async (userEmail) => {
    try {
        const query = userEmail ? `?email=${encodeURIComponent(userEmail)}` : '';
        const res = await fetch(`${API_URL}${query}`);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
};

export const pushNotification = async ({ type, title, message, createdBy, path = '/' }) => {
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, title, message, createdBy, path })
        });
        if (res.ok) {
            const data = await res.json();
            emitUpdate();
            return data;
        }
    } catch (err) {
        console.error('Failed to push notification:', err);
    }
    return null;
};

export const markNotificationRead = async (id, userEmail) => {
    try {
        await fetch(`${API_URL}/${id}/read`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail })
        });
        emitUpdate();
    } catch (err) {
        console.error('Failed to mark notification read:', err);
    }
};

export const markAllNotificationsRead = async (userEmail) => {
    try {
        await fetch(`${API_URL}/read-all`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail })
        });
        emitUpdate();
    } catch (err) {
        console.error('Failed to mark all read:', err);
    }
};

export const deleteNotification = async (id, userEmail) => {
    try {
        await fetch(`${API_URL}/${id}/delete`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail })
        });
        emitUpdate();
    } catch (err) {
        console.error('Failed to delete notification:', err);
    }
};

export const clearAllNotifications = async (userEmail) => {
    try {
        await fetch(`${API_URL}/clear-all`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail })
        });
        emitUpdate();
    } catch (err) {
        console.error('Failed to clear notifications:', err);
    }
};

export const getUnreadNotificationCount = async (userEmail) => {
    if (!userEmail) return 0;
    const list = await getNotifications(userEmail);
    return list.filter(n => !(n.readBy && n.readBy.includes(userEmail))).length;
};