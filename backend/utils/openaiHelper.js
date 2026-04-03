const OpenAI = require('openai');

const getOpenAI = () => {
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
};

/**
 * Chat with OpenAI Tutor
 * @param {string} courseTitle 
 * @param {string} videoTitle 
 * @param {string} userMessage 
 * @param {Array} history 
 */
async function askOpenAIChatbot(courseTitle, videoTitle, userMessage, history = []) {
    try {
        const client = getOpenAI();

        // Convert history to OpenAI's message format
        const messages = [
            {
                role: "system",
                content: `You are a helpful and concise programming tutor assistant for the LearnXLogic platform.
The student is currently watching a video titled "${videoTitle}" from the course "${courseTitle}".
Answer questions related to this topic in a clear, developer-friendly way. Use code examples when helpful.
Keep answers focused and under 200 words unless more detail is clearly needed.`
            }
        ];

        // Add history (limit to last 6 messages)
        history.slice(-6).forEach(m => {
            messages.push({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
            });
        });

        // Add current user message
        messages.push({ role: "user", content: userMessage });

        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 500,
            temperature: 0.7
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("OpenAI Chatbot Error:", error);
        return "Sorry, I'm having trouble with the OpenAI service right now. Please try again or switch to Gemini.";
    }
}

module.exports = { askOpenAIChatbot };
