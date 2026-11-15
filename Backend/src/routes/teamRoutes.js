const express = require('express');
const bcrypt = require('bcryptjs');
const { Team } = require('../models');
const router = express.Router();

// Get all team members
router.get('/', async (req, res) => {
    try {
        const teamMembers = await Team.find().select('-password');
        res.json(teamMembers);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching team' });
    }
});

// Add a team member
router.post('/', async (req, res) => {
    try {
        const { name, role, email, phone, imgUrl } = req.body;
        // Hash default password for new members
        const hashedPassword = await bcrypt.hash('devnexus2026', 10);
        
        const newMember = await Team.create({
            name,
            role,
            email,
            phone,
            imgUrl,
            password: hashedPassword,
            isSupremeAdmin: false
        });

        // Return without password
        const memberResponse = newMember.toObject();
        delete memberResponse.password;

        res.status(201).json(memberResponse);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Heartbeat Ping (Updates lastSeen timestamp)
router.put('/:email/ping', async (req, res) => {
    try {
        await Team.findOneAndUpdate(
            { email: req.params.email }, 
            { lastSeen: Date.now() }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- NEW: Save Push Notification Subscription ---
router.post('/:email/subscribe', async (req, res) => {
    try {
        // This dynamically adds the subscription object to the user's database document
        await Team.findOneAndUpdate(
            { email: req.params.email },
            { pushSubscription: req.body.subscription },
            { strict: false } // Ensures it saves even if you didn't define it in your Mongoose schema yet
        );
        res.status(200).json({ success: true, message: 'Push subscription saved securely.' });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ message: 'Failed to save push subscription' });
    }
});

// Delete a team member
router.delete('/:id', async (req, res) => {
    try {
        await Team.findByIdAndDelete(req.params.id);
        res.json({ message: 'Team member removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update profile
router.put('/:id', async (req, res) => {
    try {
        const updatedUser = await Team.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true }
        ).select('-password');
        
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;