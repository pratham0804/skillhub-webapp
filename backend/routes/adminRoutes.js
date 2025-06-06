const express = require('express');
const adminController = require('../controllers/adminController');
const adminMiddleware = require('../middleware/adminMiddleware');
const router = express.Router();

// Public admin routes (no authentication required)
router.post('/login', adminController.login);

// Protected admin routes (authentication required)
router.get('/verify', adminMiddleware, adminController.verifyToken);

// Admin login endpoint
router.post('/login', adminController.adminLogin);

// Admin profile (authenticated route)
router.get('/profile', adminMiddleware, adminController.getAdminProfile);

module.exports = router; 