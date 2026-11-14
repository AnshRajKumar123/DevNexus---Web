const express = require('express');
const { Integration } = require('../models');
const router = express.Router();

// Get all connected integrations
router.get('/', async (req, res) => {
    try {
        const integrations = await Integration.find();
        res.json(integrations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Save or update an API integration
router.post('/', async (req, res) => {
    try {
        const { appName, apiKey, apiSecret, connectedBy } = req.body;
        const updated = await Integration.findOneAndUpdate(
            { appName },
            { apiKey, apiSecret, connectedBy, status: 'Connected', updatedAt: Date.now() },
            { new: true, upsert: true }
        );
        res.status(200).json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Disconnect / Delete integration
router.delete('/:appName', async (req, res) => {
    try {
        await Integration.findOneAndDelete({ appName: req.params.appName });
        res.json({ message: 'Integration disconnected' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;