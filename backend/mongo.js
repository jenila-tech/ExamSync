// mongo.js - Mongoose connection setup
// Load environment variables from .env (already loaded in server.js via dotenv)
const mongoose = require('mongoose');

const mongoUser = 'examadmin';
const mongoPassword = process.env.MONGO_PASSWORD; // Ensure this env var is set
const mongoHost = 'localhost';
const dbName = 'exam_management';

// Encode password to handle special characters
const encodedPassword = encodeURIComponent(mongoPassword);
const mongoURI = `mongodb://${mongoUser}:${encodedPassword}@${mongoHost}:27017/${dbName}?authSource=admin`;

mongoose
  .connect(mongoURI)
  .then(() => console.log('✅ MongoDB connection established'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

module.exports = mongoose;
