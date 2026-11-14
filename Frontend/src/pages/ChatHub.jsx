import React, { useState, useEffect, useRef } from 'react';
import { Send, ShieldCheck, Lock, Users, Sparkles, MessageSquareCode, ArrowLeft, Plus, Video, Image, FileText, File, BarChart2, X, Check, Download, CheckCircle2, Circle } from 'lucide-react';
import { useData } from '../context/DataContext';
import '../styles/ChatHub.css';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

export default function ChatHub() {
    const { currentUser, team = [] } = useData();
    const [chats, setChats] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [selectedRecipient, setSelectedRecipient] = useState('all');
    const [mobileChatOpen, setMobileChatOpen] = useState(false);
    
    // Attachment & Modal states
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [showPollModal, setShowPollModal] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [allowMultiple, setAllowMultiple] = useState(false);
    
    // View Votes Modal State
    const [viewVotesPoll, setViewVotesPoll] = useState(null);
    const [localVotes, setLocalVotes] = useState({});

    // File Preview States
    const fileInputRef = useRef(null);
    const [attachments, setAttachments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    // --- SWIPE TO REPLY STATE ---
    const [replyingTo, setReplyingTo] = useState(null); // Stores the chat object being replied to
    const [swipeOffsets, setSwipeOffsets] = useState({}); // Tracks swipe X distance per chat _id
    const swipeStartX = useRef(null);
    const swipeTargetId = useRef(null);

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
        if (attachments.length + newFiles.length > 10) {
            alert('You can only upload up to 10 files at once.');
            return;
        }
        const newAttachments = newFiles.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file),
            type: file.type.startsWith('image/') ? 'image' : 
                  file.type.startsWith('video/') ? 'video' : 'document'
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
                const response = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    body: formData,
                });
                if (response.ok) {
                    const data = await response.json();
                    uploadedUrls.push({ url: data.imageUrl, type: att.type, name: att.file.name });
                }
            } catch (error) {
                console.error("File upload failed:", error);
            }
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

        // If replying to a message, embed the replied context into the text payload
        if (replyingTo && !customMessage) {
            // Encode replied text to avoid breaking our simple parsing logic
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
            const res = await fetch(`${API_URL}/chats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                if (!customMessage) setMessageText('');
                clearAttachments();
                setReplyingTo(null); // Clear reply state
                setShowAttachMenu(false);
                fetchChats();
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setIsUploading(false);
        }
    };

    // --- SWIPE TO REPLY HANDLERS ---
    const onSwipeStart = (e, chatId) => {
        // Support touch or mouse drag
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        swipeStartX.current = clientX;
        swipeTargetId.current = chatId;
    };

    const onSwipeMove = (e) => {
        if (!swipeStartX.current || !swipeTargetId.current) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let deltaX = clientX - swipeStartX.current;
        
        // Only allow swiping to the right (deltaX > 0) up to a max of 70px
        if (deltaX > 0) {
            if (deltaX > 70) deltaX = 70;
            setSwipeOffsets({ ...swipeOffsets, [swipeTargetId.current]: deltaX });
        }
    };

    const onSwipeEnd = () => {
        if (swipeTargetId.current) {
            const finalOffset = swipeOffsets[swipeTargetId.current] || 0;
            // If dragged past threshold (50px), trigger reply mode
            if (finalOffset > 50) {
                const chatToReply = chats.find(c => c._id === swipeTargetId.current);
                if (chatToReply) setReplyingTo(chatToReply);
            }
            
            // Snap back to 0
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
        if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) {
            alert('Please enter a question and at least 2 options.');
            return;
        }
        const validOptions = pollOptions.filter(o => o.trim()).map(opt => ({
            text: opt,
            votes: [] 
        }));
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
                if (currentVotes.includes(optionIndex)) {
                    return { ...prev, [chatId]: currentVotes.filter(idx => idx !== optionIndex) };
                } else {
                    return { ...prev, [chatId]: [...currentVotes, optionIndex] };
                }
            } else {
                return { ...prev, [chatId]: [optionIndex] };
            }
        });
    };

    const getAvatarSrc = (user) => {
        return user.imgUrl 
            ? (user.imgUrl.startsWith('http') ? user.imgUrl : `${import.meta.env.VITE_API_URL}${user.imgUrl}`)
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e5e7eb&color=374151&bold=true`;
    };

    const renderMessageContent = (chat) => {
        if (!chat.message) return null;
        let text = chat.message;

        // Render JSON Poll UI
        if (text.startsWith('[POLL_JSON]:')) {
            try {
                const poll = JSON.parse(text.substring(12));
                const userSelectedOptions = localVotes[chat._id] || [];
                const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0) + (userSelectedOptions.length > 0 ? 1 : 0);

                return (
                    <div className="custom-poll-bubble">
                        <div className="poll-question-header">
                            <h4>{poll.question}</h4>
                            <span className="poll-subtitle">
                                <CheckCircle2 size={12}/> {poll.allowMultiple ? 'Select multiple' : 'Select one'}
                            </span>
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
            } catch (e) {
                return <span>[Invalid Poll Data]</span>;
            }
        }
        
        const lines = text.split('\n');
        return lines.map((line, idx) => {
            // Render Embedded Reply Box Block
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
                        <a href={url} download target="_blank" rel="noreferrer" className="image-download-overlay" title="Download Image"><Download size={16} /></a>
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
                        <FileText size={18} /> {name} <Download size={14} className="download-icon" />
                    </a>
                );
            }
            return <span key={idx}>{line}<br /></span>;
        });
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
                            {team.filter(t => t.email !== currentUser?.email).map(member => (
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
                            </div>
                        </div>

                        <div 
                            className="chat-hub-messages-scroll"
                            onMouseMove={onSwipeMove}
                            onTouchMove={onSwipeMove}
                            onMouseUp={onSwipeEnd}
                            onTouchEnd={onSwipeEnd}
                            onMouseLeave={onSwipeEnd}
                        >
                            {filteredChats.length === 0 ? (
                                <div className="chat-hub-empty-state">
                                    <Sparkles size={36} color="#94a3b8" />
                                    <h3>No encrypted messages yet</h3>
                                    <p>Send a secure message to start chatting!</p>
                                </div>
                            ) : (
                                filteredChats.map((chat, idx) => {
                                    const isMe = chat.senderEmail === currentUser?.email;
                                    const isPoll = chat.message && chat.message.startsWith('[POLL_JSON]:');
                                    
                                    // Swipe transformation calculation
                                    const offset = swipeOffsets[chat._id] || 0;
                                    const transformStyle = { transform: `translateX(${offset}px)` };

                                    return (
                                        <div 
                                            key={chat._id || idx} 
                                            className={`chat-hub-bubble-wrapper ${isMe ? 'my-msg' : 'other-msg'} ${isPoll ? 'poll-msg-wrapper' : ''}`}
                                            onMouseDown={(e) => onSwipeStart(e, chat._id)}
                                            onTouchStart={(e) => onSwipeStart(e, chat._id)}
                                            style={transformStyle}
                                        >
                                            {!isMe && !isPoll && <span className="chat-hub-sender-label">{chat.senderName}</span>}
                                            <div className={`chat-hub-bubble ${isPoll ? 'poll-bubble-whatsapp' : (isMe ? 'bubble-mine' : 'bubble-theirs')}`}>
                                                <div className="chat-hub-text">{renderMessageContent(chat)}</div>
                                                <div className="chat-hub-bubble-footer" style={isPoll ? { color: '#64748b', marginTop: '0.2rem' } : {}}>
                                                    <span className="chat-hub-lock-icon" title="Encrypted"><Lock size={10} /></span>
                                                    <span className="chat-hub-timestamp">{chat.timestamp}</span>
                                                </div>
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
                                {/* Replied Message Preview Overlay */}
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

                                {/* Attachments Gallery */}
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

            {/* --- View Votes Modal Popup --- */}
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
                                    optionVotes.push({
                                        user: currentUser.name,
                                        avatar: getAvatarSrc(currentUser),
                                        time: 'Just now'
                                    });
                                }

                                return (
                                    <div key={i} className="poll-votes-option-group">
                                        <div className="poll-votes-option-header">
                                            <h4>{opt.text}</h4>
                                            <span className="vote-count-text">
                                                {optionVotes.length} {optionVotes.length === 1 ? 'vote' : 'votes'}
                                            </span>
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

            {/* --- Create Poll Modal Popup --- */}
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