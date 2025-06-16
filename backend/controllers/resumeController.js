const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const resumeService = require('../services/resumeService');
const geminiService = require('../services/geminiService');

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Upload resume and extract skills
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'No file uploaded'
      });
    }

    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Get file details
    const { filename, path: filePath, originalname, mimetype } = req.file;
    console.log('Uploaded file details:', { filename, filePath, originalname, mimetype });
    
    // Only accept specific file types
    const validFileTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validFileTypes.includes(mimetype)) {
      // Remove the uploaded file
      fs.unlinkSync(filePath);
      
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid file type. Please upload a .txt, .pdf, .doc, or .docx file'
      });
    }
    
    try {
      // Extract text from resume
      console.log('Extracting text from resume:', filePath);
      const resumeText = await resumeService.extractTextFromResume(filePath);
      console.log('Successfully extracted text, length:', resumeText.length);
      
      // Extract skills and get ATS score using Gemini API
      console.log('Calling Gemini API for skills extraction and ATS scoring');
      const { extractedSkills, atsScore, atsAnalysis } = await resumeService.extractSkillsFromResume(
        resumeText,
        user.targetRole
      );
      
      // Compare extracted skills with target role
      console.log('Comparing skills with target role:', user.targetRole);
      const skillComparisonResults = await resumeService.compareSkillsWithTargetRole(
        extractedSkills,
        user.targetRole
      );
      
      // Update user profile with resume info
      user.resume = {
        fileName: originalname,
        filePath: filePath,
        uploadDate: new Date(),
        atsScore: atsScore,
        atsAnalysis: atsAnalysis,
        extractedSkills: extractedSkills
      };
      
      await user.save();
      
      // Update user skills from resume
      await resumeService.updateUserSkillsFromResume(userId, extractedSkills);
      
      // Get updated user
      const updatedUser = await User.findById(userId);
      
      res.status(200).json({
        status: 'success',
        message: 'Resume uploaded and processed successfully',
        data: {
          resume: updatedUser.resume,
          skills: updatedUser.existingSkills,
          skillComparison: skillComparisonResults
        }
      });
    } catch (processingError) {
      console.error('Error processing resume:', processingError);
      
      // Return a more specific error message
      return res.status(500).json({
        status: 'error',
        message: 'Failed to process resume',
        error: processingError.message,
        details: 'Error occurred during text extraction or skills analysis'
      });
    }
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload and process resume',
      error: error.message
    });
  }
};

/**
 * Get resume analysis
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getResumeAnalysis = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    if (!user.resume || !user.resume.filePath) {
      return res.status(400).json({
        status: 'fail',
        message: 'No resume found. Please upload a resume first.'
      });
    }
    
    // Check if target role has changed since last analysis
    const targetRoleParam = req.query.targetRole;
    const currentTargetRole = user.targetRole;
    const shouldRefreshAnalysis = targetRoleParam && targetRoleParam !== currentTargetRole;
    
    // Log the analysis request details only in debug mode to reduce console spam
    if (process.env.NODE_ENV === 'development') {
      console.log(`Resume analysis requested for user: ${userId}`);
      console.log(`Current target role: ${currentTargetRole}`);
      console.log(`Requested target role: ${targetRoleParam || 'Not specified'}`);
      console.log(`Should refresh analysis: ${shouldRefreshAnalysis}`);
    }
    
    // Update target role if provided in query and different from current
    if (shouldRefreshAnalysis) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Updating target role from "${currentTargetRole}" to "${targetRoleParam}"`);
      }
      user.targetRole = targetRoleParam;
      await user.save();
    }
    
    // Use the most current target role for analysis
    const targetRole = user.targetRole;
    
    if (!targetRole) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please set a target role before requesting analysis'
      });
    }
    
    // Generate fresh analysis if:
    // 1. The target role has changed
    // 2. We don't have the analysis results cached
    // 3. The client explicitly requests a refresh
    const forceRefresh = req.query.refresh === 'true';
    const shouldGenerateFreshAnalysis = forceRefresh || shouldRefreshAnalysis || !user.resume.skillComparison;
    
    if (shouldGenerateFreshAnalysis) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Generating fresh analysis for target role: ${targetRole}`);
      }
      
      // Extract text from resume
      const resumeText = await resumeService.extractTextFromResume(user.resume.filePath);
      
      // Extract skills and get ATS score using Gemini API
      const { extractedSkills, atsScore, atsAnalysis } = await resumeService.extractSkillsFromResume(
        resumeText,
        targetRole
      );
      
      // Compare extracted skills with target role
      const skillComparisonResults = await resumeService.compareSkillsWithTargetRole(
        extractedSkills,
        targetRole
      );
      
      // Update user's resume with fresh analysis
      user.resume.atsScore = atsScore;
      user.resume.atsAnalysis = atsAnalysis;
      user.resume.extractedSkills = extractedSkills;
      user.resume.skillComparison = skillComparisonResults;
      user.resume.lastAnalysisDate = new Date();
      
      await user.save();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Fresh analysis saved to user profile');
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.log('Using cached analysis results');
    }
    
    // Get required skills for target role for more detailed comparison
    const requiredSkills = await geminiService.generateRequiredSkillsForRole(targetRole);
    
    // Create enhanced response with recommendations
    const enhancedResponse = {
      targetRole: targetRole,
      resumeInfo: {
        fileName: user.resume.fileName,
        uploadDate: user.resume.uploadDate,
        lastAnalysisDate: user.resume.lastAnalysisDate || user.resume.uploadDate
      },
      atsScore: user.resume.atsScore,
      atsAnalysis: user.resume.atsAnalysis,
      extractedSkills: user.resume.extractedSkills,
      skillComparison: user.resume.skillComparison || {},
      requiredSkills: requiredSkills,
      userSkills: user.existingSkills
    };
    
    // Generate specific career recommendations using Gemini
    try {
      // Only generate recommendations if they don't exist yet or if forcing refresh
      if (shouldGenerateFreshAnalysis || !user.resume.recommendations) {
        const recommendations = await resumeService.generateCareerRecommendations(
          enhancedResponse.extractedSkills,
          enhancedResponse.skillComparison,
          targetRole
        );
        enhancedResponse.recommendations = recommendations;
        
        // Save recommendations to avoid regenerating them on every request
        user.resume.recommendations = recommendations;
        await user.save();
      } else {
        // Use cached recommendations
        enhancedResponse.recommendations = user.resume.recommendations;
      }
    } catch (recError) {
      console.error('Error generating recommendations:', recError);
      enhancedResponse.recommendations = {
        error: 'Could not generate career recommendations'
      };
    }
    
    res.status(200).json({
      status: 'success',
      data: enhancedResponse
    });
  } catch (error) {
    console.error('Error getting resume analysis:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get resume analysis',
      error: error.message
    });
  }
};

/**
 * Delete resume
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    if (!user.resume || !user.resume.filePath) {
      return res.status(404).json({
        status: 'fail',
        message: 'No resume found for this user'
      });
    }
    
    // Delete the file
    try {
      fs.unlinkSync(user.resume.filePath);
    } catch (unlinkError) {
      console.error('Error deleting resume file:', unlinkError);
      // Continue even if file deletion fails
    }
    
    // Clear resume data from user profile
    user.resume = undefined;
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete resume',
      error: error.message
    });
  }
};

/**
 * Add missing skills to user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addMissingSkills = async (req, res) => {
  try {
    console.log('addMissingSkills called with body:', JSON.stringify(req.body));
    console.log('User ID from token:', req.user?.userId);
    
    const userId = req.user.userId;
    const { skills } = req.body;
    
    console.log('Skills to add:', JSON.stringify(skills));
    
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      console.log('No skills provided or invalid skills format');
      return res.status(400).json({
        status: 'fail',
        message: 'No skills provided'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    console.log('Found user:', user.username);
    console.log('Existing skills count:', user.existingSkills.length);
    
    // Get existing skill names for comparison (case insensitive)
    const existingSkillNames = user.existingSkills.map(skill => 
      skill.skillName.toLowerCase()
    );
    
    console.log('Existing skill names:', existingSkillNames);
    
    // Add new skills
    let addedSkills = [];
    let duplicateSkills = [];
    
    skills.forEach(skillToAdd => {
      console.log('Processing skill:', JSON.stringify(skillToAdd));
      const skillNameLower = skillToAdd.skillName.toLowerCase();
      
      // Check if skill already exists
      if (!existingSkillNames.includes(skillNameLower)) {
        console.log('Adding new skill:', skillToAdd.skillName);
        user.existingSkills.push({
          skillName: skillToAdd.skillName,
          proficiency: 'Beginner', // Default proficiency
          status: 'Not Started',
          startDate: null,
          notes: skillToAdd.importance ? `Added from missing skills. Importance: ${skillToAdd.importance}` : 'Added from missing skills'
        });
        
        // Keep track of added skills
        addedSkills.push(skillToAdd.skillName);
        
        // Update existingSkillNames to prevent duplicates
        existingSkillNames.push(skillNameLower);
      } else {
        console.log('Skill already exists:', skillToAdd.skillName);
        // Keep track of duplicate skills
        duplicateSkills.push(skillToAdd.skillName);
      }
    });
    
    console.log('Skills added:', addedSkills);
    console.log('Duplicate skills:', duplicateSkills);
    
    // Save the updated user
    const saveResult = await user.save();
    console.log('User saved successfully, new skills count:', saveResult.existingSkills.length);
    
    res.status(200).json({
      status: 'success',
      message: 'Missing skills added to user profile',
      data: {
        addedSkills,
        duplicateSkills,
        userSkills: user.existingSkills
      }
    });
  } catch (error) {
    console.error('Error adding missing skills:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add missing skills',
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * Debug endpoint to test skill addition
 */
exports.debugAddSkill = async (req, res) => {
  try {
    const { userId, skillName } = req.query;
    
    if (!userId || !skillName) {
      return res.status(400).json({
        status: 'fail',
        message: 'Missing userId or skillName in query parameters'
      });
    }
    
    console.log('Debug add skill called with:', { userId, skillName });
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Get existing skill names
    const existingSkillNames = user.existingSkills.map(skill => 
      skill.skillName.toLowerCase()
    );
    
    // Check if skill already exists
    if (existingSkillNames.includes(skillName.toLowerCase())) {
      return res.status(200).json({
        status: 'success',
        message: 'Skill already exists',
        data: {
          existingSkills: user.existingSkills
        }
      });
    }
    
    // Add new skill
    user.existingSkills.push({
      skillName: skillName,
      proficiency: 'Beginner',
      status: 'Not Started',
      startDate: null,
      notes: 'Added from debug endpoint'
    });
    
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Skill added successfully',
      data: {
        existingSkills: user.existingSkills
      }
    });
  } catch (error) {
    console.error('Debug add skill error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add skill',
      error: error.message
    });
  }
};

/**
 * Get resume data for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    if (!user.resume || !user.resume.filePath) {
      return res.status(404).json({
        status: 'fail',
        message: 'No resume found for this user'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        resume: user.resume
      }
    });
  } catch (error) {
    console.error('Error getting resume:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get resume',
      error: error.message
    });
  }
}; 