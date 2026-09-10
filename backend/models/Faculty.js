// backend/models/Faculty.js - Mongoose Faculty model
const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
});

module.exports = mongoose.model('Faculty', FacultySchema);
