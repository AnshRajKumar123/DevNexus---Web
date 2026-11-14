const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const ChatSchema = new mongoose.Schema({
    senderName: { type: String, required: true },
    senderEmail: { type: String, required: true },
    recipientEmail: { type: String, required: true },
    message: { type: String, required: true },
    attachments: { type: Array, default: [] },
    isEncrypted: { type: Boolean, default: true },
    readBy: [{ type: String }],
    deletedFor: [{ type: String }],
    isPinned: { type: Boolean, default: false }, // NEW: Pin tracker
    reactions: { type: Map, of: String, default: {} }, // NEW: Emoji tracker (UserEmail -> Emoji)
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
    } catch (err) {
        res.status(400).json({ message: err.message });
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

// NEW PUT: Toggle Emoji Reaction
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

// NEW PUT: Toggle Pinned Status
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

        if (chat.attachments && chat.attachments.length > 0) {
            chat.attachments.forEach(att => {
                if (att.url) {
                    const filePath = path.join(__dirname, '../..', att.url);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }
            });
        }
        chat.message = '[DELETED]';
        chat.attachments = [];
        await chat.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;