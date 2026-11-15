const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Team } = require('../models'); // Adjust path to your models
const router = express.Router();

// In-memory store for IP-based rate limiting
const loginRateLimits = new Map(); 

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const ip = req.ip || req.connection.remoteAddress;

        // 1. Check if IP is currently blocked
        const ipRecord = loginRateLimits.get(ip) || { attempts: 0, lockUntil: 0 };
        if (ipRecord.lockUntil > Date.now()) {
            const minutesLeft = Math.ceil((ipRecord.lockUntil - Date.now()) / 60000);
            return res.status(429).json({ 
                success: false, 
                message: `IP blocked due to too many failed attempts. Try again in ${minutesLeft} minutes.` 
            });
        }

        const user = await Team.findOne({ email });

        // 2. Validate Credentials
        if (!user || !(await bcrypt.compare(password, user.password))) {
            ipRecord.attempts += 1;
            
            // Block IP on 5th failed attempt
            if (ipRecord.attempts >= 5) {
                ipRecord.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minute lock
            }
            
            loginRateLimits.set(ip, ipRecord);

            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password.', 
                attempts: ipRecord.attempts 
            });
        }

        // 3. SUCCESSFUL LOGIN: Reset the IP rate limit entirely
        loginRateLimits.delete(ip);

        // 4. Generate Token & Return User
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role }, 
            process.env.JWT_SECRET || 'fallback_secret', 
            { expiresIn: '7d' }
        );

        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({ success: true, token, user: userResponse });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

module.exports = router;