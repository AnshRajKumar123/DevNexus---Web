import React, { useState } from 'react';
import { Globe, Save, ExternalLink, ImagePlus, Edit3, X, Plus, Trash2, Server } from 'lucide-react';
import { useData } from '../context/DataContext';
import '../styles/LiveWebsite.css';

export default function LiveWebsite() {
    const { websites, addWebsite, updateWebsite, removeWebsite, currentUser } = useData();
    const isMainAdmin = currentUser?.isSupremeAdmin; 

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null); 
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [desc, setDesc] = useState('');
    const [imgUrl, setImgUrl] = useState('');

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Image upload failed');
            const data = await response.json();
            setImgUrl(`${import.meta.env.VITE_API_URL}${data.imageUrl}`);
            
        } catch (error) {
            console.error("Upload Error:", error);
            alert("Failed to upload image. Make sure the backend is running.");
        }
    };

    const handleOpenAdd = () => {
        setEditingId(null);
        setTitle(''); setUrl(''); setDesc(''); setImgUrl('');
        setShowModal(true);
    };

    const handleOpenEdit = (website) => {
        setEditingId(website._id || website.id);
        setTitle(website.title);
        setUrl(website.url);
        setDesc(website.desc);
        setImgUrl(website.img || website.imgUrl);
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        const payload = { title, url, desc, img: imgUrl };
        if (editingId) {
            updateWebsite(editingId, payload);
        } else {
            addWebsite(payload);
        }
        setShowModal(false);
    };

    const handleDelete = () => {
        if (editingId) removeWebsite(editingId);
        setShowModal(false);
    };

    return (
        <div className="dashboard-wrapper page-animate">
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
                            <h3><Server size={18} className="icon-blue" /> Deployed Endpoints ({websites.length})</h3>
                        </div>

                        {websites.length === 0 ? (
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
                                {websites.map(website => (
                                    <div key={website._id || website.id} className="website-card-modern fade-in-row">
                                        <div className="website-card-image">
                                            {website.img || website.imgUrl ? (
                                                <img src={website.img || website.imgUrl} alt={website.title} />
                                            ) : (
                                                <div className="image-placeholder"><Globe size={36} /></div>
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
                                            </div>
                                            <a href={website.url} target="_blank" rel="noreferrer" className="website-visit-btn hover-pop" title="Visit Link">
                                                <ExternalLink size={16} />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* --- Modern Modal --- */}
            {showModal && (
                <div className="modal-overlay fade-in">
                    <div className="modal-content pop-in">
                        <div className="modal-header">
                            <h2>{editingId ? 'Edit Website' : 'Add Website'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={24}/></button>
                        </div>
                        
                        <form onSubmit={handleSave} className="modern-form">
                            <div className="form-group">
                                <label>Website Name</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="modern-input" required placeholder="e.g. DevNexus Official" />
                            </div>
                            <div className="form-group">
                                <label>Website Link (URL)</label>
                                <input type="url" value={url} onChange={e => setUrl(e.target.value)} className="modern-input" required placeholder="https://devnexus.com" />
                            </div>
                            <div className="form-group">
                                <label>Preview Image</label>
                                <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
                                    <label className="btn-modern-secondary" style={{cursor:'pointer', margin:0}}>
                                        <ImagePlus size={16} /> Choose Image
                                        <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                                    </label>
                                    {imgUrl ? (
                                        <img src={imgUrl} alt="Preview" style={{ width: '50px', height: '35px', objectFit: 'cover', borderRadius: '6px' }} />
                                    ) : (
                                        <span style={{fontSize:'0.8rem', color:'#94a3b8'}}>No image selected</span>
                                    )}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea rows="3" value={desc} onChange={e => setDesc(e.target.value)} className="modern-input" placeholder="Main dashboard and landing page..."></textarea>
                            </div>
                            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                                {editingId ? (
                                    <button type="button" className="btn-modern-danger hover-pop" onClick={handleDelete}>
                                        <Trash2 size={16} /> Delete
                                    </button>
                                ) : <div />}
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="button" className="btn-modern-secondary hover-pop" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-modern-primary hover-pop">
                                        <Save size={16} /> {editingId ? 'Save Changes' : 'Save Website'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}