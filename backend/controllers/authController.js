const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      return res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration API Error:', error);
    return res.status(500).json({ success: false, message: 'Server Error during signup. Is MongoDB connected?', error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Study Schedule
// @route   PUT /api/auth/schedule
// @access  Private
const updateSchedule = async (req, res, next) => {
  try {
    const { schedule } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (schedule && Array.isArray(schedule)) {
        user.schedule = schedule;
    }
    user.hasSetupSchedule = true;

    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Log User Study Activity
// @route   POST /api/auth/activity
// @access  Private
const logActivity = async (req, res, next) => {
    try {
        const { minutes, videoCompleted, date } = req.body;
        const today = date || new Date().toISOString().split('T')[0];

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (!user.activityLogs) user.activityLogs = [];

        let log = user.activityLogs.find(l => l.date === today);
        if (log) {
            log.minutes += (minutes || 0);
            if (videoCompleted) log.videosCompleted += 1;
        } else {
            user.activityLogs.push({
                date: today,
                minutes: minutes || 0,
                videosCompleted: videoCompleted ? 1 : 0
            });
        }

        // Maintain log history (last 60 days)
        if (user.activityLogs.length > 60) {
            user.activityLogs = user.activityLogs.slice(-60);
        }

        await user.save();
        res.status(200).json({ success: true, data: user.activityLogs });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, getMe, updateSchedule, logActivity };
