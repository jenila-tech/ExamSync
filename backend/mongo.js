// mongo.js - Mongoose connection setup
// Load environment variables from .env (already loaded in server.js via dotenv)
const mongoose = require('mongoose');

const mongoHost = 'localhost';
const dbName = 'exam_management';
const mongoUser = 'examadmin';
const mongoPassword = encodeURIComponent(process.env.MONGO_PASSWORD);
// Include authSource=admin because the user was created in the admin database
const mongoURI = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:27017/${dbName}?authSource=admin`;

mongoose
  .connect(mongoURI)
  .then(() => console.log('✅ MongoDB connection established'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

module.exports = mongoose;
