// backend/models/Venue.js - Mongoose Venue model
const mongoose = require('mongoose');

const VenueSchema = new mongoose.Schema({
  venue_name: { type: String, required: true, unique: true, trim: true },
  building: { type: String, default: '' , trim: true },
  capacity: { type: Number, required: true, min: [1, 'Capacity must be positive'] },
});

module.exports = mongoose.model('Venue', VenueSchema);
