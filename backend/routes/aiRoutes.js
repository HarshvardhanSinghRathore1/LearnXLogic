const express = require('express');
const { askGeneral } = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// POST /api/ai/ask — General purpose Ask AI (no course needed)
router.post('/ask', protect, askGeneral);

module.exports = router;
