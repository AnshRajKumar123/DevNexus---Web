const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Team } = require('../models');

const router = express.Router();

// Configure Multer Storage
const storage = multer.diskStorage({
    destination(req, file, cb) {
        let subFolder = 'docChat'; // Fallback folder

        // Dynamically route files to proper subfolders
        if (req.body.isProfile === 'true') {
            subFolder = 'profiles';
        } else if (file.mimetype.startsWith('image/')) {
            subFolder = 'imageChat';
        } else if (file.mimetype.startsWith('video/')) {
            subFolder = 'videoChat';
        } else if (file.mimetype === 'application/pdf') {
            subFolder = 'pdfChat';
        }

        const uploadDir = path.join(__dirname, '../../uploads', subFolder);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        req.savedSubFolder = subFolder; // Save for the response
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        const cleanName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
        cb(null, cleanName);
    }
});

const upload = multer({ storage });

// POST /api/upload
router.post('/', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const userId = req.body.userId;
        const subFolder = req.savedSubFolder || 'docChat';

        // Delete old profile picture ONLY if it's a profile update
        if (userId && req.body.isProfile === 'true') {
            const user = await Team.findById(userId);
            if (user && user.imgUrl && user.imgUrl.startsWith('/uploads/')) {
                const oldFilePath = path.join(__dirname, '../..', user.imgUrl);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
        }

        // Return path including subfolder
        res.json({ imageUrl: `/uploads/${subFolder}/${req.file.filename}` });
    } catch (error) {
        console.error('Error handling upload:', error);
        res.status(500).json({ message: 'Server error during upload' });
    }
});

module.exports = router;