import React, { useState, useEffect, useRef } from 'react';
import { Trash2, UserPlus, Mail, Phone, ImagePlus, ShieldAlert, X, MoreVertical, Briefcase, Users } from 'lucide-react';
import { useData } from '../context/DataContext';
import { getAvatarSrc } from './ChatHub'; 
import '../styles/Team.css';

export default function Team() {
    const { currentUser, team, addTeamMember, removeTeamMember } = useData();
    const isMainAdmin = currentUser?.isSupremeAdmin; 
    
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [imgUrl, setImgUrl] = useState('');

    const teamCacheRef = useRef('');
    const [localTeam, setLocalTeam] = useState(team);

    // Fetch team periodically to update online statuses
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

    // Ping the backend to update current user's lastSeen
    const pingStatus = async () => {
        if (!currentUser) return;
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/team/${currentUser.email}/ping`, {
                method: 'PUT',
            });
        } catch (err) {}
    };

    useEffect(() => {
        fetchTeam();
        pingStatus();
        const interval = setInterval(() => {
            fetchTeam();
            pingStatus();
        }, 5000); // Check statuses every 5 seconds
        return () => clearInterval(interval);
    }, [currentUser]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        formData.append('isProfile', 'true'); 

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error('Image upload failed');
            const data = await response.json();
            setImgUrl(data.imageUrl);
        } catch (error) { alert("Failed to upload image."); }
    };

    const handleAdd = (e) => {
        e.preventDefault();
        addTeamMember({ name, role, email, phone, imgUrl });
        setName(''); setRole(''); setEmail(''); setPhone(''); setImgUrl('');
        setShowModal(false);
    };

    // Helper to determine online status (active within last 30 seconds)
    const isUserOnline = (lastSeen) => {
        if (!lastSeen) return false;
        const diff = Date.now() - new Date(lastSeen).getTime();
        return diff < 30000;
    };

    return (
        <div className="dashboard-wrapper page-animate">
            <header className="team-hero stagger-1">
                <div className="hero-text-content">
                    <h1 className="hero-greeting">Team <span className="highlight-name">Directory</span></h1>
                    <p className="hero-subtitle">Manage your organization's members, roles, and access.</p>
                </div>
                <button className="btn-modern-primary hover-pop" onClick={() => setShowModal(true)}>
                    <UserPlus size={18} /> Invite Member
                </button>
            </header>

            <section className="dashboard-grid stagger-2">
                <div className="grid-col" style={{ gridColumn: 'span 2' }}>
                    <div className="premium-widget">
                        <div className="widget-header">
                            <h3><Users size={18} className="icon-blue" /> Active Members ({localTeam.length})</h3>
                        </div>
                        
                        <div className="team-list-container">
                            {isLoading ? Array.from({length: 4}).map((_, i) => (
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
                                                
                                                {/* ONLINE STATUS INDICATOR (HIDDEN FOR CURRENT USER) */}
                                                {!isMe && (
                                                    <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></div>
                                                )}

                                                {member.isSupremeAdmin && <div className="admin-star"><ShieldAlert size={10} color="white"/></div>}
                                            </div>
                                            <div className="member-details">
                                                <h4>{member.name}</h4>
                                                <div className="member-tags">
                                                    <span className={`role-pill ${member.isSupremeAdmin ? 'admin-pill' : 'standard-pill'}`}>
                                                        <Briefcase size={12}/> {member.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="member-contact-info">
                                            <a href={`mailto:${member.email}`} className="contact-link"><Mail size={14}/> {member.email}</a>
                                            {member.phone ? (
                                                <a href={`tel:${member.phone}`} className="contact-link"><Phone size={14}/> {member.phone}</a>
                                            ) : (
                                                <span className="contact-link disabled"><Phone size={14}/> No number</span>
                                            )}
                                        </div>

                                        <div className="member-actions">
                                            {isMainAdmin && !member.isSupremeAdmin ? (
                                                <button className="btn-icon-danger hover-pop" onClick={() => removeTeamMember(member._id)} title="Remove Member">
                                                    <Trash2 size={16} />
                                                </button>
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

            {showModal && (
                <div className="modal-overlay fade-in">
                    <div className="modal-content pop-in">
                        <div className="modal-header">
                            <h2>Add Team Member</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={24}/></button>
                        </div>
                        <form onSubmit={handleAdd} className="modern-form">
                            <div className="form-group-row">
                                <div className="form-group flex-1">
                                    <label>Full Name</label>
                                    <input type="text" value={name} onChange={e=>setName(e.target.value)} className="modern-input" required />
                                </div>
                                <div className="form-group flex-1">
                                    <label>Role</label>
                                    <input type="text" value={role} onChange={e=>setRole(e.target.value)} className="modern-input" required />
                                </div>
                            </div>
                            <div className="form-group-row">
                                <div className="form-group flex-1">
                                    <label>Email Address</label>
                                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="modern-input" required />
                                </div>
                                <div className="form-group flex-1">
                                    <label>Phone Number</label>
                                    <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="modern-input" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Profile Image</label>
                                <div className="file-upload-wrapper" style={{display:'flex', gap:'1rem', alignItems:'center'}}>
                                    <label className="btn-modern-secondary" style={{cursor:'pointer', margin:0}}>
                                        <ImagePlus size={16} /> Choose Image
                                        <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                                    </label>
                                    {imgUrl ? (
                                        <img src={`${import.meta.env.VITE_API_URL}${imgUrl}`} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{fontSize:'0.8rem', color:'#94a3b8'}}>No image selected</span>
                                    )}
                                </div>
                            </div>
                            <div className="form-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="btn-modern-secondary hover-pop" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-modern-primary hover-pop">
                                    <UserPlus size={16} /> Save Member
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}