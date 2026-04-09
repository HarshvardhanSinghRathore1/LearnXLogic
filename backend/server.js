require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');


// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB SAFELY without crashing before listen
if (!process.env.MONGO_URI) {
  console.error('CRITICAL ERROR: MONGO_URI is missing from environment variables.');
  // Do not crash immediately, let the server listen first, but skip DB connection
} else {
  // Connect but catch any unhandled sync throws (db.js handles async errors, but just in case)
  try {
    connectDB();
  } catch (err) {
    console.error('Failed to initialize DB connection:', err.message);
  }
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Root route — redirect to login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});


// Import Routes
const authRoutes   = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const aiRoutes     = require('./routes/aiRoutes');         // General Ask AI route
const uploadRoutes = require('./routes/uploadRoutes');     // Profile photo upload
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/ai', aiRoutes);                             // /api/ai/ask endpoint
app.use('/api', uploadRoutes);                            // Mount upload routes at /api (so /api/upload-profile works)

// Error Handling Middleware (example)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server Error', error: err.message });
});

// Start the server FIRST so it listens on the correct port on Render
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
