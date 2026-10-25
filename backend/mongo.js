// mongo.js - Mongoose connection setup
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;

mongoose
  .connect(mongoURI)
  .then(() => console.log('✅ MongoDB Atlas connection established'))
  .catch((err) => console.error('❌ MongoDB Atlas connection error:', err));

module.exports = mongoose;