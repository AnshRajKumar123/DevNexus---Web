import React, { useState, useEffect } from 'react';
import { Mail, Phone, ShieldAlert, Key, Save, Edit3, X, CheckCircle2, Lock, Camera, Loader2, LogOut, Trash2, FileQuestion, CalendarDays, LinkIcon, Bell } from 'lucide-react';
import { useData } from '../context/DataContext';
import { requestFirebaseNotificationPermission } from '../firebase'; // Import Firebase function
import '../styles/Profile.css';

export default function Profile() {
    const {
        currentUser, logout, updateProfile,
        inquiries, removeInquiry,
        events, removeEvent,
        links, removeLink
    } = useData();

    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(currentUser?.name || '');
    const [phone, setPhone] = useState(currentUser?.phone || '');
    const [isUploading, setIsUploading] = useState(false);
    const [passFlow, setPassFlow] = useState('idle');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (!currentUser) return null;
    const currentUserId = currentUser._id || currentUser.id;

    const myTasks = inquiries.filter(i => i.reportedBy === currentUser.name);
    const myEvents = events.filter(e => e.createdBy === currentUser.name);
    const myLinks = links.filter(l => l.createdBy === currentUser.name);

    // --- FIREBASE NOTIFICATION REGISTRATION ---
    const requestNotificationPermission = async () => {
        // PASTE THE KEY YOU GENERATED IN FIREBASE HERE
        const FIREBASE_VAPID_KEY = "BCHWdUVgm-hBj_n9hh1YE7ygE0V9qHr_TiZbHMtM_zlM8xt0OsFkWWTQNY_gXGFqRHB6l8V7mSx_fvbEiqFIqPI"; 
        
        const token = await requestFirebaseNotificationPermission(FIREBASE_VAPID_KEY);
        
        if (token) {
            console.log("Success! Firebase Token:", token);
            try {
                // Send the new Firebase token securely to your backend
                await fetch(`${import.meta.env.VITE_API_URL || ''}/api/team/${currentUser.email}/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fcmToken: token }) // Changed from subscription to fcmToken
                });
                alert('Success! Firebase Push Notifications are now enabled for this device.');
            } catch (err) {
                console.error("Failed to save token to database:", err);
                alert("Token generated, but failed to save to server.");
            }
        } else {
            alert('Failed to enable notifications. Please check browser permissions.');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        formData.append('userId', currentUserId);
        formData.append('isProfile', 'true');

        try {
            setIsUploading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/upload`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) throw new Error('Image upload failed');
            const data = await response.json();

            const finalUrl = data.imageUrl.startsWith('http') ? data.imageUrl : `${import.meta.env.VITE_API_URL || ''}${data.imageUrl}`;
            await updateProfile(currentUserId, { imgUrl: finalUrl });

        } catch (error) {
            console.error('Upload Error:', error);
            alert('Failed to upload image. Ensure the backend server is running.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        const success = await updateProfile(currentUserId, { name, phone });
        if (success) setIsEditing(false);
        else alert('Failed to update profile.');
    };

    const handleSendOTP = () => setPassFlow('otp');
    const handleVerifyOTP = (e) => {
        e.preventDefault();
        if (otp.length >= 4) setPassFlow('new-password');
        else alert("Invalid OTP");
    };
    const handleSavePassword = (e) => {
        e.preventDefault();
        setPassFlow('success');
        setTimeout(() => setPassFlow('idle'), 3000);
    };

    const getAvatarUrl = () => {
        if (!currentUser.imgUrl) {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=${currentUser.isSupremeAdmin ? '0f172a' : 'e5e7eb'}&color=${currentUser.isSupremeAdmin ? 'fff' : '374151'}&size=150`;
        }
        if (currentUser.imgUrl.startsWith('http')) return currentUser.imgUrl;

        const cleanPath = currentUser.imgUrl.startsWith('/') ? currentUser.imgUrl : `/${currentUser.imgUrl}`;
        return cleanPath;
    };

    return (
        <div className="dashboard-wrapper page-animate">

            <header className="profile-hero-modern stagger-1">
                <div className="profile-hero-content">
                    <div className="profile-avatar-container">
                        {isLoading ? (
                            <div className="skeleton skeleton-avatar" style={{ width: '100%', height: '100%' }}></div>
                        ) : isUploading ? (
                            <div className="avatar-loader">
                                <Loader2 size={36} className="pulse-anim" color="#fff" />
                            </div>
                        ) : (
                            <img
                                src={getAvatarUrl()}
                                alt={currentUser.name}
                                className="profile-main-avatar"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=${currentUser.isSupremeAdmin ? '0f172a' : 'e5e7eb'}&color=${currentUser.isSupremeAdmin ? 'fff' : '374151'}&size=150`;
                                }}
                            />
                        )}
                        {!isLoading && (
                            <label className="avatar-edit-overlay">
                                <input type="file" accept="image/*" onChange={handleImageUpload} hidden disabled={isUploading} />
                                <Camera size={24} color="white" />
                            </label>
                        )}
                        {!isLoading && currentUser.isSupremeAdmin && (
                            <div className="admin-badge-modern" title="Supreme Admin"><ShieldAlert size={18} /></div>
                        )}
                    </div>

                    <div className="profile-hero-text">
                        {isLoading ? (
                            <>
                                <div className="skeleton skeleton-title" style={{ width: '250px', height: '40px', marginBottom: '0.5rem' }}></div>
                                <div className="skeleton skeleton-btn" style={{ width: '120px', height: '24px', borderRadius: '99px', marginBottom: '1rem' }}></div>
                                <div className="skeleton skeleton-text" style={{ width: '200px' }}></div>
                            </>
                        ) : (
                            <>
                                <h1 className="profile-greeting-title">{currentUser.name}</h1>
                                <span className="hero-role-badge">{currentUser.role}</span>
                                <div className="profile-hero-contacts">
                                    <span><Mail size={14} /> {currentUser.email}</span>
                                    {currentUser.phone && <span><Phone size={14} /> {currentUser.phone}</span>}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <section className="dashboard-grid stagger-2">
                <div className="grid-col">
                    <div className="premium-widget">
                        <div className="widget-header">
                            <h3>Personal Information</h3>
                            {!isLoading && (
                                <button className="text-btn" onClick={() => setIsEditing(!isEditing)}>
                                    {isEditing ? <><X size={14} style={{ display: 'inline', marginBottom: '-2px' }} /> Cancel</> : <><Edit3 size={14} style={{ display: 'inline', marginBottom: '-2px' }} /> Edit Info</>}
                                </button>
                            )}
                        </div>
                        <div className="widget-body">
                            {isLoading ? (
                                <div className="modern-form">
                                    <div className="form-group-row">
                                        <div className="form-group flex-1">
                                            <div className="skeleton skeleton-text short" style={{ height: '14px' }}></div>
                                            <div className="skeleton skeleton-text" style={{ height: '42px', borderRadius: '10px' }}></div>
                                        </div>
                                        <div className="form-group flex-1">
                                            <div className="skeleton skeleton-text short" style={{ height: '14px' }}></div>
                                            <div className="skeleton skeleton-text" style={{ height: '42px', borderRadius: '10px' }}></div>
                                        </div>
                                    </div>
                                    <div className="form-group-row">
                                        <div className="form-group flex-1">
                                            <div className="skeleton skeleton-text short" style={{ height: '14px' }}></div>
                                            <div className="skeleton skeleton-text" style={{ height: '42px', borderRadius: '10px' }}></div>
                                        </div>
                                        <div className="form-group flex-1">
                                            <div className="skeleton skeleton-text short" style={{ height: '14px' }}></div>
                                            <div className="skeleton skeleton-text" style={{ height: '42px', borderRadius: '10px' }}></div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSaveProfile} className="modern-form">
                                    <div className="form-group-row">
                                        <div className="form-group flex-1">
                                            <label>Full Name</label>
                                            <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={!isEditing} className="modern-input" />
                                        </div>
                                        <div className="form-group flex-1">
                                            <label>Role <span className="locked-label">(Locked)</span></label>
                                            <input type="text" value={currentUser.role} disabled className="modern-input locked-input" />
                                        </div>
                                    </div>
                                    <div className="form-group-row">
                                        <div className="form-group flex-1">
                                            <label>Email Address <span className="locked-label">(Locked)</span></label>
                                            <input type="email" value={currentUser.email} disabled className="modern-input locked-input" />
                                        </div>
                                        <div className="form-group flex-1">
                                            <label>Phone Number</label>
                                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={!isEditing} className="modern-input" />
                                        </div>
                                    </div>
                                    {isEditing && (
                                        <div className="form-actions" style={{ marginTop: '1rem' }}>
                                            <button type="submit" className="btn-modern-primary hover-pop">
                                                <Save size={16} /> Save Changes
                                            </button>
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid-col">
                    <div className="premium-widget">
                        <div className="widget-header">
                            <h3>Security & Notifications</h3>
                        </div>
                        <div className="widget-body">
                            {isLoading ? (
                                <div className="security-state-idle">
                                    <div className="skeleton skeleton-text medium" style={{ marginBottom: '1rem' }}></div>
                                    <div className="skeleton skeleton-btn" style={{ width: '160px', height: '42px', borderRadius: '10px' }}></div>
                                </div>
                            ) : passFlow === 'idle' ? (
                                <div className="security-state-idle">
                                    <p style={{ marginBottom: '0.75rem' }}>Ensure your account is using a strong password.</p>
                                    <button className="btn-modern-secondary hover-pop" onClick={handleSendOTP} style={{ marginBottom: '1.5rem', width: '100%' }}>
                                        <Key size={16} /> Change Password
                                    </button>
                                    
                                    <p style={{ marginBottom: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>Enable background notifications for Safari or Chrome.</p>
                                    <button className="btn-modern-primary hover-pop" onClick={requestNotificationPermission} style={{ width: '100%' }}>
                                        <Bell size={16} /> Enable Desktop Notifications
                                    </button>
                                </div>
                            ) : passFlow === 'otp' ? (
                                <form onSubmit={handleVerifyOTP} className="security-flow-card fade-in">
                                    <div className="flow-icon-header">
                                        <div className="icon-circle blue"><Mail size={24} /></div>
                                        <div>
                                            <h4>Verify your Email</h4>
                                            <p>We sent a verification code to <strong>{currentUser.email}</strong>.</p>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP code" className="modern-input" required autoFocus />
                                    </div>
                                    <div className="flow-actions">
                                        <button type="button" className="text-btn" onClick={() => setPassFlow('idle')}>Cancel</button>
                                        <button type="submit" className="btn-modern-primary hover-pop">Verify Code</button>
                                    </div>
                                </form>
                            ) : passFlow === 'new-password' ? (
                                <form onSubmit={handleSavePassword} className="security-flow-card fade-in">
                                    <div className="flow-icon-header">
                                        <div className="icon-circle green"><Lock size={24} /></div>
                                        <div>
                                            <h4>Create New Password</h4>
                                            <p>Your email is verified. Enter a strong password.</p>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="modern-input" required autoFocus />
                                    </div>
                                    <div className="flow-actions">
                                        <button type="submit" className="btn-modern-primary hover-pop">Update Password</button>
                                    </div>
                                </form>
                            ) : passFlow === 'success' && (
                                <div className="security-success-card pop-in">
                                    <CheckCircle2 size={40} color="#10b981" />
                                    <h4>Password Updated Successfully</h4>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="premium-widget danger-widget">
                        <div className="widget-body flex-row-between">
                            {isLoading ? (
                                <div style={{ flex: 1, marginRight: '1rem' }}>
                                    <div className="skeleton skeleton-text short" style={{ marginBottom: '0.25rem', height: '16px' }}></div>
                                    <div className="skeleton skeleton-text medium"></div>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="danger-title">Sign Out</h3>
                                    <p className="danger-desc">Securely log out of this device.</p>
                                </div>
                            )}
                            {isLoading ? (
                                <div className="skeleton skeleton-btn" style={{ width: '100px', height: '42px', borderRadius: '10px' }}></div>
                            ) : (
                                <button onClick={logout} className="btn-modern-danger hover-pop">
                                    <LogOut size={16} /> Sign Out
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- My Contributions --- */}
            <div className="activity-section-header stagger-3">
                <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '1.5rem 0 0 0' }}>My Contributions</h2>
            </div>

            <section className="activity-grid stagger-3">
                <div className="premium-widget">
                    <div className="widget-header">
                        <h3><FileQuestion size={16} className="icon-orange" /> My Inquiries</h3>
                    </div>
                    <div className="widget-feed">
                        {isLoading ? Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="feed-item">
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton skeleton-text medium"></div>
                                    <div className="skeleton skeleton-text short"></div>
                                </div>
                                <div className="skeleton skeleton-btn" style={{ width: '32px', height: '32px', borderRadius: '6px' }}></div>
                            </div>
                        )) : myTasks.length === 0 ? <p className="empty-subtext">You haven't created any tasks.</p> : myTasks.map(t => (
                            <div key={t._id || t.id} className="feed-item fade-in-row" style={{ justifyContent: 'space-between' }}>
                                <div>
                                    <h4 className="feed-title">{t.title}</h4>
                                    <span className="feed-meta">For: {t.assignedTo}</span>
                                </div>
                                <button onClick={() => removeInquiry(t._id || t.id)} className="btn-icon-danger hover-pop"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="premium-widget">
                    <div className="widget-header">
                        <h3><CalendarDays size={16} className="icon-blue" /> My Meetings</h3>
                    </div>
                    <div className="widget-feed">
                        {isLoading ? Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="feed-item">
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton skeleton-text medium"></div>
                                    <div className="skeleton skeleton-text short"></div>
                                </div>
                                <div className="skeleton skeleton-btn" style={{ width: '32px', height: '32px', borderRadius: '6px' }}></div>
                            </div>
                        )) : myEvents.length === 0 ? <p className="empty-subtext">You haven't scheduled events.</p> : myEvents.map(e => (
                            <div key={e._id || e.id} className="feed-item fade-in-row" style={{ justifyContent: 'space-between' }}>
                                <div>
                                    <h4 className="feed-title">{e.title}</h4>
                                    <span className="feed-meta">{e.date} at {e.time}</span>
                                </div>
                                <button onClick={() => removeEvent(e._id || e.id)} className="btn-icon-danger hover-pop"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="premium-widget">
                    <div className="widget-header">
                        <h3><LinkIcon size={16} style={{ color: '#10b981' }} /> My Quick Links</h3>
                    </div>
                    <div className="widget-feed">
                        {isLoading ? Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="feed-item">
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton skeleton-text medium"></div>
                                    <div className="skeleton skeleton-text short"></div>
                                </div>
                                <div className="skeleton skeleton-btn" style={{ width: '32px', height: '32px', borderRadius: '6px' }}></div>
                            </div>
                        )) : myLinks.length === 0 ? <p className="empty-subtext">You haven't added any links.</p> : myLinks.map(l => (
                            <div key={l._id || l.id} className="feed-item fade-in-row" style={{ justifyContent: 'space-between' }}>
                                <div style={{ overflow: 'hidden', paddingRight: '1rem' }}>
                                    <h4 className="feed-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</h4>
                                    <a href={l.url} target="_blank" rel="noreferrer" className="feed-meta" style={{ color: '#2563eb', textDecoration: 'none' }}>{l.url}</a>
                                </div>
                                <button onClick={() => removeLink(l._id || l.id)} className="btn-icon-danger hover-pop"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}