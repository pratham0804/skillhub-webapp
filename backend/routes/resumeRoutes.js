const express = require('express');
const resumeController = require('../controllers/resumeController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

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
    const userId = req.user?.userId || 'anonymous';
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
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Core resume routes - ONLY FUNCTIONS THAT EXIST
router.post('/upload', upload.single('resume'), resumeController.uploadResume);
router.get('/analysis', resumeController.getResumeAnalysis);
router.get('/status', resumeController.getResumeStatus);
router.delete('/', resumeController.deleteResume);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
  
  res.status(500).json({
    status: 'error',
    message: 'File upload error',
    error: error.message
  });
});

module.exports = router; 