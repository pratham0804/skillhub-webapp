const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Create a unique filename with timestamp and user ID (if available)
    const userId = req.user ? req.user.userId : 'unknown';
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    cb(null, `resume_${userId}_${timestamp}${fileExtension}`);
  }
});

// File filter for allowed extensions
const fileFilter = (req, file, cb) => {
  // Accept only specific file types
  const allowedExtensions = ['.txt', '.pdf', '.doc', '.docx'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only .txt, .pdf, .doc, and .docx files are allowed.'), false);
  }
};

// Create the multer middleware with configured options
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

module.exports = {
  uploadResume: upload.single('resume')
}; 