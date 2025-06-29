const User = require('../models/User');
const { firebase } = require('../config/firebase');
const jwt = require('jsonwebtoken');

// Register a new user - Optimized for speed
exports.register = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    // Check if username exists with optimized query (only select _id)
    let finalUsername = username;
    const existingUserWithUsername = await User.findOne({ username: finalUsername }).select('_id');
    
    // If username already exists, append a random string
    if (existingUserWithUsername) {
      const randomString = Math.random().toString(36).substring(2, 7);
      finalUsername = `${username}_${randomString}`;
    }
    
    // Create user in Firebase
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const firebaseUid = userCredential.user.uid;
    
    // Create user in MongoDB
    const newUser = new User({
      firebaseUid,
      email,
      username: finalUsername,
      existingSkills: [],
      targetRole: ''
    });
    
    await newUser.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      status: 'success',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Login user - Optimized for speed
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Sign in with Firebase
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const firebaseUid = userCredential.user.uid;
    
    // Find user in MongoDB with optimized query (only select necessary fields)
    const user = await User.findOne({ firebaseUid }).select('_id email username createdAt');
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      status: 'success',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Google login - Optimized for faster MongoDB operations
exports.googleLogin = async (req, res) => {
  try {
    console.log('Google login request received:', req.body);
    const { email, username, firebaseUid } = req.body;
    
    console.log('Extracted values:', { email, username, firebaseUid });
    
    if (!email || !firebaseUid) {
      console.log('Missing required fields');
      return res.status(400).json({
        status: 'fail',
        message: 'Email and Firebase UID are required'
      });
    }
    
    // Use findOneAndUpdate with upsert for atomic operation - much faster than separate find + create
    let finalUsername = username || email.split('@')[0];
    
    // First try to find/create user atomically
    let user = await User.findOneAndUpdate(
      { firebaseUid }, // Find by firebaseUid
      {
        $setOnInsert: { // Only set these fields if creating new document
          email,
          username: finalUsername,
          existingSkills: [],
          targetRole: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { 
        upsert: true, // Create if doesn't exist
        new: true, // Return the updated document
        runValidators: true // Ensure schema validation
      }
    );
    
    // If user was just created and username conflicts, handle it
    if (user.username !== finalUsername) {
      // Username conflict occurred during creation, need to fix it
      const existingUserWithUsername = await User.findOne({ 
        username: finalUsername,
        _id: { $ne: user._id } // Exclude current user
      }).select('_id'); // Only select _id for faster query
      
      if (existingUserWithUsername) {
        // Generate unique username
        const randomString = Math.random().toString(36).substring(2, 7);
        const newUsername = `${finalUsername}_${randomString}`;
        
        // Update with unique username
        user = await User.findByIdAndUpdate(
          user._id,
          { 
            username: newUsername,
            updatedAt: new Date()
          },
          { new: true }
        );
      }
    }
    
    // Generate JWT token with optimized payload
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        iat: Math.floor(Date.now() / 1000) // Current timestamp
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Send optimized response
    res.status(200).json({
      status: 'success',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
        isNew: user.createdAt.getTime() > (Date.now() - 5000) // User created in last 5 seconds
      }
    });
    
    console.log(`Google login successful for user: ${user.email} (${user.isNew ? 'NEW' : 'EXISTING'})`);
    
  } catch (error) {
    console.error('Google login error:', error);
    
    // Enhanced error handling
    let errorMessage = 'Authentication failed';
    if (error.code === 11000) { // MongoDB duplicate key error
      errorMessage = 'Account with this email already exists';
    } else if (error.name === 'ValidationError') {
      errorMessage = 'Invalid user data provided';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(400).json({
      status: 'fail',
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { debug: error.stack })
    });
  }
}; 