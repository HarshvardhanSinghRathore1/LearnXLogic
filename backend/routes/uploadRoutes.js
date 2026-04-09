const express = require('express');
const multer  = require('multer');
const User    = require('../models/User');
const { protect } = require('../middlewares/authMiddleware');
const { storage } = require('../config/cloudinary');

const router = express.Router();

// Multer instance — stores directly to Cloudinary (no local disk)
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, webp, gif) are allowed.'));
    }
  },
});

// POST /upload-profile
// Protected — user must be logged in
router.post('/upload-profile', protect, (req, res) => {
  // ✅ FIX: Call multer in CALLBACK style so its errors are caught HERE
  // and always return JSON — never HTML.
  upload.single('profilePhoto')(req, res, async (err) => {
    // Handle multer-level errors (file type, size, Cloudinary connection, etc.)
    if (err) {
      console.error('Multer/Cloudinary error:', err.message);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed.',
      });
    }

    // No file attached
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please attach an image.',
      });
    }

    try {
      // multer-storage-cloudinary v4 puts the Cloudinary secure_url in req.file.path
      const photoUrl = req.file.path || req.file.secure_url;

      if (!photoUrl) {
        return res.status(500).json({
          success: false,
          message: 'Cloudinary did not return a URL. Check your Cloudinary credentials.',
        });
      }

      // Save URL to the user document in MongoDB
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { profilePhoto: photoUrl },
        { new: true, select: '-password' }
      );

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile photo uploaded successfully.',
        profilePhoto: photoUrl,
      });
    } catch (dbErr) {
      console.error('DB save error:', dbErr.message);
      return res.status(500).json({
        success: false,
        message: dbErr.message || 'Failed to save photo URL to database.',
      });
    }
  });
});

module.exports = router;
