const { GoogleGenerativeAI } = require("@google/generative-ai");

const getGenAI = () => {
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

async function generateStudyPlan(courseTitle, videoTitles, classesPerWeek, totalVideos) {
    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const totalWeeks = Math.ceil(totalVideos / classesPerWeek) || 1;

        const prompt = `
        You are an expert learning platform assistant determining a strict schedule for a student. 
        Course Title: "${courseTitle}"
        Total Videos: ${totalVideos}
        Curriculum Context (Video Titles): ${videoTitles.slice(0, 50).join(', ')}
        
        The student can commit to exactly ${classesPerWeek} classes per week.
        You MUST divide this curriculum into a structured weekly plan across exactly ${totalWeeks} weeks.
        
        ### Assignment Rules:
        - Each week must have exactly ${classesPerWeek} tasks.
        - **DSA Courses**: Every task MUST be a real-world LeetCode problem or a specific coding challenge. You MUST provide a valid link (e.g., https://leetcode.com/problems/binary-tree-level-order-traversal).
        - **Web Dev Courses**: Every task MUST be a practical coding project, a mini-challenge, or a link to specific MDN documentation (e.g., https://developer.mozilla.org/en-US/docs/Web/CSS/flexbox).
        - **Consistency**: Tasks should align logically with the video titles provided.
        - **Solved Stats**: Estimate realistic usage (e.g., "1.2M solved" or "High priority").
        
        ### Response Format:
        Respond ONLY with a raw JSON array of objects. Do NOT include any markdown formatting or dialogue.
        
        [
          {
            "week": 1,
            "topic": "Fundamentals of [Topic]",
            "tasks": [
              {
                "title": "Task Name",
                "description": "Specific 1-2 sentence instruction on what to build or solve.",
                "type": "dsa" or "webdev" or "general",
                "difficulty": "Easy" or "Medium" or "Hard",
                "stats": "e.g. 500k solved",
                "link": "https://leetcode.com/... or https://developer.mozilla.org/..."
              }
            ]
          }
        ]
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let plan = [];
        try {
            let cleanJson = responseText.replace(/```json\n?/ig, '').replace(/```\n?/g, '').trim();
            const startIndex = cleanJson.indexOf('[');
            const endIndex = cleanJson.lastIndexOf(']');
            if(startIndex !== -1 && endIndex !== -1) {
                cleanJson = cleanJson.substring(startIndex, endIndex + 1);
            }
            
            plan = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Failed to parse Gemini output as JSON", e);
            console.log("Raw output was:", responseText);
            
            // Fallback plan
            plan = [{ 
                week: 1, 
                topic: 'Introduction', 
                tasks: [{
                    title: "Watch the first video",
                    description: "Get started with the course",
                    type: "general",
                    difficulty: "N/A",
                    stats: "0",
                    link: "#"
                }]
            }];
        }

        return plan;
    } catch (error) {
        console.error("Gemini API Error:", error);
        return [{ 
             week: 1, 
             topic: 'Introduction', 
             tasks: [{
                 title: "Watch the first video",
                 description: "Get started with the course",
                 type: "general",
                 difficulty: "N/A",
                 stats: "0",
                 link: "#"
             }]
         }]; // Fallback
    }
}

async function generateNotesFromTranscript(transcript) {
    try {
         const genAI = getGenAI();
         const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
         const prompt = `Summarize the following transcript into organized study notes with clear headings and bullet points:\n\n${transcript}`;
         const result = await model.generateContent(prompt);
         return result.response.text();
    } catch (error) {
         console.error("Gemini Note Gen Error:", error);
         return "Failed to generate notes.";
    }
}

async function generateVideoNotes(courseTitle, videoTitle, videoIndex, totalVideos, transcript = "") {
    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `
You are an expert programming tutor creating detailed, high-quality study notes for a developer learning from a YouTube video.

Course Title: "${courseTitle}"
Current Video (${videoIndex + 1}/${totalVideos}): "${videoTitle}"

${transcript ? `### Transcript Context:\n${transcript}\n` : ''}
### Requirements:
1. **Depth**: Generate at least 300-500 words of deeply technical and structured notes.
2. **Overview**: Explain the concept, its significance, and real-world application.
3. **Key Concepts**: Minimum 5 bullet points with detailed explanations.
4. **Implementation & Code**: Provide 1-2 robust code examples (Python/JS/C++ as appropriate) in Markdown code blocks. Include pseudocode if necessary.
5. **How it Works**: A logical step-by-step breakdown of the underlying logic or algorithm.
6. **Common Patterns & Gotchas**: 3-4 patterns or edge cases developers should know.
7. **Interview Prep**: 3-4 potential interview questions and brief answer talking points.
8. **Quick Reference**: A concise summary snippet or formula.

Format the response in clean, professional Markdown with clear headings (H2/H3). Use bolding and lists for readability.
        `;
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Gemini Note Gen Error:", error);
        return `# ${videoTitle}\n\nNotes generation failed. Please try again.`;
    }
}

async function askChatbot(courseTitle, videoTitle, userMessage, history = []) {
    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Build conversation history for context
        // Exclude the current userMessage from history to avoid double-sending
        const filteredHistory = history.filter(m => m.content !== userMessage).slice(-6);
        const historyText = filteredHistory.map(m =>
            `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`
        ).join('\n');

        const prompt = `You are a helpful and concise programming tutor assistant for the LearnXLogic platform.
The student is currently watching a video titled "${videoTitle}" from the course "${courseTitle}".
Answer questions related to this topic in a clear, developer-friendly way. Use code examples when helpful.
Keep answers focused and under 200 words unless more detail is clearly needed.

${historyText ? `Conversation so far:\n${historyText}\n\n` : ''}Student: ${userMessage}
Tutor:`;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("Chatbot Error:", error);
        return "Sorry, I'm having trouble responding right now. Please try again in a moment.";
    }
}

async function generateVideoTasks(courseTitle, videoTitle, transcript = "") {
    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Use the provided transcript, or fallback to video context if not provided
        const finalTranscript = transcript || `Course: "${courseTitle}". Video: "${videoTitle}".`;

        const prompt = `
You are a strict programming task generator.

Your job is to generate tasks from the given YouTube transcript.

⚠️ VERY IMPORTANT RULES:

* DO NOT summarize the video
* DO NOT explain concepts
* DO NOT give notes
* ONLY generate tasks
* Output must NOT be empty

STEP 1: Identify the topic of the transcript.

STEP 2: Based on topic:

A. ✅ If the video is about Data Structures & Algorithms (DSA):
Generate EXACTLY 3 coding problems.

For EACH problem include:
* Title
* Problem Statement (as the description field)
* Difficulty (Easy / Medium / Hard)
* LeetCode Link — provide the REAL closest matching LeetCode URL: https://leetcode.com/problems/{problem-name}

B. 🌐 If the video is about Web Development:
Generate EXACTLY 1 project.

For the project description include:
* Features list
* Tech stack
* Step-by-step tasks
* Bonus challenge

C. ❓ If topic is unclear:
* Generate 3 relevant general programming tasks (NO LeetCode links, keep leetcode_link as "")

⚠️ OUTPUT FORMAT — respond ONLY with raw JSON, no markdown fences, no extra text:
{
  "type": "dsa",
  "tasks": [
    {
      "title": "...",
      "description": "...",
      "difficulty": "Easy",
      "leetcode_link": "https://leetcode.com/problems/..."
    }
  ]
}

IMPORTANT:
* "leetcode_link" MUST be a real URL ONLY when type = "dsa"
* For type = "webdev" or "general", set leetcode_link to ""
* difficulty field is REQUIRED for every task

Transcript:
${finalTranscript}
        `;

        const result = await model.generateContent(prompt);
        const raw = result.response.text();

        // Strip markdown fences if present
        let clean = raw.replace(/```json\n?/ig, '').replace(/```\n?/g, '').trim();
        const start = clean.indexOf('{');
        const end = clean.lastIndexOf('}');
        if (start !== -1 && end !== -1) clean = clean.substring(start, end + 1);

        const parsed = JSON.parse(clean);

        // Attach the type to each task so the frontend can use it
        const taskType = parsed.type || 'general';
        const tasks = Array.isArray(parsed.tasks) ? parsed.tasks.map(t => ({
            ...t,
            type: taskType,
            leetcode_link: taskType === 'dsa' ? (t.leetcode_link || '') : ''
        })) : [];

        return tasks;
    } catch (error) {
        console.error("Task Generation Error:", error);
        return [];
    }
}

module.exports = { generateStudyPlan, generateNotesFromTranscript, generateVideoNotes, askChatbot, generateVideoTasks };
