const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const webpush = require('web-push'); // NEW: Import web-push
const { Team } = require('../models'); // NEW: Import Team to get subscriptions
const router = express.Router();

// --- NEW: Configure Web Push with VAPID keys ---
webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

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
        
        // Respond to the sender immediately so the UI feels fast
        res.status(201).json(saved);

        // --- NEW: Send Push Notification (Runs in the background) ---
        try {
            const { senderName, senderEmail, recipientEmail, message } = req.body;
            
            // Format the message preview for the push notification banner
            let notificationBody = message;
            if (message.startsWith('[IMG')) notificationBody = '📷 Sent an image';
            else if (message.startsWith('[VID')) notificationBody = '🎥 Sent a video';
            else if (message.startsWith('[POLL')) notificationBody = '📊 Sent a poll';
            else if (message.startsWith('[FILE')) notificationBody = '📎 Sent a file';
            else if (message.length > 40) notificationBody = message.substring(0, 40) + '...';

            if (recipientEmail !== 'all') {
                // Direct Message Notification
                const recipientUser = await Team.findOne({ email: recipientEmail });
                
                if (recipientUser && recipientUser.pushSubscription) {
                    const pushPayload = JSON.stringify({
                        senderName: senderName,
                        message: notificationBody,
                        senderAvatar: '/logo.png',
                        url: '/chat'
                    });
                    await webpush.sendNotification(recipientUser.pushSubscription, pushPayload);
                }
            } else {
                // Team Chat Broadcast (Notifies everyone except the sender)
                const allTeam = await Team.find({ email: { $ne: senderEmail } });
                
                const pushPromises = allTeam
                    .filter(user => user.pushSubscription) // Only target devices that have opted in
                    .map(user => {
                        const pushPayload = JSON.stringify({
                            senderName: `${senderName} (Team Chat)`,
                            message: notificationBody,
                            senderAvatar: '/logo.png',
                            url: '/chat'
                        });
                        return webpush.sendNotification(user.pushSubscription, pushPayload);
                    });
                
                await Promise.allSettled(pushPromises);
            }
        } catch (pushError) {
            console.error('Failed to send push notification:', pushError);
        }
        // ------------------------------------------------------------

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
        
        // If clicking the same emoji, remove it (toggle off)
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

        // Cloudinary cleanup logic can be added here later if needed
        chat.message = '[DELETED]';
        chat.attachments = [];
        await chat.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;