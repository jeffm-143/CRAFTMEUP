const pool = require('../config/database');
let io;

const setIO = (socketInstance) => {
  io = socketInstance;
  console.log('✅ Socket.IO initialized in serviceController');
};

// Helper function to check if user has reached 200 SC milestone
const checkAndUpdateMilestone = async (userId) => {
  try {
    // Check if milestone already exists
    const [milestoneRows] = await pool.execute(
      'SELECT * FROM user_milestones WHERE user_id = ? AND milestone_type = ?',
      [userId, 'reached_200_sc']
    );

    if (milestoneRows.length > 0) {
      return milestoneRows[0].achieved; // Already checked before
    }

    // Calculate current balance
    const [walletRows] = await pool.execute(
      'SELECT balance FROM wallet WHERE user_id = ?',
      [userId]
    );

    const currentBalance = walletRows.length > 0 ? parseFloat(walletRows[0].balance) : 0;

    if (currentBalance >= 200) {
      // Create milestone record
      await pool.execute(
        'INSERT INTO user_milestones (user_id, milestone_type, achieved, achieved_at) VALUES (?, ?, ?, NOW())',
        [userId, 'reached_200_sc', true]
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking milestone:', error);
    return false;
  }
};

exports.getAllServices = async (req, res) => {
    try {
        const [services] = await pool.execute(`
            SELECT 
                s.*,
                u.full_name as user_full_name,
                u.id as user_id,
                u.role as user_role,
                COALESCE(AVG(f.rating), 0) as average_rating,
                COUNT(f.id) as total_ratings
            FROM services s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN feedback f ON s.id = f.service_id AND f.deleted_at IS NULL
            WHERE s.status = "Active" AND s.deleted_at IS NULL
            GROUP BY s.id
            ORDER BY s.created_at DESC
        `);
        res.json(services);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ message: 'Failed to fetch services' });
    }
};

exports.createService = async (req, res) => {
    try {
        const { userId, title, description, price, availability } = req.body;
        
        // ✅ CHECK VERIFICATION STATUS FIRST
        const [userRows] = await pool.execute(
            'SELECT role, verification_status FROM users WHERE id = ?', 
            [userId]
        );
        
        if (userRows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        const user = userRows[0];
        const role = user.role?.toLowerCase() || '';
        const verificationStatus = user.verification_status?.toLowerCase() || 'pending';

        // ✅ CHECK IF USER IS TUTOR OR BOTH AND IF VERIFIED
        if (role === 'tutor' || role === 'both') {
            if (verificationStatus !== 'approved') {
                return res.status(403).json({ 
                    success: false,
                    message: 'Your account must be verified before you can create services. Please wait for admin approval.',
                    verificationStatus: verificationStatus
                });
            }
        }

        // ✅ Proceed with service creation if verified
        const [result] = await pool.execute(
            `INSERT INTO services (user_id, title, description, price, availability, status) 
             VALUES (?, ?, ?, ?, ?, 'Active')`,
            [userId, title, description, price, availability]
        );

        // Fetch the newly created service with ratings
        const [newService] = await pool.execute(`
            SELECT 
                s.*,
                u.full_name as user_full_name,
                u.id as user_id,
                u.role as user_role,
                COALESCE(AVG(f.rating), 0) as average_rating,
                COUNT(f.id) as total_ratings
            FROM services s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN feedback f ON s.id = f.service_id AND f.deleted_at IS NULL
            WHERE s.id = ? AND s.deleted_at IS NULL
            GROUP BY s.id
        `, [result.insertId]);

        // ✅ Emit to ALL clients
        if (io) {
          console.log('📡 Broadcasting service-created event');
          io.emit('service-created', newService[0]);
        }

        // --- Deduct service creation fee for tutors or both-role users ---
        try {
            const fee = 10; // SkillCoin fee for adding a service

            if (role === 'tutor' || role === 'both') {
                // Ensure wallet exists
                const [walletRows] = await pool.execute('SELECT balance FROM wallet WHERE user_id = ?', [userId]);
                if (walletRows.length === 0) {
                    // initialize with default balance (50) like other routes
                    await pool.execute('INSERT INTO wallet (user_id, balance) VALUES (?, ?)', [userId, 50.00]);
                }

                // Subtract fee
                await pool.execute('UPDATE wallet SET balance = balance - ? WHERE user_id = ?', [fee, userId]);

                // Record a wallet request / ledger entry for traceability
                await pool.execute(
                    'INSERT INTO wallet_requests (user_id, type, amount, reference_number, proof_image, status) VALUES (?, ?, ?, ?, ?, ?)',
                    [userId, 'debit', fee, 'service_fee', null, 'approved']
                );
            }
        } catch (feeErr) {
            console.error('Error applying service creation fee:', feeErr);
            // don't fail the main request because of fee bookkeeping; just log
        }

        res.status(201).json({
            success: true,
            message: 'Service created successfully',
            serviceId: result.insertId,
            service: newService[0]
        });
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to create service',
            error: error.message 
        });
    }
};

exports.getUserServices = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const [services] = await pool.execute(`
            SELECT 
                s.*,
                u.full_name as user_full_name,
                u.id as user_id,
                COALESCE(AVG(f.rating), 0) as average_rating,
                COUNT(f.id) as total_ratings
            FROM services s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN feedback f ON s.id = f.service_id AND f.deleted_at IS NULL
            WHERE s.user_id = ? AND s.deleted_at IS NULL
            GROUP BY s.id
            ORDER BY s.created_at DESC
        `, [userId]);
        
        res.json(services);
    } catch (error) {
        console.error('Error fetching user services:', error);
        res.status(500).json({ message: 'Failed to fetch services' });
    }
};

exports.updateService = async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId || req.params.id, 10);
    const { title, description, price, availability, status } = req.body || {};

    if (!serviceId || isNaN(serviceId)) {
      return res.status(400).json({ success: false, message: 'Valid service ID is required' });
    }

    const sanitized = [
      (typeof title === 'string' && title.trim() !== '') ? title.trim() : null,
      (typeof description === 'string' && description.trim() !== '') ? description.trim() : null,
      (price !== undefined && price !== null && price !== '') ? Number(price) : null,
      availability !== undefined ? availability : null,
      (typeof status === 'string' && status.trim() !== '') ? status.trim() : 'Active',
      serviceId
    ];

    const [result] = await pool.execute(
      `UPDATE services
        SET title = COALESCE(?, title), 
            description = COALESCE(?, description), 
            price = COALESCE(?, price), 
            availability = COALESCE(?, availability), 
            status = ?
        WHERE id = ? AND deleted_at IS NULL`,
      sanitized
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Fetch updated service with ratings
    const [updatedService] = await pool.execute(`
        SELECT 
            s.*,
            u.full_name as user_full_name,
            u.id as user_id,
            u.role as user_role,
            COALESCE(AVG(f.rating), 0) as average_rating,
            COUNT(f.id) as total_ratings
        FROM services s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN feedback f ON s.id = f.service_id AND f.deleted_at IS NULL
        WHERE s.id = ? AND s.deleted_at IS NULL
        GROUP BY s.id
    `, [serviceId]);

    // ✅ Emit to ALL clients
    if (io && updatedService.length > 0) {
      console.log('📡 Broadcasting service-updated event');
      io.emit('service-updated', updatedService[0]);
    }

    res.json({ success: true, message: 'Service updated successfully', service: updatedService[0] });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ success: false, message: 'Failed to update service', error: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId || req.params.id, 10);

    if (!serviceId || isNaN(serviceId)) {
      return res.status(400).json({ success: false, message: 'Valid service ID is required' });
    }

    // ✅ SOFT DELETE: Set deleted_at instead of hard delete
    const [result] = await pool.execute(
      'UPDATE services SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [serviceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Service not found or already deleted' });
    }

    // ✅ Emit to ALL clients - Send just the serviceId
    if (io) {
      console.log('📡 Broadcasting service-deleted event for serviceId:', serviceId);
      io.emit('service-deleted', serviceId);
    }

    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service', error: error.message });
  }
};

exports.restoreService = async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId || req.params.id, 10);

    if (!serviceId || isNaN(serviceId)) {
      return res.status(400).json({ success: false, message: 'Valid service ID is required' });
    }

    // ✅ Restore deleted service
    const [result] = await pool.execute(
      'UPDATE services SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL',
      [serviceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Service not found or not deleted' });
    }

    // Fetch restored service
    const [restoredService] = await pool.execute(`
        SELECT 
            s.*,
            u.full_name as user_full_name,
            u.id as user_id,
            u.role as user_role,
            COALESCE(AVG(f.rating), 0) as average_rating,
            COUNT(f.id) as total_ratings
        FROM services s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN feedback f ON s.id = f.service_id AND f.deleted_at IS NULL
        WHERE s.id = ?
        GROUP BY s.id
    `, [serviceId]);

    // ✅ Emit to ALL clients
    if (io && restoredService.length > 0) {
      console.log('📡 Broadcasting service-created event (restored)');
      io.emit('service-created', restoredService[0]);
    }

    res.json({ success: true, message: 'Service restored successfully', service: restoredService[0] });
  } catch (error) {
    console.error('Error restoring service:', error);
    res.status(500).json({ success: false, message: 'Failed to restore service', error: error.message });
  }
};

exports.createBooking = async (req, res) => {
    try {
        const { userId, serviceId, status } = req.body;

        const [userRows] = await pool.execute(
            'SELECT role, verification_status FROM users WHERE id = ?', 
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        const user = userRows[0];
        const verificationStatus = user.verification_status?.toLowerCase() || 'pending';

        if (verificationStatus !== 'approved') {
            return res.status(403).json({ 
                success: false,
                message: 'Your account must be verified before you can book services. Please wait for admin approval.',
                verificationStatus: verificationStatus
            });
        }
        
        const [result] = await pool.execute(
            `INSERT INTO transactions (user_id, service_id, type, status, amount) 
             SELECT ?, ?, 'booking', ?, price
             FROM services WHERE id = ? AND deleted_at IS NULL`,
            [userId, serviceId, status || 'pending', serviceId]
        );

                const [booking] = await pool.execute(
                        `SELECT t.*, s.title as service_title, s.description, s.price, s.user_id as provider_id, u.full_name as provider_name
                         FROM transactions t 
                         JOIN services s ON t.service_id = s.id 
                         JOIN users u ON s.user_id = u.id 
                         WHERE t.id = ? AND s.deleted_at IS NULL`,
                        [result.insertId]
                );

                // Create a notification for the service provider (tutor)
                try {
                    const learnerId = userId;
                    // Fetch learner name
                    const [learnerRows] = await pool.execute('SELECT full_name FROM users WHERE id = ?', [learnerId]);
                    const learnerName = (learnerRows && learnerRows[0] && learnerRows[0].full_name) ? learnerRows[0].full_name : 'A learner';

                    const providerId = booking[0]?.provider_id;
                    if (providerId) {
                        const content = `You got a Tutor request from ${learnerName}`;
                        await pool.execute(
                            'INSERT INTO notifications (user_id, type, title, content, `read`) VALUES (?, ?, ?, ?, ?)',
                            [providerId, 'tutor_request', 'New Tutor Request', content, false]
                        );

                        // Emit socket notification to provider's room if io initialized
                        if (io) {
                            io.to(`user-${providerId}`).emit('new-notification', {
                                type: 'tutor_request',
                                title: 'New Tutor Request',
                                content,
                                timestamp: new Date()
                            });
                        }
                    }
                } catch (notifErr) {
                    console.error('Error creating tutor notification:', notifErr);
                }

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            booking: booking[0]
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create booking',
            error: error.message 
        });
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const [bookings] = await pool.execute(`
            SELECT 
                t.*,
                s.title as service_title,
                s.description,
                s.price,
                s.availability,
                s.user_id as provider_id,
                provider.full_name as provider_name,
                requester.full_name as requester_name,
                CASE 
                    WHEN s.user_id = ? THEN true
                    ELSE false
                END as is_provider
            FROM transactions t
            JOIN services s ON t.service_id = s.id
            JOIN users provider ON s.user_id = provider.id
            JOIN users requester ON t.user_id = requester.id
            WHERE (t.user_id = ? OR s.user_id = ?) AND s.deleted_at IS NULL
            ORDER BY t.created_at DESC
        `, [userId, userId, userId]);

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Failed to fetch bookings' });
    }
};

exports.getUserTransactions = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const [transactions] = await pool.execute(`
            SELECT 
                t.*,
                s.title as service_title,
                s.description as service_description,
                s.user_id as provider_id,
                provider.full_name as provider_name,
                learner.full_name as learner_name,
                CASE 
                    WHEN s.user_id = ? THEN true
                    ELSE false
                END as is_provider
            FROM transactions t
            JOIN services s ON t.service_id = s.id
            JOIN users provider ON s.user_id = provider.id
            JOIN users learner ON t.user_id = learner.id
            WHERE (t.user_id = ? OR s.user_id = ?) AND s.deleted_at IS NULL
            ORDER BY t.created_at DESC
        `, [userId, userId, userId]);

        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Failed to fetch transactions' });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'ongoing', 'ready', 'completed', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        await pool.execute(
            'UPDATE transactions SET status = ? WHERE id = ?',
            [status, id]
        );

        const [transactions] = await pool.execute(`
            SELECT t.*, 
                s.title as service_title,
                s.description,
                s.user_id as provider_id,
                provider.full_name as provider_name,
                requester.full_name as requester_name,
                CASE 
                    WHEN s.user_id = t.user_id THEN true
                    ELSE false
                END as is_provider
            FROM transactions t
            JOIN services s ON t.service_id = s.id
            JOIN users provider ON s.user_id = provider.id
            JOIN users requester ON t.user_id = requester.id
            WHERE t.id = ? AND s.deleted_at IS NULL
        `, [id]);

        if (transactions.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json({
            message: 'Status updated successfully',
            transaction: transactions[0]
        });

    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ message: 'Failed to update status' });
    }
};

exports.createFeedback = async (req, res) => {
    try {
        const { serviceId, userId, rating, comment } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO feedback (service_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
            [serviceId, userId, rating, comment]
        );

        // Fetch the updated service with new average rating
        const [updatedService] = await pool.execute(`
            SELECT 
                s.*,
                u.full_name as user_full_name,
                u.id as user_id,
                u.role as user_role,
                COALESCE(AVG(f.rating), 0) as average_rating,
                COUNT(f.id) as total_ratings
            FROM services s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN feedback f ON s.id = f.service_id AND f.deleted_at IS NULL
            WHERE s.id = ? AND s.deleted_at IS NULL
            GROUP BY s.id
        `, [serviceId]);

        // ✅ Emit service update with new ratings
        if (io && updatedService.length > 0) {
          console.log('📡 Broadcasting service-updated event (new feedback)');
          io.emit('service-updated', updatedService[0]);
        }

        res.status(201).json({
            message: 'Feedback submitted successfully',
            feedbackId: result.insertId
        });
    } catch (error) {
        console.error('Error creating feedback:', error);
        res.status(500).json({ message: 'Failed to submit feedback' });
    }
};

exports.getUserFeedback = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // ✅ Show ALL feedbacks, even for deleted services
        const [feedbacks] = await pool.execute(`
            SELECT 
                f.*,
                s.title as service_title,
                s.description as service_description,
                s.deleted_at as service_deleted_at,
                s.user_id as provider_id,
                provider.full_name as provider_name,
                learner.full_name as learner_name,
                CASE 
                    WHEN s.user_id = ? THEN 'tutor'
                    ELSE 'learner'
                END as role_type
            FROM feedback f
            JOIN services s ON f.service_id = s.id
            JOIN users provider ON s.user_id = provider.id
            JOIN users learner ON f.user_id = learner.id
            WHERE (f.user_id = ? OR s.user_id = ?) AND f.deleted_at IS NULL
            ORDER BY f.created_at DESC
        `, [userId, userId, userId]);

        console.log('Fetched feedbacks:', feedbacks);
        res.json(feedbacks);
    } catch (error) {
        console.error('Error fetching user feedback:', error);
        res.status(500).json({ message: 'Failed to fetch feedback' });
    }
};

exports.getWalletBalance = async (req, res) => {
    try {
        const { userId } = req.params;
        const [wallet] = await pool.execute(
            'SELECT balance FROM wallet WHERE user_id = ?',
            [userId]
        );

        if (wallet.length === 0) {
            await pool.execute(
                'INSERT INTO wallet (user_id, balance) VALUES (?, 50.00)',
                [userId]
            );
            return res.json({ data: { balance: 50.00 } });
        }

        // Check and update 200 SC milestone if reached
        const balance = parseFloat(wallet[0].balance);
        if (balance >= 200) {
            await checkAndUpdateMilestone(userId);
        }

        res.json({ data: { balance: balance } });
    } catch (error) {
        console.error('Error fetching wallet:', error);
        res.status(500).json({ message: 'Failed to fetch wallet balance' });
    }
};

exports.transferFunds = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { fromUserId, toUserId, amount, bookingId } = req.body;
        
        console.log('Transfer request:', { fromUserId, toUserId, amount, bookingId });

        if (!fromUserId || !toUserId || !amount || !bookingId) {
            connection.release();
            return res.status(400).json({ 
                message: 'Missing required fields',
                received: { fromUserId, toUserId, amount, bookingId }
            });
        }

        if (parseInt(fromUserId) === parseInt(toUserId)) {
            connection.release();
            return res.status(400).json({ message: 'Cannot transfer to yourself' });
        }

        const transferAmount = parseFloat(amount);
        if (isNaN(transferAmount) || transferAmount <= 0) {
            connection.release();
            return res.status(400).json({ message: 'Invalid amount' });
        }

        await connection.beginTransaction();

        const [learnerWallet] = await connection.execute(
            'SELECT balance FROM wallet WHERE user_id = ?',
            [fromUserId]
        );

        console.log('Learner wallet:', learnerWallet[0]);

        if (learnerWallet.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ message: 'Learner wallet not found' });
        }

        const currentBalance = parseFloat(learnerWallet[0].balance);
        if (currentBalance < transferAmount) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ 
                message: `Insufficient balance. Required: ${transferAmount}, Available: ${currentBalance}`
            });
        }

        const [providerWallet] = await connection.execute(
            'SELECT * FROM wallet WHERE user_id = ?',
            [toUserId]
        );

        if (providerWallet.length === 0) {
            await connection.execute(
                'INSERT INTO wallet (user_id, balance) VALUES (?, 50.00)',
                [toUserId]
            );
        }

        await connection.execute(
            'UPDATE wallet SET balance = balance - ? WHERE user_id = ?',
            [transferAmount, fromUserId]
        );

        await connection.execute(
            'UPDATE wallet SET balance = balance + ? WHERE user_id = ?',
            [transferAmount, toUserId]
        );

        await connection.execute(
            'UPDATE transactions SET status = ? WHERE id = ?',
            ['completed', bookingId]
        );

        await connection.commit();

        const [updatedWallet] = await connection.execute(
            'SELECT balance FROM wallet WHERE user_id = ?',
            [fromUserId]
        );

        // Check if provider reached 200 SC milestone
        const [providerNewBalance] = await connection.execute(
            'SELECT balance FROM wallet WHERE user_id = ?',
            [toUserId]
        );
        const newProviderBalance = parseFloat(providerNewBalance[0].balance);
        if (newProviderBalance >= 200) {
            await checkAndUpdateMilestone(toUserId);
        }

        connection.release();

        // ✅ Emit wallet update
        if (io) {
          io.emit('wallet-updated', {
            fromUserId,
            toUserId,
            amount: transferAmount,
            type: 'transfer'
          });
        }

        res.json({
            message: 'Payment completed successfully',
            newBalance: parseFloat(updatedWallet[0].balance)
        });
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Transfer error:', error);
        res.status(500).json({ 
            message: 'Failed to process payment',
            error: error.message
        });
    }
};

exports.getServiceFeedbacks = async (req, res) => {
  try {
    const { serviceId } = req.params;
    
    if (!serviceId) {
      return res.status(400).json({ message: 'Service ID is required' });
    }

    const [feedbacks] = await pool.execute(`
      SELECT 
        f.id,
        f.service_id,
        f.user_id,
        f.rating,
        f.comment,
        f.created_at,
        u.full_name as learner_name
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      WHERE f.service_id = ? AND f.deleted_at IS NULL
      ORDER BY f.created_at DESC
    `, [serviceId]);

    res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching service feedbacks:', error);
    res.status(500).json({ message: 'Failed to fetch feedbacks', error: error.message });
  }
};

module.exports = {
  ...module.exports,
  setIO
};