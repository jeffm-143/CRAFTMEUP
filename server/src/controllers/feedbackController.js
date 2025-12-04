const pool = require('../config/database');

exports.createFeedback = async (req, res) => {
    try {
        const { service_id, user_id, rating, comment } = req.body;
        
        if (!service_id || !user_id || !rating) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const [result] = await pool.execute(
            'INSERT INTO feedback (service_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
            [service_id, user_id, rating, comment || null]
        );

        res.status(201).json({
            message: 'Feedback submitted successfully',
            feedbackId: result.insertId
        });
    } catch (error) {
        console.error('Error creating feedback:', error);
        res.status(500).json({ message: 'Failed to submit feedback', error: error.message });
    }
};

exports.getUserFeedback = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // ✅ Get feedback GIVEN by user (as learner/student)
    // Only shows feedbacks for ACTIVE services (not deleted)
    const givenQuery = `
      SELECT 
        f.id,
        f.service_id,
        f.user_id,
        f.rating,
        f.comment,
        f.created_at,
        'given' as feedback_type,
        s.title as service_title,
        s.description as service_description,
        s.deleted_at as service_deleted_at,
        s.user_id as provider_id,
        u.full_name as provider_name
      FROM feedback f
      LEFT JOIN services s ON f.service_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE f.user_id = ? AND f.deleted_at IS NULL AND s.deleted_at IS NULL
      ORDER BY f.created_at DESC
    `;

    // ✅ Get feedback RECEIVED by user (as tutor/provider)
    // Only shows feedbacks for ACTIVE services
    const receivedQuery = `
      SELECT 
        f.id,
        f.service_id,
        f.user_id,
        f.rating,
        f.comment,
        f.created_at,
        'received' as feedback_type,
        s.title as service_title,
        s.description as service_description,
        s.deleted_at as service_deleted_at,
        u.full_name as user_full_name
      FROM feedback f
      LEFT JOIN services s ON f.service_id = s.id
      LEFT JOIN users u ON f.user_id = u.id
      WHERE s.user_id = ? AND f.deleted_at IS NULL AND s.deleted_at IS NULL 
      ORDER BY f.created_at DESC
    `;

    const [givenFeedback] = await pool.execute(givenQuery, [userId]);
    const [receivedFeedback] = await pool.execute(receivedQuery, [userId]);

    console.log('Given feedback:', givenFeedback);
    console.log('Received feedback:', receivedFeedback);

    res.json({
      success: true,
      data: {
        given: givenFeedback,
        received: receivedFeedback
      }
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback',
      details: error.message
    });
  }
};

exports.getProviderFeedbacks = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // ✅ Only show feedbacks for ACTIVE services (not deleted)
        const [feedbacks] = await pool.execute(`
            SELECT 
                f.id,
                f.service_id,
                f.user_id,
                f.rating,
                f.comment,
                f.created_at,
                u.full_name as learner_name,
                u.profile_image as learner_image,
                s.title as service_title,
                s.id as service_id
            FROM feedback f
            JOIN users u ON f.user_id = u.id
            JOIN services s ON f.service_id = s.id
            WHERE s.user_id = ? 
              AND f.deleted_at IS NULL 
              AND s.deleted_at IS NULL
            ORDER BY f.created_at DESC
        `, [userId]);

        res.json(feedbacks);
    } catch (error) {
        console.error('Error fetching provider feedbacks:', error);
        res.status(500).json({ message: 'Failed to fetch feedbacks', error: error.message });
    }
};

module.exports = {
    createFeedback: exports.createFeedback,
    getUserFeedback: exports.getUserFeedback,
    getProviderFeedbacks: exports.getProviderFeedbacks
};