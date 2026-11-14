const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configure Multer Storage
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/'); // Save files in the Backend/uploads folder
    },
    filename(req, file, cb) {
        // Create a unique filename: timestamp-originalName
        cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
    }
});

const upload = multer({ storage });

// POST /api/upload - Expects a form-data field named 'image'
router.post('/', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    // Return the path so the frontend can save it in the database (e.g., /uploads/123-img.jpg)
    res.json({ imageUrl: `/${req.file.path.replace(/\\/g, '/')}` });
});

module.exports = router;