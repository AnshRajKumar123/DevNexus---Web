import React, { useState, useEffect, useRef } from 'react';
import { Send, Lock, Users, Sparkles, MessageSquareCode, ArrowLeft, Plus, Video, Image, FileText, File, BarChart2, X, Check, CheckCircle2, Circle, Ban, Pin, Maximize, Minimize, CheckCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import '../styles/ChatHub.css';

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api`;

export const getAvatarSrc = (user) => {
    if (!user || !user.imgUrl) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=${user?.isSupremeAdmin ? '0f172a' : 'e5e7eb'}&color=${user?.isSupremeAdmin ? 'fff' : '374151'}&bold=true`;
    }
    if (user.imgUrl.startsWith('http')) return user.imgUrl;
    return user.imgUrl.startsWith('/') ? user.imgUrl : `/${user.imgUrl}`;
};

const formatChatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatLastSeen = (lastSeenDate) => {
    if (!lastSeenDate) return 'offline';
    
    const date = new Date(lastSeenDate);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = diffMs / (1000 * 60);

    if (diffMins < 5) return 'Online';

    const isToday = date.toDateString() === now.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    if (isToday) return `last seen today at ${timeString}`;
    if (isYesterday) return `last seen yesterday at ${timeString}`;
    return `last seen ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${timeString}`;
};

const formatSidebarTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
    }
};

export default function ChatHub() {
    const { currentUser, team = [] } = useData();
    const [chats, setChats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
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

    // Lightbox Preview State
    const [previewModal, setPreviewModal] = useState({ visible: false, images: [], currentIndex: 0 });

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

    const pingStatus = async () => {
        if (!currentUser || !navigator.onLine || document.visibilityState === 'hidden') return;
        try { await fetch(`${API_URL}/team/${currentUser.email}/ping`, { method: 'PUT' }); } catch (err) { }
    };

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
                setIsLoading(false);
            }
        } catch (err) { setIsLoading(false); }
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
        } catch (err) { }
    };

    useEffect(() => {
        fetchChats();
        pingStatus();
        const interval = setInterval(() => {
            fetchChats();
            pingStatus();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setActivePinIndex(0);
        if (currentUser) markAsRead(selectedRecipient);
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
            } catch (error) { }
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
                const baseUrl = import.meta.env.VITE_API_URL || '';
                const fullUrl = f.url.startsWith('http') ? f.url : `${baseUrl}${f.url}`;
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
        } catch (err) { } finally { setIsUploading(false); }
    };

    const handleRightClick = (e, chat) => {
        if (chat.message === '[DELETED]') return;
        e.preventDefault();
        e.stopPropagation();
        let x = e.pageX; let y = e.pageY;
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
                if (newReactions[currentUser.email] === emoji) delete newReactions[currentUser.email];
                else newReactions[currentUser.email] = emoji;
                return { ...c, reactions: newReactions };
            }
            return c;
        }));
        try { await fetch(`${API_URL}/chats/${chat._id}/react`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userEmail: currentUser.email, emoji }) }); fetchChats(); } catch (err) { }
    };

    const handleMenuReply = () => { setReplyingTo(contextMenu.chat); setContextMenu({ visible: false, x: 0, y: 0, chat: null }); };
    
    const handleMenuCopy = () => {
        navigator.clipboard.writeText(contextMenu.chat.message.replace(/\[(?:REPLY|IMG|VID|FILE):.*?\]/g, '').trim());
        setContextMenu({ visible: false, x: 0, y: 0, chat: null });
    };

    const togglePin = async (chatId, isPinned) => {
        setChats(prev => prev.map(c => c._id === chatId ? { ...c, isPinned } : c));
        try { await fetch(`${API_URL}/chats/${chatId}/pin`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPinned }) }); fetchChats(); } catch (err) { }
    };

    const handleMenuPin = () => {
        const chat = contextMenu.chat;
        setContextMenu({ visible: false, x: 0, y: 0, chat: null });
        if (chat.isPinned) togglePin(chat._id, false);
        else setPinModal({ visible: true, chat });
    };

    const handleMenuDownload = () => {
        const text = contextMenu.chat.message;
        const match = text.match(/\[(?:IMG|VID|FILE):(?:.*?\|)?(.*?)\]/);
        if (match && match[1]) {
            const link = document.createElement('a');
            link.href = match[1]; link.download = 'download'; link.target = '_blank';
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
        }
        setContextMenu({ visible: false, x: 0, y: 0, chat: null });
    };

    const handleMenuDelete = () => {
        const chat = contextMenu.chat;
        setContextMenu({ visible: false, x: 0, y: 0, chat: null });
        if (chat.senderEmail === currentUser.email) setDeleteModal({ visible: true, chat });
        else handleConfirmDelete('me', chat);
    };

    const handleConfirmDelete = async (type, chatTarget = null) => {
        const chat = chatTarget || deleteModal.chat;
        setDeleteModal({ visible: false, chat: null });

        if (type === 'me') {
            setChats(prev => prev.filter(c => c._id !== chat._id));
            try { await fetch(`${API_URL}/chats/${chat._id}/deleteForMe`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userEmail: currentUser.email }) }); fetchChats(); } catch (err) { }
        } else if (type === 'everyone') {
            setChats(prev => prev.map(c => c._id === chat._id ? { ...c, message: '[DELETED]', isPinned: false } : c));
            try { await fetch(`${API_URL}/chats/${chat._id}`, { method: 'DELETE' }); fetchChats(); } catch (err) { }
        }
    };

    const onSwipeStart = (e, chatId) => {
        if (e.button === 2) return;
        swipeStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
        swipeTargetId.current = chatId;
    };

    const onSwipeMove = (e) => {
        if (!swipeStartX.current || !swipeTargetId.current) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let deltaX = clientX - swipeStartX.current;
        if (deltaX > 0) setSwipeOffsets({ ...swipeOffsets, [swipeTargetId.current]: Math.min(deltaX, 70) });
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

    const handleCreatePoll = (e) => {
        e.preventDefault();
        if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) return alert('Please enter a question and at least 2 options.');
        const validOptions = pollOptions.filter(o => o.trim()).map(opt => ({ text: opt, votes: [] }));
        const pollData = { question: pollQuestion, allowMultiple, options: validOptions, creatorEmail: currentUser.email };
        handleSendMessage(null, `[POLL_JSON]:${JSON.stringify(pollData)}`);
        setPollQuestion(''); setPollOptions(['', '']); setAllowMultiple(false); setShowPollModal(false);
    };

    const handleVoteToggle = (chatId, optionIndex, allowMultiple) => {
        setLocalVotes(prev => {
            const currentVotes = prev[chatId] || [];
            if (allowMultiple) {
                return currentVotes.includes(optionIndex) ? { ...prev, [chatId]: currentVotes.filter(idx => idx !== optionIndex) } : { ...prev, [chatId]: [...currentVotes, optionIndex] };
            } else {
                return { ...prev, [chatId]: [optionIndex] };
            }
        });
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
                            <span className="poll-subtitle"><CheckCircle2 size={12} /> {poll.allowMultiple ? 'Select multiple' : 'Select one'}</span>
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
        const images = [];
        const videos = [];
        const files = [];
        const textElements = [];

        lines.forEach((line, idx) => {
            if (line.startsWith('[IMG:') && line.endsWith(']')) {
                images.push(line.substring(5, line.length - 1));
            } else if (line.startsWith('[VID:') && line.endsWith(']')) {
                videos.push(line.substring(5, line.length - 1));
            } else if (line.startsWith('[FILE:') && line.endsWith(']')) {
                const content = line.substring(6, line.length - 1);
                const [name, url] = content.split('|');
                files.push({ name, url });
            } else if (line.startsWith('[REPLY:') && line.endsWith(']')) {
                const replyContent = line.substring(7, line.length - 1);
                const [repliedName, repliedText] = replyContent.split('|');
                textElements.push(
                    <div key={`reply-${idx}`} className="rendered-reply-box">
                        <div className="reply-name">{repliedName}</div>
                        <div className="reply-preview-text">{repliedText}</div>
                    </div>
                );
            } else if (line.trim() !== '') {
                textElements.push(<span key={`text-${idx}`}>{line}</span>);
            }
        });

        return (
            <div className="chat-message-blocks">
                {textElements.length > 0 && (
                    <div className="chat-text-content">
                        {textElements}
                    </div>
                )}

                {images.length > 0 && (
                    <div className={`chat-image-collage collage-count-${Math.min(images.length, 4)}`}>
                        {images.slice(0, 4).map((url, i) => (
                            <div key={i} className="collage-item" onClick={() => setPreviewModal({ visible: true, images, currentIndex: i })}>
                                <img src={url} alt="attachment" />
                                {i === 3 && images.length > 4 && (
                                    <div className="collage-overlay-count">+{images.length - 4}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {videos.map((url, i) => (
                    <video key={`vid-${i}`} src={url} controls className="chat-bubble-video" style={{ marginTop: '0.5rem' }} />
                ))}

                {files.map((file, i) => (
                    <a key={`file-${i}`} href={file.url} target="_blank" rel="noreferrer" className="chat-bubble-file">
                        <FileText size={18} /> {file.name}
                    </a>
                ))}
            </div>
        );
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

    const activeUser = selectedRecipient === 'all' ? null : team.find(t => t.email === selectedRecipient);
    const activeRecipientName = selectedRecipient === 'all' ? 'Team Chat' : activeUser?.name;
    const pinnedChats = filteredChats.filter(c => c.isPinned);
    const activePinnedChat = pinnedChats.length > 0 ? pinnedChats[activePinIndex % pinnedChats.length] : null;

    const getConversationMeta = (recipientEmail) => {
        const conversationMsgs = chats.filter(c => {
            if (c.deletedFor && c.deletedFor.includes(currentUser.email)) return false;
            if (recipientEmail === 'all') return c.recipientEmail === 'all';
            return (
                (c.senderEmail === currentUser.email && c.recipientEmail === recipientEmail) ||
                (c.senderEmail === recipientEmail && c.recipientEmail === currentUser.email)
            );
        });
        const unreadCount = conversationMsgs.filter(c => c.senderEmail !== currentUser.email && !(c.readBy && c.readBy.includes(currentUser.email))).length;
        const lastMsg = conversationMsgs[conversationMsgs.length - 1];
        
        let previewText = '';
        if (lastMsg) {
            if (lastMsg.message === '[DELETED]') previewText = '🚫 Deleted message';
            else if (lastMsg.message.startsWith('[IMG')) previewText = '📷 Photo';
            else if (lastMsg.message.startsWith('[VID')) previewText = '🎥 Video';
            else if (lastMsg.message.startsWith('[FILE')) previewText = '📎 File';
            else if (lastMsg.message.startsWith('[POLL_JSON]')) previewText = '📊 Poll';
            else previewText = lastMsg.message.replace(/\[REPLY:.*?\]\n/g, '').substring(0, 30);
        }
        return { unreadCount, lastMsgTime: lastMsg ? formatSidebarTime(lastMsg.createdAt) : '', previewText };
    };

    const teamChatMeta = getConversationMeta('all');

    return (
        <div className={`chatbox-wrapper page-animate ${isFullScreen ? 'fullscreen-mode' : ''}`}>
            <header className="team-hero stagger-1">
                <div className="hero-text-content">
                    <h1 className="hero-greeting">DevNexus <span className="highlight-name">Secure Chat Hub</span></h1>
                    <p className="hero-subtitle">End-to-end encrypted workspace messaging for the DevNexus team.</p>
                </div>
            </header>

            <section className="stagger-2 chat-main-section">
                <div className={`chat-hub-layout ${mobileChatOpen ? 'mobile-chat-active' : ''}`}>

                    <div className="chat-hub-sidebar">
                        <div className="chat-hub-sidebar-header">
                            <h3>Conversations</h3>
                        </div>
                        <div className="chat-hub-channels-list">
                            <div className={`chat-hub-channel-item ${selectedRecipient === 'all' ? 'active-channel' : ''}`} onClick={() => handleSelectRecipient('all')}>
                                <div className="chat-hub-icon-circle" style={{ background: '#eff6ff', color: '#2563eb' }}>
                                    <Users size={18} />
                                </div>
                                <div className="chat-hub-channel-info sidebar-meta-layout">
                                    <div className="sidebar-meta-top">
                                        <h4>Team Chat</h4>
                                        <span className="sidebar-time">{teamChatMeta.lastMsgTime}</span>
                                    </div>
                                    <div className="sidebar-meta-bottom">
                                        <p>{teamChatMeta.previewText || 'Public encrypted room'}</p>
                                        {teamChatMeta.unreadCount > 0 && <span className="sidebar-unread-badge">{teamChatMeta.unreadCount}</span>}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="chat-hub-section-title">Team Members</div>
                            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="chat-hub-channel-item">
                                    <div className="skeleton skeleton-avatar"></div>
                                    <div className="chat-hub-channel-info" style={{ flex: 1 }}>
                                        <div className="skeleton skeleton-text medium"></div>
                                        <div className="skeleton skeleton-text short"></div>
                                    </div>
                                </div>
                            )) : team.filter(t => t.email !== currentUser?.email).map(member => {
                                const meta = getConversationMeta(member.email);
                                return (
                                <div key={member._id} className={`chat-hub-channel-item ${selectedRecipient === member.email ? 'active-channel' : ''}`} onClick={() => handleSelectRecipient(member.email)}>
                                    <img src={getAvatarSrc(member)} alt={member.name} className="chat-hub-member-avatar" />
                                    <div className="chat-hub-channel-info sidebar-meta-layout">
                                        <div className="sidebar-meta-top">
                                            <h4>{member.name}</h4>
                                            <span className="sidebar-time" style={{ color: meta.unreadCount > 0 ? '#10b981' : '#94a3b8' }}>{meta.lastMsgTime}</span>
                                        </div>
                                        <div className="sidebar-meta-bottom">
                                            <p>{meta.previewText || member.role}</p>
                                            {meta.unreadCount > 0 && <span className="sidebar-unread-badge">{meta.unreadCount}</span>}
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="chat-hub-main-pane">
                        <div className="chat-hub-main-header">
                            <div className="chat-hub-active-title">
                                <button className="mobile-back-btn" onClick={() => setMobileChatOpen(false)}>
                                    <ArrowLeft size={20} />
                                </button>
                                
                                {selectedRecipient === 'all' ? (
                                    <>
                                        <div className="chat-hub-icon-circle header-avatar" style={{ background: '#eff6ff', color: '#2563eb' }}><Users size={20} /></div>
                                        <div className="chat-hub-header-info">
                                            <h3>Team Chat</h3>
                                            <span className="chat-status">Public encrypted room</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <img src={getAvatarSrc(activeUser)} alt={activeRecipientName} className="chat-hub-header-avatar" />
                                        <div className="chat-hub-header-info">
                                            <h3>{activeRecipientName}</h3>
                                            <span className={`chat-status ${formatLastSeen(activeUser?.lastSeen) === 'Online' ? 'online' : ''}`}>
                                                {formatLastSeen(activeUser?.lastSeen)}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="chat-hub-security-tag">
                                <button onClick={() => setIsFullScreen(!isFullScreen)} className="fullscreen-btn">
                                    {isFullScreen ? <Minimize size={14} /> : <Maximize size={14} />}
                                </button>
                            </div>
                        </div>

                        <div className="chat-hub-messages-scroll" onMouseMove={onSwipeMove} onTouchMove={onSwipeMove} onMouseUp={onSwipeEnd} onTouchEnd={onSwipeEnd} onMouseLeave={onSwipeEnd}>
                            {isLoading ? (
                                <>
                                    <div className="chat-hub-bubble-wrapper other-msg"><div className="skeleton skeleton-bubble" style={{ width: '220px', height: '60px' }}></div></div>
                                    <div className="chat-hub-bubble-wrapper my-msg"><div className="skeleton skeleton-bubble" style={{ width: '300px', height: '80px' }}></div></div>
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
                                    const transformStyle = { transform: `translateX(${swipeOffsets[chat._id] || 0}px)` };
                                    const renderedReactions = chat.reactions ? Array.from(new Set(Object.values(chat.reactions))) : [];
                                    const isRead = chat.recipientEmail === 'all' ? (chat.readBy && chat.readBy.length > 1) : (chat.readBy && chat.readBy.includes(chat.recipientEmail));
                                    
                                    const chatDate = chat.createdAt ? new Date(chat.createdAt).toDateString() : '';
                                    const prevChatDate = idx > 0 && filteredChats[idx - 1].createdAt ? new Date(filteredChats[idx - 1].createdAt).toDateString() : '';
                                    const showDateBadge = chatDate && chatDate !== prevChatDate;

                                    return (
                                        <React.Fragment key={chat._id || idx}>
                                            {showDateBadge && (
                                                <div className="chat-date-wrapper pop-in">
                                                    <span className="chat-date-badge">{formatChatDate(chat.createdAt)}</span>
                                                </div>
                                            )}

                                            <div id={`chat-${chat._id}`} className={`chat-hub-bubble-wrapper ${isMe ? 'my-msg' : 'other-msg'} ${isPoll ? 'poll-msg-wrapper' : ''}`} onMouseDown={(e) => onSwipeStart(e, chat._id)} onTouchStart={(e) => onSwipeStart(e, chat._id)} onContextMenu={(e) => handleRightClick(e, chat)} style={transformStyle}>
                                                {!isMe && !isPoll && selectedRecipient === 'all' && <span className="chat-hub-sender-label">{chat.senderName}</span>}
                                                <div className={`chat-hub-bubble ${isPoll ? 'poll-bubble-whatsapp' : (isMe ? 'bubble-mine' : 'bubble-theirs')}`}>

                                                    <div className="chat-hub-text">{renderMessageContent(chat)}</div>

                                                    <div className="chat-hub-bubble-footer">
                                                        {chat.isPinned && <Pin size={10} style={{ marginRight: '4px' }} />}
                                                        <span className="chat-hub-timestamp">
                                                            {chat.createdAt ? new Date(chat.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : chat.timestamp}
                                                        </span>
                                                        {isMe && chat.message !== '[DELETED]' && (
                                                            <span className={`read-receipt ${isRead ? 'read' : 'unread'}`}><CheckCheck size={14} /></span>
                                                        )}
                                                    </div>

                                                    {renderedReactions.length > 0 && (
                                                        <div className="chat-reaction-badge pop-in">
                                                            {renderedReactions.join(' ')}
                                                            {Object.keys(chat.reactions).length > 1 && <span className="reaction-count">{Object.keys(chat.reactions).length}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={(e) => handleSendMessage(e)} className="chat-hub-input-form">
                            <div className="chat-attach-container">
                                <button type="button" className="chat-attach-trigger-btn" onClick={() => setShowAttachMenu(!showAttachMenu)}><Plus size={22} /></button>
                                {showAttachMenu && (
                                    <div className="chat-upside-dropdown pop-in">
                                        <button type="button" onClick={() => triggerFileInput('video')}><Video size={16} color="#ef4444" /> Videos</button>
                                        <button type="button" onClick={() => triggerFileInput('image')}><Image size={16} color="#3b82f6" /> Photos</button>
                                        <button type="button" onClick={() => triggerFileInput('file')}><FileText size={16} color="#f59e0b" /> Files</button>
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
                                            <span className="replying-text">{replyingTo.message.startsWith('[POLL') ? '📊 Poll' : replyingTo.message.startsWith('[IMG') ? '🖼️ Image' : replyingTo.message.substring(0, 50)}</span>
                                        </div>
                                        <button type="button" className="close-reply-btn" onClick={() => setReplyingTo(null)}><X size={16} /></button>
                                    </div>
                                )}

                                {attachments.length > 0 && (
                                    <div className="chat-attachment-gallery pop-in">
                                        {attachments.map((att, index) => (
                                            <div key={index} className="chat-attachment-item">
                                                <button type="button" className="remove-attachment-btn hover-pop" onClick={() => removeAttachment(index)}><X size={14} /></button>
                                                {att.type === 'image' && <img src={att.previewUrl} alt="preview" />}
                                                {att.type === 'video' && <video src={att.previewUrl} />}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <input type="text" placeholder="Message" value={messageText} onChange={(e) => setMessageText(e.target.value)} className="chat-hub-text-input" disabled={isUploading} autoFocus={!!replyingTo} />
                            </div>

                            <button type="submit" className="chat-hub-send-btn" disabled={(!messageText.trim() && attachments.length === 0) || isUploading}>
                                {isUploading ? <Sparkles size={18} className="pulse-anim" /> : <Send size={18} style={{ transform: 'translateX(-1px) translateY(1px)' }} />}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* --- IMAGE PREVIEW MODAL (LIGHTBOX) --- */}
            {previewModal.visible && (
                <div className="lightbox-overlay fade-in" onClick={() => setPreviewModal({ visible: false, images: [], currentIndex: 0 })}>
                    <div className="lightbox-header">
                        <span className="lightbox-counter">{previewModal.currentIndex + 1} / {previewModal.images.length}</span>
                        <button className="lightbox-close hover-pop" onClick={() => setPreviewModal({ visible: false, images: [], currentIndex: 0 })}><X size={28} color="white" /></button>
                    </div>
                    
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        {previewModal.images.length > 1 && (
                            <button 
                                className="lightbox-nav prev hover-pop" 
                                onClick={(e) => { e.stopPropagation(); setPreviewModal(p => ({ ...p, currentIndex: p.currentIndex === 0 ? p.images.length - 1 : p.currentIndex - 1 })); }}
                            >
                                <ChevronLeft size={36} color="white" />
                            </button>
                        )}
                        
                        <img src={previewModal.images[previewModal.currentIndex]} alt="fullscreen preview" className="lightbox-main-img" />
                        
                        {previewModal.images.length > 1 && (
                            <button 
                                className="lightbox-nav next hover-pop" 
                                onClick={(e) => { e.stopPropagation(); setPreviewModal(p => ({ ...p, currentIndex: (p.currentIndex + 1) % p.images.length })); }}
                            >
                                <ChevronRight size={36} color="white" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {contextMenu.visible && (
                <div className="custom-context-menu pop-in" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={(e) => e.stopPropagation()}>
                    <div className="context-menu-reactions">
                        {['👍', '❤️', '😂', '😮', '😢', '👏'].map(emoji => (
                            <button key={emoji} onClick={() => handleMenuReact(emoji)} className="reaction-btn">{emoji}</button>
                        ))}
                    </div>
                    <div className="context-menu-actions">
                        <button onClick={handleMenuReply}>Reply</button>
                        <button onClick={handleMenuPin}>{contextMenu.chat?.isPinned ? 'Unpin' : 'Pin'}</button>
                        <button onClick={handleMenuCopy}>Copy</button>
                        <button onClick={handleMenuDelete} className="context-menu-danger">Delete</button>
                    </div>
                </div>
            )}
        </div>
    );
}