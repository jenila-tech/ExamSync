// backend/models/InvigilationAssignment.js - Mongoose Invigilation Assignment model
const mongoose = require('mongoose');

const InvigilationAssignmentSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
}, { timestamps: true });

module.exports = mongoose.model('InvigilationAssignment', InvigilationAssignmentSchema);
