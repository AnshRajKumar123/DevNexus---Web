const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { Team } = require('../models');
const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, 
    max: 3, 
    message: { message: 'Too many login attempts from this IP. You have been temporarily blocked for 30 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await Team.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Added `phone` to the response so it persists on login
        res.json({
            _id: user._id, 
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            imgUrl: user.imgUrl,
            isSupremeAdmin: user.isSupremeAdmin
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error during login' });
    }
});

module.exports = router;