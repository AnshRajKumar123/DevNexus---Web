const express = require('express');
const { Link } = require('../models');
const router = express.Router();

router.get('/', async (req, res) => {
    try { 
        const links = await Link.find().sort({ createdAt: -1 }); 
        res.json(links); 
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
    try { 
        const newLink = await Link.create(req.body); 
        res.status(201).json(newLink); 
    } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try { 
        await Link.findByIdAndDelete(req.params.id); 
        res.json({ message: 'Deleted' }); 
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;