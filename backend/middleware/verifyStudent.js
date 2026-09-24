// backend/middleware/verifyStudent.js - Middleware to verify student authentication
const User = require('../models/User');

/**
 * Middleware to verify that the request is made by an authenticated student.
 * Reads `x-user-id` and `x-user-role` headers.
 * - If `x-user-id` is present and valid, looks up the user in MongoDB and ensures role is 'student'.
 * - If no ID or ID is undefined/null, falls back to `x-user-role` header.
 * Returns 401 if no auth, 403 if not a student.
 */
const verifyStudent = async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!userId && !userRole) {
    return res.status(401).json({ error: 'Access denied. Authentication required.' });
  }

  // Check if userId is a valid non-empty string that isn't 'undefined' or 'null'
  if (userId && userId !== 'undefined' && userId !== 'null' && userId.trim() !== '') {
    try {
      const user = await User.findById(userId).lean();
      if (!user || user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied. Student authorization required.' });
      }
      // Attach user info to request for downstream use
      req.user = user;
      return next();
    } catch (err) {
      console.error('Student auth verification error:', err);
      return res.status(500).json({ error: 'Authorization verification failed' });
    }
  }

  // Fallback to role header
  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Access denied. Student authorization required.' });
  }
  // If role header is student, attach minimal student info
  req.user = { role: 'student', name: 'Student User' };
  next();
};

module.exports = verifyStudent;
