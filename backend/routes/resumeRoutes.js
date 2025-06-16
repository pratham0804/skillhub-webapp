const express = require('express');
const resumeController = require('../controllers/resumeController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Public debug endpoint (no auth)
router.get('/debug-add-skill', resumeController.debugAddSkill);

// Apply auth middleware to all routes
router.use(authMiddleware);

// Configure multer for resume upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/resumes';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId-timestamp-originalname
    const userId = req.user.userId;
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '_');
    
    cb(null, `${userId}-${timestamp}-${originalName}`);
  }
});

// File filter to allow only PDFs and DOCs
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Upload resume
router.post('/upload', upload.single('resume'), resumeController.uploadResume);

// Note: Resume analysis route removed - keeping only basic upload/download functionality

// Delete resume
router.delete('/', resumeController.deleteResume);

// Add missing skills from resume analysis
router.post('/add-missing-skills', resumeController.addMissingSkills);

// Get resume
router.get('/', resumeController.getResume);

module.exports = router; 