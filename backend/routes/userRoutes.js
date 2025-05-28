const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const analysisController = require('../controllers/analysisController');
const userController = require('../controllers/userController');
const router = express.Router();

// Public routes (no auth required)
router.get('/public/required-skills/:targetRole', analysisController.getRequiredSkillsForRole);

// Protected routes - Apply auth middleware to all routes below this line
router.use(authMiddleware);

// Get user profile
router.get('/profile', userController.getUserProfile);

// Update user profile
router.put('/profile', userController.updateUserProfile);

// Update a single skill or add new one
router.patch('/skills', userController.updateSkillProgress);

// Skill gap analysis
router.get('/analysis/skill-gap', analysisController.getSkillGapAnalysis);

// Debug endpoint to get user profile directly (temporary)
router.get('/debug-profile', async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          targetRole: user.targetRole,
          existingSkills: user.existingSkills,
          skillsCount: user.existingSkills.length
        }
      }
    });
  } catch (error) {
    console.error('Debug profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch debug profile',
      error: error.message
    });
  }
});

module.exports = router; 