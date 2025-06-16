const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  
  // Enhanced Profile Information
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  
  // Social Links
  website: {
    type: String,
    default: ''
  },
  linkedIn: {
    type: String,
    default: ''
  },
  github: {
    type: String,
    default: ''
  },
  twitter: {
    type: String,
    default: ''
  },
  
  // Career Information
  experience: {
    type: String,
    enum: ['', 'Entry Level', '1-2 years', '3-5 years', '5-10 years', '10+ years'],
    default: ''
  },
  careerGoals: {
    type: String,
    default: ''
  },
  availability: {
    type: String,
    enum: ['Available', 'Open to Opportunities', 'Not Looking', 'Busy'],
    default: 'Available'
  },
  preferredWorkType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Remote Only', 'Hybrid'],
    default: 'Full-time'
  },
  salaryRange: {
    type: String,
    default: ''
  },
  
  // Privacy and Notification Settings
  profileVisibility: {
    type: String,
    enum: ['Public', 'Community', 'Private'],
    default: 'Public'
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  skillUpdateNotifications: {
    type: Boolean,
    default: true
  },
  marketingEmails: {
    type: Boolean,
    default: false
  },
  
  // Skills with enhanced categories
  existingSkills: [{
    skillName: String,
    proficiency: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Beginner'
    },
    category: {
      type: String,
      enum: [
        'Technical', 
        'Soft Skills', 
        'Tools', 
        'Frameworks', 
        'Languages', 
        'Methodologies',
        'Frontend Frameworks',
        'Backend Technologies',
        'DevOps Tools',
        'Domain Knowledge',
        'Programming Languages',
        'Databases',
        'Cloud Services',
        'Testing',
        'Mobile Development',
        'Web Development',
        'Data Science',
        'Machine Learning',
        'Security',
        'Project Management'
      ],
      default: 'Technical'
    },
    status: {
      type: String,
      enum: [
        'Not Started', 
        'Learning', 
        'Practicing', 
        'Proficient', 
        'Mastered',
        'In Progress',
        'Completed',
        'Active',
        'Inactive'
      ],
      default: 'Not Started'
    },
    startDate: Date,
    completionDate: Date,
    notes: String,
    dateAdded: {
      type: Date,
      default: Date.now
    }
  }],
  targetRole: {
    type: String,
    required: false
  },
  resume: {
    fileName: String,
    filePath: String,
    uploadDate: {
      type: Date,
      default: null
    },
    lastAnalysisDate: {
      type: Date,
      default: null
    },
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    atsAnalysis: {
      type: String,
      default: null
    },
    extractedSkills: [{
      skillName: String,
      confidenceScore: Number
    }],
    skillComparison: {
      matching: [{
        skillName: String,
        confidenceScore: Number
      }],
      missing: [{
        skillName: String,
        importance: String
      }],
      analysis: String
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', UserSchema); 