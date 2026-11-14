const express = require('express');
const { Event } = require('../models');
const router = express.Router();

router.get('/', async (req, res) => {
    try { 
        const events = await Event.find().sort({ date: 1, time: 1 }); 
        res.json(events); 
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
    try { 
        const newEvent = await Event.create(req.body); 
        res.status(201).json(newEvent); 
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try { 
        await Event.findByIdAndDelete(req.params.id); 
        res.json({ message: 'Deleted' }); 
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;