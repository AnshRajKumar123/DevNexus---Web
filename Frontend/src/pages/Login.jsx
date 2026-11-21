import React, { useState } from 'react';
import {
    AlertTriangle, XCircle, ShieldAlert, Eye, EyeOff,
    Mail, Lock, ArrowRight, ShieldCheck
} from 'lucide-react';
import '../styles/Login.css';
import { DashPic } from '../assets/assets';
import { useData } from '../context/DataContext';

export default function Login() {
    const { login } = useData();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Security State
    const [attempts, setAttempts] = useState(0);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 5000);
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await login(email, password);

        if (result.success) {
            setAttempts(0);
        } else {
            setIsLoading(false);
            if (result.status === 429) {
                showToast(result.message || 'IP blocked due to too many failed attempts. Try again in 30 minutes.', 'blocked');
            } else if (result.status === 401) {
                const currentAttempts = result.attempts || (attempts + 1);
                setAttempts(currentAttempts);

                if (currentAttempts === 4) {
                    showToast('Warning: You have only one chance left before a 30-minute security block.', 'warning');
                } else if (currentAttempts >= 5) {
                    showToast('Account locked due to too many failed attempts.', 'blocked');
                } else {
                    showToast('Invalid email or password. Please try again.', 'error');
                }
            } else {
                showToast('A server error occurred. Please contact support.', 'error');
            }
        }
    };

    return (
        <div className="login-wrapper">
            {toast.show && (
                <div className={`security-toast pop-in toast-${toast.type}`}>
                    {toast.type === 'warning' && <AlertTriangle size={20} />}
                    {toast.type === 'error' && <XCircle size={20} />}
                    {toast.type === 'blocked' && <ShieldAlert size={20} />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* --- DESKTOP LEFT SIDE: FULL BANNER IMAGE (UNTOUCHED) --- */}
            <div className="login-banner-side">
                <img src={DashPic.WebsiteBanner} alt="DevNexus Banner" className="login-banner-image" />
            </div>

            {/* --- MOBILE ONLY TOP ANIMATED HERO ILLUSTRATION --- */}
            <div className="mobile-login-hero" aria-hidden="true">
                <div className="mlh-top-brand">
                    <div className="mlh-brand-left">
                        <img src={DashPic.WebLogo} alt="DevNexus" className="mlh-brand-logo" />
                        <span className="mlh-brand-name">DEVNEXUS</span>
                    </div>
                    <span className="mlh-secure-pill">
                        <ShieldCheck size={12} /> Encrypted
                    </span>
                </div>

                {/* Animated Vector Illustration */}
                <div className="mlh-illustration-stage">
                    <div className="mlh-orbit-ring ring-outer"></div>
                    <div className="mlh-orbit-ring ring-inner"></div>

                    <svg
                        className="mlh-hero-svg"
                        viewBox="0 0 260 190"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <linearGradient id="phoneBody" x1="80" y1="18" x2="180" y2="176" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#1e3a8a" stopOpacity="0.65" />
                                <stop offset="1" stopColor="#09132b" stopOpacity="0.95" />
                            </linearGradient>
                            <linearGradient id="shieldGrad" x1="112" y1="48" x2="148" y2="96" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#60a5fa" />
                                <stop offset="1" stopColor="#2563eb" />
                            </linearGradient>
                        </defs>

                        {/* Floating Left Task Card */}
                        <g className="svg-float-slow">
                            <rect x="16" y="42" width="66" height="44" rx="12" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.22)" />
                            <circle cx="30" cy="57" r="5" fill="#10b981" />
                            <rect x="40" y="54" width="32" height="5" rx="2.5" fill="rgba(255,255,255,0.75)" />
                            <rect x="25" y="69" width="46" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
                        </g>

                        {/* Floating Right Message Card */}
                        <g className="svg-float-reverse">
                            <rect x="178" y="88" width="68" height="46" rx="12" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.22)" />
                            <rect x="188" y="100" width="26" height="5" rx="2.5" fill="#60a5fa" />
                            <rect x="188" y="110" width="46" height="4" rx="2" fill="rgba(255,255,255,0.45)" />
                            <rect x="188" y="119" width="34" height="4" rx="2" fill="rgba(255,255,255,0.25)" />
                        </g>

                        {/* Center Glass Phone Frame */}
                        <g className="svg-phone-bob">
                            <rect x="86" y="18" width="88" height="154" rx="22" fill="url(#phoneBody)" stroke="rgba(255,255,255,0.32)" strokeWidth="1.5" />
                            <rect x="114" y="27" width="32" height="6" rx="3" fill="#000000" />

                            {/* Glowing Security Shield */}
                            <path
                                d="M130 48L148 56V71C148 82.5 140.2 92.2 130 96C119.8 92.2 112 82.5 112 71V56L130 48Z"
                                fill="url(#shieldGrad)"
                                fillOpacity="0.92"
                            />
                            <path
                                d="M123.5 71.5L128 76L137 66.5"
                                stroke="#ffffff"
                                strokeWidth="2.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Mini UI Lines Inside Phone */}
                            <rect x="102" y="110" width="56" height="12" rx="6" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.18)" />
                            <rect x="102" y="128" width="56" height="12" rx="6" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.18)" />
                            <rect x="108" y="148" width="44" height="11" rx="5.5" fill="#ffffff" />
                        </g>

                        {/* Floating Spark Dots */}
                        <circle cx="62" cy="134" r="4" fill="#60a5fa" className="svg-pulse" />
                        <circle cx="204" cy="48" r="5" fill="#10b981" className="svg-pulse-delay" />
                        <circle cx="192" cy="156" r="3" fill="#ffffff" fillOpacity="0.6" />
                    </svg>
                </div>

                <div className="mlh-hero-copy">
                    <h3>Stay on top of your tasks &amp; projects</h3>
                </div>
            </div>

            {/* --- LOGIN FORM SIDE (DESKTOP UNTOUCHED / MOBILE LIQUID GLASS SHEET) --- */}
            <div className="login-form-side">
                <div className="login-card fade-in">
                    <div className="login-header">
                        <img src={DashPic.WebLogo} alt="DevNexus Logo" className="login-logo" />
                        <h2>Welcome to DevNexus</h2>
                        <p>Sign in to manage your team dashboard</p>
                    </div>

                    <form className="login-form" onSubmit={handleSignIn}>
                        <div className="input-group">
                            <label htmlFor="email">Work Email</label>
                            {isLoading ? (
                                <div className="skeleton skeleton-text" style={{ height: '46px', width: '100%', borderRadius: '8px', marginBottom: 0 }}></div>
                            ) : (
                                <div className="login-input-wrap">
                                    <Mail size={17} className="mobile-input-icon" />
                                    <input
                                        type="email"
                                        id="email"
                                        autoComplete="email"
                                        placeholder="enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={attempts >= 5}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            {isLoading ? (
                                <div className="skeleton skeleton-text" style={{ height: '46px', width: '100%', borderRadius: '8px', marginBottom: 0 }}></div>
                            ) : (
                                <div className="password-input-container login-input-wrap">
                                    <Lock size={17} className="mobile-input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={attempts >= 5}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex="-1"
                                        disabled={attempts >= 5}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="login-options">
                            <label className="remember-me">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    disabled={attempts >= 5 || isLoading}
                                />
                                <span className="mobile-toggle-track" aria-hidden="true">
                                    <span className="mobile-toggle-thumb"></span>
                                </span>
                                <span>Remember me</span>
                            </label>
                            <a href="#" className="forgot-password">Forgot password?</a>
                        </div>

                        {isLoading ? (
                            <div className="skeleton skeleton-btn" style={{ height: '46px', width: '100%', borderRadius: '8px', marginTop: '0.5rem' }}></div>
                        ) : (
                            <button type="submit" className="login-button hover-pop" disabled={attempts >= 5}>
                                <span className="login-btn-shimmer" aria-hidden="true"></span>
                                <span>Sign In</span>
                                <ArrowRight size={18} className="mobile-btn-arrow" />
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}