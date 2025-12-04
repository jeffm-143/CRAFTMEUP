const pool = require('../config/database');
const { getIO } = require('../config/socket');

exports.bookmarkService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const userId = req.body.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    if (!serviceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Service ID is required' 
      });
    }

    // Check if already bookmarked FIRST
    const [existing] = await pool.execute(
      'SELECT id FROM saved_services WHERE user_id = ? AND service_id = ?',
      [userId, serviceId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Service already bookmarked',
        isAlreadyBookmarked: true
      });
    }

    // Get full service details
    const [serviceExists] = await pool.execute(
      `SELECT s.*, u.full_name as provider_name, u.profile_image,
              COALESCE(AVG(f.rating), 0) as average_rating,
              COUNT(DISTINCT f.id) as total_ratings
       FROM services s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN feedback f ON s.id = f.service_id
       WHERE s.id = ?
       GROUP BY s.id`,
      [serviceId]
    );

    if (serviceExists.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Service not found' 
      });
    }

    // Add bookmark
    const [result] = await pool.execute(
      'INSERT INTO saved_services (user_id, service_id) VALUES (?, ?)',
      [userId, serviceId]
    );

    // EMIT SOCKET EVENT - broadcast to all connected clients
    try {
      const io = getIO();
      io.emit('bookmark-service-added', {
        userId: userId,
        serviceId: serviceId,
        service: serviceExists[0],
        timestamp: new Date()
      });
      console.log('📌 Emitted bookmark-service-added for user:', userId, 'service:', serviceId);
    } catch (socketError) {
      console.warn('⚠️ Socket emit warning:', socketError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Service bookmarked successfully',
      bookmarkId: result.insertId,
      service: serviceExists[0]
    });
  } catch (error) {
    console.error('Error bookmarking service:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to bookmark service',
      error: error.message 
    });
  }
};

exports.unbookmarkService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const userId = req.body.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    if (!serviceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Service ID is required' 
      });
    }

    // Check if bookmark exists
    const [bookmarkExists] = await pool.execute(
      'SELECT id FROM saved_services WHERE user_id = ? AND service_id = ?',
      [userId, serviceId]
    );

    if (bookmarkExists.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bookmark not found' 
      });
    }

    // Delete bookmark
    const [result] = await pool.execute(
      'DELETE FROM saved_services WHERE user_id = ? AND service_id = ?',
      [userId, serviceId]
    );

    // EMIT SOCKET EVENT - broadcast to all connected clients
    try {
      const io = getIO();
      io.emit('bookmark-service-removed', {
        userId: userId,
        serviceId: parseInt(serviceId),
        timestamp: new Date()
      });
      console.log('🗑️ Emitted bookmark-service-removed for user:', userId, 'service:', serviceId);
    } catch (socketError) {
      console.warn('⚠️ Socket emit warning:', socketError.message);
    }

    res.json({ 
      success: true, 
      message: 'Service unbookmarked successfully' 
    });
  } catch (error) {
    console.error('Error unbookmarking service:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to unbookmark service',
      error: error.message 
    });
  }
};

exports.getSavedServices = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const [services] = await pool.execute(
      `SELECT s.*, u.full_name as provider_name, u.profile_image,
              COALESCE(AVG(f.rating), 0) as average_rating,
              COUNT(DISTINCT f.id) as total_ratings,
              ss.created_at as bookmarked_at
       FROM saved_services ss
       JOIN services s ON ss.service_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN feedback f ON s.id = f.service_id
       WHERE ss.user_id = ?
       GROUP BY s.id
       ORDER BY ss.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error fetching saved services:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch saved services',
      error: error.message 
    });
  }
};

exports.isServiceBookmarked = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const userId = req.body.userId || req.user?.id;

    if (!userId) {
      return res.json({ isBookmarked: false });
    }

    if (!serviceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Service ID is required' 
      });
    }

    const [result] = await pool.execute(
      'SELECT id FROM saved_services WHERE user_id = ? AND service_id = ?',
      [userId, serviceId]
    );

    res.json({ 
      success: true,
      isBookmarked: result.length > 0 
    });
  } catch (error) {
    console.error('Error checking bookmark:', error);
    res.status(500).json({ 
      success: false,
      isBookmarked: false 
    });
  }
};

exports.getSavedServicesCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM saved_services WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      count: result[0].count
    });
  } catch (error) {
    console.error('Error getting saved services count:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get saved services count' 
    });
  }
};