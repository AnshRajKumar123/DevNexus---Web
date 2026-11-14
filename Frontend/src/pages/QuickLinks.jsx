import React, { useState } from 'react';
import { Link as LinkIcon, Plus, Trash2, ExternalLink, X, Compass, Globe } from 'lucide-react';
import { useData } from '../context/DataContext';
import '../styles/QuickLinks.css';

export default function QuickLinks() {
    const { links, addLink, removeLink, currentUser } = useData();
    const [showModal, setShowModal] = useState(false);
    
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        addLink({ title, url });
        setTitle(''); setUrl('');
        setShowModal(false);
    };

    return (
        <div className="dashboard-wrapper page-animate">
            <header className="team-hero stagger-1">
                <div className="hero-text-content">
                    <h1 className="hero-greeting">Quick <span className="highlight-name">Links</span></h1>
                    <p className="hero-subtitle">Store, manage, and share essential company resources and references.</p>
                </div>
                <button className="btn-modern-primary hover-pop" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Add Link
                </button>
            </header>

            <section className="dashboard-grid stagger-2">
                <div className="grid-col" style={{ gridColumn: 'span 2' }}>
                    <div className="premium-widget">
                        <div className="widget-header">
                            <h3><Compass size={18} className="icon-blue" /> Saved Resources ({links.length})</h3>
                        </div>

                        {links.length === 0 ? (
                            <div className="empty-state">
                                <LinkIcon size={48} color="#94a3b8" />
                                <h3>No links added</h3>
                                <p>Important company URLs and references will appear here.</p>
                                <button className="btn-modern-primary hover-pop" onClick={() => setShowModal(true)} style={{ marginTop: '1rem' }}>
                                    <Plus size={16} /> Add First Link
                                </button>
                            </div>
                        ) : (
                            <div className="links-list-modern">
                                {links.map(link => {
                                    const idToUse = link._id || link.id; 
                                    return (
                                        <div key={idToUse} className="link-card-item fade-in-row">
                                            <div className="link-icon-box">
                                                <Globe size={18} color="#2563eb" />
                                            </div>
                                            
                                            <div className="link-main-info">
                                                <h4>{link.title}</h4>
                                                <a href={link.url} target="_blank" rel="noreferrer" className="link-url-text">{link.url}</a>
                                            </div>

                                            <div className="link-creator-col">
                                                <span className="meta-tag">Added by: <strong>{link.createdBy || 'Admin'}</strong></span>
                                            </div>

                                            <div className="link-actions-col">
                                                <a href={link.url} target="_blank" rel="noreferrer" className="link-external-btn hover-pop" title="Open Link">
                                                    <ExternalLink size={16} />
                                                </a>
                                                <button onClick={() => removeLink(idToUse)} className="btn-icon-danger hover-pop" title="Delete Link">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
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
                            <h2>Add Quick Link</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={24}/></button>
                        </div>
                        
                        <form onSubmit={handleAdd} className="modern-form">
                            <div className="form-group">
                                <label>Link Title</label>
                                <input type="text" value={title} onChange={e=>setTitle(e.target.value)} className="modern-input" required placeholder="e.g. Figma Design System" />
                            </div>
                            <div className="form-group">
                                <label>Target URL</label>
                                <input type="url" value={url} onChange={e=>setUrl(e.target.value)} className="modern-input" required placeholder="https://figma.com/..." />
                            </div>
                            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-modern-secondary hover-pop" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-modern-primary hover-pop">
                                    <Plus size={16} /> Save Link
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}