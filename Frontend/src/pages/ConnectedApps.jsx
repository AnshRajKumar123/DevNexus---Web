import React, { useState, useEffect } from 'react';
import { Mail, MessageCircle, Camera, Calendar, Plug, CheckCircle2, AlertCircle, X, Key, ShieldCheck, ExternalLink, Lock } from 'lucide-react';
import { useData } from '../context/DataContext';
import '../styles/ConnectedApps.css';

export default function ConnectedApps() {
    const { integrations = [], connectIntegration, disconnectIntegration, currentUser } = useData();
    const isMainAdmin = currentUser?.isSupremeAdmin;

    const [isLoading, setIsLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const apps = [
        { 
            id: 'Gmail', 
            name: 'Gmail', 
            icon: <Mail color="#EA4335" size={24} />, 
            desc: 'Sync emails and notifications via Google Workspace API',
            portalUrl: 'https://console.cloud.google.com/apis/credentials',
            portalName: 'Google Cloud Console'
        },
        { 
            id: 'WhatsApp', 
            name: 'WhatsApp', 
            icon: <MessageCircle color="#25D366" size={24} />, 
            desc: 'Manage business chats via WhatsApp Cloud API',
            portalUrl: 'https://developers.facebook.com/apps/',
            portalName: 'Meta Developer Portal'
        },
        { 
            id: 'Instagram', 
            name: 'Instagram', 
            icon: <Camera color="#E1306C" size={24} />, 
            desc: 'Track direct messages via Meta Graph API',
            portalUrl: 'https://developers.facebook.com/apps/',
            portalName: 'Meta Developer Portal'
        },
        { 
            id: 'Google Calendar', 
            name: 'Google Calendar', 
            icon: <Calendar color="#4285F4" size={24} />, 
            desc: 'Sync company schedules via Google Calendar API',
            portalUrl: 'https://console.cloud.google.com/apis/credentials',
            portalName: 'Google Cloud Console'
        }
    ];

    const handleOpenConnect = (app) => {
        if (!isMainAdmin) return;
        setSelectedApp(app);
        setApiKey('');
        setApiSecret('');
    };

    const handleSaveConnection = async (e) => {
        e.preventDefault();
        if (!selectedApp || !isMainAdmin) return;

        const success = await connectIntegration({
            appName: selectedApp.name,
            apiKey,
            apiSecret
        });

        if (success) {
            setSelectedApp(null);
        } else {
            alert('Failed to connect application. Make sure the backend server is running.');
        }
    };

    return (
        <div className="dashboard-wrapper page-animate apps-page">
            <header className="team-hero stagger-1">
                <div className="hero-text-content">
                    <h1 className="hero-greeting">Connected <span className="highlight-name">Integrations</span></h1>
                    <p className="hero-subtitle">Connect third-party messaging platforms and business tools using secure API keys.</p>
                </div>
            </header>

            <section className="dashboard-grid stagger-2">
                <div className="grid-col" style={{ gridColumn: 'span 2' }}>
                    <div className="premium-widget">
                        <div className="widget-header">
                            <h3><Plug size={18} className="icon-blue" /> Available Integrations ({apps.length})</h3>
                        </div>

                        <div className="apps-list-modern">
                            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="app-card-item">
                                    <div className="skeleton skeleton-avatar" style={{ borderRadius: '12px' }}></div>
                                    <div className="app-main-info">
                                        <div className="skeleton skeleton-text medium"></div>
                                        <div className="skeleton skeleton-text short"></div>
                                    </div>
                                    <div className="app-status-col">
                                        <div className="skeleton skeleton-btn" style={{ width: '100px', height: '25px', borderRadius: '99px' }}></div>
                                    </div>
                                    <div className="app-actions-col">
                                        <div className="skeleton skeleton-btn" style={{ width: '110px', height: '35px' }}></div>
                                    </div>
                                </div>
                            )) : apps.map(app => {
                                const isConnected = integrations.some(i => i.appName === app.name);

                                return (
                                    <div key={app.id} className="app-card-item fade-in-row">
                                        <div className="app-icon-wrapper">
                                            {app.icon}
                                        </div>
                                        
                                        <div className="app-main-info">
                                            <h4>{app.name}</h4>
                                            <p>{app.desc}</p>
                                        </div>

                                        <div className="app-status-col">
                                            {isConnected ? (
                                                <span className="status-pill-connected"><CheckCircle2 size={14}/> Connected</span>
                                            ) : (
                                                <span className="status-pill-disconnected"><AlertCircle size={14}/> Not Connected</span>
                                            )}
                                        </div>

                                        <div className="app-actions-col">
                                            {isMainAdmin ? (
                                                isConnected ? (
                                                    <button onClick={() => disconnectIntegration(app.name)} className="btn-disconnect hover-pop">
                                                        Disconnect
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleOpenConnect(app)} className="btn-connect hover-pop">
                                                        Connect API
                                                    </button>
                                                )
                                            ) : (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                                                    <Lock size={13} /> Admin Only
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- API Key Configuration Modal (Supreme Admin Only) --- */}
            {isMainAdmin && selectedApp && (
                <div className="modal-overlay fade-in">
                    <div className="modal-content pop-in">
                        <div className="modal-header">
                            <h2>Connect {selectedApp.name}</h2>
                            <button className="modal-close" onClick={() => setSelectedApp(null)}><X size={24}/></button>
                        </div>
                        
                        <form onSubmit={handleSaveConnection} className="modern-form">
                            <div className="flow-icon-header" style={{ marginBottom: '0.5rem', justifyContent: 'space-between', width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div className="icon-circle blue"><Key size={22} /></div>
                                    <div>
                                        <h4>Enter API Credentials</h4>
                                        <p>Stored securely in database.</p>
                                    </div>
                                </div>
                                <a 
                                    href={selectedApp.portalUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="btn-modern-secondary hover-pop"
                                    style={{ textDecoration: 'none', padding: '0.5rem 0.85rem', fontSize: '0.8rem', color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff' }}
                                >
                                    Get API Key <ExternalLink size={14} />
                                </a>
                            </div>

                            <div className="form-group">
                                <label>API Key / Client ID</label>
                                <input 
                                    type="text" 
                                    value={apiKey} 
                                    onChange={(e) => setApiKey(e.target.value)} 
                                    className="modern-input" 
                                    placeholder={`Paste your ${selectedApp.name} API Key here...`} 
                                    required 
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label>API Secret / Access Token (Optional)</label>
                                <input 
                                    type="password" 
                                    value={apiSecret} 
                                    onChange={(e) => setApiSecret(e.target.value)} 
                                    className="modern-input" 
                                    placeholder="••••••••••••••••" 
                                />
                            </div>

                            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-modern-secondary hover-pop" onClick={() => setSelectedApp(null)}>Cancel</button>
                                <button type="submit" className="btn-modern-primary hover-pop">
                                    <ShieldCheck size={16} /> Authenticate & Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}