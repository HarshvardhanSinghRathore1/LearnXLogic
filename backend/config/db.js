const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI is missing. Please ensure it is set properly in the .env or Render environment, e.g., mongodb+srv://username:password@cluster.mongodb.net/dbname");
      return;
    }
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Rethrow to let server.js handle it
    throw error;
  }
};

module.exports = connectDB;
