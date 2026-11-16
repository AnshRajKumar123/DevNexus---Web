const express = require('express');
const mongoose = require('mongoose');
const { Team } = require('../models');
const router = express.Router();
const admin = require('firebase-admin');

const ChatSchema = new mongoose.Schema({
    senderName: { type: String, required: true },
    senderEmail: { type: String, required: true },
    recipientEmail: { type: String, required: true },
    message: { type: String, required: true },
    attachments: { type: Array, default: [] },
    isEncrypted: { type: Boolean, default: true },
    readBy: [{ type: String }],
    deletedFor: [{ type: String }],
    isPinned: { type: Boolean, default: false }, 
    reactions: { type: Map, of: String, default: {} }, 
    timestamp: { type: String, default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    createdAt: { type: Date, default: Date.now }
});

const Chat = mongoose.model('Chat', ChatSchema);

// GET: Fetch all team chat messages
router.get('/', async (req, res) => {
    try {
        const chats = await Chat.find().sort({ createdAt: 1 });
        res.json(chats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST: Send a new encrypted chat message
router.post('/', async (req, res) => {
    try {
        const payload = { ...req.body, readBy: [req.body.senderEmail] };
        const newChat = new Chat(payload);
        const saved = await newChat.save();
        
        res.status(201).json(saved);

        // --- FIREBASE PUSH NOTIFICATION DISPATCH ---
        const { senderName, senderEmail, recipientEmail, message } = req.body;
        
        let notificationBody = message;
        if (message.startsWith('[IMG')) notificationBody = '📷 Sent an image';
        else if (message.startsWith('[VID')) notificationBody = '🎥 Sent a video';
        else if (message.startsWith('[POLL')) notificationBody = '📊 Sent a poll';
        else if (message.startsWith('[FILE')) notificationBody = '📎 Sent a file';
        else if (message.length > 40) notificationBody = message.substring(0, 40) + '...';

        // Fetch sender's profile picture for the notification icon
        const senderUser = await Team.findOne({ email: senderEmail });
        let senderIcon = '/logo.png';
        if (senderUser && senderUser.imgUrl) {
            senderIcon = senderUser.imgUrl.startsWith('http') 
                ? senderUser.imgUrl 
                : `https://teamdashboard-bice.vercel.app${senderUser.imgUrl}`;
        }

        const appUrl = 'https://teamdashboard-bice.vercel.app';

        if (recipientEmail !== 'all') {
            const recipientUser = await Team.findOne({ email: recipientEmail });
            
            if (recipientUser && recipientUser.fcmToken) {
                const fcmPayload = {
                    token: recipientUser.fcmToken,
                    notification: {
                        title: senderName,
                        body: notificationBody,
                        image: senderIcon // Shows avatar as notification thumbnail/image
                    },
                    webpush: {
                        notification: {
                            icon: senderIcon, // Shows sender avatar as notification icon
                            click_action: `${appUrl}/chat`
                        }
                    }
                };
                try {
                    await admin.messaging().send(fcmPayload);
                } catch (pushError) {
                    console.error('Firebase DM Push Error:', pushError);
                }
            }
        } else {
            const allTeam = await Team.find({ email: { $ne: senderEmail } });
            const tokens = allTeam.filter(user => user.fcmToken).map(user => user.fcmToken);

            if (tokens.length > 0) {
                const fcmPayload = {
                    tokens: tokens,
                    notification: {
                        title: `${senderName} (Team Chat)`,
                        body: notificationBody,
                        image: senderIcon
                    },
                    webpush: {
                        notification: {
                            icon: senderIcon,
                            click_action: `${appUrl}/chat`
                        }
                    }
                };
                try {
                    await admin.messaging().sendEachForMulticast(fcmPayload);
                } catch (pushError) {
                    console.error('Firebase Broadcast Push Error:', pushError);
                }
            }
        }
    } catch (err) {
        if (!res.headersSent) {
            res.status(400).json({ message: err.message });
        }
    }
});

// PUT: Mark unread messages as read
router.put('/read', async (req, res) => {
    try {
        const { userEmail, recipientEmail } = req.body;
        if (recipientEmail === 'all') {
            await Chat.updateMany(
                { recipientEmail: 'all', readBy: { $ne: userEmail } },
                { $push: { readBy: userEmail } }
            );
        } else {
            await Chat.updateMany(
                { senderEmail: recipientEmail, recipientEmail: userEmail, readBy: { $ne: userEmail } },
                { $push: { readBy: userEmail } }
            );
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT: Toggle Emoji Reaction
router.put('/:id/react', async (req, res) => {
    try {
        const { userEmail, emoji } = req.body;
        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        
        if (!chat.reactions) chat.reactions = new Map();
        
        if (chat.reactions.get(userEmail) === emoji) {
            chat.reactions.delete(userEmail);
        } else {
            chat.reactions.set(userEmail, emoji);
        }
        
        await chat.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT: Toggle Pinned Status
router.put('/:id/pin', async (req, res) => {
    try {
        const { isPinned } = req.body;
        await Chat.findByIdAndUpdate(req.params.id, { isPinned });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT: "Delete for me"
router.put('/:id/deleteForMe', async (req, res) => {
    try {
        const { userEmail } = req.body;
        await Chat.findByIdAndUpdate(req.params.id, {
            $push: { deletedFor: userEmail }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE: "Delete for everyone"
router.delete('/:id', async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        chat.message = '[DELETED]';
        chat.attachments = [];
        await chat.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;