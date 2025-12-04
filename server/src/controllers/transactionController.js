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

// Add a function to get all transactions for a user
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

// Add a function to delete a transaction
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