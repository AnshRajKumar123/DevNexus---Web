const express = require('express');
const { Inquiry } = require('../models');
const router = express.Router();

router.get('/', async (req, res) => {
    try { 
        const inquiries = await Inquiry.find().sort({ createdAt: -1 }); 
        res.json(inquiries); 
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
    try { 
        const newInquiry = await Inquiry.create(req.body); 
        res.status(201).json(newInquiry); 
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
    try { 
        const updated = await Inquiry.findByIdAndUpdate(req.params.id, req.body, { new: true }); 
        res.json(updated); 
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// Add this DELETE route so users can delete their inquiries from the profile page
router.delete('/:id', async (req, res) => {
    try { 
        await Inquiry.findByIdAndDelete(req.params.id); 
        res.json({ message: 'Inquiry Deleted' }); 
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;