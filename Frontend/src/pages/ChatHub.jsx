import React, { useState, useEffect, useRef } from 'react';
import { Send, Lock, Users, Sparkles, MessageSquareCode, ArrowLeft, Plus, Video, Image, FileText, File, BarChart2, X, Check, CheckCircle2, Circle, Ban, Pin, Maximize, Minimize } from 'lucide-react';
import { useData } from '../context/DataContext';
import '../styles/ChatHub.css';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

export const getAvatarSrc = (user) => {
    if (!user || !user.imgUrl) return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=e5e7eb&color=374151&bold=true`;
    if (user.imgUrl.startsWith('http')) return user.imgUrl;
    return `${import.meta.env.VITE_API_URL}${user.imgUrl.startsWith('/') ? '' : '/'}${user.imgUrl}`;
};

export default function ChatHub() {
    const { currentUser, team = [] } = useData();
    const [chats, setChats] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // NEW: Skeleton Loading State
    const [messageText, setMessageText] = useState('');
    const [selectedRecipient, setSelectedRecipient] = useState('all');
    const [mobileChatOpen, setMobileChatOpen] = useState(false);
    
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [showPollModal, setShowPollModal] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [allowMultiple, setAllowMultiple] = useState(false);
    
    const [viewVotesPoll, setViewVotesPoll] = useState(null);
    const [localVotes, setLocalVotes] = useState({});

    const fileInputRef = useRef(null);
    const [attachments, setAttachments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const [replyingTo, setReplyingTo] = useState(null);
    const [swipeOffsets, setSwipeOffsets] = useState({});
    const swipeStartX = useRef(null);
    const swipeTargetId = useRef(null);

    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, chat: null });
    const [pinModal, setPinModal] = useState({ visible: false, chat: null });
    const [deleteModal, setDeleteModal] = useState({ visible: false, chat: null });
    const [hiddenChats, setHiddenChats] = useState(new Set()); 
    const [localReactions, setLocalReactions] = useState({}); 

    const [activePinIndex, setActivePinIndex] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const messagesEndRef = useRef(null);
    const chatCacheRef = useRef(''); 

    useEffect(() => {
        const handleGlobalContextMenu = (e) => e.preventDefault();
        document.addEventListener('contextmenu', handleGlobalContextMenu);
        const handleClickOutside = () => setContextMenu({ visible: false, x: 0, y: 0, chat: null });
        document.addEventListener('click', handleClickOutside);
        
        return () => {
            document.removeEventListener('contextmenu', handleGlobalContextMenu);
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const fetchChats = async () => {
        try {
            const res = await fetch(`${API_URL}/chats`);
            if (res.ok) {
                const data = await res.json();
                const dataString = JSON.stringify(data);
                if (dataString !== chatCacheRef.current) {
                    chatCacheRef.current = dataString;
                    setChats(data);
                }
                setIsLoading(false); // Disable skeleton once data arrives
            }
        } catch (err) {
            setIsLoading(false);
        }
    };

    const markAsRead = async (recipient) => {
        if (!currentUser) return;
        try {
            await fetch(`${API_URL}/chats/read`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: currentUser.email, recipientEmail: recipient })
            });
            fetchChats();
        } catch (err) {}
    };

    useEffect(() => {
        fetchChats();
        const interval = setInterval(fetchChats, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (currentUser) markAsRead(selectedRecipient);
    }, [selectedRecipient, currentUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setActivePinIndex(0); 
    }, [chats.length, selectedRecipient]);

    const handleSelectRecipient = (recipientKey) => {
        setSelectedRecipient(recipientKey);
        setMobileChatOpen(true);
    };

    const triggerFileInput = (type) => {
        setShowAttachMenu(false);
        if (fileInputRef.current) {
            if (type === 'image') fileInputRef.current.accept = 'image/*';
            else if (type === 'video') fileInputRef.current.accept = 'video/*';
            else fileInputRef.current.accept = '*/*';
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        if (attachments.length + newFiles.length > 10) return alert('Max 10 files allowed.');
        const newAttachments = newFiles.map(file => ({
            file, previewUrl: URL.createObjectURL(file),
            type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document'
        }));
        setAttachments([...attachments, ...newAttachments]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (index) => {
        const updated = [...attachments];
        updated.splice(index, 1);
        setAttachments(updated);
    };

    const clearAttachments = () => {
        setAttachments([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const uploadFiles = async () => {
        const uploadedUrls = [];
        for (const att of attachments) {
            const formData = new FormData();
            formData.append('image', att.file);
            try {
                const response = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
                if (response.ok) {
                    const data = await response.json();
                    uploadedUrls.push({ url: data.imageUrl, type: att.type, name: att.file.name });
                }
            } catch (error) {}
        }
        return uploadedUrls;
    };

    const handleSendMessage = async (e, customMessage = null) => {
        if (e) e.preventDefault();
        let finalMessageText = customMessage || messageText.trim();
        
        if (!finalMessageText && attachments.length === 0) return;

        setIsUploading(true);
        let fileUrls = [];
        if (attachments.length > 0 && !customMessage) {
            fileUrls = await uploadFiles();
        }

        if (replyingTo && !customMessage) {
            const safeRepliedText = replyingTo.message.replace(/\n/g, ' ').substring(0, 60);
            finalMessageText = `[REPLY:${replyingTo.senderName}|${safeRepliedText}...]\n${finalMessageText}`;
        }

        const payload = {
            senderName: currentUser.name,
            senderEmail: currentUser.email,
            recipientEmail: selectedRecipient,
            message: finalMessageText,
            attachments: fileUrls, 
            isEncrypted: true
        };

        if (fileUrls.length > 0) {
            const attachmentStrings = fileUrls.map(f => {
                const fullUrl = `${import.meta.env.VITE_API_URL}${f.url}`;
                if (f.type === 'image') return `[IMG:${fullUrl}]`;
                if (f.type === 'video') return `[VID:${fullUrl}]`;
                return `[FILE:${f.name}|${fullUrl}]`;
            });
            payload.message = finalMessageText ? `${finalMessageText}\n\n${attachmentStrings.join('\n')}` : attachmentStrings.join('\n');
        }

        try {
            const res = await fetch(`${API_URL}/chats`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) {
                if (!customMessage) setMessageText('');
                clearAttachments();
                setReplyingTo(null);
                setShowAttachMenu(false);
                fetchChats();
            }
        } catch (err) {} finally { setIsUploading(false); }
    };

    const handleRightClick = (e, chat) => {
        if (chat.message === '[DELETED]') return; 
        e.preventDefault();
        e.stopPropagation();
        
        let x = e.pageX;
        let y = e.pageY;
        if (window.innerWidth - x < 180) x -= 180;
        if (window.innerHeight - y < 350) y -= 350;
        setContextMenu({ visible: true, x, y, chat });
    };

    const handleMenuReact = async (emoji) => {
        const chat = contextMenu.chat;
        setContextMenu({ visible: false, x: 0, y: 0, chat: null });

        setChats(prev => prev.map(c => {
            if (c._id === chat._id) {
                const newReactions = { ...(c.reactions || {}) };
                if (newReactions[currentUser.email] === emoji) {
                    delete newReactions[currentUser.email];
                } else {
                    newReactions[currentUser.email] = emoji;
                }
                return { ...c, reactions: newReactions };
            }
            return c;
        }));

        try {
            await fetch(`${API_URL}/chats/${chat._id}/react`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: currentUser.email, emoji })
            });
            fetchChats();
        } catch (err) {}
    };

    const handleMenuReply = () => {
        setReplyingTo(contextMenu.chat);
        setContextMenu({ visible: false, x: 0, y: 0, chat: null });
    };

    const handleMenuCopy = () => {
        navigator.clipboard.writeText(contextMenu.chat.message.replace(/\[(?:REPLY|IMG|VID|FILE):.*?\]/g, '').trim());
        setContextMenu({ visible: false, x: 0, y: 0, chat: null });
    };

    const togglePin = async (chatId, isPinned) => {
        setChats(prev => prev.map(c => c._id === chatId ? { ...c, isPinned } : c));
        try {
            await fetch(`${API_URL}/chats/${chatId}/pin`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPinned })
            });
            fetchChats();
        } catch (err) {}
    };

    const handleMenuPin = () => {
        const chat = contextMenu.chat;
        setContextMenu({ visible: false, x: 0, y: 0, chat: null });
        if (chat.isPinned) {
            togglePin(chat._id, false); 
        } else {
            setPinModal({ visible: true, chat }); 
        }
    };

    const handleMenuDownload = () => {
        const text = contextMenu.chat.message;
        const match = text.match(/\[(?:IMG|VID|FILE):(?:.*?\|)?(.*?)\]/);
        if (match && match[1]) {
            const link = document.createElement('a');
            link.href = match[1];
            link.download = 'download';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        setContextMenu({ visible: false, x: 0, y: 0, chat: null });
    };

    const handleMenuDelete = () => {
        const chat = contextMenu.chat;
        setContextMenu({ visible: false, x: 0, y: 0, chat: null });
        if (chat.senderEmail === currentUser.email) {
            setDeleteModal({ visible: true, chat }); 
        } else {
            handleConfirmDelete('me', chat); 
        }
    };

    const handleConfirmDelete = async (type, chatTarget = null) => {
        const chat = chatTarget || deleteModal.chat;
        setDeleteModal({ visible: false, chat: null });

        if (type === 'me') {
            setChats(prev => prev.filter(c => c._id !== chat._id)); 
            try {
                await fetch(`${API_URL}/chats/${chat._id}/deleteForMe`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userEmail: currentUser.email })
                });
                fetchChats();
            } catch (err) {}
        } else if (type === 'everyone') {
            setChats(prev => prev.map(c => c._id === chat._id ? { ...c, message: '[DELETED]', isPinned: false } : c));
            try {
                await fetch(`${API_URL}/chats/${chat._id}`, { method: 'DELETE' });
                fetchChats();
            } catch (err) {}
        }
    };

    const onSwipeStart = (e, chatId) => {
        if(e.button === 2) return; 
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        swipeStartX.current = clientX;
        swipeTargetId.current = chatId;
    };

    const onSwipeMove = (e) => {
        if (!swipeStartX.current || !swipeTargetId.current) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let deltaX = clientX - swipeStartX.current;
        if (deltaX > 0) {
            if (deltaX > 70) deltaX = 70;
            setSwipeOffsets({ ...swipeOffsets, [swipeTargetId.current]: deltaX });
        }
    };

    const onSwipeEnd = () => {
        if (swipeTargetId.current) {
            const finalOffset = swipeOffsets[swipeTargetId.current] || 0;
            if (finalOffset > 50) {
                const chatToReply = chats.find(c => c._id === swipeTargetId.current);
                if (chatToReply && chatToReply.message !== '[DELETED]') setReplyingTo(chatToReply);
            }
            setSwipeOffsets({ ...swipeOffsets, [swipeTargetId.current]: 0 });
        }
        swipeStartX.current = null;
        swipeTargetId.current = null;
    };

    const handleAddPollOption = () => setPollOptions([...pollOptions, '']);
    const handlePollOptionChange = (index, value) => {
        const updated = [...pollOptions];
        updated[index] = value;
        setPollOptions(updated);
    };

    const handleCreatePoll = (e) => {
        e.preventDefault();
        if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) return alert('Please enter a question and at least 2 options.');
        const validOptions = pollOptions.filter(o => o.trim()).map(opt => ({ text: opt, votes: [] }));
        const pollData = { question: pollQuestion, allowMultiple, options: validOptions, creatorEmail: currentUser.email };
        handleSendMessage(null, `[POLL_JSON]:${JSON.stringify(pollData)}`);
        setPollQuestion('');
        setPollOptions(['', '']);
        setAllowMultiple(false);
        setShowPollModal(false);
    };

    const handleVoteToggle = (chatId, optionIndex, allowMultiple) => {
        setLocalVotes(prev => {
            const currentVotes = prev[chatId] || [];
            if (allowMultiple) {
                if (currentVotes.includes(optionIndex)) return { ...prev, [chatId]: currentVotes.filter(idx => idx !== optionIndex) };
                else return { ...prev, [chatId]: [...currentVotes, optionIndex] };
            } else {
                return { ...prev, [chatId]: [optionIndex] };
            }
        });
    };

    const handleBannerClick = () => {
        if (pinnedChats.length === 0) return;
        const chatTarget = pinnedChats[activePinIndex];
        const element = document.getElementById(`chat-${chatTarget._id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight-flash');
            setTimeout(() => element.classList.remove('highlight-flash'), 2000);
        }
        setActivePinIndex((prevIndex) => (prevIndex + 1) % pinnedChats.length);
    };

    const renderMessageContent = (chat) => {
        if (!chat.message) return null;
        let text = chat.message;

        if (text === '[DELETED]') {
            return <div className="deleted-message-bubble"><Ban size={14} /> This message was deleted</div>;
        }

        if (text.startsWith('[POLL_JSON]:')) {
            try {
                const poll = JSON.parse(text.substring(12));
                const userSelectedOptions = localVotes[chat._id] || [];
                const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0) + (userSelectedOptions.length > 0 ? 1 : 0);

                return (
                    <div className="custom-poll-bubble">
                        <div className="poll-question-header">
                            <h4>{poll.question}</h4>
                            <span className="poll-subtitle"><CheckCircle2 size={12}/> {poll.allowMultiple ? 'Select multiple' : 'Select one'}</span>
                        </div>
                        <div className="poll-options-container">
                            {poll.options.map((opt, idx) => {
                                const isSelected = userSelectedOptions.includes(idx);
                                const simulatedOptionVotes = opt.votes.length + (isSelected ? 1 : 0);
                                const percent = totalVotes > 0 ? (simulatedOptionVotes / totalVotes) * 100 : 0;
                                return (
                                    <div key={idx} className="poll-option-row" onClick={() => handleVoteToggle(chat._id, idx, poll.allowMultiple)}>
                                        <div className="poll-progress-bg" style={{ width: `${percent}%` }}></div>
                                        <div className="poll-option-content">
                                            <div className="poll-option-left">
                                                {isSelected ? <CheckCircle2 size={20} className="poll-check-icon checked" /> : <Circle size={20} className="poll-check-icon" />}
                                                <span className="poll-opt-text">{opt.text}</span>
                                            </div>
                                            <div className="poll-option-right">
                                                {simulatedOptionVotes > 0 && <span className="poll-vote-count">{simulatedOptionVotes}</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {chat.senderEmail === currentUser.email && (
                            <div className="poll-footer-action">
                                <button className="view-votes-btn" onClick={() => setViewVotesPoll({ poll, chatId: chat._id })}>View votes</button>
                            </div>
                        )}
                    </div>
                );
            } catch (e) { return <span>[Invalid Poll Data]</span>; }
        }
        
        const lines = text.split('\n');
        return lines.map((line, idx) => {
            if (line.startsWith('[REPLY:') && line.endsWith(']')) {
                const replyContent = line.substring(7, line.length - 1);
                const [repliedName, repliedText] = replyContent.split('|');
                return (
                    <div key={idx} className="rendered-reply-box">
                        <div className="reply-name">{repliedName}</div>
                        <div className="reply-preview-text">{repliedText}</div>
                    </div>
                );
            }
            if (line.startsWith('[IMG:') && line.endsWith(']')) {
                const url = line.substring(5, line.length - 1);
                return (
                    <div key={idx} className="chat-bubble-image-container">
                        <img src={url} alt="attachment" className="chat-bubble-image" />
                    </div>
                );
            }
            if (line.startsWith('[VID:') && line.endsWith(']')) {
                const url = line.substring(5, line.length - 1);
                return <video key={idx} src={url} controls className="chat-bubble-video" />;
            }
            if (line.startsWith('[FILE:') && line.endsWith(']')) {
                const content = line.substring(6, line.length - 1);
                const [name, url] = content.split('|');
                return (
                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="chat-bubble-file">
                        <FileText size={18} /> {name}
                    </a>
                );
            }
            return <span key={idx}>{line}<br /></span>;
        });
    };

    const filteredChats = chats.filter(c => {
        if (c.deletedFor && c.deletedFor.includes(currentUser.email)) return false; 
        if (hiddenChats.has(c._id)) return false; 
        if (selectedRecipient === 'all') return c.recipientEmail === 'all';
        return (
            (c.senderEmail === currentUser.email && c.recipientEmail === selectedRecipient) ||
            (c.senderEmail === selectedRecipient && c.recipientEmail === currentUser.email)
        );
    });

    const activeRecipientName = selectedRecipient === 'all' ? 'Team Chat' : team.find(t => t.email === selectedRecipient)?.name;
    const pinnedChats = filteredChats.filter(c => c.isPinned);
    const activePinnedChat = pinnedChats.length > 0 ? pinnedChats[activePinIndex % pinnedChats.length] : null;

    return (
        <div className={`chatbox-wrapper page-animate ${isFullScreen ? 'fullscreen-mode' : ''}`}>
            <header className="team-hero stagger-1">
                <div className="hero-text-content">
                    <h1 className="hero-greeting">DevNexus <span className="highlight-name">Secure Chat Hub</span></h1>
                    <p className="hero-subtitle">End-to-end encrypted workspace messaging for the DevNexus team.</p>
                </div>
            </header>

            <section className="stagger-2" style={{ height: isFullScreen ? '100vh' : 'calc(100vh - 240px)' }}>
                <div className={`chat-hub-layout ${mobileChatOpen ? 'mobile-chat-active' : ''}`}>
                    
                    {/* Left Sidebar */}
                    <div className="chat-hub-sidebar">
                        <div className="chat-hub-sidebar-header">
                            <h3>Conversations</h3>
                        </div>
                        <div className="chat-hub-channels-list">
                            <div className={`chat-hub-channel-item ${selectedRecipient === 'all' ? 'active-channel' : ''}`} onClick={() => handleSelectRecipient('all')}>
                                <div className="chat-hub-icon-circle" style={{ background: '#eff6ff', color: '#2563eb' }}>
                                    <Users size={18} />
                                </div>
                                <div className="chat-hub-channel-info">
                                    <h4>Team Chat</h4>
                                    <p>Public encrypted room</p>
                                </div>
                            </div>
                            <div className="chat-hub-section-title">Team Members</div>
                            {/* SIDEBAR SKELETON LOADER */}
                            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="chat-hub-channel-item">
                                    <div className="skeleton skeleton-avatar"></div>
                                    <div className="chat-hub-channel-info" style={{ flex: 1 }}>
                                        <div className="skeleton skeleton-text medium"></div>
                                        <div className="skeleton skeleton-text short"></div>
                                    </div>
                                </div>
                            )) : team.filter(t => t.email !== currentUser?.email).map(member => (
                                <div key={member._id} className={`chat-hub-channel-item ${selectedRecipient === member.email ? 'active-channel' : ''}`} onClick={() => handleSelectRecipient(member.email)}>
                                    <img src={getAvatarSrc(member)} alt={member.name} className="chat-hub-member-avatar" />
                                    <div className="chat-hub-channel-info">
                                        <h4>{member.name}</h4>
                                        <p>{member.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Main Pane */}
                    <div className="chat-hub-main-pane">
                        <div className="chat-hub-main-header">
                            <div className="chat-hub-active-title">
                                <button className="mobile-back-btn" onClick={() => setMobileChatOpen(false)}>
                                    <ArrowLeft size={20} />
                                </button>
                                <MessageSquareCode size={20} color="#6366f1" />
                                <h3>{activeRecipientName}</h3>
                            </div>
                            <div className="chat-hub-security-tag">
                                <Lock size={13} color="#10b981" /> Encrypted
                                <button onClick={() => setIsFullScreen(!isFullScreen)} className="fullscreen-btn" title="Toggle Fullscreen">
                                    {isFullScreen ? <Minimize size={14} /> : <Maximize size={14} />}
                                </button>
                            </div>
                        </div>

                        {activePinnedChat && (
                            <div className="pinned-message-banner pop-in" onClick={handleBannerClick}>
                                <div className="pinned-banner-indicator">
                                    <Pin size={16} color="#059669" />
                                    {pinnedChats.length > 1 && (
                                        <span className="pinned-counter">{activePinIndex + 1}/{pinnedChats.length}</span>
                                    )}
                                </div>
                                <div className="pinned-banner-content">
                                    <span className="pinned-banner-title">Pinned Message</span>
                                    <span className="pinned-banner-text">
                                        {activePinnedChat.message.startsWith('[POLL') ? '📊 Poll' :
                                         activePinnedChat.message.startsWith('[IMG') ? '🖼️ Image attached' :
                                         activePinnedChat.message.length > 50 ? activePinnedChat.message.substring(0,50) + '...' : activePinnedChat.message}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div 
                            className="chat-hub-messages-scroll"
                            onMouseMove={onSwipeMove}
                            onTouchMove={onSwipeMove}
                            onMouseUp={onSwipeEnd}
                            onTouchEnd={onSwipeEnd}
                            onMouseLeave={onSwipeEnd}
                        >
                            {/* MAIN CHAT SKELETON LOADER */}
                            {isLoading ? (
                                <>
                                    <div className="chat-hub-bubble-wrapper other-msg"><div className="skeleton skeleton-bubble" style={{ width: '220px', height: '60px' }}></div></div>
                                    <div className="chat-hub-bubble-wrapper my-msg"><div className="skeleton skeleton-bubble" style={{ width: '300px', height: '80px' }}></div></div>
                                    <div className="chat-hub-bubble-wrapper other-msg"><div className="skeleton skeleton-bubble" style={{ width: '250px', height: '50px' }}></div></div>
                                </>
                            ) : filteredChats.length === 0 ? (
                                <div className="chat-hub-empty-state">
                                    <Sparkles size={36} color="#94a3b8" />
                                    <h3>No encrypted messages yet</h3>
                                    <p>Send a secure message to start chatting!</p>
                                </div>
                            ) : (
                                filteredChats.map((chat, idx) => {
                                    const isMe = chat.senderEmail === currentUser?.email;
                                    const isPoll = chat.message && chat.message.startsWith('[POLL_JSON]:');
                                    const offset = swipeOffsets[chat._id] || 0;
                                    const transformStyle = { transform: `translateX(${offset}px)` };
                                    const renderedReactions = chat.reactions ? Array.from(new Set(Object.values(chat.reactions))) : [];

                                    return (
                                        <div 
                                            id={`chat-${chat._id}`}
                                            key={chat._id || idx} 
                                            className={`chat-hub-bubble-wrapper ${isMe ? 'my-msg' : 'other-msg'} ${isPoll ? 'poll-msg-wrapper' : ''}`}
                                            onMouseDown={(e) => onSwipeStart(e, chat._id)}
                                            onTouchStart={(e) => onSwipeStart(e, chat._id)}
                                            onContextMenu={(e) => handleRightClick(e, chat)}
                                            style={transformStyle}
                                        >
                                            {!isMe && !isPoll && <span className="chat-hub-sender-label">{chat.senderName}</span>}
                                            <div className={`chat-hub-bubble ${isPoll ? 'poll-bubble-whatsapp' : (isMe ? 'bubble-mine' : 'bubble-theirs')}`}>
                                                
                                                <div className="chat-hub-text">{renderMessageContent(chat)}</div>
                                                
                                                <div className="chat-hub-bubble-footer" style={isPoll ? { color: '#64748b', marginTop: '0.2rem' } : {}}>
                                                    {chat.isPinned && <Pin size={10} style={{ marginRight: '4px' }} />}
                                                    <span className="chat-hub-timestamp">{chat.timestamp}</span>
                                                </div>

                                                {renderedReactions.length > 0 && (
                                                    <div className="chat-reaction-badge pop-in">
                                                        {renderedReactions.join(' ')}
                                                        {Object.keys(chat.reactions).length > 1 && (
                                                            <span className="reaction-count">{Object.keys(chat.reactions).length}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={(e) => handleSendMessage(e)} className="chat-hub-input-form" style={{ position: 'relative' }}>
                            <div className="chat-attach-container">
                                <button type="button" className="chat-attach-trigger-btn hover-pop" onClick={() => setShowAttachMenu(!showAttachMenu)}>
                                    <Plus size={20} />
                                </button>
                                {showAttachMenu && (
                                    <div className="chat-upside-dropdown pop-in">
                                        <button type="button" onClick={() => triggerFileInput('video')}><Video size={16} color="#ef4444" /> Videos</button>
                                        <button type="button" onClick={() => triggerFileInput('image')}><Image size={16} color="#3b82f6" /> Photos</button>
                                        <button type="button" onClick={() => triggerFileInput('file')}><FileText size={16} color="#f59e0b" /> Files</button>
                                        <button type="button" onClick={() => triggerFileInput('document')}><File size={16} color="#10b981" /> Document</button>
                                        <button type="button" onClick={() => { setShowAttachMenu(false); setShowPollModal(true); }}><BarChart2 size={16} color="#8b5cf6" /> Poll</button>
                                    </div>
                                )}
                            </div>

                            <input type="file" ref={fileInputRef} multiple style={{ display: 'none' }} onChange={handleFileChange} />

                            <div className="chat-input-wrapper">
                                {replyingTo && (
                                    <div className="replying-preview-box pop-in">
                                        <div className="replying-accent-bar"></div>
                                        <div className="replying-content-col">
                                            <span className="replying-name">{replyingTo.senderName === currentUser.name ? 'You' : replyingTo.senderName}</span>
                                            <span className="replying-text">
                                                {replyingTo.message.startsWith('[POLL') ? '📊 Poll' : 
                                                 replyingTo.message.startsWith('[IMG') ? '🖼️ Image' :
                                                 replyingTo.message.length > 50 ? replyingTo.message.substring(0, 50) + '...' : replyingTo.message}
                                            </span>
                                        </div>
                                        <button type="button" className="close-reply-btn" onClick={() => setReplyingTo(null)}><X size={16}/></button>
                                    </div>
                                )}

                                {attachments.length > 0 && (
                                    <div className="chat-attachment-gallery pop-in">
                                        {attachments.map((att, index) => (
                                            <div key={index} className="chat-attachment-item">
                                                <button type="button" className="remove-attachment-btn hover-pop" onClick={() => removeAttachment(index)}><X size={14} /></button>
                                                {att.type === 'image' && <img src={att.previewUrl} alt="preview" />}
                                                {att.type === 'video' && <video src={att.previewUrl} />}
                                                {(att.type === 'document' || att.type === 'file') && (
                                                    <div className="file-preview-box">
                                                        <FileText size={20} color="#2563eb" />
                                                        <div className="file-preview-info">
                                                            <span className="file-name" title={att.file.name}>{att.file.name.length > 15 ? att.file.name.substring(0,15) + '...' : att.file.name}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <input 
                                    type="text" 
                                    placeholder="Send secure message..." 
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    className="chat-hub-text-input"
                                    disabled={isUploading}
                                    autoFocus={!!replyingTo}
                                />
                            </div>
                            <button type="submit" className="btn-modern-primary hover-pop chat-hub-send-btn" disabled={(!messageText.trim() && attachments.length === 0) || isUploading}>
                                {isUploading ? <Sparkles size={16} className="pulse-anim" /> : <Send size={16} />} 
                                {isUploading ? 'Sending...' : 'Send'}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {contextMenu.visible && (
                <div className="custom-context-menu pop-in" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={(e) => e.stopPropagation()}>
                    <div className="context-menu-reactions">
                        {['👍','❤️','😂','😮','😢','👏'].map(emoji => (
                            <button key={emoji} onClick={() => handleMenuReact(emoji)} className="reaction-btn">{emoji}</button>
                        ))}
                    </div>
                    <div className="context-menu-actions">
                        <button onClick={handleMenuReply}>Reply</button>
                        <button onClick={handleMenuPin}>
                            {contextMenu.chat?.isPinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button onClick={handleMenuCopy}>Copy</button>
                        {contextMenu.chat?.message?.match(/\[(?:IMG|VID|FILE):/) && (
                            <button onClick={handleMenuDownload}>Download</button>
                        )}
                        <button onClick={handleMenuDelete} className="context-menu-danger">Delete</button>
                    </div>
                </div>
            )}

            {pinModal.visible && (
                <div className="modal-overlay fade-in">
                    <div className="pin-duration-modal pop-in">
                        <h3>Choose how long your new pin lasts</h3>
                        <p>You can unpin at any time.</p>
                        <div className="pin-duration-options">
                            <button onClick={() => { togglePin(pinModal.chat._id, true); setPinModal({ visible: false, chat: null }); }}>24 hours</button>
                            <button onClick={() => { togglePin(pinModal.chat._id, true); setPinModal({ visible: false, chat: null }); }}>7 days</button>
                            <button onClick={() => { togglePin(pinModal.chat._id, true); setPinModal({ visible: false, chat: null }); }}>30 days</button>
                            <button onClick={() => setPinModal({ visible: false, chat: null })}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {deleteModal.visible && (
                <div className="modal-overlay fade-in">
                    <div className="delete-action-modal pop-in">
                        <h3>Delete Message?</h3>
                        <p>Are you sure you want to delete this message?</p>
                        <div className="delete-action-options">
                            <button className="btn-modern-danger" onClick={() => handleConfirmDelete('everyone')}>Delete for everyone</button>
                            <button className="btn-modern-secondary" onClick={() => handleConfirmDelete('me')}>Delete for me</button>
                            <button className="text-btn" onClick={() => setDeleteModal({ visible: false, chat: null })}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {viewVotesPoll && (
                <div className="modal-overlay fade-in">
                    <div className="poll-votes-modal pop-in">
                        <div className="poll-votes-modal-header">
                            <button className="modal-close-btn" onClick={() => setViewVotesPoll(null)}><X size={20} color="#0f172a" /></button>
                            <h2>Poll votes</h2>
                        </div>
                        
                        <div className="poll-votes-body">
                            <div className="poll-votes-question-bubble">
                                {viewVotesPoll.poll.question}
                            </div>
                            {viewVotesPoll.poll.options.map((opt, i) => {
                                const optionVotes = [...opt.votes];
                                const userSelectedOptions = localVotes[viewVotesPoll.chatId] || [];
                                if (userSelectedOptions.includes(i)) {
                                    optionVotes.push({ user: currentUser.name, avatar: getAvatarSrc(currentUser), time: 'Just now' });
                                }
                                return (
                                    <div key={i} className="poll-votes-option-group">
                                        <div className="poll-votes-option-header">
                                            <h4>{opt.text}</h4>
                                            <span className="vote-count-text">{optionVotes.length} {optionVotes.length === 1 ? 'vote' : 'votes'}</span>
                                        </div>
                                        {optionVotes.length === 0 ? (
                                            <div className="no-votes-text">No votes yet</div>
                                        ) : (
                                            optionVotes.map((v, vIdx) => (
                                                <div key={vIdx} className="poll-voter-item">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <img src={v.avatar} alt={v.user} className="voter-avatar" />
                                                        <span className="voter-name">{v.user === currentUser.name ? 'You' : v.user}</span>
                                                    </div>
                                                    <span className="voter-time">{v.time}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {showPollModal && (
                <div className="modal-overlay fade-in">
                    <div className="modal-content pop-in poll-modal-content">
                        <div className="modal-header poll-modal-header">
                            <button className="modal-close" onClick={() => setShowPollModal(false)}><X size={20}/></button>
                            <h2>Create poll</h2>
                            <button type="button" className="btn-modern-primary poll-send-btn hover-pop" onClick={handleCreatePoll}>Send</button>
                        </div>
                        <form onSubmit={handleCreatePoll} className="modern-form poll-form">
                            <div className="form-group">
                                <label className="poll-section-label">QUESTION</label>
                                <input type="text" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} className="modern-input poll-input" placeholder="Ask question" required autoFocus />
                            </div>
                            <div className="form-group">
                                <label className="poll-section-label">OPTIONS</label>
                                {pollOptions.map((opt, idx) => (
                                    <input key={idx} type="text" value={opt} onChange={(e) => handlePollOptionChange(idx, e.target.value)} className="modern-input poll-input" placeholder="Add" style={{ marginBottom: '0.75rem' }} />
                                ))}
                                <button type="button" className="text-btn" onClick={handleAddPollOption} style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563eb' }}>+ Add another option</button>
                            </div>
                            <div className="poll-checkbox-row">
                                <span>Allow multiple answers</span>
                                <label className="custom-checkbox">
                                    <input type="checkbox" checked={allowMultiple} onChange={(e) => setAllowMultiple(e.target.checked)} />
                                    <span className="checkmark"><Check size={14} color="white" /></span>
                                </label>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}