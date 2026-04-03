const { askChatbot } = require('../utils/geminiHelper');
const { askOpenAIChatbot } = require('../utils/openaiHelper');

// @desc    General-purpose Ask AI endpoint (no course context required)
// @route   POST /api/ai/ask
// @access  Private
const askGeneral = async (req, res, next) => {
    try {
        const { message, history, provider } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ success: false, message: 'Please provide a message.' });
        }

        let reply = '';
        if (provider === 'openai') {
            reply = await askOpenAIChatbot(
                'General Learning',
                'general programming and computer science topics',
                message.trim(),
                Array.isArray(history) ? history : []
            );
        } else {
            // Default: Gemini
            reply = await askChatbot(
                'General Learning',
                'general programming and computer science topics',
                message.trim(),
                Array.isArray(history) ? history : []
            );
        }

        res.status(200).json({ success: true, data: reply });
    } catch (error) {
        next(error);
    }
};

module.exports = { askGeneral };
