// backend/models/Student.js - Mongoose Student model
const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  register_number: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  year: { type: Number, required: true },
  section: { type: String, default: '' },
});

module.exports = mongoose.model('Student', StudentSchema);
