const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const path = require('path');
const pool = require('../config/database');
const nodemailer = require('nodemailer');

// Configure nodemailer with SERVICE email (not user's email)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  },
  secure: false,
  requireTLS: true
});

// Test connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email service error:', error);
  } else {
    console.log('✓ Email service is ready');
  }
});

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendEmail = async (recipientEmail, subject, htmlContent) => {
  try {
    await transporter.sendMail({
      from: `"CraftMeUp" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlContent
    });
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Login controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        course: user.course,
        year: user.year,
        verified: user.verification_status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Register controller
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, course, year, role } = req.body;

    const studentIdBuffer = req.files?.studentId ? req.files.studentId[0].buffer : null;
    const studyLoadBuffer = req.files?.studyLoad ? req.files.studyLoad[0].buffer : null;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      `INSERT INTO users (
        full_name, email, password, course, year, role, 
        student_id_file, study_load_file, verification_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        fullName, email, hashedPassword, course || null, year || null, role,
        studentIdBuffer, studyLoadBuffer
      ]
    );

    const token = jwt.sign(
      { userId: result.insertId, email, role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.insertId,
        email,
        fullName,
        role,
        course,
        year
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Get unverified users for admin
exports.getUnverifiedUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, full_name, email, course, year, role, 
              student_id_file, study_load_file, verification_status 
       FROM users WHERE verification_status = 'pending'`
    );

    const usersWithBase64 = users.map(user => ({
      ...user,
      student_id_file: user.student_id_file ? Buffer.from(user.student_id_file).toString('base64') : null,
      study_load_file: user.study_load_file ? Buffer.from(user.study_load_file).toString('base64') : null
    }));

    res.json(usersWithBase64);
  } catch (error) {
    console.error('Error fetching unverified users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify user account
exports.verifyUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await pool.execute(
      'UPDATE users SET verified = ?, verification_status = ? WHERE id = ?',
      [status === 'approved' ? 1 : 0, status, id]
    );

    res.json({ message: 'User verification status updated' });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot password - send code to user's email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    const [user] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (user.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Email not found' 
      });
    }

    const verificationCode = generateVerificationCode();
    const codeExpires = new Date(Date.now() + 5 * 60 * 1000);

    await pool.execute(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
      [verificationCode, codeExpires, email]
    );

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0;">CraftMeUp</h1>
        </div>
        
        <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          You requested to reset your password. Use the 6-digit code below:
        </p>
        
        <div style="background-color: #f0f4ff; padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0; border: 2px solid #667eea;">
          <h1 style="color: #667eea; letter-spacing: 8px; margin: 0; font-size: 48px; font-weight: bold;">
            ${verificationCode}
          </h1>
        </div>
        
        <p style="color: #999; font-size: 14px; text-align: center;">
          This code expires in <strong>5 minutes</strong>.
        </p>
        
        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 5px;">
          <p style="color: #856404; margin: 0; font-size: 14px;">
            ⚠️ <strong>Do not share this code with anyone.</strong> We will never ask for your code.
          </p>
        </div>
        
        <p style="color: #999; font-size: 13px; margin-top: 30px; text-align: center;">
          If you didn't request this, please ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
          © 2025 CraftMeUp. All rights reserved.
        </p>
      </div>
    `;

    const emailSent = await sendEmail(
      email,
      'Password Reset Code',
      htmlContent
    );

    if (!emailSent) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to send email. Please try again.' 
      });
    }

    res.json({ 
      success: true,
      message: 'Verification code sent to your email' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Verify reset code
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and code are required' 
      });
    }

    const [user] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND reset_token = ?',
      [email, code]
    );

    if (user.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification code' 
      });
    }

    if (new Date() > new Date(user[0].reset_token_expires)) {
      return res.status(400).json({ 
        success: false,
        message: 'Verification code expired' 
      });
    }

    res.json({ 
      success: true,
      message: 'Code verified successfully' 
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    const [user] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND reset_token = ?',
      [email, code]
    );

    if (user.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification code' 
      });
    }

    if (new Date() > new Date(user[0].reset_token_expires)) {
      return res.status(400).json({ 
        success: false,
        message: 'Verification code expired' 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.execute(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?',
      [hashedPassword, email]
    );

    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0;">CraftMeUp</h1>
        </div>
        
        <h2 style="color: #333; margin-top: 0;">Password Reset Successful ✓</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Your password has been successfully reset. You can now log in with your new password.
        </p>
        
        <a href="http://localhost:3000/login" style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
          Go to Login
        </a>
        
        <p style="color: #999; font-size: 14px; margin-top: 30px;">
          If you didn't make this change, please contact support immediately.
        </p>
      </div>
    `;

    await sendEmail(
      email,
      'Password Reset Successful - CraftMeUp',
      confirmationHtml
    );

    res.json({ 
      success: true,
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get user data
exports.getUserData = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await pool.execute(
      `SELECT id, full_name, email, course, year, role, 
              verified, verification_status, profile_image, created_at
       FROM users WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    const userData = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      course: user.course && user.course.trim() !== '' ? user.course : 'Not specified',
      year: user.year && user.year.trim() !== '' ? user.year : 'Not specified',
      role: user.role || 'User',
      verified: user.verified === 1 || user.verified === true,
      verification_status: user.verification_status || 'pending',
      profileImage: user.profile_image // ← Key fix: rename to profileImage
    };

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user data', error: error.message });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, course, year, profileImage } = req.body;

    let updateFields = [];
    let updateValues = [];

    if (full_name !== undefined && full_name !== null) {
      updateFields.push('full_name = ?');
      updateValues.push(full_name);
    }
    if (course !== undefined && course !== null) {
      updateFields.push('course = ?');
      updateValues.push(course);
    }
    if (year !== undefined && year !== null) {
      updateFields.push('year = ?');
      updateValues.push(year);
    }
    // IMPORTANT: Only update image if it was provided and is a valid base64 string
    if (profileImage !== undefined && profileImage !== null && profileImage.startsWith('data:')) {
      updateFields.push('profile_image = ?');
      updateValues.push(profileImage);
      console.log('Updating profile image in database');
    }

    updateValues.push(id);

    if (updateFields.length > 0) {
      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      console.log('Executing query:', query);
      await pool.execute(query, updateValues);
    }

    const [users] = await pool.execute(
      `SELECT id, full_name, email, course, year, role, 
              verified, verification_status, profile_image
       FROM users WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = {
      id: users[0].id,
      full_name: users[0].full_name,
      email: users[0].email,
      course: users[0].course,
      year: users[0].year,
      role: users[0].role,
      verified: users[0].verified === 1,
      verification_status: users[0].verification_status,
      profileImage: users[0].profile_image
    };

    res.json({
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Update profile photo
exports.updateProfilePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const photoPath = req.photoPath;

    if (!photoPath) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    await pool.execute(
      'UPDATE users SET profile_image = ? WHERE id = ?',
      [photoPath, id]
    );

    const [updatedUser] = await pool.execute(
      'SELECT id, email, full_name, course, year, role, verified, verification_status, profile_image FROM users WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Profile photo updated successfully',
      user: {
        id: updatedUser[0].id,
        email: updatedUser[0].email,
        fullName: updatedUser[0].full_name,
        course: updatedUser[0].course,
        year: updatedUser[0].year,
        role: updatedUser[0].role,
        verified: updatedUser[0].verified,
        verification_status: updatedUser[0].verification_status,
        profileImage: updatedUser[0].profile_image
      }
    });
  } catch (error) {
    console.error('Profile photo update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get file
exports.getUserFile = async (req, res) => {
  try {
    const { userId, fileType } = req.params;
    
    const query = fileType === 'student-id' 
      ? 'SELECT student_id_file FROM users WHERE id = ?'
      : 'SELECT study_load_file FROM users WHERE id = ?';

    const [result] = await pool.execute(query, [userId]);

    if (!result.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const fileData = fileType === 'student-id' 
      ? result[0].student_id_file 
      : result[0].study_load_file;

    if (!fileData) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="document"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(fileData);
  } catch (error) {
    console.error('Error retrieving file:', error);
    res.status(500).json({ message: 'Failed to retrieve file' });
  }
};