const User = require('../models/User');
const { firebase } = require('../config/firebase');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    // Check if username exists
    let finalUsername = username;
    const existingUserWithUsername = await User.findOne({ username: finalUsername });
    
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

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Sign in with Firebase
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const firebaseUid = userCredential.user.uid;
    
    // Find user in MongoDB
    const user = await User.findOne({ firebaseUid });
    
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

// Google login
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
    
    // Check if user exists in MongoDB
    let user = await User.findOne({ firebaseUid });
    
    // If user doesn't exist, create new user
    if (!user) {
      // Check if username exists
      let finalUsername = username || email.split('@')[0];
      const existingUserWithUsername = await User.findOne({ username: finalUsername });
      
      // If username already exists, append a random string
      if (existingUserWithUsername) {
        const randomString = Math.random().toString(36).substring(2, 7);
        finalUsername = `${finalUsername}_${randomString}`;
      }
      
      user = new User({
        firebaseUid,
        email,
        username: finalUsername,
        existingSkills: [],
        targetRole: ''
      });
      
      await user.save();
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
    console.error('Google login error:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
}; 