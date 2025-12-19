const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const path = require('path');
const pool = require('../config/database');
const nodemailer = require('nodemailer');

// Configure nodemailer
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;

let transporter = null;
if (emailUser && emailPass) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    },
    tls: {
      rejectUnauthorized: false
    },
    secure: false,
    requireTLS: true
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error('Email service error:', error);
    } else {
      console.log('✓ Email service is ready');
    }
  });
} else {
  console.warn('Email credentials not set. Email sending is disabled.');
}

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendEmail = async (recipientEmail, subject, htmlContent) => {
  try {
    if (!transporter) {
      console.warn('Skipping email send: transporter not configured.');
      return false;
    }

    await transporter.sendMail({
      from: `"CraftMeUp" <${emailUser}>`,
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
        name: user.full_name,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        ageRange: user.age_range,
        bio: user.bio,
        verified: user.verification_status,
        profileImage: user.profile_image
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Register controller
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, phone, gender, dateOfBirth, bio, role } = req.body;

    // Get the valid ID file
    const validIdBuffer = req.files?.validId ? req.files.validId[0].buffer : null;

    console.log('📝 Registration data:', { fullName, email, role, phone, gender, dateOfBirth });

    // Validation
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields: fullName, email, password, role' });
    }

    // Check if email already exists
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await pool.execute(
      `INSERT INTO users (
        full_name, email, password, phone, gender, date_of_birth, bio, role, 
        valid_id_file, verification_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        fullName, 
        email, 
        hashedPassword, 
        phone || null, 
        gender || null, 
        dateOfBirth || null, 
        bio || null, 
        role,
        validIdBuffer
      ]
    );

    console.log('✅ User registered with ID:', result.insertId);

    // Generate token
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
        phone,
        gender,
        dateOfBirth,
        bio
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Get unverified users for admin
exports.getUnverifiedUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, full_name, email, phone, gender, date_of_birth, bio, role, 
              valid_id_file, verification_status, created_at
       FROM users WHERE verification_status = 'pending'
       ORDER BY created_at DESC`
    );

    const usersWithBase64 = users.map(user => ({
      ...user,
      valid_id_file: user.valid_id_file ? Buffer.from(user.valid_id_file).toString('base64') : null
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

// Forgot password
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
            ⚠️ <strong>Do not share this code with anyone.</strong>
          </p>
        </div>
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
      `SELECT id, full_name, email, phone, gender, date_of_birth, bio, role, 
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
      phone: user.phone || '',
      gender: user.gender || '',
      date_of_birth: user.date_of_birth || '',
      bio: user.bio || '',
      role: user.role || 'User',
      verified: user.verified === 1 || user.verified === true,
      verification_status: user.verification_status || 'pending',
      profileImage: user.profile_image
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
    const { full_name, phone, gender, date_of_birth, bio, profileImage } = req.body;

    let updateFields = [];
    let updateValues = [];

    if (full_name !== undefined && full_name !== null) {
      updateFields.push('full_name = ?');
      updateValues.push(full_name);
    }
    if (phone !== undefined && phone !== null) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (gender !== undefined && gender !== null) {
      updateFields.push('gender = ?');
      updateValues.push(gender);
    }
    if (date_of_birth !== undefined && date_of_birth !== null) {
      updateFields.push('date_of_birth = ?');
      updateValues.push(date_of_birth);
    }
    if (bio !== undefined && bio !== null) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }
    if (profileImage !== undefined && profileImage !== null && profileImage.startsWith('data:')) {
      updateFields.push('profile_image = ?');
      updateValues.push(profileImage);
    }

    updateValues.push(id);

    if (updateFields.length > 0) {
      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      await pool.execute(query, updateValues);
    }

    const [users] = await pool.execute(
      `SELECT id, full_name, email, phone, gender, date_of_birth, bio, role, 
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
      phone: users[0].phone,
      gender: users[0].gender,
      date_of_birth: users[0].date_of_birth,
      bio: users[0].bio,
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
      'SELECT id, email, full_name, phone, gender, age_range, bio, role, verified, verification_status, profile_image FROM users WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Profile photo updated successfully',
      user: {
        id: updatedUser[0].id,
        email: updatedUser[0].email,
        fullName: updatedUser[0].full_name,
        phone: updatedUser[0].phone,
        gender: updatedUser[0].gender,
        age_range: updatedUser[0].age_range,
        bio: updatedUser[0].bio,
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
    
    const query = 'SELECT valid_id_file FROM users WHERE id = ?';
    const [result] = await pool.execute(query, [userId]);

    if (!result.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const fileData = result[0].valid_id_file;

    if (!fileData) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="valid-id"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(fileData);
  } catch (error) {
    console.error('Error retrieving file:', error);
    res.status(500).json({ message: 'Failed to retrieve file' });
  }
};

module.exports = exports;