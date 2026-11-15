import React, { useState, useEffect } from 'react';
import { AlertTriangle, XCircle, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import '../styles/Login.css';
import { DashPic } from '../assets/assets';
import { useData } from '../context/DataContext';

export default function Login() {
    const { login } = useData();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
            setAttempts(0); // Reset local attempts on success
            // Note: Splash screen logic is now handled in App.jsx
        } else {
            setIsLoading(false);
            if (result.status === 429) {
                showToast(result.message || 'IP blocked due to too many failed attempts. Try again in 30 minutes.', 'blocked');
            } else if (result.status === 401) {
                // Use backend attempts count if provided, otherwise increment local
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

            {/* --- LEFT SIDE: FULL BANNER IMAGE (NO HTML TEXT) --- */}
            <div className="login-banner-side">
                <img src={DashPic.WebsiteBanner} alt="DevNexus Banner" className="login-banner-image" />
            </div>

            {/* --- RIGHT SIDE: LOGIN FORM --- */}
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
                                <input 
                                    type="email" 
                                    id="email" 
                                    placeholder="enter your email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required 
                                    disabled={attempts >= 5}
                                />
                            )}
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            {isLoading ? (
                                <div className="skeleton skeleton-text" style={{ height: '46px', width: '100%', borderRadius: '8px', marginBottom: 0 }}></div>
                            ) : (
                                <div className="password-input-container">
                                    <input 
                                        type={showPassword ? 'text' : 'password'} 
                                        id="password" 
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
                                <input type="checkbox" disabled={attempts >= 5 || isLoading} />
                                <span>Remember me</span>
                            </label>
                            <a href="#" className="forgot-password">Forgot password?</a>
                        </div>

                        {isLoading ? (
                            <div className="skeleton skeleton-btn" style={{ height: '46px', width: '100%', borderRadius: '8px', marginTop: '0.5rem' }}></div>
                        ) : (
                            <button type="submit" className="login-button hover-pop" disabled={attempts >= 5}>
                                Sign In
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}