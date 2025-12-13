    const pool = require('../config/database');
    const { getIO } = require('../config/socket'); // ✅ Import socket

    // ✅ FIXED FUNCTION - Uses connection parameter instead of pool
    const recordPlatformFee = async (connection, walletRequestId, userId, transactionType, originalAmount) => {
    try {
        const feePercentage = 5.00; // 5% fee
        const feeAmount = (parseFloat(originalAmount) * feePercentage) / 100;
        const netAmount = parseFloat(originalAmount) - feeAmount;

        await connection.execute(
        `INSERT INTO platform_revenue 
        (wallet_request_id, user_id, transaction_type, original_amount, fee_percentage, fee_amount, net_amount) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [walletRequestId, userId, transactionType, originalAmount, feePercentage, feeAmount, netAmount]
        );

        await connection.execute(
        'UPDATE wallet_requests SET fee_recorded = TRUE WHERE id = ?',
        [walletRequestId]
        );

        console.log(`✅ Platform fee recorded: ${transactionType} - ${feeAmount} SC (${feePercentage}% of ${originalAmount} SC)`);
        return { feeAmount, netAmount };
    } catch (error) {
        console.error('Error recording platform fee:', error);
        throw error;
    }
    };

    // ✅ EXISTING FUNCTION - UNCHANGED
    exports.createTransaction = async (req, res) => {
        try {
            const { userId, serviceId, type, amount, referenceNumber } = req.body;
            const paymentProof = req.file ? '/uploads/' + req.file.filename : null;

            console.log('📝 Creating transaction:', { userId, serviceId, amount });

            if (!userId || !serviceId || !amount) {
                return res.status(400).json({ 
                    message: 'Missing required fields: userId, serviceId, amount' 
                });
            }

            const transactionAmount = parseFloat(amount);

            const [result] = await pool.execute(
                `INSERT INTO transactions 
                (user_id, service_id, type, amount, reference_number, payment_proof, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
                [userId, serviceId, type || 'booking', transactionAmount, referenceNumber, paymentProof]
            );

            const [transaction] = await pool.execute(
                `SELECT t.*, s.title as service_title 
                FROM transactions t 
                LEFT JOIN services s ON t.service_id = s.id 
                WHERE t.id = ?`,
                [result.insertId]
            );

            console.log('✅ Transaction created:', result.insertId);

            res.status(201).json({
                message: 'Transaction created successfully',
                data: {
                    id: result.insertId,
                    ...transaction[0]
                },
                transaction: transaction[0]
            });
        } catch (error) {
            console.error('Error creating transaction:', error);
            res.status(500).json({ message: 'Failed to create transaction', error: error.message });
        }
    };

    // ✅ EXISTING FUNCTION - UNCHANGED
    exports.getUserTransactions = async (req, res) => {
        try {
            const { userId } = req.params;
            
            const [transactions] = await pool.execute(
                `SELECT t.*, s.title as service_title
                FROM transactions t
                LEFT JOIN services s ON t.service_id = s.id
                WHERE t.user_id = ?
                ORDER BY t.created_at DESC`,
                [userId]
            );
            
            res.json(transactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            res.status(500).json({ message: 'Failed to fetch transactions' });
        }
    };

    // ✅ EXISTING FUNCTION - UNCHANGED
    exports.updateTransactionStatus = async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const [result] = await pool.execute(
                'UPDATE transactions SET status = ? WHERE id = ?',
                [status, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Transaction not found' });
            }

            res.json({ message: 'Transaction status updated successfully' });
        } catch (error) {
            console.error('Error updating transaction:', error);
            res.status(500).json({ message: 'Failed to update transaction' });
        }
    };

    // ✅ EXISTING FUNCTION - UNCHANGED
    exports.getAllUserTransactions = async (req, res) => {
        try {
            const { userId } = req.params;

            const [transactions] = await pool.execute(
                `SELECT t.*, s.title as service_title
                FROM transactions t
                LEFT JOIN services s ON t.service_id = s.id
                WHERE t.user_id = ?`,
                [userId]
            );

            res.json(transactions);
        } catch (error) {
            console.error('Error fetching all transactions:', error);
            res.status(500).json({ message: 'Failed to fetch all transactions' });
        }
    };

    // ✅ EXISTING FUNCTION - UNCHANGED
    exports.deleteTransaction = async (req, res) => {
        try {
            const { id } = req.params;

            const [result] = await pool.execute(
                'DELETE FROM transactions WHERE id = ?',
                [id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Transaction not found' });
            }

            res.json({ message: 'Transaction deleted successfully' });
        } catch (error) {
            console.error('Error deleting transaction:', error);
            res.status(500).json({ message: 'Failed to delete transaction' });
        }
    };

    // ✅ MODIFIED FUNCTION - Now emits socket event when wallet request is created
    exports.createWalletRequest = async (req, res) => {
        try {
            const { userId, type, amount, referenceNumber, proofImage } = req.body;

            if (!userId || !type || !amount || !referenceNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            if (type === 'top-up' && !proofImage) {
                return res.status(400).json({
                    success: false,
                    message: 'Proof image is required for top-up'
                });
            }

            const [result] = await pool.execute(
                `INSERT INTO wallet_requests 
                (user_id, type, amount, reference_number, proof_image, status) 
                VALUES (?, ?, ?, ?, ?, 'pending')`,
                [
                    userId,
                    type,
                    parseFloat(amount),
                    referenceNumber,
                    proofImage || null
                ]
            );

            // ✅ Emit socket event to admin room for new wallet request
                try {
                const io = getIO();

                 console.log('🔊 Attempting to emit wallet-request-created to admin-room');
                console.log('📊 Current rooms:', io.sockets.adapter.rooms);
                console.log('📊 Admin room size:', io.sockets.adapter.rooms.get('admin-room')?.size || 0);
                
                // Emit to admin-room
                io.to('admin-room').emit('wallet-request-created', {
                    requestId: result.insertId,
                    userId,
                    type,
                    amount: parseFloat(amount),
                    referenceNumber,
                    timestamp: new Date()
                });
                
  console.log('✅ Socket event emitted: wallet-request-created to admin-room');
} catch (socketError) {
  console.warn('⚠️ Failed to emit socket event:', socketError.message);
  console.error(socketError);
}

            res.status(201).json({
                success: true,
                message: 'Wallet request created successfully',
                requestId: result.insertId
            });

        } catch (error) {
            console.error('Error creating wallet request:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create wallet request',
                error: error.message
            });
        }
    };

    // ✅ EXISTING FUNCTION - UNCHANGED
    exports.getWalletRequests = async (req, res) => {
        try {
            const [requests] = await pool.execute(
                `SELECT wr.*, u.full_name, u.email
                FROM wallet_requests wr
                JOIN users u ON wr.user_id = u.id
                ORDER BY wr.created_at DESC`
            );

            res.json({
                success: true,
                data: requests
            });
        } catch (error) {
            console.error('Error fetching wallet requests:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch wallet requests'
            });
        }
    };

    // ✅ MODIFIED FUNCTION - Now emits socket events and creates notifications
    exports.updateWalletRequestStatus = async (req, res) => {
        let connection;
        
        try {
            const requestId = parseInt(req.params.requestId || req.params.id, 10);
            const { status, userId, amount, type } = req.body;

            console.log('📝 Updating wallet request:', { requestId, status, userId, amount, type });

            if (!requestId || isNaN(requestId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid request ID is required'
                });
            }

            const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status'
                });
            }

            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Get the wallet request details
            const [requestRows] = await connection.execute(
                'SELECT * FROM wallet_requests WHERE id = ?',
                [requestId]
            );

            if (requestRows.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ success: false, message: 'Wallet request not found' });
            }

            const request = requestRows[0];
            const requestAmount = parseFloat(amount || request.amount);
            const feePercentage = 5.00;
            const feeAmount = (requestAmount * feePercentage) / 100;
            const netAmount = requestAmount - feeAmount;

            // Update wallet request status
            await connection.execute(
                'UPDATE wallet_requests SET status = ? WHERE id = ?',
                [status, requestId]
            );

            // ✅ CREATE NOTIFICATION based on status
            let notificationTitle = '';
            let notificationContent = '';
            let notificationType = '';

            if (status === 'approved' && request.type === 'top-up') {
                // Top-up: Add NET amount to user wallet
                await connection.execute(
                    'UPDATE wallet SET balance = balance + ? WHERE user_id = ?',
                    [netAmount, userId]
                );

                await recordPlatformFee(connection, requestId, userId, 'top-up', requestAmount);

                notificationTitle = '✅ Top-Up Approved';
                notificationContent = `Your top-up request of ₱${requestAmount} has been approved!\n\nYou received: ₱${netAmount} SC\nPlatform fee (5%): ₱${feeAmount}`;
                notificationType = 'wallet_topup_approved';

                console.log(`💰 Top-up approved: User receives ${netAmount} SC (${requestAmount} SC - ${feeAmount} SC fee)`);
                
            } else if (status === 'completed' && request.type === 'cash-out') {
                // Cash-out: Deduct ORIGINAL amount from user wallet
                await connection.execute(
                    'UPDATE wallet SET balance = balance - ? WHERE user_id = ?',
                    [requestAmount, userId]
                );

                await recordPlatformFee(connection, requestId, userId, 'cash-out', requestAmount);

                notificationTitle = '✅ Cash-Out Completed';
                notificationContent = `Your cash-out request has been completed!\n\nAmount deducted: ₱${requestAmount} SC\nYou'll receive: ₱${netAmount}\nPlatform fee (5%): ₱${feeAmount}`;
                notificationType = 'wallet_cashout_completed';

                console.log(`💸 Cash-out completed: User pays ${requestAmount} SC, receives ${netAmount} SC equivalent (${feeAmount} SC fee)`);
                
            } else if (status === 'rejected') {
                notificationTitle = '❌ Request Rejected';
                notificationContent = request.type === 'top-up' 
                    ? `Your top-up request of ₱${requestAmount} has been rejected. Please contact support if you have questions.`
                    : `Your cash-out request of ₱${requestAmount} has been rejected. Please contact support if you have questions.`;
                notificationType = 'wallet_request_rejected';
            }

            // ✅ INSERT NOTIFICATION into database
            if (notificationTitle && notificationContent) {
                await connection.execute(
                    `INSERT INTO notifications (user_id, type, title, content, \`read\`) 
                    VALUES (?, ?, ?, ?, FALSE)`,
                    [userId, notificationType, notificationTitle, notificationContent]
                );
            }

            await connection.commit();
            connection.release();

            // ✅ EMIT SOCKET EVENTS after successful commit
            try {
                const io = getIO();

                // 1. Emit to user's room for notification badge update
                if (notificationTitle && notificationContent) {
                    io.to(`user-${userId}`).emit('notification-created', {
                        userId,
                        type: notificationType,
                        title: notificationTitle,
                        content: notificationContent,
                        timestamp: new Date()
                    });
                    console.log(`✅ Notification emitted to user-${userId}`);
                }

                // 2. Emit wallet balance update to user
                io.to(`user-${userId}`).emit('wallet-balance-updated', {
                    userId,
                    requestId,
                    status,
                    type: request.type,
                    originalAmount: requestAmount,
                    feeAmount,
                    netAmount,
                    timestamp: new Date()
                });
                console.log(`✅ Wallet balance update emitted to user-${userId}`);

                // 3. Emit to admin room that request was processed
                io.to('admin-room').emit('wallet-request-updated', {
                    requestId,
                    userId,
                    status,
                    type: request.type,
                    timestamp: new Date()
                });
                console.log('✅ Wallet request update emitted to admin-room');

            } catch (socketError) {
                console.warn('⚠️ Failed to emit socket events:', socketError.message);
            }

            res.json({
                success: true,
                message: 'Request status updated successfully',
                feeCharged: (status === 'approved' || status === 'completed') ? feeAmount : 0,
                netAmount: (status === 'approved' || status === 'completed') ? netAmount : requestAmount
            });

        } catch (error) {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
            console.error('Error updating wallet request:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update wallet request',
                error: error.message
            });
        }
    };

    // ✅ EXISTING FUNCTION - UNCHANGED
    exports.getRevenueStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let dateFilter = '';
        const params = [];

        if (startDate && endDate) {
        dateFilter = 'WHERE created_at BETWEEN ? AND ?';
        params.push(startDate, endDate);
        } else if (startDate) {
        dateFilter = 'WHERE created_at >= ?';
        params.push(startDate);
        } else if (endDate) {
        dateFilter = 'WHERE created_at <= ?';
        params.push(endDate);
        }

        const [revenueByType] = await pool.execute(
        `SELECT 
            transaction_type,
            COUNT(*) as transaction_count,
            SUM(original_amount) as total_original_amount,
            SUM(fee_amount) as total_fee_revenue,
            SUM(net_amount) as total_net_amount
        FROM platform_revenue
        ${dateFilter}
        GROUP BY transaction_type`,
        params
        );

        const [monthlyRevenue] = await pool.execute(
        `SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as month,
            transaction_type,
            COUNT(*) as transaction_count,
            SUM(fee_amount) as monthly_fee_revenue
        FROM platform_revenue
        ${dateFilter}
        GROUP BY month, transaction_type
        ORDER BY month DESC`,
        params
        );

        const [totalRevenue] = await pool.execute(
        `SELECT 
            SUM(fee_amount) as total_platform_revenue,
            COUNT(*) as total_transactions,
            SUM(CASE WHEN transaction_type = 'top-up' THEN fee_amount ELSE 0 END) as topup_revenue,
            SUM(CASE WHEN transaction_type = 'cash-out' THEN fee_amount ELSE 0 END) as cashout_revenue,
            SUM(CASE WHEN transaction_type = 'top-up' THEN 1 ELSE 0 END) as topup_count,
            SUM(CASE WHEN transaction_type = 'cash-out' THEN 1 ELSE 0 END) as cashout_count
        FROM platform_revenue
        ${dateFilter}`,
        params
        );

        const [dailyRevenue] = await pool.execute(
        `SELECT 
            DATE(created_at) as date,
            SUM(fee_amount) as daily_revenue,
            COUNT(*) as daily_transactions
        FROM platform_revenue
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC`,
        []
        );

        res.json({
        success: true,
        data: {
            revenueByType: revenueByType || [],
            monthlyRevenue: monthlyRevenue || [],
            totalRevenue: totalRevenue[0] || {
            total_platform_revenue: 0,
            total_transactions: 0,
            topup_revenue: 0,
            cashout_revenue: 0,
            topup_count: 0,
            cashout_count: 0
            },
            dailyRevenue: dailyRevenue || []
        }
        });

    } catch (error) {
        console.error('Error fetching revenue stats:', error);
        res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch revenue statistics',
        error: error.message 
        });
    }
    };

    // ✅ EXISTING FUNCTION - UNCHANGED
    exports.getRevenueTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, startDate, endDate } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        const params = [];

        if (type && (type === 'top-up' || type === 'cash-out')) {
        whereConditions.push('pr.transaction_type = ?');
        params.push(type);
        }

        if (startDate) {
        whereConditions.push('pr.created_at >= ?');
        params.push(startDate);
        }

        if (endDate) {
        whereConditions.push('pr.created_at <= ?');
        params.push(endDate);
        }

        const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ') 
        : '';

        const [transactions] = await pool.execute(
        `SELECT 
            pr.*,
            u.full_name,
            u.email,
            u.role,
            wr.reference_number
        FROM platform_revenue pr
        JOIN users u ON pr.user_id = u.id
        LEFT JOIN wallet_requests wr ON pr.wallet_request_id = wr.id
        ${whereClause}
        ORDER BY pr.created_at DESC
        LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
        );

        const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total
        FROM platform_revenue pr
        ${whereClause}`,
        params
        );

        const totalCount = countResult[0].total;
        const totalPages = Math.ceil(totalCount / limit);

        res.json({
        success: true,
        data: transactions,
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount,
            limit: parseInt(limit)
        }
        });

    } catch (error) {
        console.error('Error fetching revenue transactions:', error);
        res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch revenue transactions',
        error: error.message 
        });
    }
    };