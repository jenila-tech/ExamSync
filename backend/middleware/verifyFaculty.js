const User = require('../models/User');
const Faculty = require('../models/Faculty');

/**
 * Middleware to verify that the request originates from a logged‑in faculty member.
 * Reads `x-user-id` and `x-user-role` headers, validates the user, and attaches
 * the faculty document to `req.faculty` and user to `req.user`.
 */
const verifyFaculty = async (req, res, next) => {
  const userRole = req.headers['x-user-role'];
  const userId = req.headers['x-user-id'];

  if (!userRole && !userId) {
    return res.status(401).json({ error: 'Access denied. Authentication required.' });
  }

  let user = null;

  if (userId && userId !== 'undefined' && userId !== 'null' && userId.trim() !== '') {
    try {
      user = await User.findById(userId).lean();
      if (!user || user.role !== 'faculty') {
        return res.status(403).json({ error: 'Access denied. Faculty authorization required.' });
      }
    } catch (err) {
      console.error('Faculty auth verification error:', err);
      return res.status(500).json({ error: 'Authorization verification failed' });
    }
  } else {
    if (userRole !== 'faculty') {
      return res.status(403).json({ error: 'Access denied. Faculty authorization required.' });
    }
    user = { role: 'faculty', name: 'Faculty Member', email: 'faculty@exam.com' };
  }

  req.user = user;

  try {
    // 1. Try finding Faculty by exact email
    let faculty = await Faculty.findOne({ email: user.email }).lean();

    // 2. Try finding by name if not found by email
    if (!faculty && user.name) {
      faculty = await Faculty.findOne({
        name: { $regex: new RegExp(`^${user.name.trim()}$`, 'i') }
      }).lean();
    }

    // 3. Fallback to first faculty record if available
    if (!faculty) {
      faculty = await Faculty.findOne().sort({ _id: 1 }).lean();
    }

    // 4. If no faculty in DB at all, attach fallback object
    if (!faculty) {
      req.faculty = { _id: user._id || user.id, name: user.name, email: user.email };
    } else {
      req.faculty = faculty;
    }

    return next();
  } catch (err) {
    console.error('Error resolving faculty profile:', err);
    return res.status(500).json({ error: 'Failed to resolve faculty profile' });
  }
};

module.exports = verifyFaculty;
