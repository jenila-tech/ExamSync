const User = require('../models/User');

/**
 * Middleware to verify that the request is made by an admin user.
 *
 * - Reads `x-user-id` and `x-user-role` headers.
 * - If `x-user-id` is present, looks up the user in MongoDB via the `User` model
 *   and ensures the stored role is exactly "admin".
 * - If no `x-user-id` is supplied, falls back to the `x-user-role` header value.
 * - Preserves original status codes and error messages:
 *     401 – Access denied. Authentication required.
 *     403 – Access denied. Admin authorization required.
 *     500 – Authorization verification failed
 */
const verifyAdmin = async (req, res, next) => {
  const userRole = req.headers['x-user-role'];
  const userId = req.headers['x-user-id'];

  // Neither header supplied -> unauthenticated request
  if (!userRole && !userId) {
    return res.status(401).json({ error: 'Access denied. Authentication required.' });
  }

  // If a MongoDB user ID is provided, verify via the User model
  if (userId) {
    try {
      const user = await User.findById(userId).lean();
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin authorization required.' });
      }
      return next();
    } catch (err) {
      console.error('Authorization check error:', err);
      return res.status(500).json({ error: 'Authorization verification failed' });
    }
  }

  // Fallback to role header when no ID is supplied
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin authorization required.' });
  }

  next();
};

module.exports = verifyAdmin;
