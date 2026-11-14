import React, { useState, useEffect } from 'react';
import { AlertTriangle, XCircle, ShieldAlert } from 'lucide-react';
import '../styles/Login.css';
import { DashPic } from '../assets/assets';
import { useData } from '../context/DataContext';

export default function Login() {
    const { login } = useData();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        
        if (!result.success) {
            if (result.status === 429) {
                // Backend blocked the IP (Max 3 reached)
                showToast(result.message, 'blocked');
            } else if (result.status === 401) {
                // Incorrect password/email
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                
                if (newAttempts === 2) {
                    showToast('Warning: You have only one chance left before a 30-minute security block.', 'warning');
                } else if (newAttempts >= 3) {
                    showToast('Account locked due to too many failed attempts.', 'blocked');
                } else {
                    showToast('Invalid email or password. Please try again.', 'error');
                }
            } else {
                showToast('A server error occurred. Please contact support.', 'error');
            }
        }
        
        setIsLoading(false);
    };

    return (
        <div className="login-wrapper">
            {/* Custom Toast Notification */}
            {toast.show && (
                <div className={`security-toast pop-in toast-${toast.type}`}>
                    {toast.type === 'warning' && <AlertTriangle size={20} />}
                    {toast.type === 'error' && <XCircle size={20} />}
                    {toast.type === 'blocked' && <ShieldAlert size={20} />}
                    <span>{toast.message}</span>
                </div>
            )}

            <div className="login-card fade-in">
                <div className="login-header">
                    <img src={DashPic.WebLogo} alt="DevNexus Logo" className="login-logo" />
                    <h2>Welcome to DevNexus</h2>
                    <p>Sign in to manage your team dashboard</p>
                </div>

                <form className="login-form" onSubmit={handleSignIn}>
                    <div className="input-group">
                        <label htmlFor="email">Work Email</label>
                        <input 
                            type="email" 
                            id="email" 
                            placeholder="enter your email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                            disabled={attempts >= 3}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input 
                            type="password" 
                            id="password" 
                            placeholder="••••••••" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                            disabled={attempts >= 3}
                        />
                    </div>

                    <div className="login-options">
                        <label className="remember-me">
                            <input type="checkbox" disabled={attempts >= 3} />
                            <span>Remember me</span>
                        </label>
                        <a href="#" className="forgot-password">Forgot password?</a>
                    </div>

                    <button type="submit" className="login-button hover-pop" disabled={isLoading || attempts >= 3}>
                        {isLoading ? 'Verifying...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}