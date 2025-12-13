const db = require('../config/database');
const { getIO } = require('../config/socket');

exports.submitReport = async (req, res) => {
  try {
    const { reported_user_id, reporter_id, reason, description, booking_id } = req.body;
    
    // ✅ Enhanced validation - check for empty strings too
    if (!reported_user_id || !reporter_id || !reason || !description) {
      console.log('❌ Validation failed - missing fields:', { 
        reported_user_id, 
        reporter_id, 
        reason: reason || 'EMPTY', 
        description: description || 'EMPTY' 
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // ✅ Check for empty strings after trim
    const trimmedReason = String(reason).trim();
    const trimmedDescription = String(description).trim();
    
    if (!trimmedReason || !trimmedDescription) {
      console.log('❌ Validation failed - empty strings after trim');
      return res.status(400).json({
        success: false,
        message: 'Reason and description cannot be empty'
      });
    }

    console.log('📝 Creating new report:', { 
      reported_user_id, 
      reporter_id, 
      reason: trimmedReason, 
      description: trimmedDescription,
      booking_id 
    });

    const query = `
      INSERT INTO reports 
      (reported_user_id, reporter_id, reason, description, booking_id, status, created_at) 
      VALUES (?, ?, ?, ?, ?, 'pending', NOW())
    `;
    
    const [result] = await db.execute(query, [
      reported_user_id,
      reporter_id,
      trimmedReason,
      trimmedDescription,
      booking_id || null
    ]);

    console.log('✅ Report created with ID:', result.insertId);

    // ✅ Emit socket event to notify admin dashboard
    const io = getIO();
    io.emit('report-created', {
      reportId: result.insertId,
      reportedUserId: reported_user_id,
      reporterUserId: reporter_id,
      reason: trimmedReason,
      timestamp: new Date()
    });
    
    console.log('✅ Socket event emitted: report-created');

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      reportId: result.insertId
    });
  } catch (error) {
    console.error('❌ Error submitting report:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit report',
      details: error.message
    });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    console.log('📋 Fetching all reports...');
    
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
      ORDER BY 
        CASE 
          WHEN r.status = 'pending' OR r.status IS NULL THEN 0 
          ELSE 1 
        END,
        r.created_at DESC
    `;
    
    const [reports] = await db.execute(query);
    console.log(`✅ Found ${reports.length} reports`);

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
      booking_id: report.booking_id,
      status: report.status || 'pending',
      violationType: report.violation_type,
      adminNotes: report.admin_notes,
      created_at: report.created_at,
      updated_at: report.updated_at
    }));

    res.json(formattedReports);
  } catch (error) {
    console.error('❌ Error fetching reports:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch reports',
      details: error.message 
    });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, violationType, adminNotes } = req.body;
    
    console.log('📥 Received parameters:', { id, status, violationType, adminNotes });

    if (!id || !status) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required parameters' 
      });
    }

    // Get full report details including booking info
    const [reports] = await db.execute(`
      SELECT 
        r.*,
        u_reported.full_name as reported_user_name,
        u_reported.email as reported_user_email,
        u_reporter.full_name as reporter_name,
        u_reporter.email as reporter_email,
        t.amount as booking_amount
      FROM reports r
      LEFT JOIN users u_reported ON r.reported_user_id = u_reported.id
      LEFT JOIN users u_reporter ON r.reporter_id = u_reporter.id
      LEFT JOIN transactions t ON r.booking_id = t.id
      WHERE r.id = ?
    `, [id]);

    if (reports.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Report not found' 
      });
    }

    const report = reports[0];
    const io = getIO();

    // Update report status in database
    await db.execute(
      `UPDATE reports 
      SET status = ?, violation_type = ?, admin_notes = ?, updated_at = NOW() 
      WHERE id = ?`,
      [status, violationType || 'minor', adminNotes, id]
    );

    console.log('✅ Report status updated in database');

    // Handle different resolution types
    if (status === 'invalid') {
      await db.execute(
        `INSERT INTO notifications (user_id, type, title, content, \`read\`, created_at) 
         VALUES (?, ?, ?, ?, 0, NOW())`,
        [
          report.reporter_id,
          'report_resolved',
          '❌ Report Resolved - Invalid',
          `Your report against ${report.reported_user_name} was reviewed and marked as invalid. No violation was found.`
        ]
      );

      io.to(`user-${report.reporter_id}`).emit('new-notification', {
        type: 'report_resolved',
        title: '❌ Report Resolved - Invalid',
        content: `Your report against ${report.reported_user_name} was reviewed and marked as invalid.`,
        timestamp: new Date()
      });

    } else if (status === 'warning') {
      // Count previous warnings
      const [warningCount] = await db.execute(
        `SELECT COUNT(*) as count FROM reports 
         WHERE reported_user_id = ? AND status = 'warning' AND id != ?`,
        [report.reported_user_id, id]
      );

      const totalWarnings = warningCount[0].count + 1;
      console.log(`⚠️ User ${report.reported_user_id} has ${totalWarnings} warning(s)`);

      // Process refund if booking exists
      const refundAmount = report.booking_id && report.booking_amount 
        ? parseFloat(report.booking_amount) * 0.70 
        : 0;

      if (report.booking_id && refundAmount > 0) {
        const [wallets] = await db.execute(
          'SELECT balance FROM wallet WHERE user_id = ?',
          [report.reporter_id]
        );

        if (wallets.length === 0) {
          await db.execute(
            'INSERT INTO wallet (user_id, balance) VALUES (?, ?)',
            [report.reporter_id, refundAmount]
          );
        } else {
          const newBalance = parseFloat(wallets[0].balance) + refundAmount;
          await db.execute(
            'UPDATE wallet SET balance = ? WHERE user_id = ?',
            [newBalance, report.reporter_id]
          );
        }

        io.to(`user-${report.reporter_id}`).emit('wallet-updated', {
          userId: report.reporter_id,
          newBalance: wallets[0] ? parseFloat(wallets[0].balance) + refundAmount : refundAmount
        });
      }

      // Check for 3rd warning suspension
      let suspensionMessage = '';
      if (totalWarnings >= 3) {
        const suspensionEnd = new Date();
        suspensionEnd.setDate(suspensionEnd.getDate() + 5);

        await db.execute(
          `UPDATE users 
           SET suspended = 1, suspension_end = ?, suspension_reason = ? 
           WHERE id = ?`,
          [suspensionEnd, `${violationType} violation - 3rd Warning`, report.reported_user_id]
        );

        suspensionMessage = ` This is your 3rd warning. Your account has been suspended for 5 days until ${suspensionEnd.toLocaleDateString()}.`;
      } else {
        suspensionMessage = ` You now have ${totalWarnings}/3 warnings.`;
      }

      // Notify reported user
      await db.execute(
        `INSERT INTO notifications (user_id, type, title, content, \`read\`, created_at, dismissible) 
         VALUES (?, ?, ?, ?, 0, NOW(), ?)`,
        [
          report.reported_user_id,
          totalWarnings >= 3 ? 'account_suspended' : 'account_warning',
          totalWarnings >= 3 ? '🚫 Account Suspended (3rd Warning)' : '⚠️ Account Warning',
          `You received a warning for ${violationType} violation.${suspensionMessage}`,
          totalWarnings >= 3 ? 1 : 0
        ]
      );

      io.to(`user-${report.reported_user_id}`).emit('new-notification', {
        type: totalWarnings >= 3 ? 'account_suspended' : 'account_warning',
        title: totalWarnings >= 3 ? '🚫 Account Suspended (3rd Warning)' : '⚠️ Account Warning',
        content: `You received a warning for ${violationType} violation.${suspensionMessage}`,
        timestamp: new Date()
      });

      // Notify reporter
      const reporterMessage = report.booking_id 
        ? `Your report was resolved. The user received a warning (${totalWarnings}/3). You've been refunded ${refundAmount.toFixed(2)} SC (70%).`
        : `Your report was resolved. The user received a warning (${totalWarnings}/3).`;

      await db.execute(
        `INSERT INTO notifications (user_id, type, title, content, \`read\`, created_at) 
         VALUES (?, ?, ?, ?, 0, NOW())`,
        [
          report.reporter_id,
          'report_resolved',
          '✅ Report Resolved - Warning Issued',
          reporterMessage
        ]
      );

      io.to(`user-${report.reporter_id}`).emit('new-notification', {
        type: 'report_resolved',
        title: '✅ Report Resolved - Warning Issued',
        content: reporterMessage,
        timestamp: new Date()
      });

    } else if (status === 'suspended') {
      // Direct suspension
      const refundAmount = report.booking_id && report.booking_amount 
        ? parseFloat(report.booking_amount) * 0.70 
        : 0;

      if (report.booking_id && refundAmount > 0) {
        const [wallets] = await db.execute(
          'SELECT balance FROM wallet WHERE user_id = ?',
          [report.reporter_id]
        );

        if (wallets.length === 0) {
          await db.execute(
            'INSERT INTO wallet (user_id, balance) VALUES (?, ?)',
            [report.reporter_id, refundAmount]
          );
        } else {
          const newBalance = parseFloat(wallets[0].balance) + refundAmount;
          await db.execute(
            'UPDATE wallet SET balance = ? WHERE user_id = ?',
            [newBalance, report.reporter_id]
          );
        }

        io.to(`user-${report.reporter_id}`).emit('wallet-updated', {
          userId: report.reporter_id,
          newBalance: wallets[0] ? parseFloat(wallets[0].balance) + refundAmount : refundAmount
        });
      }

      // Suspend for 5 days
      const suspensionEnd = new Date();
      suspensionEnd.setDate(suspensionEnd.getDate() + 5);

      await db.execute(
        `UPDATE users 
         SET suspended = 1, suspension_end = ?, suspension_reason = ? 
         WHERE id = ?`,
        [suspensionEnd, `${violationType} violation - Account Suspended`, report.reported_user_id]
      );

      // Notify reported user
      await db.execute(
        `INSERT INTO notifications (user_id, type, title, content, \`read\`, created_at, dismissible) 
         VALUES (?, ?, ?, ?, 0, NOW(), 1)`,
        [
          report.reported_user_id,
          'account_suspended',
          '🚫 Account Suspended',
          `Your account has been suspended for ${violationType} violation. Suspension period: 5 days until ${suspensionEnd.toLocaleDateString()}.`
        ]
      );

      io.to(`user-${report.reported_user_id}`).emit('new-notification', {
        type: 'account_suspended',
        title: '🚫 Account Suspended',
        content: `Your account has been suspended for ${violationType} violation. Suspension period: 5 days until ${suspensionEnd.toLocaleDateString()}.`,
        timestamp: new Date()
      });

      // Notify reporter
      const reporterMessage = report.booking_id 
        ? `Your report was resolved. The user's account has been suspended for 5 days. You've been refunded ${refundAmount.toFixed(2)} SC (70%).`
        : `Your report was resolved. The user's account has been suspended for 5 days.`;

      await db.execute(
        `INSERT INTO notifications (user_id, type, title, content, \`read\`, created_at) 
         VALUES (?, ?, ?, ?, 0, NOW())`,
        [
          report.reporter_id,
          'report_resolved',
          '✅ Report Resolved - Account Suspended',
          reporterMessage
        ]
      );

      io.to(`user-${report.reporter_id}`).emit('new-notification', {
        type: 'report_resolved',
        title: '✅ Report Resolved - Account Suspended',
        content: reporterMessage,
        timestamp: new Date()
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Report resolved successfully'
    });

  } catch (error) {
    console.error('❌ Error updating report status:', error);
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
      WHERE r.reporter_id = ? OR r.reported_user_id = ?
      ORDER BY r.created_at DESC
    `;
    
    const [reports] = await db.execute(query, [userId, userId]);
    res.json(reports);
  } catch (error) {
    console.error('❌ Error fetching report history:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch report history' 
    });
  }
};