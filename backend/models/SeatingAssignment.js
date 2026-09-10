// backend/models/SeatingAssignment.js - Mongoose Seating Assignment model
const mongoose = require('mongoose');

const SeatingAssignmentSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
  seat_number: { type: Number, required: true, min: 1 },
}, { timestamps: true });

module.exports = mongoose.model('SeatingAssignment', SeatingAssignmentSchema);
