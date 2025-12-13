const pool = require('../config/database');

// ✅ Middleware to check if user is suspended
const checkSuspension = async (req, res, next) => {
  try {
    const userId = req.body.userId || req.params.userId || req.user?.id;
    
    if (!userId) {
      return next(); // No user ID, continue
    }

    const [users] = await pool.execute(
      'SELECT suspended, suspension_end, suspension_reason FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return next(); // User not found, continue
    }

    const user = users[0];

    // ✅ Check if suspension has expired
    if (user.suspended && user.suspension_end) {
      const now = new Date();
      const suspensionEnd = new Date(user.suspension_end);

      if (now > suspensionEnd) {
        // ✅ Suspension expired - lift it
        await pool.execute(
          'UPDATE users SET suspended = 0, suspension_end = NULL, suspension_reason = NULL WHERE id = ?',
          [userId]
        );
        console.log(`✅ Suspension lifted for user ${userId}`);
        return next();
      }
    }

    // ✅ User is currently suspended
    if (user.suspended) {
      return res.status(403).json({
        success: false,
        suspended: true,
        suspension_end: user.suspension_end,
        suspension_reason: user.suspension_reason,
        message: `Your account is suspended until ${new Date(user.suspension_end).toLocaleDateString()}. Reason: ${user.suspension_reason}`
      });
    }

    next();
  } catch (error) {
    console.error('Error checking suspension:', error);
    next(); // Continue on error to avoid blocking legitimate requests
  }
};

// ✅ Function to check if user can provide services (tutoring)
const canProvideServices = async (req, res, next) => {
  try {
    const userId = req.body.userId || req.params.userId || req.user?.id;
    
    if (!userId) {
      return next();
    }

    const [users] = await pool.execute(
      'SELECT suspended, suspension_end, suspension_reason FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return next();
    }

    const user = users[0];

    // Check if suspension expired
    if (user.suspended && user.suspension_end) {
      const now = new Date();
      const suspensionEnd = new Date(user.suspension_end);

      if (now > suspensionEnd) {
        await pool.execute(
          'UPDATE users SET suspended = 0, suspension_end = NULL, suspension_reason = NULL WHERE id = ?',
          [userId]
        );
        return next();
      }
    }

    // Block if suspended
    if (user.suspended) {
      return res.status(403).json({
        success: false,
        suspended: true,
        message: `You cannot provide services while suspended. Your suspension ends on ${new Date(user.suspension_end).toLocaleDateString()}.`
      });
    }

    next();
  } catch (error) {
    console.error('Error checking service provision:', error);
    next();
  }
};

module.exports = {
  checkSuspension,
  canProvideServices
};