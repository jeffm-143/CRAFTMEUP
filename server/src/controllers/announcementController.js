const pool = require('../config/database');
let io;

const setIO = (socketInstance) => {
  io = socketInstance;
  console.log('✅ Socket.IO initialized in announcementController');
};

const createAnnouncement = async (req, res) => {
    try {
        const { title, content, targetAudience, expirationDate } = req.body;
        
        console.log('Creating announcement:', { title, content, targetAudience, expirationDate });

        if (!title || !content || !targetAudience) {
          return res.status(400).json({ 
            message: 'Missing required fields: title, content, targetAudience' 
          });
        }

        const [result] = await pool.execute(
            `INSERT INTO announcements (
                title, 
                content, 
                target_audience, 
                expiration_date, 
                status,
                created_at
            ) VALUES (?, ?, ?, ?, 'active', NOW())`,
            [title, content, targetAudience, expirationDate || null]
        );

        const [newAnnouncement] = await pool.execute(
            'SELECT * FROM announcements WHERE id = ?',
            [result.insertId]
        );

        // ✅ Emit to all clients
        if (io) {
          console.log('📡 Broadcasting announcement-created event');
          io.emit('announcement-created', newAnnouncement[0]);
        }

        res.status(201).json({
            message: 'Announcement created successfully',
            announcement: newAnnouncement[0]
        });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ 
            message: 'Failed to create announcement',
            error: error.message 
        });
    }
};

const getAnnouncements = async (req, res) => {
    try {
        const [announcements] = await pool.execute(
            `SELECT * FROM announcements 
             WHERE status = 'active' 
             AND (expiration_date IS NULL OR expiration_date > NOW())
             ORDER BY created_at DESC`
        );
        
        console.log('✅ Fetched announcements:', announcements.length, 'found');
        res.json(announcements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ 
            message: 'Failed to fetch announcements',
            error: error.message 
        });
    }
};

const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
          return res.status(400).json({ message: 'Announcement ID is required' });
        }

        const [result] = await pool.execute(
            'DELETE FROM announcements WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // ✅ Emit to all clients
        if (io) {
          console.log('📡 Broadcasting announcement-deleted event');
          io.emit('announcement-deleted', id);
        }

        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ message: 'Failed to delete announcement' });
    }
};

const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, targetAudience, expirationDate } = req.body;

        if (!id) {
          return res.status(400).json({ message: 'Announcement ID is required' });
        }

        if (!title || !content || !targetAudience) {
          return res.status(400).json({ 
            message: 'Missing required fields: title, content, targetAudience' 
          });
        }

        const [result] = await pool.execute(
            `UPDATE announcements 
             SET title = ?, 
                 content = ?, 
                 target_audience = ?, 
                 expiration_date = ?,
                 updated_at = NOW()
             WHERE id = ?`,
            [title, content, targetAudience, expirationDate || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        const [updatedAnnouncement] = await pool.execute(
            'SELECT * FROM announcements WHERE id = ?',
            [id]
        );

        // ✅ Emit to all clients
        if (io) {
          console.log('📡 Broadcasting announcement-updated event');
          io.emit('announcement-updated', updatedAnnouncement[0]);
        }

        res.json({
            message: 'Announcement updated successfully',
            announcement: updatedAnnouncement[0]
        });
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({ message: 'Failed to update announcement' });
    }
};

// ✅ PROPER EXPORTS
module.exports = {
  setIO,
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  updateAnnouncement
};