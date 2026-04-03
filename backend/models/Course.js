const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: { type: String, enum: ['dsa', 'webdev', 'general'] },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'N/A'] },
  stats: String,
  link: String,
});

const ModuleSchema = new mongoose.Schema({
  week: Number,
  topic: String,
  tasks: [TaskSchema],
});

const VideoSchema = new mongoose.Schema({
  videoId: String,
  title: String,
  duration: String,
  completed: { type: Boolean, default: false },
});

const NoteSchema = new mongoose.Schema({
  videoIndex: Number,
  videoTitle: String,
  content: String,
  generatedAt: { type: Date, default: Date.now },
});


const courseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  playlistId: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
  },
  progress: {
    type: Number,
    default: 0,
  },
  scheduledTime: {
    type: String,
    default: "09:00",
  },
  studyPlan: [ModuleSchema],
  videos: [VideoSchema],
  notes: [NoteSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Course', courseSchema);
