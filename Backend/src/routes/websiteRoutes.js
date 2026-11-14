const express = require('express');
const { Website } = require('../models');
const router = express.Router();

router.get('/', async (req, res) => {
    try { 
        const websites = await Website.find().sort({ createdAt: -1 }); 
        res.json(websites); 
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
    try { 
        const newWebsite = await Website.create(req.body); 
        res.status(201).json(newWebsite); 
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
    try { 
        const updated = await Website.findByIdAndUpdate(req.params.id, req.body, { new: true }); 
        res.json(updated); 
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try { 
        await Website.findByIdAndDelete(req.params.id); 
        res.json({ message: 'Deleted' }); 
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;