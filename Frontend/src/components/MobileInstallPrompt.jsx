import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles, CheckCircle2, MoreVertical } from 'lucide-react';
import { DashPic } from '../assets/assets';
import '../styles/MobileInstallPrompt.css';

export default function MobileInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(() => window.__deferredInstallPrompt || null);
    const [isVisible, setIsVisible] = useState(false);
    const [showFallbackSteps, setShowFallbackSteps] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);

    useEffect(() => {
        // Do not show if already running as installed standalone PWA
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.matchMedia('(display-mode: fullscreen)').matches ||
            window.navigator.standalone === true;

        if (isStandalone) return;

        // Do not nag if user already dismissed in this session
        if (sessionStorage.getItem('devnexus_install_dismissed') === 'true') return;

        const handlePromptReady = () => {
            if (window.__deferredInstallPrompt) {
                setDeferredPrompt(window.__deferredInstallPrompt);
            }
        };

        const handleBeforeInstall = (e) => {
            e.preventDefault();
            window.__deferredInstallPrompt = e;
            setDeferredPrompt(e);
        };

        const handleInstalled = () => {
            setIsVisible(false);
            setDeferredPrompt(null);
            window.__deferredInstallPrompt = null;
            if (window.island?.success) {
                window.island.success('DevNexus App installed! 🎉');
            }
        };

        window.addEventListener('pwa-install-ready', handlePromptReady);
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleInstalled);

        const showTimer = setTimeout(() => {
            setIsVisible(true);
        }, 1000);

        return () => {
            clearTimeout(showTimer);
            window.removeEventListener('pwa-install-ready', handlePromptReady);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleInstalled);
        };
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('devnexus_install_dismissed', 'true');
    };

    const handleDownloadClick = async () => {
        const promptEvent = deferredPrompt || window.__deferredInstallPrompt;

        if (promptEvent) {
            try {
                setIsInstalling(true);
                promptEvent.prompt();
                const { outcome } = await promptEvent.userChoice;
                if (outcome === 'accepted') {
                    setIsVisible(false);
                }
                setDeferredPrompt(null);
                window.__deferredInstallPrompt = null;
            } catch {
                setShowFallbackSteps(true);
            } finally {
                setIsInstalling(false);
            }
        } else {
            setShowFallbackSteps(true);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="mip-overlay" onClick={handleDismiss}>
            <div className="mip-card" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    className="mip-close-btn"
                    onClick={handleDismiss}
                    aria-label="Close download prompt"
                >
                    <X size={16} />
                </button>

                <div className="mip-badge">
                    <Sparkles size={12} /> BETTER EXPERIENCE
                </div>

                <div className="mip-app-row">
                    <div className="mip-logo-ring">
                        <img src={DashPic.WebLogo} alt="DevNexus" className="mip-logo" />
                    </div>
                    <div className="mip-text">
                        <h3>Download DevNexus App</h3>
                        <p>Install on your phone for full-screen liquid glass UI, instant load &amp; push alerts.</p>
                    </div>
                </div>

                <div className="mip-perks">
                    <span><CheckCircle2 size={13} /> No URL Bar</span>
                    <span><CheckCircle2 size={13} /> Instant Access</span>
                    <span><CheckCircle2 size={13} /> Live Alerts</span>
                </div>

                {showFallbackSteps ? (
                    <div className="mip-fallback-box">
                        <p>
                            Tap Chrome&apos;s <MoreVertical size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> menu at the top right and select <strong>Install app</strong> (or <strong>Add to Home screen</strong>).
                        </p>
                        <button type="button" className="mip-secondary-btn" onClick={handleDismiss}>
                            Got it
                        </button>
                    </div>
                ) : (
                    <div className="mip-actions">
                        <button
                            type="button"
                            className="mip-download-btn"
                            onClick={handleDownloadClick}
                            disabled={isInstalling}
                        >
                            <span className="mip-btn-shimmer" aria-hidden="true"></span>
                            <Download size={17} />
                            <span>{isInstalling ? 'Opening Chrome Installer...' : 'Download App'}</span>
                        </button>
                        <button type="button" className="mip-later-btn" onClick={handleDismiss}>
                            <Smartphone size={13} /> Continue in browser
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}