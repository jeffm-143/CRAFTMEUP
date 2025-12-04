const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const upload = require('../middleware/upload');
const db = require('../config/database');

router.post('/create', upload.single('paymentProof'), transactionController.createTransaction);
router.put('/:id/status', transactionController.updateTransactionStatus);

// ✅ Get user transactions (both as learner and tutor) - FIXED TO USE t.amount
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT 
        t.id,
        t.user_id,
        t.service_id,
        t.amount as price,
        t.status,
        t.created_at,
        t.updated_at,
        s.user_id as service_provider_id,
        s.user_id as provider_id,
        s.title as service_title,
        s.description,
        u_requester.full_name as requester_name,
        u_provider.full_name as provider_name,
        CASE 
          WHEN s.user_id = ? THEN 1
          ELSE 0
        END as is_provider
      FROM transactions t
      JOIN services s ON t.service_id = s.id
      LEFT JOIN users u_requester ON t.user_id = u_requester.id
      LEFT JOIN users u_provider ON s.user_id = u_provider.id
      WHERE t.user_id = ? OR s.user_id = ?
      ORDER BY t.created_at DESC
    `;
    
    const [transactions] = await db.query(query, [userId, userId, userId]);
    console.log('✅ Fetched transactions:', transactions.length);
    res.json(transactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get earnings (SC earned by tutor)
router.get('/earnings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT 
        SUM(t.amount) as total_earnings,
        COUNT(t.id) as total_bookings
      FROM transactions t
      JOIN services s ON t.service_id = s.id
      WHERE s.user_id = ? AND t.status = 'completed'
    `;
    
    const [result] = await db.query(query, [userId]);
    const earnings = result[0]?.total_earnings || 0;
    
    console.log(`✅ Earnings for tutor ${userId}:`, earnings);
    res.json({ 
      earnings: parseFloat(earnings),
      total_bookings: result[0]?.total_bookings || 0
    });
  } catch (error) {
    console.error('Error calculating earnings:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get spent (SC spent by learner)
router.get('/spent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT 
        SUM(t.amount) as total_spent,
        COUNT(t.id) as total_bookings
      FROM transactions t
      WHERE t.user_id = ? AND t.status = 'completed'
    `;
    
    const [result] = await db.query(query, [userId]);
    const spent = result[0]?.total_spent || 0;
    
    console.log(`✅ Spent for learner ${userId}:`, spent);
    res.json({ 
      spent: parseFloat(spent),
      total_bookings: result[0]?.total_bookings || 0
    });
  } catch (error) {
    console.error('Error calculating spent:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get earnings and spent for this month only (with proper net calculation)
router.get('/monthly/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // ✅ Get gross earnings (this month) - Money earned as service provider
    const earningsQuery = `
      SELECT 
        COALESCE(SUM(t.amount), 0) as total_earnings
      FROM transactions t
      JOIN services s ON t.service_id = s.id
      WHERE s.user_id = ? 
        AND t.status = 'completed'
        AND MONTH(t.created_at) = MONTH(CURRENT_DATE())
        AND YEAR(t.created_at) = YEAR(CURRENT_DATE())
    `;
    
    // ✅ Get total spent (this month) - Money paid as service requester
    const spentQuery = `
      SELECT 
        COALESCE(SUM(t.amount), 0) as total_spent
      FROM transactions t
      WHERE t.user_id = ? 
        AND t.status = 'completed'
        AND MONTH(t.created_at) = MONTH(CURRENT_DATE())
        AND YEAR(t.created_at) = YEAR(CURRENT_DATE())
    `;
    
    // ✅ Calculate NET earnings (earnings - spent)
    const netQuery = `
      SELECT 
        COALESCE(SUM(CASE 
          WHEN s.user_id = ? THEN t.amount 
          ELSE 0 
        END), 0) as gross_earnings,
        COALESCE(SUM(CASE 
          WHEN t.user_id = ? THEN t.amount 
          ELSE 0 
        END), 0) as total_spent,
        COALESCE(SUM(CASE 
          WHEN s.user_id = ? THEN t.amount 
          ELSE 0 
        END), 0) - COALESCE(SUM(CASE 
          WHEN t.user_id = ? THEN t.amount 
          ELSE 0 
        END), 0) as net_earnings
      FROM transactions t
      JOIN services s ON t.service_id = s.id
      WHERE (s.user_id = ? OR t.user_id = ?)
        AND t.status = 'completed'
        AND MONTH(t.created_at) = MONTH(CURRENT_DATE())
        AND YEAR(t.created_at) = YEAR(CURRENT_DATE())
    `;
    
    const [earningsResult] = await db.query(earningsQuery, [userId]);
    const [spentResult] = await db.query(spentQuery, [userId]);
    const [netResult] = await db.query(netQuery, [userId, userId, userId, userId, userId, userId]);
    
    const earnings = parseFloat(earningsResult[0]?.total_earnings || 0);
    const spent = parseFloat(spentResult[0]?.total_spent || 0);
    const netEarnings = parseFloat(netResult[0]?.net_earnings || 0);
    
    console.log(`✅ Monthly stats for user ${userId}:`, { 
      gross_earnings: earnings,
      total_spent: spent,
      net_earnings: netEarnings
    });
    
    res.json({ 
      earnings: earnings,
      spent: spent,
      net_earnings: netEarnings,
      month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
    });
  } catch (error) {
    console.error('Error calculating monthly stats:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/wallet/request', upload.single('proofImage'), async (req, res) => {
  try {
    const { userId, type, amount, referenceNumber } = req.body;
    const proofImage = req.file ? req.file.filename : null;

    if (!userId || !type || !amount || !referenceNumber) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let [wallet] = await db.query('SELECT * FROM wallet WHERE user_id = ?', [userId]);
    
    if (wallet.length === 0) {
      await db.query(
        'INSERT INTO wallet (user_id, balance) VALUES (?, ?)',
        [userId, 50.00]
      );
      wallet = [{ balance: 50.00 }];
    }

    if (type === 'cash-out' && wallet[0].balance < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const [result] = await db.query(
      'INSERT INTO wallet_requests (user_id, type, amount, reference_number, proof_image, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, type, amount, referenceNumber, proofImage, 'pending']
    );

    res.json({ 
      success: true,
      message: 'Request submitted successfully',
      requestId: result.insertId
    });
  } catch (error) {
    console.error('Error creating wallet request:', error);
    res.status(500).json({ message: 'Failed to submit request' });
  }
});

router.get('/wallet/:userId/balance', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('Getting balance for user:', userId);

    let [wallet] = await db.query('SELECT * FROM wallet WHERE user_id = ?', [userId]);
    
    if (wallet.length === 0) {
      await db.query(
        'INSERT INTO wallet (user_id, balance) VALUES (?, ?)',
        [userId, 50.00]
      );
      return res.json({ balance: 50.00 });
    }
    
    console.log('Found wallet:', wallet[0]);
    return res.json({ balance: parseFloat(wallet[0].balance) });

  } catch (error) {
    console.error('Error getting wallet balance:', error);
    res.status(500).json({ error: 'Failed to get wallet balance' });
  }
});

router.get('/wallet/requests', async (req, res) => {
  try {
    const [requests] = await db.query(`
      SELECT 
        wr.*,
        u.full_name,
        u.email,
        CONCAT('http://localhost:5000/uploads/', wr.proof_image) as proof_image_url
      FROM wallet_requests wr
      LEFT JOIN users u ON wr.user_id = u.id
      ORDER BY 
        CASE 
          WHEN wr.status = 'pending' THEN 0 
          ELSE 1 
        END,
        wr.created_at DESC
    `);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching wallet requests:', error);
    res.status(500).json({ message: 'Failed to fetch wallet requests' });
  }
});

router.put('/wallet/requests/:id/status', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { status, userId, amount, type } = req.body;
    
    await connection.query(
      'UPDATE wallet_requests SET status = ? WHERE id = ?',
      [status, id]
    );

    if (type !== 'none') {
      const [wallet] = await connection.query(
        'SELECT balance FROM wallet WHERE user_id = ?',
        [userId]
      );

      if (wallet.length === 0) {
        throw new Error('Wallet not found');
      }

      const currentBalance = parseFloat(wallet[0].balance);
      const updateAmount = type === 'credit' ? amount : -amount;
      const newBalance = currentBalance + updateAmount;

      if (type === 'debit' && newBalance < 0) {
        throw new Error('Insufficient balance');
      }

      await connection.query(
        'UPDATE wallet SET balance = ? WHERE user_id = ?',
        [newBalance, userId]
      );
    }

    await connection.commit();
    res.json({ success: true });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating wallet request:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to update request status'
    });
  } finally {
    connection.release();
  }
});

router.get('/wallet/history/:userId', async (req, res) => {
  try {
    const [transactions] = await db.query(
      'SELECT * FROM wallet_requests WHERE user_id = ? ORDER BY created_at DESC',
      [req.params.userId]
    );
    res.json(transactions);
  } catch (error) {
    console.error('Error getting wallet history:', error);
    res.status(500).json({ error: 'Failed to get wallet history' });
  }
});

module.exports = router;