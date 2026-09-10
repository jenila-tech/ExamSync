// backend/models/User.js - Mongoose User model
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // bcrypt hash stored manually by auth logic
  role: { type: String, required: true, enum: ['admin', 'faculty', 'student'] },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
