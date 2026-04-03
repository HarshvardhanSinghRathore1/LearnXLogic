const express = require('express');
const { previewCourse, addCourse, getCourses, getCourseById, deleteCourse, generateNotes, generateTasksForVideo, updateCourseProgress } = require('../controllers/courseController');
const { chatWithTutor } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/preview')
    .post(protect, previewCourse);

router.route('/')
    .post(protect, addCourse)
    .get(protect, getCourses);

router.route('/:id')
    .get(protect, getCourseById)
    .delete(protect, deleteCourse);

router.route('/:id/notes/:videoIndex')
    .post(protect, generateNotes);

router.route('/:id/tasks/:videoIndex')
    .post(protect, generateTasksForVideo);

router.route('/:id/chat')
    .post(protect, chatWithTutor);

router.route('/:id/progress')
    .put(protect, updateCourseProgress);

module.exports = router;
