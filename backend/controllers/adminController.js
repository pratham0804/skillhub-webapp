const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
// Remove Firebase dependency temporarily
// const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');

// Hardcoded admin credentials
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'thisisadmin';

// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password',
      });
    }

    // Check if credentials match hardcoded admin credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid credentials',
      });
    }

    // Simplified approach - skip Firebase authentication
    // Find admin by email or create one if it doesn't exist
    let admin = await Admin.findOne({ email });

    if (!admin) {
      // Create a mock Firebase UID using UUID
      const mockFirebaseUid = uuidv4();

        // Create admin in database
        admin = await Admin.create({
          email,
        firebaseUid: mockFirebaseUid, // Use UUID as a replacement
          role: 'admin'
        });
      
      console.log('Created new admin account:', admin._id);
        } else {
      console.log('Found existing admin account:', admin._id);
    }

    // Create token
    const token = jwt.sign(
      { adminId: admin._id, email: admin.email, role: admin.role },
      process.env.ADMIN_JWT_SECRET || 'admin-secret-key-fallback',
      { expiresIn: '1d' }
    );

    // Send token to client
    res.status(200).json({
      status: 'success',
      token,
      data: {
        admin: {
          id: admin._id,
          email: admin.email,
          role: admin.role
        }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during login: ' + error.message,
    });
  }
};

// @desc    Verify admin token
// @route   GET /api/admin/verify
// @access  Private (Admin only)
exports.verifyToken = async (req, res) => {
  try {
    // If middleware passed, admin exists
    const admin = await Admin.findById(req.admin.adminId);
    
    if (!admin) {
      return res.status(404).json({
        status: 'fail',
        message: 'Admin not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        admin: {
          id: admin._id,
          email: admin.email,
          role: admin.role
        }
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during token verification'
    });
  }
}; 