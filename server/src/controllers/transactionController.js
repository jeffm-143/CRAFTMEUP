const pool = require('../config/database');

exports.createTransaction = async (req, res) => {
    try {
        const { userId, serviceId, type, amount, referenceNumber } = req.body;
        const paymentProof = req.file ? '/uploads/' + req.file.filename : null;

        console.log('📝 Creating transaction:', { userId, serviceId, amount });

        // ✅ Validate required fields
        if (!userId || !serviceId || !amount) {
            return res.status(400).json({ 
                message: 'Missing required fields: userId, serviceId, amount' 
            });
        }

        // ✅ Use the amount provided (which should be the service price at booking time)
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

exports.updateWalletRequestStatus = async (req, res) => {
    try {
        const requestId = parseInt(req.params.requestId || req.params.id, 10);
        const { status, userId, amount, type } = req.body;

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

        const [result] = await pool.execute(
            `UPDATE wallet_requests SET status = ? WHERE id = ?`,
            [status, requestId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        res.json({
            success: true,
            message: 'Request status updated successfully'
        });
    } catch (error) {
        console.error('Error updating wallet request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update wallet request'
        });
    }
};