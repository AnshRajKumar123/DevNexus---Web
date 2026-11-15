const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Team } = require('../models');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use memory storage so we don't write to Render's temporary disk
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const userId = req.body.userId;
        let folderName = 'devnexus/docChat';

        // Dynamically organize Cloudinary folders
        if (req.body.isProfile === 'true') {
            folderName = 'devnexus/profiles';
        } else if (req.file.mimetype.startsWith('image/')) {
            folderName = 'devnexus/imageChat';
        } else if (req.file.mimetype.startsWith('video/')) {
            folderName = 'devnexus/videoChat';
        } else if (req.file.mimetype === 'application/pdf') {
            folderName = 'devnexus/pdfChat';
        }

        // Determine correct resource type
        let resourceType = 'auto';
        if (req.file.mimetype.startsWith('video/')) resourceType = 'video';
        else if (!req.file.mimetype.startsWith('image/')) resourceType = 'raw';

        // Upload stream to Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: folderName, resource_type: resourceType },
            async (error, result) => {
                if (error) {
                    console.error('Cloudinary error:', error);
                    return res.status(500).json({ message: 'Cloudinary upload failed' });
                }

                // Delete old profile picture from Cloudinary (optional cleanup)
                if (userId && req.body.isProfile === 'true') {
                    const user = await Team.findById(userId);
                    if (user && user.imgUrl && user.imgUrl.includes('cloudinary.com')) {
                        // Advanced: You can extract the public_id here and delete the old image
                    }
                }

                // Return the secure, permanent Cloudinary URL
                res.json({ imageUrl: result.secure_url });
            }
        );

        uploadStream.end(req.file.buffer);
    } catch (error) {
        console.error('Error handling upload:', error);
        res.status(500).json({ message: 'Server error during upload' });
    }
});

module.exports = router;