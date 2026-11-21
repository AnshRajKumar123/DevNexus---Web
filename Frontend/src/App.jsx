import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import Inquiry from './pages/Inquiry';
import ConnectedApps from './pages/ConnectedApps';
import QuickLinks from './pages/QuickLinks';
import Calendar from './pages/Calendar';
import LiveWebsite from './pages/LiveWebsite';
import Profile from './pages/Profile';
import MyTodoList from './pages/MyTodoList';
import ChatHub from './pages/ChatHub.jsx';
import Projects from './pages/Projects';
import ScrollToTop from './components/ScrollToTop';
import { useData } from './context/DataContext';
import { DashPic } from './assets/assets';
import MobileInstallPrompt from './components/MobileInstallPrompt';
import { Sparkles, Loader2, Home, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import Notifications from './pages/Notifications.jsx';

// --- GLOBAL CUSTOM DYNAMIC ISLAND API ---
window.island = {
    show: (type, message, options = {}) => window.dispatchEvent(new CustomEvent('trigger-island', { detail: { type, message, ...options } })),
    success: (msg, opts) => window.island.show('success', msg, opts),
    error: (msg, opts) => window.island.show('error', msg, opts),
    loading: (msg, opts) => window.island.show('loading', msg, opts),
    promise: async (promise, msgs) => {
        window.island.loading(msgs.loading);
        try {
            const res = await promise;
            window.island.success(msgs.success);
            return res;
        } catch (err) {
            window.island.error(msgs.error, msgs.errorOptions);
            throw err;
        }
    }
};

const CustomDynamicIsland = () => {
    const [toast, setToast] = useState({ visible: false, type: 'loading', message: '', options: {} });
    const hideTimer = useRef(null);

    useEffect(() => {
        const handleTrigger = (e) => {
            const { type, message, ...options } = e.detail;
            setToast({ visible: true, type, message, options });

            if (hideTimer.current) clearTimeout(hideTimer.current);

            if (type !== 'loading' && !options.permanent) {
                hideTimer.current = setTimeout(() => {
                    setToast(prev => ({ ...prev, visible: false }));
                }, options.duration || 4000);
            }
        };

        window.addEventListener('trigger-island', handleTrigger);
        return () => window.removeEventListener('trigger-island', handleTrigger);
    }, []);

    const closeIsland = () => setToast(prev => ({ ...prev, visible: false }));

    return (
        <div className={`dynamic-island-wrapper ${toast.visible ? 'is-visible' : ''}`}>
            <div className={`dynamic-island island-${toast.type}`}>
                {toast.type === 'loading' && <Loader2 size={16} className="island-spinner" />}
                {toast.type === 'success' && <CheckCircle2 size={16} color="#34d399" />}
                {toast.type === 'error' && <AlertTriangle size={16} color="#f87171" />}

                <span className="island-text">{toast.message}</span>

                {toast.options.action && (
                    <button className="island-action-btn" onClick={() => {
                        toast.options.action.onClick();
                        if (!toast.options.keepOpenOnAction) closeIsland();
                    }}>
                        {toast.options.action.label}
                    </button>
                )}

                {(toast.type !== 'loading' || toast.options.permanent) && (
                    <button className="island-close-btn" onClick={closeIsland}><X size={14} /></button>
                )}
            </div>
        </div>
    );
};

const NotFound404 = () => (
    <div className="not-found-page">
        <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
        <h1>404</h1>
        <h2>Page Not Found or Restricted</h2>
        <p>The page you are trying to access doesn't exist, or you do not have permission to view it. Please return to your workspace.</p>
        <Link to="/" className="btn-modern-primary hover-pop not-found-home-btn">
            <Home size={18} /> Back to Dashboard
        </Link>
    </div>
);

const DashboardLayout = () => (
    <div className="dashboard-container">
        <CustomDynamicIsland />
        <MobileInstallPrompt />
        <Sidebar />
        <div className="main-content-wrapper">
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    </div>
);

export default function App() {
    const { currentUser } = useData();
    const [showSplash, setShowSplash] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isVerifyingSession, setIsVerifyingSession] = useState(true);

    useEffect(() => {
        let timer;
        if (currentUser) {
            setIsVerifyingSession(false);
        } else {
            timer = setTimeout(() => {
                setIsVerifyingSession(false);
            }, 4000);
        }
        return () => clearTimeout(timer);
    }, [currentUser]);

    useEffect(() => {
        if (currentUser && !isVerifyingSession) {
            const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
            if (!hasSeenSplash) {
                setShowSplash(true);
                sessionStorage.setItem('hasSeenSplash', 'true');
            }
        }
    }, [currentUser, isVerifyingSession]);

    useEffect(() => {
        let interval;
        let hideTimer;

        if (showSplash) {
            setProgress(0);
            const duration = 2500;
            const intervalTime = 50;
            const step = (intervalTime / duration) * 100;

            interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + step;
                });
            }, intervalTime);

            hideTimer = setTimeout(() => {
                setShowSplash(false);
            }, duration + 200);
        }

        return () => {
            clearInterval(interval);
            clearTimeout(hideTimer);
        };
    }, [showSplash]);

    if (isVerifyingSession && !currentUser) {
        return (
            <div className="splash-fullscreen">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <img src={DashPic.WebLogo} alt="DevNexus Logo" className="splash-verify-logo" />
                <div className="splash-verify-pill">
                    <Loader2 size={22} color="#2563eb" className="island-spinner" />
                    <span>Verifying secure session...</span>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <>
                <Login />
                <MobileInstallPrompt />
            </>
        );
    }

    if (showSplash) {
        const fallbackName = currentUser.name || currentUser.email.split('@')[0];
        return (
            <div className="splash-fullscreen">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
                <div className="sparkle-star s1"><Sparkles size={14} color="#38bdf8" /></div>
                <div className="sparkle-star s2"><Sparkles size={20} color="#818cf8" /></div>
                <div className="sparkle-star s3"><Sparkles size={12} color="#60a5fa" /></div>
                <div className="sparkle-star s4"><Sparkles size={18} color="#a78bfa" /></div>

                <div className="splash-content pop-in">
                    <img src={DashPic.WebLogo} alt="DevNexus Logo" className="splash-logo" />
                    <div className="splash-greeting-wrapper">
                        <h2>Hey, <span className="splash-name">{fallbackName}!</span> 👋</h2>
                        <h3>We are loading your dashboard</h3>
                        <p className="splash-slogan">"Collaborate. Innovate. Grow."</p>
                    </div>
                    <div className="splash-loader-wrapper">
                        <div className="progress-track">
                            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="splash-status">
                            <Loader2 className="spinner-icon" size={14} />
                            <span>Securing connection & establishing handshake... ({Math.round(progress)}%)</span>
                        </div>
                    </div>
                    <p className="splash-meta">Welcome back to the DevNexus hub</p>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <ScrollToTop />
            <Routes>
                <Route element={<DashboardLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/todo" element={<MyTodoList />} />
                    <Route path="/website" element={<LiveWebsite />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/inquiry" element={<Inquiry />} />
                    <Route path="/links" element={<QuickLinks />} />
                    <Route path="/apps" element={<ConnectedApps />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/chat" element={<ChatHub />} />
                    <Route path="/notifications" element={<Notifications />} />
                </Route>
                <Route path="*" element={<NotFound404 />} />
            </Routes>
        </Router>
    );
}