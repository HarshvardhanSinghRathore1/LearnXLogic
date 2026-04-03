const express = require('express');
const { register, login, getMe, updateSchedule, logActivity } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/schedule', protect, updateSchedule);
router.post('/activity', protect, logActivity);

module.exports = router;
