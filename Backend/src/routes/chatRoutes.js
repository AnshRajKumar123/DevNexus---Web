const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const ChatSchema = new mongoose.Schema({
    senderName: { type: String, required: true },
    senderEmail: { type: String, required: true },
    recipientEmail: { type: String, required: true },
    message: { type: String, required: true },
    isEncrypted: { type: Boolean, default: true },
    readBy: [{ type: String }], // Array of user emails who have read this message
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
        const payload = { ...req.body, readBy: [req.body.senderEmail] }; // Sender has read it by default
        const newChat = new Chat(payload);
        const saved = await newChat.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT: Mark unread messages as read for a specific user & channel/sender
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

module.exports = router;