require('dotenv').config();

// Global error handlers to prevent silent crashes
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');


// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

console.log('Starting server initialization...');

// Connection logic moved to bottom

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Root route — test endpoint to confirm server is working
app.get('/', (req, res) => {
  res.status(200).send("Server is working properly");
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

// Connect to MongoDB and then start server
if (!process.env.MONGO_URI) {
  console.error('CRITICAL ERROR: MONGO_URI is missing from environment variables.');
  app.listen(PORT, () => console.log(`Server running on port ${PORT} (WITHOUT DB)`));
} else {
  console.log('MONGO_URI is loaded successfully. Connecting to MongoDB...');
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch((err) => {
    console.error('Failed to initialize DB connection:', err.message);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (DB CONNECTION FAILED)`);
    });
  });
}
