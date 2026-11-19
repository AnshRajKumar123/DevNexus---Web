import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
    Sun, MessageCircle, Calendar,
    Globe, Users, MessageSquare, Link as LinkIcon, Plug,
    CheckCircle2, Menu, X, Briefcase
} from 'lucide-react';
import { useData } from '../context/DataContext';
import '../styles/Sidebar.css';
import { DashPic } from '../assets/assets';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

export default function Sidebar() {
    const { currentUser, isDarkMode, toggleTheme } = useData();
    const [unreadCount, setUnreadCount] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    const isDashboard = location.pathname === '/';

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!currentUser) return;

        const fetchUnreadChats = async () => {
            try {
                const res = await fetch(`${API_URL}/chats`);
                if (res.ok) {
                    const chats = await res.json();
                    const unread = chats.filter(c =>
                        c.senderEmail !== currentUser.email &&
                        (c.recipientEmail === 'all' || c.recipientEmail === currentUser.email) &&
                        (!c.readBy || !c.readBy.includes(currentUser.email))
                    );
                    setUnreadCount(unread.length);
                }
            } catch (err) {
                console.error('Error fetching sidebar unread count:', err);
            }
        };

        fetchUnreadChats();
        const interval = setInterval(fetchUnreadChats, 3000);
        return () => clearInterval(interval);
    }, [currentUser]);

    const menuSections = [
        {
            label: 'Home',
            items: [
                { title: 'Today', icon: <Sun size={18} />, path: '/' },
            ]
        },
        {
            label: 'Messages',
            items: [
                {
                    title: 'ChatBox',
                    icon: <MessageCircle size={18} />,
                    path: '/chat',
                    badge: unreadCount > 0 ? unreadCount : null
                },
            ]
        },
        {
            label: 'Schedule',
            items: [
                { title: 'Calendar', icon: <Calendar size={18} color="#4285F4" />, path: '/calendar' },
                { title: 'My To-Do List', icon: <CheckCircle2 size={18} color="#10b981" />, path: '/todo' },
            ]
        },
        {
            label: 'Business',
            items: [
                { title: 'Projects', icon: <Briefcase size={18} />, path: '/projects' },
                { title: 'Live Website', icon: <Globe size={18} />, path: '/website' },
                { title: 'Team', icon: <Users size={18} />, path: '/team' },
                { title: 'Inquiry', icon: <MessageSquare size={18} />, path: '/inquiry' },
            ]
        },
        {
            label: 'Setup',
            items: [
                { title: 'Quick links', icon: <LinkIcon size={18} />, path: '/links' },
                { title: 'Connected apps', icon: <Plug size={18} />, path: '/apps' },
            ]
        }
    ];

    const avatarSrc = currentUser?.imgUrl
        ? (currentUser.imgUrl.startsWith('http') ? currentUser.imgUrl : `${import.meta.env.VITE_API_URL}${currentUser.imgUrl}`)
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=${currentUser?.isSupremeAdmin ? '0f172a' : 'e5e7eb'}&color=${currentUser?.isSupremeAdmin ? 'fff' : '374151'}&bold=true`;

    const mobileBottomNav = [
        { title: 'Today', icon: <Sun size={20} />, path: '/' },
        { title: 'ChatBox', icon: <MessageCircle size={20} />, path: '/chat', badge: unreadCount > 0 ? unreadCount : null },
        { title: 'Projects', icon: <Briefcase size={20} />, path: '/projects' },
        { title: 'To-Do', icon: <CheckCircle2 size={20} />, path: '/todo' },
        { title: 'Profile', icon: <img src={avatarSrc} alt="Profile" className="mobile-btm-avatar" />, path: '/profile' }
    ];

    return (
        <>
            {/* --- MOBILE TOP NAVBAR --- */}
            <div className={`mobile-top-navbar ${isDashboard ? 'is-dashboard' : 'is-subpage'}`}>
                <div className="mobile-brand">
                    <img src={DashPic.WebLogo} alt="DevNexus" className="brand-logo" />
                    <span className="brand-text">DevNexus</span>
                </div>

                <button
                    className="mobile-hamburger-btn"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle Menu"
                    type="button"
                >
                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* --- MOBILE RIGHT SIDE SLIDE-OUT DRAWER --- */}
            <div className={`mobile-drawer-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <div className={`mobile-slide-drawer ${mobileMenuOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
                    <div className="drawer-header">
                        <h3>DevNexus</h3>
                        <button className="drawer-close" onClick={() => setMobileMenuOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>
                    <div className="drawer-scrollable">
                        {menuSections.map((section, idx) => (
                            <div key={idx} className="sidebar-section">
                                <h3 className="section-label">{section.label}</h3>
                                <ul className="sidebar-list">
                                    {section.items.map((item, iIdx) => (
                                        <li key={iIdx} className="sidebar-item">
                                            <NavLink to={item.path} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                                                <div className="nav-link-left">
                                                    <span className="nav-icon">{item.icon}</span>
                                                    <span className="nav-title">{item.title}</span>
                                                </div>
                                                {item.badge && <span className="nav-badge">{item.badge}</span>}
                                            </NavLink>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="sidebar-bottom">
                        <div className="theme-toggle-container">
                            <label className="switch">
                                <input type="checkbox" checked={isDarkMode} onChange={toggleTheme} />
                                <span className="slider" />
                            </label>
                            <span className="theme-text">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
                        </div>

                        <Link to="/profile" className="profile-link-reset">
                            <div className="profile-widget hover-pop">
                                <img src={avatarSrc} alt={currentUser?.name || "Profile"} className="profile-pic" />
                                <div className="profile-info">
                                    <h4 className="profile-name">{currentUser?.name || 'Loading...'}</h4>
                                    <p className="profile-role">{currentUser?.role || 'Team Member'}</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* --- DESKTOP SIDEBAR --- */}
            <aside className="sidebar desktop-sidebar">
                <div className="sidebar-header">
                    <img src={DashPic.WebLogo} alt="DevNexus Logo" className="brand-logo" />
                    <span className="brand-text">DevNexus</span>
                </div>

                <div className="sidebar-scrollable">
                    {menuSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="sidebar-section">
                            <h3 className="section-label">{section.label}</h3>
                            <ul className="sidebar-list">
                                {section.items.map((item, itemIndex) => (
                                    <li key={itemIndex} className="sidebar-item">
                                        <NavLink
                                            to={item.path}
                                            className={({ isActive }) =>
                                                isActive ? "nav-link active" : "nav-link"
                                            }
                                        >
                                            <div className="nav-link-left">
                                                <span className="nav-icon">{item.icon}</span>
                                                <span className="nav-title">{item.title}</span>
                                            </div>
                                            {item.badge && (
                                                <span className="nav-badge animate-pulse">{item.badge}</span>
                                            )}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="sidebar-bottom">
                    <div className="theme-toggle-container">
                        <label className="switch">
                            <input type="checkbox" checked={isDarkMode} onChange={toggleTheme} />
                            <span className="slider" />
                        </label>
                        <span className="theme-text">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
                    </div>

                    <Link to="/profile" className="profile-link-reset">
                        <div className="profile-widget hover-pop">
                            <img src={avatarSrc} alt={currentUser?.name || "Profile"} className="profile-pic" />
                            <div className="profile-info">
                                <h4 className="profile-name">{currentUser?.name || 'Loading...'}</h4>
                                <p className="profile-role">{currentUser?.role || 'Team Member'}</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </aside>

            {/* --- MOBILE BOTTOM NAVBAR (LIQUID GLASS PILL) --- */}
            <nav className="mobile-bottom-navbar">
                {mobileBottomNav.map((nav, idx) => (
                    <NavLink
                        key={idx}
                        to={nav.path}
                        className={({ isActive }) => isActive ? "mobile-btm-item active" : "mobile-btm-item"}
                    >
                        <div className="mobile-btm-icon-wrapper">
                            {nav.icon}
                            {nav.badge && <span className="mobile-btm-badge">{nav.badge}</span>}
                        </div>
                        <span className="mobile-btm-title">{nav.title}</span>
                    </NavLink>
                ))}
            </nav>
        </>
    );
}