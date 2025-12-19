const pool = require('../config/database');
const { emitActivityStatusUpdated, emitStatsUpdated } = require('../config/socket');

exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, full_name, email, role FROM users ORDER BY full_name ASC`
    );
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    const [conversations] = await pool.execute(
      `SELECT DISTINCT u.id, u.full_name, u.email, u.role
       FROM users u
       WHERE u.id IN (
         SELECT DISTINCT 
           CASE 
             WHEN sender_id = ? THEN receiver_id 
             ELSE sender_id 
           END as other_user_id
         FROM messages 
         WHERE sender_id = ? OR receiver_id = ?
       )
       ORDER BY u.full_name ASC`,
      [userId, userId, userId]
    );
    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

exports.getConversationMessages = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const [messages] = await pool.execute(
      `SELECT id, sender_id, receiver_id, message, created_at
       FROM messages
       WHERE (sender_id = ? AND receiver_id = ?) 
          OR (sender_id = ? AND receiver_id = ?)
       ORDER BY created_at ASC`,
      [userId, otherUserId, otherUserId, userId]
    );
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};


exports.getActivities = async (req, res) => {
  try {
    const { page = 1, limit = 10, filterType = 'all', search = '', dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;

    let query;
    let countQuery;
    let params = [];

    // Fixed search condition - use column names from the combined result, not the original table aliases
    const searchCondition = search && search.trim() !== '' 
      ? `AND (LOWER(full_name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(role) LIKE ? OR LOWER(activity_type) LIKE ? OR LOWER(details) LIKE ? OR LOWER(status) LIKE ?)`
      : '';
    
    const searchParams = search && search.trim() !== '' 
      ? Array(6).fill(`%${search.toLowerCase()}%`)
      : [];

    // Date filter condition to be applied at the combined result level
    const dateCondition = (dateFrom && dateTo) ? `AND DATE(created_at) BETWEEN ? AND ?` : '';

    if (filterType === 'all') {
      query = `
        SELECT * FROM (
          SELECT s.id, s.user_id, u.full_name, u.email, u.role, 'Class Created' as activity_type, s.title as details, s.status, s.id as related_id, s.created_at FROM services s JOIN users u ON s.user_id = u.id
          UNION ALL
          SELECT t.id, t.user_id, u.full_name, u.email, u.role, 'Transaction' as activity_type, CONCAT('Requested Class: ', COALESCE(sv.title, 'N/A')) as details, t.status, t.id as related_id, t.created_at FROM transactions t JOIN users u ON t.user_id = u.id LEFT JOIN services sv ON t.service_id = sv.id
          UNION ALL
          SELECT wr.id, wr.user_id, u.full_name, u.email, u.role, 'Wallet Request' as activity_type, CONCAT(wr.type, ': ', wr.amount) as details, wr.status, wr.id as related_id, wr.created_at FROM wallet_requests wr JOIN users u ON wr.user_id = u.id
          UNION ALL
          SELECT r.id, r.reporter_id as user_id, u.full_name, u.email, u.role, 'Report Submitted' as activity_type, r.reason as details, r.status, r.id as related_id, r.created_at FROM reports r JOIN users u ON r.reporter_id = u.id
          UNION ALL
          SELECT u.id, u.id as user_id, u.full_name, u.email, u.role, 'User Registered' as activity_type, CONCAT('Registered as ', u.role, ' - ', u.verification_status) as details, u.verification_status as status, u.id as related_id, u.created_at FROM users u
        ) as combined
        WHERE 1=1 ${searchCondition} ${dateCondition}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      // Build params array
      params = [...searchParams];
      if (dateFrom && dateTo) {
        params.push(dateFrom, dateTo);
      }
      params.push(parseInt(limit), parseInt(offset));
      
      // ✅ FIX: Include created_at in count query subquery
      countQuery = `
        SELECT COUNT(*) as total FROM (
          SELECT s.id, u.full_name, u.email, u.role, 'Class Created' as activity_type, s.title as details, s.status, s.created_at FROM services s JOIN users u ON s.user_id = u.id
          UNION ALL
          SELECT t.id, u.full_name, u.email, u.role, 'Transaction' as activity_type, CONCAT('Requested Class: ', COALESCE(sv.title, 'N/A')) as details, t.status, t.created_at FROM transactions t JOIN users u ON t.user_id = u.id LEFT JOIN services sv ON t.service_id = sv.id
          UNION ALL
          SELECT wr.id, u.full_name, u.email, u.role, 'Wallet Request' as activity_type, CONCAT(wr.type, ': ', wr.amount) as details, wr.status, wr.created_at FROM wallet_requests wr JOIN users u ON wr.user_id = u.id
          UNION ALL
          SELECT r.id, u.full_name, u.email, u.role, 'Report Submitted' as activity_type, r.reason as details, r.status, r.created_at FROM reports r JOIN users u ON r.reporter_id = u.id
          UNION ALL
          SELECT u.id, u.full_name, u.email, u.role, 'User Registered' as activity_type, u.role as details, u.verification_status as status, u.created_at FROM users u
        ) as combined
        WHERE 1=1 ${searchCondition} ${dateCondition}
      `;
    } else if (filterType === 'Class Created') {
      const searchCond = search && search.trim() !== '' 
        ? `AND (LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.role) LIKE ? OR LOWER(s.title) LIKE ? OR LOWER(s.status) LIKE ?)`
        : '';
      const searchP = search && search.trim() !== '' 
        ? Array(5).fill(`%${search.toLowerCase()}%`)
        : [];
      
      const dateCond = (dateFrom && dateTo) ? `AND DATE(s.created_at) BETWEEN ? AND ?` : '';
      
      query = `
        SELECT s.id, s.user_id, u.full_name, u.email, u.role, 'Class Created' as activity_type, s.title as details, s.status, s.id as related_id, s.created_at 
        FROM services s 
        JOIN users u ON s.user_id = u.id
        WHERE 1=1 ${searchCond} ${dateCond}
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `;
      countQuery = `SELECT COUNT(*) as total FROM services s JOIN users u ON s.user_id = u.id WHERE 1=1 ${searchCond} ${dateCond}`;
      
      params = [...searchP];
      if (dateFrom && dateTo) {
        params.push(dateFrom, dateTo);
      }
      params.push(parseInt(limit), parseInt(offset));
      
    } else if (filterType === 'Transaction') {
      const searchCond = search && search.trim() !== '' 
        ? `AND (LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.role) LIKE ? OR LOWER(s.title) LIKE ? OR LOWER(t.status) LIKE ?)`
        : '';
      const searchP = search && search.trim() !== '' 
        ? Array(5).fill(`%${search.toLowerCase()}%`)
        : [];
      
      const dateCond = (dateFrom && dateTo) ? `AND DATE(t.created_at) BETWEEN ? AND ?` : '';
      
      query = `
        SELECT t.id, t.user_id, u.full_name, u.email, u.role, 'Transaction' as activity_type, CONCAT('Requested Service: ', COALESCE(s.title, 'N/A')) as details, t.status, t.id as related_id, t.created_at 
        FROM transactions t 
        JOIN users u ON t.user_id = u.id
        LEFT JOIN services s ON t.service_id = s.id
        WHERE 1=1 ${searchCond} ${dateCond}
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `;
      countQuery = `SELECT COUNT(*) as total FROM transactions t JOIN users u ON t.user_id = u.id LEFT JOIN services s ON t.service_id = s.id WHERE 1=1 ${searchCond} ${dateCond}`;
      
      params = [...searchP];
      if (dateFrom && dateTo) {
        params.push(dateFrom, dateTo);
      }
      params.push(parseInt(limit), parseInt(offset));
      
    } else if (filterType === 'Wallet Request') {
      const searchCond = search && search.trim() !== '' 
        ? `AND (LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.role) LIKE ? OR LOWER(wr.type) LIKE ? OR LOWER(wr.status) LIKE ?)`
        : '';
      const searchP = search && search.trim() !== '' 
        ? Array(5).fill(`%${search.toLowerCase()}%`)
        : [];
      
      const dateCond = (dateFrom && dateTo) ? `AND DATE(wr.created_at) BETWEEN ? AND ?` : '';
      
      query = `
        SELECT wr.id, wr.user_id, u.full_name, u.email, u.role, 'Wallet Request' as activity_type, CONCAT(wr.type, ': ', wr.amount) as details, wr.status, wr.id as related_id, wr.created_at 
        FROM wallet_requests wr 
        JOIN users u ON wr.user_id = u.id
        WHERE 1=1 ${searchCond} ${dateCond}
        ORDER BY wr.created_at DESC
        LIMIT ? OFFSET ?
      `;
      countQuery = `SELECT COUNT(*) as total FROM wallet_requests wr JOIN users u ON wr.user_id = u.id WHERE 1=1 ${searchCond} ${dateCond}`;
      
      params = [...searchP];
      if (dateFrom && dateTo) {
        params.push(dateFrom, dateTo);
      }
      params.push(parseInt(limit), parseInt(offset));
      
    } else if (filterType === 'Report Submitted') {
      const searchCond = search && search.trim() !== '' 
        ? `AND (LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.role) LIKE ? OR LOWER(r.reason) LIKE ? OR LOWER(r.status) LIKE ?)`
        : '';
      const searchP = search && search.trim() !== '' 
        ? Array(5).fill(`%${search.toLowerCase()}%`)
        : [];
      
      const dateCond = (dateFrom && dateTo) ? `AND DATE(r.created_at) BETWEEN ? AND ?` : '';
      
      query = `
        SELECT r.id, r.reporter_id as user_id, u.full_name, u.email, u.role, 'Report Submitted' as activity_type, r.reason as details, r.status, r.id as related_id, r.created_at 
        FROM reports r 
        JOIN users u ON r.reporter_id = u.id
        WHERE 1=1 ${searchCond} ${dateCond}
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
      `;
      countQuery = `SELECT COUNT(*) as total FROM reports r JOIN users u ON r.reporter_id = u.id WHERE 1=1 ${searchCond} ${dateCond}`;
      
      params = [...searchP];
      if (dateFrom && dateTo) {
        params.push(dateFrom, dateTo);
      }
      params.push(parseInt(limit), parseInt(offset));
      
    } else if (filterType === 'User Registered') {
      const searchCond = search && search.trim() !== '' 
        ? `AND (LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.role) LIKE ? OR LOWER(u.verification_status) LIKE ?)`
        : '';
      const searchP = search && search.trim() !== '' 
        ? Array(4).fill(`%${search.toLowerCase()}%`)
        : [];
      
      const dateCond = (dateFrom && dateTo) ? `AND DATE(u.created_at) BETWEEN ? AND ?` : '';
      
      query = `
        SELECT u.id, u.id as user_id, u.full_name, u.email, u.role, 'User Registered' as activity_type, CONCAT('Registered as ', u.role, ' - ', u.verification_status) as details, u.verification_status as status, u.id as related_id, u.created_at FROM users u
        WHERE 1=1 ${searchCond} ${dateCond}
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `;
      countQuery = `SELECT COUNT(*) as total FROM users u WHERE 1=1 ${searchCond} ${dateCond}`;
      
      params = [...searchP];
      if (dateFrom && dateTo) {
        params.push(dateFrom, dateTo);
      }
      params.push(parseInt(limit), parseInt(offset));
    }

    const [activities] = await pool.execute(query, params);
    
    // Build count params - same as query params but without limit and offset
    let countParams = [];
    if (filterType === 'all' && search && search.trim() !== '') {
      countParams = Array(6).fill(`%${search.toLowerCase()}%`);
    } else if (['Class Created', 'Transaction', 'Wallet Request', 'Report Submitted'].includes(filterType) && search && search.trim() !== '') {
      countParams = Array(5).fill(`%${search.toLowerCase()}%`);
    } else if (filterType === 'User Registered' && search && search.trim() !== '') {
      countParams = Array(4).fill(`%${search.toLowerCase()}%`);
    }
    
    if (dateFrom && dateTo) {
      countParams.push(dateFrom, dateTo);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: activities,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages }
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ success: false, message: 'Error fetching activities', error: error.message });
  }
};






exports.getActivityDetails = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { type } = req.query;

    if (type === 'Transaction') {
      const [result] = await pool.execute(
        `SELECT t.*, 
                u.full_name, 
                u.email, 
                u.role, 
                s.title as service_title,
                s.description as service_description,
                s.price as service_price,
                provider.full_name as provider_name,
                provider.email as provider_email
         FROM transactions t 
         JOIN users u ON t.user_id = u.id
         LEFT JOIN services s ON t.service_id = s.id
         LEFT JOIN users provider ON s.user_id = provider.id
         WHERE t.id = ?`,
        [activityId]
      );

      if (result && result.length > 0) {
        const data = result[0];
        return res.json({
          success: true,
          data: {
            id: data.id,
            activity_type: 'Transaction',
            requester_name: data.full_name,
            requester_email: data.email,
            requester_role: data.role,
            provider_name: data.provider_name || 'N/A',
            provider_email: data.provider_email || 'N/A',
            service_title: data.service_title || 'N/A',
            service_description: data.service_description || 'N/A',
            service_price: data.service_price || '0',
            amount: data.amount || '0',
            type: data.type || 'booking',
            status: data.status || 'pending',
            created_at: data.created_at,
            description: `${data.full_name} requested: ${data.service_title || 'N/A'} from ${data.provider_name || 'N/A'}`
          }
        });
      }
    } else if (type === 'Class Created') {
      const [result] = await pool.execute(
        `SELECT s.*, u.full_name, u.email, u.role
         FROM services s
         JOIN users u ON s.user_id = u.id
         WHERE s.id = ?`,
        [activityId]
      );

      if (result && result.length > 0) {
        const data = result[0];
        return res.json({
          success: true,
          data: {
            id: data.id,
            activity_type: 'Class Created',
            full_name: data.full_name,
            email: data.email,
            role: data.role,
            title: data.title,
            description: data.description,
            price: data.price,
            category: data.category || 'N/A',
            availability: data.availability || 'N/A',
            status: data.status || 'Active',
            created_at: data.created_at
          }
        });
      }
    } else if (type === 'Wallet Request') {
      const [result] = await pool.execute(
        `SELECT wr.*, u.full_name, u.email, u.role
         FROM wallet_requests wr
         JOIN users u ON wr.user_id = u.id
         WHERE wr.id = ?`,
        [activityId]
      );

      if (result && result.length > 0) {
        const data = result[0];
        return res.json({
          success: true,
          data: {
            id: data.id,
            activity_type: 'Wallet Request',
            full_name: data.full_name,
            email: data.email,
            role: data.role,
            type: data.type,
            amount: data.amount,
            reason: data.reason || 'N/A',
            reference_number: data.reference_number || 'N/A',
            proof_image: data.proof_image || 'N/A',
            status: data.status || 'pending',
            created_at: data.created_at,
            user_id: data.user_id  // ✅ Include user_id for wallet operations
          }
        });
      }
} else if (type === 'Report Submitted') {
  const [result] = await pool.execute(
    `SELECT r.*, 
            u.full_name as reporter_name, 
            u.email as reporter_email,
            reported_user.full_name as reported_user_name, 
            reported_user.email as reported_user_email
     FROM reports r
     JOIN users u ON r.reporter_id = u.id
     JOIN users reported_user ON r.reported_user_id = reported_user.id
     WHERE r.id = ?`,
    [activityId]
  );

  if (result && result.length > 0) {
    const data = result[0];
    return res.json({
      success: true,
      data: {
        id: data.id,
        activity_type: 'Report Submitted',
        reporter_id: data.reporter_id,  
        reported_user_id: data.reported_user_id, 
        reporter_name: data.reporter_name,
        reporter_email: data.reporter_email,
        reported_user_name: data.reported_user_name,
        reported_user_email: data.reported_user_email,
        reason: data.reason || 'N/A',
        description: data.description || 'N/A',
        status: data.status || 'pending',
        violationType: data.violation_type,  
        adminNotes: data.admin_notes,  
        created_at: data.created_at,
        updated_at: data.updated_at  
      }
    });
  }
  } else if (type === 'User Registered') {
    const [result] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.role, 
              u.verification_status, u.created_at,
              u.valid_id_file
      FROM users u
      WHERE u.id = ?`,
      [activityId]
    );

    if (result && result.length > 0) {
      const data = result[0];
      
      // Convert Buffer to base64 if needed
      const convertToBase64 = (buffer) => {
        if (!buffer) return null;
        if (Buffer.isBuffer(buffer)) {
          return buffer.toString('base64');
        }
        return buffer;
      };
      
      return res.json({
        success: true,
        data: {
          id: data.id,
          activity_type: 'User Registered',
          full_name: data.full_name,
          email: data.email,
          role: data.role,
          valid_id_file: convertToBase64(data.valid_id_file),
          verification_status: data.verification_status || 'pending',
          created_at: data.created_at,
          user_id: data.id
        }
      });
    }
  }
    // Fallback: Search for Transaction if type not specified
    const [result] = await pool.execute(
      `SELECT t.*, 
              u.full_name, 
              u.email, 
              u.role, 
              s.title as service_title,
              s.description as service_description,
              s.price as service_price,
              provider.full_name as provider_name,
              provider.email as provider_email
       FROM transactions t 
       JOIN users u ON t.user_id = u.id
       LEFT JOIN services s ON t.service_id = s.id
       LEFT JOIN users provider ON s.user_id = provider.id
       WHERE t.id = ?`,
      [activityId]
    );

    if (result && result.length > 0) {
      const data = result[0];
      return res.json({
        success: true,
        data: {
          id: data.id,
          activity_type: 'Transaction',
          requester_name: data.full_name,
          requester_email: data.email,
          requester_role: data.role,
          provider_name: data.provider_name || 'N/A',
          provider_email: data.provider_email || 'N/A',
          service_title: data.service_title || 'N/A',
          service_description: data.service_description || 'N/A',
          service_price: data.service_price || '0',
          amount: data.amount || '0',
          type: data.type || 'booking',
          status: data.status || 'pending',
          created_at: data.created_at,
          description: `${data.full_name} requested: ${data.service_title || 'N/A'} from ${data.provider_name || 'N/A'}`
        }
      });
    }

    res.status(404).json({ success: false, message: 'Activity not found' });
  } catch (error) {
    console.error('Error fetching activity details:', error);
    res.status(500).json({ success: false, message: 'Error fetching details', error: error.message });
  }
};



exports.getDashboardStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT (
        (SELECT COUNT(*) FROM services) +
        (SELECT COUNT(*) FROM transactions) +
        (SELECT COUNT(*) FROM wallet_requests) +
        (SELECT COUNT(*) FROM reports) +
        (SELECT COUNT(*) FROM users)
      ) as totalActivities,
      (
        (SELECT COUNT(*) FROM transactions WHERE status = 'pending' OR status = 'Pending') +
        (SELECT COUNT(*) FROM wallet_requests WHERE status = 'pending' OR status = 'Pending') +
        (SELECT COUNT(*) FROM reports WHERE status = 'pending' OR status = 'Pending') +
        (SELECT COUNT(*) FROM users WHERE verification_status = 'pending')
      ) as pendingActions
    `);

    const [activitiesByType] = await pool.execute(`
      SELECT 'Class Created' as activity_type, COUNT(*) as count, 0 as pendingCount FROM services
      UNION ALL
      SELECT 'Transaction', COUNT(*), COALESCE(SUM(CASE WHEN status IN ('pending', 'Pending') THEN 1 ELSE 0 END), 0) FROM transactions
      UNION ALL
      SELECT 'Wallet Request', COUNT(*), COALESCE(SUM(CASE WHEN status IN ('pending', 'Pending') THEN 1 ELSE 0 END), 0) FROM wallet_requests
      UNION ALL
      SELECT 'Report Submitted', COUNT(*), COALESCE(SUM(CASE WHEN status IN ('pending', 'Pending') THEN 1 ELSE 0 END), 0) FROM reports
      UNION ALL
      SELECT 'User Registered', COUNT(*), COALESCE(SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END), 0) FROM users
    `);

    res.json({
      success: true,
      data: {
        totalActivities: stats[0].totalActivities,
        totalWithPending: stats[0].totalActivities + stats[0].pendingActions,
        pendingActions: stats[0].pendingActions,
        activitiesByType
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

exports.updateActivityStatus = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { status, type } = req.body;

    if (!type || !status) {
      return res.status(400).json({ success: false, message: 'Type and status are required' });
    }

    let table;
    switch (type) {
      case 'Class Created':
        table = 'services';
        break;
      case 'Transaction':
        table = 'transactions';
        break;
      case 'Wallet Request':
        table = 'wallet_requests';
        break;
      case 'Report Submitted':
        table = 'reports';
        break;
      case 'User Registered':
        table = 'users';
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid type' });
    }

    const [result] = await pool.execute(
      `UPDATE ${table} SET status = ? WHERE id = ?`,
      [status, activityId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    // ✅ EMIT SOCKET EVENT FOR REAL-TIME UPDATE
    emitActivityStatusUpdated(activityId, status, type);
    emitStatsUpdated({ updated: true, timestamp: new Date() });

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, message: 'Update failed', error: error.message });
  }
};

exports.logActivity = async (req, res) => {
  try {
    res.status(201).json({ success: true, message: 'Activity logged' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to log activity' });
  }
};

// ✅ ADD THIS NEW FUNCTION
exports.verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    // ✅ Validate status is one of the allowed enum values
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const [result] = await pool.execute(
      `UPDATE users SET verification_status = ? WHERE id = ?`,
      [status, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // ✅ EMIT SOCKET EVENT FOR REAL-TIME UPDATE
    emitActivityStatusUpdated(userId, status, 'User Registered');
    emitStatsUpdated({ updated: true, timestamp: new Date() });

    res.json({ 
      success: true, 
      message: `User verification status updated to ${status}` 
    });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update verification status',
      error: error.message 
    });
  }
};