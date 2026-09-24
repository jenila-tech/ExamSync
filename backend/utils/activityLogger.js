// backend/utils/activityLogger.js - Helper to create Activity records safely
const Activity = require('../models/Activity');

async function logActivity({ action, entityType, entityName = '', message }) {
  try {
    await Activity.create({
      action,
      entityType,
      entityName: entityName || '',
      message,
      createdAt: new Date()
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

module.exports = logActivity;
