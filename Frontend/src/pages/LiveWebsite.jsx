import React, { useState, useEffect } from 'react';
import {
    Globe, Save, ExternalLink, ImagePlus, Edit3, X, Plus, Trash2, Server,
    Monitor, Smartphone, Tablet, Lock
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { pushNotification } from '../utils/notifications';
import '../styles/LiveWebsite.css';

const DEVICE_OPTIONS = ['Desktop', 'Mobile', 'Tablet'];

export default function LiveWebsite() {
    const { websites, addWebsite, updateWebsite, removeWebsite, currentUser } = useData();
    const isMainAdmin = currentUser?.isSupremeAdmin;

    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [desc, setDesc] = useState('');
    const [imgUrl, setImgUrl] = useState('');
    const [devices, setDevices] = useState(['Desktop', 'Mobile']);
    const [isPrivate, setIsPrivate] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const toggleDevice = (dev) => {
        setDevices(prev =>
            prev.includes(dev)
                ? (prev.length > 1 ? prev.filter(d => d !== dev) : prev)
                : [...prev, dev]
        );
    };

    const renderDeviceIcon = (dev) => {
        if (dev === 'Desktop') return <Monitor size={12} />;
        if (dev === 'Mobile') return <Smartphone size={12} />;
        return <Tablet size={12} />;
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Image upload failed');

            const data = await response.json();
            const finalUrl = data.imageUrl.startsWith('http') ? data.imageUrl : `${import.meta.env.VITE_API_URL || ''}${data.imageUrl}`;
            setImgUrl(finalUrl);
        } catch (error) {
            alert('Failed to upload image. Make sure the backend is running.');
        }
    };

    const handleOpenAdd = () => {
        setEditingId(null);
        setTitle('');
        setUrl('');
        setDesc('');
        setImgUrl('');
        setDevices(['Desktop', 'Mobile']);
        setIsPrivate(false);
        setShowModal(true);
    };

    const handleOpenEdit = (website) => {
        setEditingId(website._id || website.id);
        setTitle(website.title);
        setUrl(website.url);
        setDesc(website.desc);
        setImgUrl(website.img || website.imgUrl);
        setDevices(website.devices && website.devices.length > 0 ? website.devices : ['Desktop', 'Mobile']);
        setIsPrivate(Boolean(website.isPrivate));
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        const payload = { title, url, desc, img: imgUrl, devices, isPrivate };
        if (editingId) {
            updateWebsite(editingId, payload);
        } else {
            addWebsite(payload);
            if (!isPrivate) {
                pushNotification({
                    type: 'website',
                    title: `New Live Website: ${title}`,
                    message: desc ? desc.substring(0, 90) : url,
                    createdBy: currentUser?.name,
                    path: '/website'
                });
            }
        }
        setShowModal(false);
    };

    const handleDelete = () => {
        if (editingId) removeWebsite(editingId);
        setShowModal(false);
    };

    // Hide Private websites from non-admin members
    const visibleWebsites = websites.filter(w => isMainAdmin || !w.isPrivate);

    return (
        <div className="dashboard-wrapper page-animate website-page">
            <header className="team-hero stagger-1">
                <div className="hero-text-content">
                    <h1 className="hero-greeting">Live <span className="highlight-name">Websites</span></h1>
                    <p className="hero-subtitle">Monitor and access deployed applications and client projects.</p>
                </div>
                {isMainAdmin && (
                    <button className="btn-modern-primary hover-pop" onClick={handleOpenAdd}>
                        <Plus size={18} /> Add Website
                    </button>
                )}
            </header>

            <section className="dashboard-grid stagger-2">
                <div className="grid-col" style={{ gridColumn: 'span 2' }}>
                    <div className="premium-widget">
                        <div className="widget-header">
                            <h3><Server size={18} className="icon-blue" /> Deployed Endpoints ({visibleWebsites.length})</h3>
                        </div>

                        {isLoading ? (
                            <div className="websites-grid-modern">
                                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton skeleton-card" style={{ height: '300px' }}></div>)}
                            </div>
                        ) : visibleWebsites.length === 0 ? (
                            <div className="empty-state">
                                <Globe size={48} className="pulse-anim" color="#94a3b8" />
                                <h3>No Websites Configured</h3>
                                <p>Connect your live websites to display them on the workspace.</p>
                                {isMainAdmin && (
                                    <button className="btn-modern-primary hover-pop" onClick={handleOpenAdd} style={{ marginTop: '1rem' }}>
                                        <Plus size={16} /> Add First Website
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="websites-grid-modern">
                                {visibleWebsites.map(website => {
                                    const siteDevices = website.devices && website.devices.length > 0 ? website.devices : ['Desktop', 'Mobile'];
                                    return (
                                        <div key={website._id || website.id} className="website-card-modern fade-in-row">
                                            <div className="website-card-image">
                                                {website.img || website.imgUrl ? (
                                                    <img
                                                        src={website.img || website.imgUrl}
                                                        alt={website.title}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="image-placeholder"><Globe size={36} /></div>
                                                )}
                                                {isMainAdmin && website.isPrivate && (
                                                    <span className="site-private-badge">
                                                        <Lock size={11} /> Private
                                                    </span>
                                                )}
                                                {isMainAdmin && (
                                                    <button className="card-edit-btn hover-pop" onClick={() => handleOpenEdit(website)} title="Edit Website">
                                                        <Edit3 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="website-card-body">
                                                <div className="website-info">
                                                    <h4>{website.title}</h4>
                                                    <p>{website.desc || 'No description provided.'}</p>
                                                    <div className="website-device-badges">
                                                        {siteDevices.map(dev => (
                                                            <span key={dev} className="device-pill">
                                                                {renderDeviceIcon(dev)} {dev}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <a href={website.url} target="_blank" rel="noreferrer" className="website-visit-btn hover-pop" title="Visit Link">
                                                    <ExternalLink size={16} />
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {showModal && (
                <div className="modal-overlay fade-in">
                    <div className="modal-content pop-in">
                        <div className="modal-header">
                            <h2>{editingId ? 'Edit Website' : 'Add Website'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSave} className="modern-form">
                            <div className="form-group">
                                <label>Website Name</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="modern-input" required />
                            </div>
                            <div className="form-group">
                                <label>Website Link (URL)</label>
                                <input type="url" value={url} onChange={e => setUrl(e.target.value)} className="modern-input" required />
                            </div>
                            <div className="form-group">
                                <label>Supported Devices</label>
                                <div className="device-toggle-group">
                                    {DEVICE_OPTIONS.map(dev => (
                                        <button
                                            key={dev}
                                            type="button"
                                            className={`device-select-btn ${devices.includes(dev) ? 'active' : ''}`}
                                            onClick={() => toggleDevice(dev)}
                                        >
                                            {renderDeviceIcon(dev)} {dev}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Visibility</label>
                                <div className="visibility-toggle-group">
                                    <button
                                        type="button"
                                        className={`vis-btn ${!isPrivate ? 'active' : ''}`}
                                        onClick={() => setIsPrivate(false)}
                                    >
                                        <Globe size={14} /> Public (All Members)
                                    </button>
                                    <button
                                        type="button"
                                        className={`vis-btn ${isPrivate ? 'active private' : ''}`}
                                        onClick={() => setIsPrivate(true)}
                                    >
                                        <Lock size={14} /> Private (Admin Only)
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Preview Image</label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <label className="btn-modern-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                                        <ImagePlus size={16} /> Choose Image
                                        <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                                    </label>
                                    {imgUrl ? (
                                        <img src={imgUrl.startsWith('http') ? imgUrl : `${import.meta.env.VITE_API_URL || ''}${imgUrl}`} alt="Preview" style={{ width: '50px', height: '35px', objectFit: 'cover', borderRadius: '6px' }} />
                                    ) : (
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No image selected</span>
                                    )}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea rows="3" value={desc} onChange={e => setDesc(e.target.value)} className="modern-input"></textarea>
                            </div>
                            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                                {editingId ? (
                                    <button type="button" className="btn-modern-danger hover-pop" onClick={handleDelete}><Trash2 size={16} /> Delete</button>
                                ) : <div />}
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="button" className="btn-modern-secondary hover-pop" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-modern-primary hover-pop"><Save size={16} /> {editingId ? 'Save Changes' : 'Save Website'}</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}