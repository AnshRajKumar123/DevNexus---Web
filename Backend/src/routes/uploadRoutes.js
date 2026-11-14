const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Configure Multer Storage with duplicate replacement
const storage = multer.diskStorage({
    destination(req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        // Keep clean original filename or timestamped name. To replace duplicates by name:
        const cleanName = file.originalname.replace(/\s+/g, '-');
        const filePath = path.join(__dirname, '../../uploads', cleanName);

        // If file already exists in uploads folder, delete it to replace with the new one
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        cb(null, cleanName);
    }
});

const upload = multer({ storage });

// POST /api/upload
router.post('/', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

module.exports = router;