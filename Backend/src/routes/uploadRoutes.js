const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Team } = require('../models');

const router = express.Router();

// Configure Multer Storage
const storage = multer.diskStorage({
    destination(req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
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

        // If a userId was passed, find the old image and delete it from the server
        if (userId) {
            const user = await Team.findById(userId);
            if (user && user.imgUrl && user.imgUrl.startsWith('/uploads/')) {
                const oldFilePath = path.join(__dirname, '../..', user.imgUrl);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath); // Delete previous image file
                }
            }
        }

        res.json({ imageUrl: `/uploads/${req.file.filename}` });
    } catch (error) {
        console.error('Error handling upload:', error);
        res.status(500).json({ message: 'Server error during upload' });
    }
});

module.exports = router;