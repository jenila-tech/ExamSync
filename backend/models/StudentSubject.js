// backend/models/StudentSubject.js - Mongoose model linking Student and Subject
const mongoose = require('mongoose');

const StudentSubjectSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
});

// Ensure a student cannot be mapped to the same subject more than once
StudentSubjectSchema.index({ student: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('StudentSubject', StudentSubjectSchema);
