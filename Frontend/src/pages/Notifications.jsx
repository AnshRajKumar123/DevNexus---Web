import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, CheckCheck, Trash2, Briefcase, Globe, CalendarDays,
    Link as LinkIcon, FileQuestion, Sparkles
} from 'lucide-react';
import { useData } from '../context/DataContext';
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearAllNotifications
} from '../utils/notifications';
import '../styles/Notifications.css';

const formatTimeAgo = (iso) => {
    if (!iso) return '';
    const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function Notifications() {
    const navigate = useNavigate();
    const { currentUser } = useData();
    const userEmail = currentUser?.email || '';

    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' | 'unread'

    const syncNotifications = async () => {
        if (!userEmail) return;
        const data = await getNotifications(userEmail);
        setNotifications(data);
        setIsLoading(false);
    };

    useEffect(() => {
        // Clean up legacy localStorage key if present
        localStorage.removeItem('devnexus_notifications');

        syncNotifications();
        const interval = setInterval(syncNotifications, 5000);
        window.addEventListener('devnexus-notifications-updated', syncNotifications);
        return () => {
            clearInterval(interval);
            window.removeEventListener('devnexus-notifications-updated', syncNotifications);
        };
    }, [userEmail]);

    const getTypeIcon = (type) => {
        switch (type) {
            case 'project': return <Briefcase size={18} color="#3b82f6" />;
            case 'website': return <Globe size={18} color="#10b981" />;
            case 'calendar': return <CalendarDays size={18} color="#2563eb" />;
            case 'link': return <LinkIcon size={18} color="#0ea5e9" />;
            case 'inquiry': return <FileQuestion size={18} color="#f59e0b" />;
            default: return <Bell size={18} color="#3b82f6" />;
        }
    };

    const isItemRead = (item) => Boolean(item.readBy && item.readBy.includes(userEmail));

    const unreadCount = notifications.filter(n => !isItemRead(n)).length;
    const filteredList = filter === 'unread' ? notifications.filter(n => !isItemRead(n)) : notifications;

    const handleOpen = async (item) => {
        const id = item._id || item.id;
        if (!isItemRead(item)) {
            setNotifications(prev =>
                prev.map(n => ((n._id || n.id) === id ? { ...n, readBy: [...(n.readBy || []), userEmail] } : n))
            );
            await markNotificationRead(id, userEmail);
        }
        if (item.path) navigate(item.path);
    };

    const handleMarkAllRead = async () => {
        setNotifications(prev =>
            prev.map(n => ({
                ...n,
                readBy: n.readBy?.includes(userEmail) ? n.readBy : [...(n.readBy || []), userEmail]
            }))
        );
        await markAllNotificationsRead(userEmail);
    };

    const handleDelete = async (id) => {
        setNotifications(prev => prev.filter(n => (n._id || n.id) !== id));
        await deleteNotification(id, userEmail);
    };

    const handleClearAll = async () => {
        setNotifications([]);
        await clearAllNotifications(userEmail);
    };

    return (
        <div className="dashboard-wrapper page-animate notifications-page">
            <header className="team-hero stagger-1">
                <div className="hero-text-content">
                    <h1 className="hero-greeting">Workspace <span className="highlight-name">Notifications</span></h1>
                    <p className="hero-subtitle">Stay updated on new inquiries, projects, live websites, quick links, and meetings.</p>
                </div>
                {notifications.length > 0 && (
                    <div className="notif-hero-actions">
                        {unreadCount > 0 && (
                            <button className="btn-modern-primary hover-pop" onClick={handleMarkAllRead}>
                                <CheckCheck size={16} /> Mark All Read
                            </button>
                        )}
                        <button className="btn-modern-danger hover-pop" onClick={handleClearAll}>
                            <Trash2 size={16} /> Clear All
                        </button>
                    </div>
                )}
            </header>

            <section className="dashboard-grid stagger-2">
                <div className="grid-col" style={{ gridColumn: 'span 2' }}>
                    <div className="premium-widget">
                        <div className="widget-header notif-widget-header">
                            <h3><Bell size={18} className="icon-blue" /> Activity Feed ({filteredList.length})</h3>
                            <div className="notif-filter-tabs">
                                <button
                                    className={`notif-tab ${filter === 'all' ? 'active' : ''}`}
                                    onClick={() => setFilter('all')}
                                >
                                    All ({notifications.length})
                                </button>
                                <button
                                    className={`notif-tab ${filter === 'unread' ? 'active' : ''}`}
                                    onClick={() => setFilter('unread')}
                                >
                                    Unread ({unreadCount})
                                </button>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="notif-list-modern">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="notif-card-item">
                                        <div className="skeleton skeleton-avatar" style={{ borderRadius: '12px', width: '42px', height: '42px' }}></div>
                                        <div className="notif-main-info">
                                            <div className="skeleton skeleton-text medium"></div>
                                            <div className="skeleton skeleton-text short"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredList.length === 0 ? (
                            <div className="empty-state">
                                <Sparkles size={44} color="#94a3b8" />
                                <h3>All Caught Up</h3>
                                <p>{filter === 'unread' ? 'No unread notifications right now.' : 'New workspace activity will appear here.'}</p>
                            </div>
                        ) : (
                            <div className="notif-list-modern">
                                {filteredList.map((item) => {
                                    const id = item._id || item.id;
                                    const unread = !isItemRead(item);
                                    return (
                                        <div
                                            key={id}
                                            className={`notif-card-item fade-in-row ${unread ? 'is-unread' : ''}`}
                                            onClick={() => handleOpen(item)}
                                        >
                                            <div className="notif-icon-box">
                                                {getTypeIcon(item.type)}
                                            </div>
                                            <div className="notif-main-info">
                                                <div className="notif-top-line">
                                                    <h4>{item.title}</h4>
                                                    <span className="notif-time">{formatTimeAgo(item.createdAt)}</span>
                                                </div>
                                                <p>{item.message}</p>
                                                <span className="notif-meta">By <strong>{item.createdBy}</strong></span>
                                            </div>
                                            <div className="notif-item-actions" onClick={e => e.stopPropagation()}>
                                                {unread && <span className="notif-unread-dot" title="Unread"></span>}
                                                <button
                                                    className="btn-icon-danger hover-pop"
                                                    onClick={() => handleDelete(id)}
                                                    title="Delete Notification"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}