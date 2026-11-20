const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// GET all notifications for a user (excludes ones they cleared)
router.get('/', async (req, res) => {
    try {
        const { email } = req.query;
        const query = email ? { deletedFor: { $ne: email } } : {};
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// POST create a new notification
router.post('/', async (req, res) => {
    try {
        const { type, title, message, createdBy, path } = req.body;
        const notification = new Notification({
            type: type || 'general',
            title,
            message: message || '',
            createdBy: createdBy || 'Team Member',
            path: path || '/',
            readBy: [],
            deletedFor: []
        });
        const saved = await notification.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create notification' });
    }
});

// PUT mark a single notification as read for a user
router.put('/:id/read', async (req, res) => {
    try {
        const { userEmail } = req.body;
        const updated = await Notification.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { readBy: userEmail } },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// PUT mark all notifications as read for a user
router.put('/read-all', async (req, res) => {
    try {
        const { userEmail } = req.body;
        await Notification.updateMany(
            { deletedFor: { $ne: userEmail } },
            { $addToSet: { readBy: userEmail } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

// PUT hide/delete a single notification for a user
router.put('/:id/delete', async (req, res) => {
    try {
        const { userEmail } = req.body;
        if (userEmail) {
            await Notification.findByIdAndUpdate(req.params.id, {
                $addToSet: { deletedFor: userEmail }
            });
        } else {
            await Notification.findByIdAndDelete(req.params.id);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// PUT clear all notifications for a user
router.put('/clear-all', async (req, res) => {
    try {
        const { userEmail } = req.body;
        if (userEmail) {
            await Notification.updateMany(
                {},
                { $addToSet: { deletedFor: userEmail } }
            );
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
});

module.exports = router;