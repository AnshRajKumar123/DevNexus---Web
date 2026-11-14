import React, { useState, useEffect, useRef } from 'react';
import { Send, ShieldCheck, Lock, Users, Sparkles, MessageSquareCode, ArrowLeft } from 'lucide-react';
import { useData } from '../context/DataContext';
import '../styles/ChatHub.css';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;


export default function ChatHub() {
    const { currentUser, team = [] } = useData();
    const [chats, setChats] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [selectedRecipient, setSelectedRecipient] = useState('all'); // 'all' or teammate email
    const [mobileChatOpen, setMobileChatOpen] = useState(false); // Mobile view toggle
    const messagesEndRef = useRef(null);

    const fetchChats = async () => {
        try {
            const res = await fetch(`${API_URL}/chats`);
            if (res.ok) {
                const data = await res.json();
                setChats(data);
            }
        } catch (err) {
            console.error('Error fetching chats:', err);
        }
    };

    const markAsRead = async (recipient) => {
        if (!currentUser) return;
        try {
            await fetch(`${API_URL}/chats/read`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail: currentUser.email,
                    recipientEmail: recipient
                })
            });
            fetchChats();
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    useEffect(() => {
        fetchChats();
        const interval = setInterval(fetchChats, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (currentUser) {
            markAsRead(selectedRecipient);
        }
    }, [selectedRecipient, currentUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chats, selectedRecipient]);

    const handleSelectRecipient = (recipientKey) => {
        setSelectedRecipient(recipientKey);
        setMobileChatOpen(true); // Open chat view on mobile when tapped
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageText.trim()) return;

        const payload = {
            senderName: currentUser.name,
            senderEmail: currentUser.email,
            recipientEmail: selectedRecipient,
            message: messageText.trim(),
            isEncrypted: true
        };

        try {
            const res = await fetch(`${API_URL}/chats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setMessageText('');
                fetchChats();
            }
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    const filteredChats = chats.filter(c => {
        if (selectedRecipient === 'all') return c.recipientEmail === 'all';
        return (
            (c.senderEmail === currentUser.email && c.recipientEmail === selectedRecipient) ||
            (c.senderEmail === selectedRecipient && c.recipientEmail === currentUser.email)
        );
    });

    const activeRecipientName = selectedRecipient === 'all' 
        ? 'Team Chat' 
        : team.find(t => t.email === selectedRecipient)?.name;

    return (
        <div className="chatbox-wrapper page-animate">
            <header className="team-hero stagger-1">
                <div className="hero-text-content">
                    <h1 className="hero-greeting">
                        DevNexus <span className="highlight-name">Secure Chat Hub</span>
                    </h1>
                    <p className="hero-subtitle">
                        End-to-end encrypted workspace messaging for the DevNexus team.
                    </p>
                </div>
            </header>

            <section className="stagger-2" style={{ height: 'calc(100vh - 240px)' }}>
                <div className={`chat-hub-layout ${mobileChatOpen ? 'mobile-chat-active' : ''}`}>
                    
                    {/* Left Sidebar (Conversations List) */}
                    <div className="chat-hub-sidebar">
                        <div className="chat-hub-sidebar-header">
                            <h3>Conversations</h3>
                        </div>
                        <div className="chat-hub-channels-list">
                            <div 
                                className={`chat-hub-channel-item ${selectedRecipient === 'all' ? 'active-channel' : ''}`}
                                onClick={() => handleSelectRecipient('all')}
                            >
                                <div className="chat-hub-icon-circle" style={{ background: '#eff6ff', color: '#2563eb' }}>
                                    <Users size={18} />
                                </div>
                                <div className="chat-hub-channel-info">
                                    <h4>Team Chat</h4>
                                    <p>Public encrypted room</p>
                                </div>
                            </div>

                            <div className="chat-hub-section-title">Team Members</div>
                            {team.filter(t => t.email !== currentUser?.email).map(member => (
                                <div 
                                    key={member._id} 
                                    className={`chat-hub-channel-item ${selectedRecipient === member.email ? 'active-channel' : ''}`}
                                    onClick={() => handleSelectRecipient(member.email)}
                                >
                                    <img 
                                        src={member.imgUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=e5e7eb&color=374151&bold=true`} 
                                        alt={member.name} 
                                        className="chat-hub-member-avatar" 
                                    />
                                    <div className="chat-hub-channel-info">
                                        <h4>{member.name}</h4>
                                        <p>{member.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Main Pane (Chat Messages) */}
                    <div className="chat-hub-main-pane">
                        <div className="chat-hub-main-header">
                            <div className="chat-hub-active-title">
                                {/* Mobile Back Button */}
                                <button 
                                    className="mobile-back-btn" 
                                    onClick={() => setMobileChatOpen(false)}
                                    aria-label="Back to conversations"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <MessageSquareCode size={20} color="#6366f1" />
                                <h3>{activeRecipientName}</h3>
                            </div>
                            <div className="chat-hub-security-tag">
                                <Lock size={13} color="#10b981" /> Encrypted
                            </div>
                        </div>

                        <div className="chat-hub-messages-scroll">
                            {filteredChats.length === 0 ? (
                                <div className="chat-hub-empty-state">
                                    <Sparkles size={36} color="#94a3b8" />
                                    <h3>No encrypted messages yet</h3>
                                    <p>Send a secure message to start chatting!</p>
                                </div>
                            ) : (
                                filteredChats.map((chat, idx) => {
                                    const isMe = chat.senderEmail === currentUser?.email;
                                    return (
                                        <div key={chat._id || idx} className={`chat-hub-bubble-wrapper ${isMe ? 'my-msg' : 'other-msg'}`}>
                                            {!isMe && <span className="chat-hub-sender-label">{chat.senderName}</span>}
                                            <div className={`chat-hub-bubble ${isMe ? 'bubble-mine' : 'bubble-theirs'}`}>
                                                <div className="chat-hub-text">{chat.message}</div>
                                                <div className="chat-hub-bubble-footer">
                                                    <span className="chat-hub-lock-icon" title="Encrypted">
                                                        <Lock size={10} />
                                                    </span>
                                                    <span className="chat-hub-timestamp">{chat.timestamp}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="chat-hub-input-form">
                            <input 
                                type="text" 
                                placeholder="Send secure message..." 
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                className="chat-hub-text-input"
                                required
                            />
                            <button type="submit" className="btn-modern-primary hover-pop chat-hub-send-btn">
                                <Send size={16} /> Send
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}