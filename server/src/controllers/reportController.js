const db = require('../config/database');

exports.getAllReports = async (req, res) => {
  try {
    console.log('Fetching reports...');
    
    const query = `
      SELECT 
        r.*,
        u1.full_name as reported_user_name,
        u2.full_name as reporter_name,
        u1.email as reported_user_email,
        u2.email as reporter_email
      FROM reports r
      LEFT JOIN users u1 ON r.reported_user_id = u1.id
      LEFT JOIN users u2 ON r.reporter_id = u2.id
      ORDER BY r.created_at DESC
    `;
    
    const [reports] = await db.execute(query);
    console.log('Raw reports from DB:', reports);

    const formattedReports = reports.map(report => ({
      id: report.id,
      reported_user_id: report.reported_user_id,
      reporter_id: report.reporter_id,
      reported_user_name: report.reported_user_name || 'Unknown User',
      reporter_name: report.reporter_name || 'Unknown User',
      reported_user_email: report.reported_user_email,
      reporter_email: report.reporter_email,
      reason: report.reason,
      description: report.description,
      status: report.status || 'pending',
      violation_type: report.violation_type,
      created_at: report.created_at,
      updated_at: report.updated_at
    }));

    console.log('Formatted reports:', formattedReports);
    res.json(formattedReports);
  } catch (error) {
    console.error('Error in getAllReports:', error);
    res.status(500).json({ 
      error: 'Failed to fetch reports',
      details: error.message 
    });
  }
};

exports.submitReport = async (req, res) => {
  try {
    const { reported_user_id, reporter_id, reason, description } = req.body;
    
    const query = `
      INSERT INTO reports 
      (reported_user_id, reporter_id, reason, description, status, created_at) 
      VALUES (?, ?, ?, ?, 'pending', NOW())
    `;
    
    const [result] = await db.execute(query, [
      reported_user_id,
      reporter_id,
      reason,
      description
    ]);

    res.status(201).json({
      message: 'Report submitted successfully',
      reportId: result.insertId
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, violationType } = req.body;
    
    console.log('Updating report:', { id, status, violationType }); // Add logging

    // Validate required parameters
    if (!id || !status) {
      console.log('Missing parameters:', { id, status });
      return res.status(400).json({ 
        success: false,
        message: 'Missing required parameters' 
      });
    }

    const query = `
      UPDATE reports 
      SET 
        status = ?,
        violation_type = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    
    const values = [status, violationType, id];
    console.log('Executing query with values:', values);

    const [result] = await db.execute(query, values);

    if (result.affectedRows === 0) {
      console.log('No report found with id:', id);
      return res.status(404).json({ 
        success: false,
        message: 'Report not found' 
      });
    }
    
    // Send success response
    res.status(200).json({ 
      success: true,
      message: 'Report status updated successfully',
      data: {
        id,
        status,
        violationType,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update report status',
      error: error.message 
    });
  }
};

exports.getUserReportHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT 
        r.*,
        u1.full_name as reported_user_name,
        u2.full_name as reporter_name
      FROM reports r
      LEFT JOIN users u1 ON r.reported_user_id = u1.id
      LEFT JOIN users u2 ON r.reporter_id = u2.id
      WHERE r.reported_user_id = ?
      ORDER BY r.created_at DESC
    `;
    
    const [reports] = await db.execute(query, [userId]);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching user report history:', error);
    res.status(500).json({ error: 'Failed to fetch report history' });
  }
};