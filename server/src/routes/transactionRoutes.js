const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const upload = require('../middleware/upload');
const db = require('../config/database');

router.post('/create', upload.single('paymentProof'), transactionController.createTransaction);
router.get('/user/:userId', transactionController.getUserTransactions);
router.put('/:id/status', transactionController.updateTransactionStatus);

router.post('/wallet/request', upload.single('proofImage'), async (req, res) => {
  try {
    const { userId, type, amount, referenceNumber } = req.body;
    const proofImage = req.file ? req.file.filename : null;

    // Validate input
    if (!userId || !type || !amount || !referenceNumber) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get current wallet
    let [wallet] = await db.query('SELECT * FROM wallet WHERE user_id = ?', [userId]);
    
    // Create wallet if doesn't exist
    if (wallet.length === 0) {
      await db.query(
        'INSERT INTO wallet (user_id, balance) VALUES (?, ?)',
        [userId, 50.00]
      );
      wallet = [{ balance: 50.00 }];
    }
        // For cash-out, check sufficient balance
    if (type === 'cash-out' && wallet[0].balance < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create request
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

    // First check if wallet exists
    let [wallet] = await db.query('SELECT * FROM wallet WHERE user_id = ?', [userId]);
    
    if (wallet.length === 0) {
      // Create new wallet with initial balance
      await db.query(
        'INSERT INTO wallet (user_id, balance) VALUES (?, ?)',
        [userId, 50.00]
      );
      return res.json({ balance: 50.00 });
    }
    
    // Return existing wallet balance
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
    
    // Update request status
    await connection.query(
      'UPDATE wallet_requests SET status = ? WHERE id = ?',
      [status, id]
    );

    // Update wallet balance if needed
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
