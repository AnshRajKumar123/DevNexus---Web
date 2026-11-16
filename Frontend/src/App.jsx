import React, { useState, useEffect } from 'react';
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
import { useData } from './context/DataContext';
import { DashPic } from './assets/assets';
import { Sparkles, Loader2, Home, AlertTriangle } from 'lucide-react';

// --- Custom 404 Error Page ---
const NotFound404 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', textAlign: 'center', padding: '2rem', background: '#f8fafc' }}>
        <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
        <h1 style={{ fontSize: '4rem', color: '#0f172a', margin: '0 0 0.5rem 0', fontWeight: 800 }}>404</h1>
        <h2 style={{ fontSize: '1.5rem', color: '#334155', margin: '0 0 1rem 0' }}>Page Not Found or Restricted</h2>
        <p style={{ color: '#64748b', marginBottom: '2.5rem', maxWidth: '400px', lineHeight: 1.5 }}>
            The page you are trying to access doesn't exist, or you do not have permission to view it. Please return to your workspace.
        </p>
        <Link to="/" className="btn-modern-primary hover-pop" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', padding: '0.8rem 1.5rem', borderRadius: '10px', background: '#2563eb', color: 'white', fontWeight: 600 }}>
            <Home size={18} style={{ marginRight: '0.5rem' }} /> Back to Dashboard
        </Link>
    </div>
);

// --- Layout Wrapper ---
const DashboardLayout = () => (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
        <Sidebar />
        <div className="main-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <main className="main-content" style={{ flex: 1, padding: '0' }}>
                <Outlet />
            </main>
        </div>
    </div>
);

export default function App() {
    const { currentUser } = useData();
    const [showSplash, setShowSplash] = useState(false);
    const [progress, setProgress] = useState(0);
    
    // --- NEW: Bulletproof Session Verification ---
    // We always start as TRUE on refresh to give the backend time to answer, 
    // guaranteeing the Login page won't flash prematurely.
    const [isVerifyingSession, setIsVerifyingSession] = useState(true);

    useEffect(() => {
        let timer;
        if (currentUser) {
            // Once the backend returns the user data, stop the loading screen immediately.
            setIsVerifyingSession(false);
        } else {
            // Give the backend up to 4 seconds to fetch the user profile.
            // If nothing is returned by then, we assume the token is missing/expired and boot them to Login.
            timer = setTimeout(() => {
                setIsVerifyingSession(false);
            }, 4000);
        }

        return () => clearTimeout(timer);
    }, [currentUser]);

    // --- Splash Screen Logic ---
    useEffect(() => {
        // Only trigger the welcome splash if they are fully logged in and verification is done
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


    // --- NEW: Verifying Token Render State ---
    if (isVerifyingSession && !currentUser) {
        return (
            <div className="splash-fullscreen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', height: '100vh', width: '100vw' }}>
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                
                <img src={DashPic.WebLogo} alt="DevNexus Logo" style={{ width: '180px', marginBottom: '2.5rem', zIndex: 10 }} />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', zIndex: 10, background: 'white', padding: '0.85rem 1.75rem', borderRadius: '99px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                    <Loader2 size={22} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>Verifying secure session...</span>
                </div>
                
                <style>
                    {`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}
                </style>
            </div>
        );
    }

    // --- Original Login Guard ---
    if (!currentUser) {
        return <Login />;
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
                    <Route path="/chat" element={<ChatHub />} />
                </Route>
                <Route path="*" element={<NotFound404 />} />
            </Routes>
        </Router>
    );
}