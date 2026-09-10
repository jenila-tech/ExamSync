// backend/models/Exam.js - Mongoose Exam model
const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  exam_date: { type: Date, required: true }, // stored as Date (UTC midnight)
  start_time: { type: String, required: true }, // "HH:MM" 24h format
  end_time: { type: String, required: true },   // "HH:MM" 24h format
});

module.exports = mongoose.model('Exam', ExamSchema);
