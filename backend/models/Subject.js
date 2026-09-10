// backend/models/Subject.js - Mongoose Subject model
const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  subject_code: { type: String, required: true, unique: true, trim: true, uppercase: true },
  subject_name: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
});

module.exports = mongoose.model('Subject', SubjectSchema);
