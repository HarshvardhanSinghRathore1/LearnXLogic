const Course = require('../models/Course');
const { askChatbot } = require('../utils/geminiHelper');
const { askOpenAIChatbot } = require('../utils/openaiHelper');

// @desc    Ask the AI tutor chatbot a question about a course/video
// @route   POST /api/courses/:id/chat
// @access  Private
const chatWithTutor = async (req, res, next) => {
    try {
        const { message, videoTitle, history, provider } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ success: false, message: 'Please provide a message' });
        }

        const course = await Course.findOne({ _id: req.params.id, user: req.user.id });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        let reply = '';
        if (provider === 'openai') {
            reply = await askOpenAIChatbot(
                course.title,
                videoTitle || 'this video',
                message.trim(),
                Array.isArray(history) ? history : []
            );
        } else {
            // Default to Gemini
            reply = await askChatbot(
                course.title,
                videoTitle || 'this video',
                message.trim(),
                Array.isArray(history) ? history : []
            );
        }

        res.status(200).json({ success: true, data: reply });
    } catch (error) {
        next(error);
    }
};

module.exports = { chatWithTutor };
