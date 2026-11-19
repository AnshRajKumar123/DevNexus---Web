import React, { useState, useEffect, useRef } from 'react';
import { Trash2, UserPlus, Mail, Phone, ImagePlus, ShieldAlert, X, MoreVertical, Briefcase, Users, Edit3, Save } from 'lucide-react';
import { useData } from '../context/DataContext';
import { getAvatarSrc } from './ChatHub';
import '../styles/Team.css';

export default function Team() {
    const { currentUser, team, addTeamMember, removeTeamMember, updateProfile } = useData();
    const isMainAdmin = currentUser?.isSupremeAdmin;

    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [imgUrl, setImgUrl] = useState('');

    const teamCacheRef = useRef('');
    const [localTeam, setLocalTeam] = useState(team);

    const fetchTeam = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/team`);
            if (res.ok) {
                const data = await res.json();
                const dataString = JSON.stringify(data);
                if (dataString !== teamCacheRef.current) {
                    teamCacheRef.current = dataString;
                    setLocalTeam(data);
                }
                setIsLoading(false);
            }
        } catch (err) {
            setIsLoading(false);
        }
    };

    const pingStatus = async () => {
        if (!currentUser) return;
        if (!navigator.onLine || document.visibilityState === 'hidden') return;
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/team/${currentUser.email}/ping`, { method: 'PUT' });
        } catch (err) { }
    };

    useEffect(() => {
        fetchTeam();
        pingStatus();
        const interval = setInterval(() => {
            fetchTeam();
            pingStatus();
        }, 5000);
        return () => clearInterval(interval);
    }, [currentUser]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        formData.append('isProfile', 'true');

        const uploadOp = new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
                    method: 'POST',
                    body: formData
                });
                if (!response.ok) throw new Error('Image upload failed');
                const data = await response.json();
                setImgUrl(data.imageUrl);
                resolve();
            } catch (error) { reject(); }
        });

        window.island.promise(uploadOp, {
            loading: 'Uploading photo...',
            success: 'Photo uploaded! ✅',
            error: 'Failed to upload photo.'
        });
    };

    const handleOpenAdd = () => {
        setEditingId(null);
        setName(''); setRole(''); setEmail(''); setPhone(''); setImgUrl('');
        setShowModal(true);
    };

    const handleOpenEdit = (member) => {
        setEditingId(member._id);
        setName(member.name);
        setRole(member.role);
        setEmail(member.email);
        setPhone(member.phone || '');
        setImgUrl(member.imgUrl || '');
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = { name, role, email, phone, imgUrl };

        const saveOp = new Promise(async (resolve, reject) => {
            try {
                if (editingId) {
                    await updateProfile(editingId, payload);
                } else {
                    await addTeamMember(payload);
                }
                resolve();
            } catch (err) {
                reject(err);
            }
        });

        window.island.promise(saveOp, {
            loading: editingId ? 'Updating member profile...' : 'Adding new member...',
            success: editingId ? 'Profile updated successfully! ✅' : 'New member added! 🎉',
            error: 'Failed to save changes.'
        });

        await saveOp;
        setShowModal(false);
        fetchTeam();
    };

    const isUserOnline = (lastSeen) => {
        if (!lastSeen) return false;
        const diff = Date.now() - new Date(lastSeen).getTime();
        return diff < 15000;
    };

    const previewAvatar = imgUrl
        ? (imgUrl.startsWith('http') ? imgUrl : `${import.meta.env.VITE_API_URL}${imgUrl}`)
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'New')}&background=e5e7eb&color=374151&size=150`;

    return (
        <div className="dashboard-wrapper page-animate team-page">
            <header className="team-hero stagger-1">
                <div className="hero-text-content">
                    <h1 className="hero-greeting">Team <span className="highlight-name">Directory</span></h1>
                    <p className="hero-subtitle">Manage your organization's members, roles, and access.</p>
                </div>
                {isMainAdmin && (
                    <button className="btn-modern-primary hover-pop" onClick={handleOpenAdd}>
                        <UserPlus size={18} /> Invite Member
                    </button>
                )}
            </header>

            <section className="dashboard-grid stagger-2">
                <div className="grid-col" style={{ gridColumn: 'span 2' }}>
                    <div className="premium-widget">
                        <div className="widget-header">
                            <h3><Users size={18} className="icon-blue" /> Active Members ({localTeam.length})</h3>
                        </div>

                        <div className="team-list-container">
                            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="team-list-item">
                                    <div className="team-member-info">
                                        <div className="skeleton skeleton-avatar"></div>
                                        <div className="member-details" style={{ flex: 1 }}>
                                            <div className="skeleton skeleton-text medium"></div>
                                            <div className="skeleton skeleton-text short"></div>
                                        </div>
                                    </div>
                                    <div className="member-contact-info"><div className="skeleton skeleton-text medium"></div></div>
                                </div>
                            )) : localTeam.map(member => {
                                const isOnline = isUserOnline(member.lastSeen);
                                const isMe = currentUser && member.email === currentUser.email;

                                return (
                                    <div key={member._id} className="team-list-item fade-in-row">
                                        <div className="team-member-info">
                                            <div className="member-avatar-box">
                                                <img src={getAvatarSrc(member)} alt={member.name} />

                                                {!isMe && (
                                                    <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></div>
                                                )}

                                                {member.isSupremeAdmin && <div className="admin-star"><ShieldAlert size={10} color="white" /></div>}
                                            </div>
                                            <div className="member-details">
                                                <h4>{member.name}</h4>
                                                <div className="member-tags">
                                                    <span className={`role-pill ${member.isSupremeAdmin ? 'admin-pill' : 'standard-pill'}`}>
                                                        <Briefcase size={12} /> {member.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="member-contact-info">
                                            <a href={`mailto:${member.email}`} className="contact-link"><Mail size={14} /> {member.email}</a>
                                            {member.phone ? (
                                                <a href={`tel:${member.phone}`} className="contact-link"><Phone size={14} /> {member.phone}</a>
                                            ) : (
                                                <span className="contact-link disabled"><Phone size={14} /> No number</span>
                                            )}
                                        </div>

                                        <div className="member-actions">
                                            {isMainAdmin ? (
                                                <div className="action-btn-group">
                                                    <button className="btn-icon-primary hover-pop" onClick={() => handleOpenEdit(member)} title="Edit Member">
                                                        <Edit3 size={16} />
                                                    </button>
                                                    {!member.isSupremeAdmin && (
                                                        <button className="btn-icon-danger hover-pop" onClick={() => removeTeamMember(member._id)} title="Remove Member">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <button className="btn-icon-ghost" disabled>
                                                    <MoreVertical size={16} color="#cbd5e1" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Redesigned Modal */}
            {showModal && (
                <div className="modal-overlay fade-in" onClick={() => setShowModal(false)}>
                    <div className="modal-content pop-in team-modal-large" onClick={e => e.stopPropagation()}>
                        <div className="team-modal-header">
                            <h2>{editingId ? 'Edit Team Member' : 'Invite New Member'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={24} /></button>
                        </div>

                        <div className="team-modal-body">
                            <div className="team-modal-sidebar">
                                <img src={previewAvatar} alt="Preview" className="modal-avatar-preview" />
                                <label className="btn-modern-secondary upload-btn hover-pop">
                                    <ImagePlus size={14} style={{ marginRight: '0.25rem' }} /> Change Photo
                                    <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                                </label>
                            </div>

                            <form onSubmit={handleSave} className="modern-form team-modal-form">
                                <div className="form-group-row">
                                    <div className="form-group flex-1">
                                        <label>Full Name</label>
                                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="modern-input" required placeholder="e.g. John Doe" />
                                    </div>
                                    <div className="form-group flex-1">
                                        <label>Role</label>
                                        <input type="text" value={role} onChange={e => setRole(e.target.value)} className="modern-input" required placeholder="e.g. UI/UX Designer" />
                                    </div>
                                </div>
                                <div className="form-group-row">
                                    <div className="form-group flex-1">
                                        <label>Email Address</label>
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="modern-input" required placeholder="name@company.com" disabled={!!editingId} title={editingId ? "Email cannot be changed" : ""} />
                                    </div>
                                    <div className="form-group flex-1">
                                        <label>Phone Number (Optional)</label>
                                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="modern-input" placeholder="+91 9876543210" />
                                    </div>
                                </div>

                                <div className="form-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button type="button" className="btn-modern-secondary hover-pop" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-modern-primary hover-pop">
                                        {editingId ? <><Save size={16} /> Save Changes</> : <><UserPlus size={16} /> Send Invite</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}