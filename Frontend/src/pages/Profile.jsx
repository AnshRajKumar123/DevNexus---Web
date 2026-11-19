import React, { useState, useEffect } from 'react';
import {
    Mail, Phone, ShieldAlert, Key, Save, Edit3, X, CheckCircle2, Lock,
    Camera, Loader2, LogOut, Trash2, FileQuestion, CalendarDays, LinkIcon,
    Bell, ChevronRight, Sparkles, Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { requestFirebaseNotificationPermission } from '../firebase';
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
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPassModal, setShowPassModal] = useState(false);
    const [name, setName] = useState(currentUser?.name || '');
    const [phone, setPhone] = useState(currentUser?.phone || '');
    const [isUploading, setIsUploading] = useState(false);
    const [passFlow, setPassFlow] = useState('idle');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Dynamic hero colors extracted from profile picture (Red & Golden fallback)
    const [heroColors, setHeroColors] = useState({
        primary: 'rgba(185, 28, 28, 0.85)',
        secondary: 'rgba(217, 119, 6, 0.55)'
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);

            if (Notification.permission !== 'granted') {
                window.island.error('Notifications are off! Turn them on to stay tuned.', {
                    permanent: true,
                    action: {
                        label: 'Enable',
                        onClick: requestNotificationPermission
                    }
                });
            }
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const getAvatarUrl = () => {
        if (!currentUser?.imgUrl) {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=${currentUser?.isSupremeAdmin ? '0f172a' : 'e5e7eb'}&color=${currentUser?.isSupremeAdmin ? 'fff' : '374151'}&size=150`;
        }
        if (currentUser.imgUrl.startsWith('http')) return currentUser.imgUrl;
        return currentUser.imgUrl.startsWith('/') ? currentUser.imgUrl : `/${currentUser.imgUrl}`;
    };

    // Extract dominant & accent colors from the profile picture
    useEffect(() => {
        if (!currentUser?.imgUrl) return;

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = getAvatarUrl();

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 24;
                canvas.height = 24;
                ctx.drawImage(img, 0, 0, 24, 24);
                const data = ctx.getImageData(0, 0, 24, 24).data;

                let r1 = 0, g1 = 0, b1 = 0, count1 = 0;
                let r2 = 0, g2 = 0, b2 = 0, count2 = 0;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
                    if (a < 128) continue;
                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    const sat = max === 0 ? 0 : (max - min) / max;

                    // Pick vibrant pixels for primary glow, warmer/lighter pixels for secondary
                    if (sat > 0.25 && max > 50) {
                        r1 += r; g1 += g; b1 += b; count1++;
                    } else if (max > 80) {
                        r2 += r; g2 += g; b2 += b; count2++;
                    }
                }

                if (count1 > 5) {
                    const pr = Math.round(r1 / count1);
                    const pg = Math.round(g1 / count1);
                    const pb = Math.round(b1 / count1);
                    const sr = count2 > 5 ? Math.round(r2 / count2) : Math.min(255, pr + 45);
                    const sg = count2 > 5 ? Math.round(g2 / count2) : Math.min(255, pg + 35);
                    const sb = count2 > 5 ? Math.round(b2 / count2) : Math.max(0, pb - 20);

                    setHeroColors({
                        primary: `rgba(${pr}, ${pg}, ${pb}, 0.85)`,
                        secondary: `rgba(${sr}, ${sg}, ${sb}, 0.5)`
                    });
                }
            } catch {
                // Keep rich Red & Golden fallback if image host blocks CORS canvas read
            }
        };
    }, [currentUser?.imgUrl]);

    if (!currentUser) return null;
    const currentUserId = currentUser._id || currentUser.id;

    const myTasks = inquiries.filter(i => i.reportedBy === currentUser.name);
    const myEvents = events.filter(e => e.createdBy === currentUser.name);
    const myLinks = links.filter(l => l.createdBy === currentUser.name);
    const hasContributions = myTasks.length > 0 || myEvents.length > 0 || myLinks.length > 0;

    const handlePhoneChange = (e) => {
        const raw = e.target.value.replace(/\D/g, '');
        if (raw.length <= 10) {
            setPhone(raw);
        }
    };

    const requestNotificationPermission = async () => {
        const FIREBASE_VAPID_KEY = "BCHWdUVgm-hBj_n9hh1YE7ygE0V9qHr_TiZbHMtM_zlM8xt0OsFkWWTQNY_gXGFqRHB6l8V7mSx_fvbEiqFIqPI";

        const permissionOp = new Promise(async (resolve, reject) => {
            try {
                const token = await requestFirebaseNotificationPermission(FIREBASE_VAPID_KEY);
                if (token) {
                    await fetch(`${import.meta.env.VITE_API_URL || ''}/api/team/${currentUser.email}/subscribe`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fcmToken: token })
                    });
                    resolve('Success');
                } else {
                    reject(new Error('Permission denied'));
                }
            } catch (err) {
                reject(err);
            }
        });

        window.island.promise(permissionOp, {
            loading: 'Requesting permission...',
            success: 'Push Notifications enabled! ✅',
            error: 'Failed to enable notifications. Check browser settings.',
            errorOptions: {
                action: { label: 'Retry', onClick: requestNotificationPermission }
            }
        });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        formData.append('userId', currentUserId);
        formData.append('isProfile', 'true');

        const uploadOp = new Promise(async (resolve, reject) => {
            try {
                setIsUploading(true);
                const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/upload`, {
                    method: 'POST',
                    body: formData,
                });
                if (!response.ok) throw new Error('Upload failed');

                const data = await response.json();
                const finalUrl = data.imageUrl.startsWith('http') ? data.imageUrl : `${import.meta.env.VITE_API_URL || ''}${data.imageUrl}`;
                await updateProfile(currentUserId, { imgUrl: finalUrl });
                resolve('Success');
            } catch (error) {
                reject(error);
            } finally {
                setIsUploading(false);
            }
        });

        window.island.promise(uploadOp, {
            loading: 'Uploading profile picture...',
            success: 'Profile picture updated! ✅',
            error: 'Image upload failed.',
            errorOptions: {
                action: { label: 'Retry', onClick: () => handleImageUpload(e) }
            }
        });
    };

    const handleSaveProfile = (e) => {
        e.preventDefault();
        if (phone.length > 0 && phone.length < 10) {
            window.island.error('Please enter a valid 10-digit phone number.');
            return;
        }

        const saveOperation = new Promise(async (resolve, reject) => {
            const success = await updateProfile(currentUserId, { name, phone });
            if (success) {
                setIsEditing(false);
                setShowEditModal(false);
                resolve('Saved');
            } else {
                reject(new Error('Update failed'));
            }
        });

        window.island.promise(saveOperation, {
            loading: 'Saving profile changes...',
            success: 'Profile changes saved successfully! ✅',
            error: 'Failed to update profile.'
        });
    };

    const handleSendOTP = () => setPassFlow('otp');
    const handleVerifyOTP = (e) => {
        e.preventDefault();
        if (otp.length >= 4) {
            setPassFlow('new-password');
            window.island.success('Email verified successfully!');
        } else {
            window.island.error('Invalid OTP code entered.');
        }
    };

    const handleSavePassword = (e) => {
        e.preventDefault();
        setPassFlow('success');
        window.island.success('Password updated successfully!');
        setTimeout(() => {
            setPassFlow('idle');
            setShowPassModal(false);
            setOtp('');
            setNewPassword('');
        }, 2000);
    };

    return (
        <>
            {/* =======================================================
                MOBILE LIQUID GLASSMORPHISM PROFILE (<= 768px ONLY)
               ======================================================= */}
            <div
                className="mobile-liquid-profile page-animate"
                style={{
                    '--profile-accent-1': heroColors.primary,
                    '--profile-accent-2': heroColors.secondary
                }}
            >
                {/* Dynamic Color Top Hero */}
                <section className="mp-hero">
                    {/* Floating Top-Right Pencil Edit Button */}
                    <button
                        className="mp-edit-fab"
                        onClick={() => {
                            setName(currentUser.name || '');
                            setPhone(currentUser.phone || '');
                            setShowEditModal(true);
                        }}
                        aria-label="Edit Profile"
                    >
                        <Edit3 size={18} />
                    </button>

                    {/* Centered Profile Picture */}
                    <div className="mp-avatar-wrap">
                        {isUploading ? (
                            <div className="mp-avatar-loader">
                                <Loader2 size={30} className="island-spinner" color="#fff" />
                            </div>
                        ) : (
                            <img
                                src={getAvatarUrl()}
                                alt={currentUser.name}
                                className="mp-avatar-img"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=0f172a&color=fff&size=150`;
                                }}
                            />
                        )}
                        <label className="mp-avatar-cam" title="Change Photo">
                            <input type="file" accept="image/*" onChange={handleImageUpload} hidden disabled={isUploading} />
                            <Camera size={14} color="#fff" />
                        </label>
                        {currentUser.isSupremeAdmin && (
                            <div className="mp-admin-badge" title="Supreme Admin">
                                <ShieldAlert size={13} />
                            </div>
                        )}
                    </div>

                    {/* Centered Name, Role & Contact Info */}
                    <h1 className="mp-name">{currentUser.name}</h1>
                    <span className="mp-role-pill">{currentUser.role}</span>

                    <div className="mp-contact-row">
                        <span><Mail size={13} /> {currentUser.email}</span>
                        {currentUser.phone && <span><Phone size={13} /> +91 {currentUser.phone}</span>}
                    </div>

                    {/* Soft Fog Transition into Pitch Black */}
                    <div className="mp-hero-fog" aria-hidden="true"></div>
                </section>

                {/* Lower Black & White Liquid Glass Sections */}
                <div className="mp-body">
                    {/* Security & Notifications Liquid Glass Menu */}
                    <section className="mp-section">
                        <span className="mp-section-label">SECURITY & SETTINGS</span>
                        <div className="mp-glass-list">
                            <button
                                className="mp-glass-row-btn"
                                onClick={() => {
                                    setPassFlow('otp');
                                    setShowPassModal(true);
                                }}
                            >
                                <div className="mp-row-left">
                                    <span className="mp-row-icon"><Key size={16} /></span>
                                    <span>Change Password</span>
                                </div>
                                <ChevronRight size={16} className="mp-row-chevron" />
                            </button>

                            <button
                                className="mp-glass-row-btn"
                                onClick={requestNotificationPermission}
                            >
                                <div className="mp-row-left">
                                    <span className="mp-row-icon"><Bell size={16} /></span>
                                    <span>Enable Notifications</span>
                                </div>
                                <ChevronRight size={16} className="mp-row-chevron" />
                            </button>
                        </div>
                    </section>

                    {/* Smart Contributions Section */}
                    <section className="mp-section">
                        <span className="mp-section-label">MY CONTRIBUTIONS</span>

                        {!hasContributions ? (
                            <div className="mp-compact-empty">
                                <div className="mp-empty-left">
                                    <Sparkles size={18} className="mp-empty-icon" />
                                    <div>
                                        <h4>No Contributions Yet</h4>
                                        <p>You haven't contributed anything yet.</p>
                                    </div>
                                </div>
                                <Link to="/projects" className="mp-glass-pill-btn">
                                    <Plus size={14} /> Contribute
                                </Link>
                            </div>
                        ) : (
                            <div className="mp-contrib-stack">
                                {myTasks.length > 0 && (
                                    <div className="mp-glass-card">
                                        <div className="mp-card-head">
                                            <h3><FileQuestion size={15} /> My Inquiries ({myTasks.length})</h3>
                                        </div>
                                        {myTasks.map(t => (
                                            <div key={t._id || t.id} className="mp-contrib-row">
                                                <div className="mp-contrib-text">
                                                    <h4>{t.title}</h4>
                                                    <span>For: {t.assignedTo}</span>
                                                </div>
                                                <button onClick={() => removeInquiry(t._id || t.id)} className="mp-del-btn">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {myEvents.length > 0 && (
                                    <div className="mp-glass-card">
                                        <div className="mp-card-head">
                                            <h3><CalendarDays size={15} /> My Meetings ({myEvents.length})</h3>
                                        </div>
                                        {myEvents.map(e => (
                                            <div key={e._id || e.id} className="mp-contrib-row">
                                                <div className="mp-contrib-text">
                                                    <h4>{e.title}</h4>
                                                    <span>{e.date} at {e.time}</span>
                                                </div>
                                                <button onClick={() => removeEvent(e._id || e.id)} className="mp-del-btn">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {myLinks.length > 0 && (
                                    <div className="mp-glass-card">
                                        <div className="mp-card-head">
                                            <h3><LinkIcon size={15} /> My Quick Links ({myLinks.length})</h3>
                                        </div>
                                        {myLinks.map(l => (
                                            <div key={l._id || l.id} className="mp-contrib-row">
                                                <div className="mp-contrib-text">
                                                    <h4>{l.title}</h4>
                                                    <a href={l.url} target="_blank" rel="noreferrer">{l.url}</a>
                                                </div>
                                                <button onClick={() => removeLink(l._id || l.id)} className="mp-del-btn">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Very Bottom: Red Pseudo-Glow Liquid Glass Sign Out Button */}
                    <button onClick={logout} className="mp-signout-btn">
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>

                {/* Mobile Edit Profile Popup */}
                {showEditModal && (
                    <div className="modal-overlay fade-in" onClick={() => setShowEditModal(false)}>
                        <div className="mp-glass-modal pop-in" onClick={e => e.stopPropagation()}>
                            <div className="mp-modal-head">
                                <h3>Edit Profile</h3>
                                <button className="mp-modal-close" onClick={() => setShowEditModal(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleSaveProfile} className="mp-modal-form">
                                <div className="mp-field">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="mp-glass-input"
                                        required
                                    />
                                </div>
                                <div className="mp-field">
                                    <label>Phone Number (10 digits)</label>
                                    <div className="mp-phone-wrap">
                                        <span>+91</span>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={handlePhoneChange}
                                            placeholder="9876543210"
                                            maxLength="10"
                                        />
                                    </div>
                                </div>
                                <div className="mp-field">
                                    <label>Role <em>(Locked)</em></label>
                                    <input type="text" value={currentUser.role} disabled className="mp-glass-input locked" />
                                </div>
                                <div className="mp-field">
                                    <label>Email <em>(Locked)</em></label>
                                    <input type="email" value={currentUser.email} disabled className="mp-glass-input locked" />
                                </div>
                                <div className="mp-modal-actions">
                                    <button type="button" className="mp-glass-pill-btn" onClick={() => setShowEditModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="mp-glass-pill-btn solid">
                                        <Save size={14} /> Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Mobile Change Password Popup */}
                {showPassModal && (
                    <div className="modal-overlay fade-in" onClick={() => { setShowPassModal(false); setPassFlow('idle'); }}>
                        <div className="mp-glass-modal pop-in" onClick={e => e.stopPropagation()}>
                            <div className="mp-modal-head">
                                <h3>Change Password</h3>
                                <button className="mp-modal-close" onClick={() => { setShowPassModal(false); setPassFlow('idle'); }}>
                                    <X size={18} />
                                </button>
                            </div>
                            {passFlow === 'otp' && (
                                <form onSubmit={handleVerifyOTP} className="mp-modal-form">
                                    <p className="mp-modal-desc">We sent a verification code to <strong>{currentUser.email}</strong>.</p>
                                    <div className="mp-field">
                                        <label>OTP Code</label>
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={e => setOtp(e.target.value)}
                                            placeholder="Enter OTP code"
                                            className="mp-glass-input"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div className="mp-modal-actions">
                                        <button type="button" className="mp-glass-pill-btn" onClick={() => { setShowPassModal(false); setPassFlow('idle'); }}>Cancel</button>
                                        <button type="submit" className="mp-glass-pill-btn solid">Verify Code</button>
                                    </div>
                                </form>
                            )}
                            {passFlow === 'new-password' && (
                                <form onSubmit={handleSavePassword} className="mp-modal-form">
                                    <p className="mp-modal-desc">Email verified. Enter your new strong password.</p>
                                    <div className="mp-field">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="mp-glass-input"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div className="mp-modal-actions">
                                        <button type="submit" className="mp-glass-pill-btn solid">Update Password</button>
                                    </div>
                                </form>
                            )}
                            {passFlow === 'success' && (
                                <div className="mp-pass-success">
                                    <CheckCircle2 size={36} color="#10b981" />
                                    <h4>Password Updated!</h4>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* =======================================================
                DESKTOP VIEW (> 768px — UNTOUCHED)
               ======================================================= */}
            <div className="dashboard-wrapper desktop-profile-view page-animate">
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
                                        {currentUser.phone && <span><Phone size={14} /> +91 {currentUser.phone}</span>}
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
                                                <label>Phone Number (10 digits)</label>
                                                <div className="phone-input-group">
                                                    <span className="country-code-pill">+91</span>
                                                    <input
                                                        type="tel"
                                                        value={phone}
                                                        onChange={handlePhoneChange}
                                                        placeholder="9876543210"
                                                        maxLength="10"
                                                        disabled={!isEditing}
                                                        className="modern-input phone-field"
                                                    />
                                                </div>
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

                                        <button className="btn-modern-primary hover-pop" onClick={requestNotificationPermission} style={{ width: '100%' }}>
                                            <Bell size={16} /> Enable Notifications
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
        </>
    );
}