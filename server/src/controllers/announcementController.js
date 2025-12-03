const pool = require('../config/database');

exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content, targetAudience, expirationDate } = req.body;
        
        console.log('Creating announcement:', { title, content, targetAudience, expirationDate });

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

        // Fetch the created announcement
        const [newAnnouncement] = await pool.execute(
            'SELECT * FROM announcements WHERE id = ?',
            [result.insertId]
        );

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

exports.getAnnouncements = async (req, res) => {
    try {
        const [announcements] = await pool.execute(
            `SELECT * FROM announcements 
             WHERE status = 'active' 
             AND (expiration_date IS NULL OR expiration_date > NOW())
             ORDER BY created_at DESC`
        );
        
        console.log('Fetched announcements:', announcements);
        res.json(announcements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ 
            message: 'Failed to fetch announcements',
            error: error.message 
        });
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            'DELETE FROM announcements WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ message: 'Failed to delete announcement' });
    }
};

exports.updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, targetAudience, expirationDate } = req.body;

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

        res.json({
            message: 'Announcement updated successfully',
            announcement: updatedAnnouncement[0]
        });
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({ message: 'Failed to update announcement' });
    }
};
