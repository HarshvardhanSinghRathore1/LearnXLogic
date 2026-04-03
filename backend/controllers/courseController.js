const Course = require('../models/Course');
const { fetchPlaylistDetails } = require('../utils/youtubeHelper');
const { generateStudyPlan, generateVideoNotes, generateVideoTasks } = require('../utils/geminiHelper');


// @desc    Preview a course before generating full AI plan
// @route   POST /api/courses/preview
// @access  Private
const previewCourse = async (req, res, next) => {
    try {
        const { playlistUrl } = req.body;
        if (!playlistUrl) return res.status(400).json({ success: false, message: 'Please provide a YouTube playlist URL' });

        const ytData = await fetchPlaylistDetails(playlistUrl);
        const totalVideos = Math.max(1, ytData.videos.length);
        const estimatedHours = Math.ceil((totalVideos * 15) / 60); // ~15 min per video

        // Weekly schedule calculation
        const userSchedule = req.user.schedule || [];
        const weeklyAvailability = userSchedule.reduce((acc, currentDay) => {
            if (!currentDay.active || !currentDay.timeSlots) return acc;
            const dayHours = currentDay.timeSlots.reduce((sum, slot) => sum + (Number(slot.hours) || 0), 0);
            return acc + dayHours;
        }, 0) || 1;
        
        // Suggest classes based on availability
        let suggestedClasses = Math.min(totalVideos, weeklyAvailability);
        if(suggestedClasses < 1) suggestedClasses = 1;

        res.status(200).json({
            success: true,
            data: {
                title: ytData.title,
                thumbnail: ytData.thumbnail,
                totalVideos,
                estimatedHours,
                weeklyAvailability,
                suggestedClasses
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add a new course from YouTube
// @route   POST /api/courses
// @access  Private
const addCourse = async (req, res, next) => {
    try {
        const { playlistUrl, classesPerWeek } = req.body;
        if (!playlistUrl) {
            return res.status(400).json({ success: false, message: 'Please provide a YouTube playlist URL' });
        }

        // 1. Fetch from YouTube
        const ytData = await fetchPlaylistDetails(playlistUrl);
        
        // Check if user already added this course
        const existingCourse = await Course.findOne({ 
            user: req.user.id, 
            playlistId: ytData.playlistId 
        });

        if (existingCourse) {
            return res.status(400).json({ success: false, message: 'You have already added this course.' });
        }

        // 2. Generate Study Plan via Gemini
        const videoTitles = ytData.videos.map(v => v.title);
        const cpw = parseInt(classesPerWeek) || 3;
        const studyPlan = await generateStudyPlan(ytData.title, videoTitles, cpw, ytData.videos.length);

        // 3. Save to DB
        const course = await Course.create({
            user: req.user.id,
            title: ytData.title,
            playlistId: ytData.playlistId,
            thumbnail: ytData.thumbnail,
            videos: ytData.videos,
            studyPlan: studyPlan,
            // scheduledTime is essentially deprecated visually as we use per-day time now, but we'll default it safely
            scheduledTime: "09:00"
        });

        res.status(201).json({
            success: true,
            data: course
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all courses for logged in user
// @route   GET /api/courses
// @access  Private
const getCourses = async (req, res, next) => {
    try {
        const courses = await Course.find({ user: req.user.id });
        res.status(200).json({ success: true, count: courses.length, data: courses });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single course by ID
// @route   GET /api/courses/:id
// @access  Private
const getCourseById = async (req, res, next) => {
    try {
        const course = await Course.findOne({ 
            _id: req.params.id, 
            user: req.user.id 
        });

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.status(200).json({ success: true, data: course });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private
const deleteCourse = async (req, res, next) => {
    try {
        const course = await Course.findOneAndDelete({ 
            _id: req.params.id, 
            user: req.user.id 
        });

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};


// @desc    Generate AI notes for a specific video in a course
// @route   POST /api/courses/:id/notes/:videoIndex
// @access  Private
const generateNotes = async (req, res, next) => {
    try {
        const { transcript } = req.body || {};
        const course = await Course.findOne({ _id: req.params.id, user: req.user.id });
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        const videoIndex = parseInt(req.params.videoIndex);
        const video = course.videos[videoIndex];
        if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

        if (!course.notes) course.notes = [];

        // Check cache — but skip if cached content looks like a failure
        const cached = course.notes.find(n => n.videoIndex === videoIndex);
        if (cached && cached.content && !cached.content.includes('failed') && !cached.content.includes('Failed') && cached.content.length > 100) {
            return res.status(200).json({ success: true, data: cached.content, cached: true });
        }

        // Remove stale/failed cache entry if it exists
        if (cached) {
            course.notes = course.notes.filter(n => n.videoIndex !== videoIndex);
        }

        // Generate with Gemini
        const notesContent = await generateVideoNotes(
            course.title,
            video.title,
            videoIndex,
            course.videos.length,
            transcript || ""
        );

        // Only cache if generation succeeded (content is substantial)
        if (notesContent && !notesContent.includes('failed') && notesContent.length > 100) {
            course.notes.push({ videoIndex, videoTitle: video.title, content: notesContent });
            await course.save();
        }

        res.status(200).json({ success: true, data: notesContent, cached: false });
    } catch (error) {
        next(error);
    }
};

// @desc    Update video status and course progress
// @route   PUT /api/courses/:id/progress
// @access  Private
const updateCourseProgress = async (req, res, next) => {
    try {
        const { videoIndex, completed } = req.body;
        
        const course = await Course.findOne({ 
            _id: req.params.id, 
            user: req.user.id 
        });

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (course.videos[videoIndex]) {
            course.videos[videoIndex].completed = completed;
            
            // Recalculate total progress
            const completedCount = course.videos.filter(v => v.completed).length;
            course.progress = Math.round((completedCount / course.videos.length) * 100);
            
            await course.save();
        }

        res.status(200).json({ success: true, data: course });
    } catch (error) {
        next(error);
    }
};

// @desc    Generate AI tasks for a specific video in a course
// @route   POST /api/courses/:id/tasks/:videoIndex
// @access  Private
const generateTasksForVideo = async (req, res, next) => {
    try {
        const { transcript } = req.body || {};
        const course = await Course.findOne({ _id: req.params.id, user: req.user.id });
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        const videoIndex = parseInt(req.params.videoIndex);
        const video = course.videos[videoIndex];
        if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

        const tasks = await generateVideoTasks(course.title, video.title, transcript || "");

        if (!tasks || tasks.length === 0) {
            return res.status(200).json({ success: false, message: 'Could not generate tasks. Try again.' });
        }

        res.status(200).json({ success: true, data: tasks });
    } catch (error) {
        next(error);
    }
};

module.exports = { 
    previewCourse, 
    addCourse, 
    getCourses, 
    getCourseById, 
    deleteCourse, 
    generateNotes,
    generateTasksForVideo,
    updateCourseProgress
};


