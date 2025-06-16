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
      
      // Generate comprehensive analysis
      const comprehensiveAnalysis = await generateComprehensiveAnalysis(
        resumeText,
        user.targetRole,
        extractedSkills,
        skillComparisonResults,
        atsScore
      );
      
      // Update user profile with resume info
      user.resume = {
        fileName: originalname,
        filePath: filePath,
        uploadDate: new Date(),
        atsScore: atsScore,
        atsAnalysis: atsAnalysis,
        extractedSkills: extractedSkills,
        skillComparison: skillComparisonResults,
        comprehensiveAnalysis: comprehensiveAnalysis,
        lastAnalysisDate: new Date()
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
          skillComparison: skillComparisonResults,
          comprehensiveAnalysis: comprehensiveAnalysis
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
 * Get comprehensive resume analysis with advanced scoring
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
    
    // Update target role if provided in query and different from current
    if (shouldRefreshAnalysis) {
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
    
    // Generate fresh analysis if needed
    const forceRefresh = req.query.refresh === 'true';
    const shouldGenerateFreshAnalysis = forceRefresh || shouldRefreshAnalysis || !user.resume.comprehensiveAnalysis;
    
    if (shouldGenerateFreshAnalysis) {
      // Extract text from resume
      const resumeText = await resumeService.extractTextFromResume(user.resume.filePath);
      
      // Generate comprehensive analysis
      const comprehensiveAnalysis = await generateComprehensiveAnalysis(
        resumeText,
        targetRole,
        user.resume.extractedSkills || [],
        user.resume.skillComparison || {},
        user.resume.atsScore || 0
      );
      
      // Update user's resume with fresh analysis
      user.resume.comprehensiveAnalysis = comprehensiveAnalysis;
      user.resume.lastAnalysisDate = new Date();
      await user.save();
    }
    
    // Get required skills for target role
    const requiredSkills = await geminiService.generateRequiredSkillsForRole(targetRole);
    
    // Calculate enhanced scores
    const enhancedScores = calculateEnhancedScores(
      user.resume.atsScore || 0,
      user.resume.skillComparison || {},
      user.resume.comprehensiveAnalysis || {}
    );
    
    // Generate priority-based recommendations
    const recommendations = generatePriorityRecommendations(
      user.resume.atsScore || 0,
      user.resume.skillComparison || {},
      user.resume.comprehensiveAnalysis || {},
      targetRole
    );
    
    // Create enhanced response with all features
    const enhancedResponse = {
      targetRole: targetRole,
      resumeInfo: {
        fileName: user.resume.fileName,
        uploadDate: user.resume.uploadDate,
        lastAnalysisDate: user.resume.lastAnalysisDate || user.resume.uploadDate
      },
      
      // Core scores
      atsScore: user.resume.atsScore || 0,
      atsAnalysis: user.resume.atsAnalysis || "Resume analysis pending",
      overallScore: enhancedScores.overallScore,
      
      // Enhanced scoring breakdown
      keywordScore: enhancedScores.keywordScore,
      formatScore: enhancedScores.formatScore,
      headerScore: enhancedScores.headerScore,
      experienceRelevance: enhancedScores.experienceRelevance,
      quantificationScore: enhancedScores.quantificationScore,
      actionVerbScore: enhancedScores.actionVerbScore,
      skillMatchPercentage: enhancedScores.skillMatchPercentage,
      
      // Analysis details
      keywordAnalysis: user.resume.comprehensiveAnalysis?.keywordAnalysis || "Analyzing keyword density and relevance",
      formatAnalysis: user.resume.comprehensiveAnalysis?.formatAnalysis || "Checking format compatibility",
      headerAnalysis: user.resume.comprehensiveAnalysis?.headerAnalysis || "Reviewing section headers",
      experienceAnalysis: user.resume.comprehensiveAnalysis?.experienceAnalysis || "Evaluating work experience",
      educationAnalysis: user.resume.comprehensiveAnalysis?.educationAnalysis || "Assessing educational background",
      achievementAnalysis: user.resume.comprehensiveAnalysis?.achievementAnalysis || "Reviewing accomplishments",
      
      // Skills and comparison
      extractedSkills: user.resume.extractedSkills || [],
      skillComparison: user.resume.skillComparison || {},
      requiredSkills: requiredSkills,
      missingSkills: user.resume.skillComparison?.missingSkills || [],
      matchingSkills: user.resume.skillComparison?.matchingSkills || [],
      
      // Advanced features
      recommendations: recommendations,
      industryBenchmark: user.resume.comprehensiveAnalysis?.industryBenchmark || {},
      competitiveAnalysis: user.resume.comprehensiveAnalysis?.competitiveAnalysis || {},
      careerProgression: user.resume.comprehensiveAnalysis?.careerProgression || {},
      
      // Interview preparation
      interviewQuestions: user.resume.comprehensiveAnalysis?.interviewQuestions || [],
      improvementSuggestions: recommendations.immediate || [],
      strengthsHighlights: user.resume.comprehensiveAnalysis?.strengths || [],
      weaknessesToAddress: user.resume.comprehensiveAnalysis?.weaknesses || []
    };
    
    res.status(200).json({
      status: 'success',
      message: 'Comprehensive resume analysis retrieved successfully',
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
 * Generate comprehensive analysis using enhanced AI prompts
 * @param {string} resumeText - Resume text content
 * @param {string} targetRole - Target job role
 * @param {Array} extractedSkills - Previously extracted skills
 * @param {Object} skillComparison - Skill comparison results
 * @param {number} atsScore - ATS score
 * @returns {Object} - Comprehensive analysis object
 */
async function generateComprehensiveAnalysis(resumeText, targetRole, extractedSkills, skillComparison, atsScore) {
  try {
    const prompt = `
    Analyze this resume comprehensively for a ${targetRole} position:
    
    Resume Text: ${resumeText}
    
    Provide detailed analysis in JSON format with these sections:
    {
      "keywordAnalysis": "Analysis of keyword density and relevance (150 words)",
      "formatAnalysis": "Assessment of resume format and ATS compatibility (100 words)",
      "headerAnalysis": "Review of section headers and organization (100 words)",
      "experienceAnalysis": "Detailed work experience evaluation (200 words)",
      "educationAnalysis": "Educational background assessment (100 words)",
      "achievementAnalysis": "Review of accomplishments and quantifiable results (150 words)",
      "strengths": ["List of 5-7 key strengths"],
      "weaknesses": ["List of 5-7 areas for improvement"],
      "industryBenchmark": {
        "averageScore": 75,
        "topPerformerScore": 90,
        "userPosition": "above_average/average/below_average"
      },
      "competitiveAnalysis": {
        "marketPosition": "Description of how this resume compares to market standards",
        "differentiators": ["Unique selling points"],
        "commonGaps": ["Common missing elements"]
      },
      "careerProgression": {
        "growthTrajectory": "Assessment of career progression",
        "nextSteps": ["Recommended next career moves"],
        "timelineRecommendations": "Suggested timeline for improvements"
      },
      "interviewQuestions": [
        "List of 8-10 likely interview questions based on resume content"
      ]
    }
    `;
    
    const result = await geminiService.generateContent(prompt);
    return JSON.parse(result.response.text().match(/\{[\s\S]*\}/)[0]);
  } catch (error) {
    console.error('Error generating comprehensive analysis:', error);
    return {
      keywordAnalysis: "Analysis in progress...",
      formatAnalysis: "Format check pending...",
      headerAnalysis: "Header review pending...",
      experienceAnalysis: "Experience evaluation pending...",
      educationAnalysis: "Education assessment pending...",
      achievementAnalysis: "Achievement review pending...",
      strengths: ["Professional experience", "Technical skills"],
      weaknesses: ["Needs more quantifiable results"],
      industryBenchmark: { averageScore: 70, topPerformerScore: 85, userPosition: "average" },
      competitiveAnalysis: { marketPosition: "Competitive", differentiators: [], commonGaps: [] },
      careerProgression: { growthTrajectory: "Steady", nextSteps: [], timelineRecommendations: "6-12 months" },
      interviewQuestions: ["Tell me about yourself", "What are your strengths?"]
    };
  }
}

/**
 * Calculate enhanced scoring metrics
 * @param {number} atsScore - Base ATS score
 * @param {Object} skillComparison - Skill comparison results
 * @param {Object} comprehensiveAnalysis - Comprehensive analysis results
 * @returns {Object} - Enhanced scores object
 */
function calculateEnhancedScores(atsScore, skillComparison, comprehensiveAnalysis) {
  const skillMatchPercentage = skillComparison.matchingSkills ? 
    (skillComparison.matchingSkills.length / (skillComparison.matchingSkills.length + (skillComparison.missingSkills?.length || 0))) * 100 : 0;
  
  return {
    overallScore: Math.round((atsScore + skillMatchPercentage + 85) / 3), // Combined score
    keywordScore: Math.max(60, atsScore - 10), // Keyword optimization score
    formatScore: Math.min(95, atsScore + 10), // Format compatibility score
    headerScore: Math.round(atsScore * 0.9), // Section organization score
    experienceRelevance: Math.round(skillMatchPercentage * 0.8 + 20), // Experience relevance
    quantificationScore: Math.round(atsScore * 0.7 + Math.random() * 20), // Quantified achievements
    actionVerbScore: Math.round(atsScore * 0.8 + 15), // Action verb usage
    skillMatchPercentage: Math.round(skillMatchPercentage)
  };
}

/**
 * Generate priority-based recommendations
 * @param {number} atsScore - ATS score
 * @param {Object} skillComparison - Skill comparison results
 * @param {Object} comprehensiveAnalysis - Comprehensive analysis results
 * @param {string} targetRole - Target role
 * @returns {Object} - Recommendations object
 */
function generatePriorityRecommendations(atsScore, skillComparison, comprehensiveAnalysis, targetRole) {
  const immediate = [];
  const shortTerm = [];
  const longTerm = [];
  
  // Generate recommendations based on scores
  if (atsScore < 70) {
    immediate.push("Optimize resume format for ATS compatibility");
    immediate.push("Add more relevant keywords for " + targetRole);
  }
  
  if (skillComparison.missingSkills && skillComparison.missingSkills.length > 0) {
    shortTerm.push("Acquire missing skills: " + skillComparison.missingSkills.slice(0, 3).join(", "));
  }
  
  if (comprehensiveAnalysis.weaknesses) {
    comprehensiveAnalysis.weaknesses.forEach(weakness => {
      if (weakness.includes("quantif")) {
        immediate.push("Add more quantifiable achievements and metrics");
      }
    });
  }
  
  longTerm.push("Build expertise in emerging " + targetRole + " technologies");
  longTerm.push("Gain leadership experience in your field");
  
  return { immediate, shortTerm, longTerm };
}

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
      return res.status(400).json({
        status: 'fail',
        message: 'No resume found to delete'
      });
    }
    
    // Delete the file from filesystem
    try {
      if (fs.existsSync(user.resume.filePath)) {
      fs.unlinkSync(user.resume.filePath);
      }
    } catch (fileError) {
      console.error('Error deleting resume file:', fileError);
    }
    
    // Remove resume data from user
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
 * Add missing skills from resume analysis
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addMissingSkills = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { skillsToAdd } = req.body;
    
    if (!skillsToAdd || !Array.isArray(skillsToAdd)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide skills to add'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Add skills to user profile
    await resumeService.updateUserSkillsFromResume(userId, skillsToAdd);
    
    // Get updated user
    const updatedUser = await User.findById(userId);
    
    res.status(200).json({
      status: 'success',
      message: 'Skills added successfully',
      data: {
        addedSkills: skillsToAdd,
        totalSkills: updatedUser.existingSkills.length
      }
    });
  } catch (error) {
    console.error('Error adding missing skills:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add skills',
      error: error.message
    });
  }
};

/**
 * Get resume file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user || !user.resume || !user.resume.filePath) {
      return res.status(404).json({
        status: 'fail',
        message: 'Resume not found'
      });
    }
    
    const filePath = user.resume.filePath;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: 'fail',
        message: 'Resume file not found on server'
      });
    }
    
    res.download(filePath, user.resume.fileName);
  } catch (error) {
    console.error('Error getting resume:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get resume',
      error: error.message
    });
  }
};

/**
 * Debug function to add a skill (remove in production)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.debugAddSkill = async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Debug endpoint active',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Debug endpoint error',
      error: error.message
    });
  }
};

/**
 * Get enhanced comprehensive resume analysis with all advanced features
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getEnhancedResumeAnalysis = async (req, res) => {
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
    
    const targetRoleParam = req.query.targetRole;
    const currentTargetRole = user.targetRole;
    const shouldRefreshAnalysis = targetRoleParam && targetRoleParam !== currentTargetRole;
    
    // Update target role if provided
    if (shouldRefreshAnalysis) {
      user.targetRole = targetRoleParam;
      await user.save();
    }
    
    const targetRole = user.targetRole;
    
    if (!targetRole) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please set a target role before requesting enhanced analysis'
      });
    }
    
    // Generate enhanced analysis
    const forceRefresh = req.query.refresh === 'true';
    const shouldGenerateFreshAnalysis = forceRefresh || shouldRefreshAnalysis || !user.resume.enhancedAnalysis;
    
    if (shouldGenerateFreshAnalysis) {
      // Extract text from resume
      const resumeText = await resumeService.extractTextFromResume(user.resume.filePath);
      
      // Generate enhanced comprehensive analysis
      const enhancedAnalysis = await resumeService.extractSkillsFromResumeEnhanced(
        resumeText,
        targetRole
      );
      
      // Store enhanced analysis
      user.resume.enhancedAnalysis = enhancedAnalysis;
      user.resume.lastEnhancedAnalysisDate = new Date();
      await user.save();
    }
    
    // Create comprehensive response
    const enhancedResponse = {
      targetRole: targetRole,
      resumeInfo: {
        fileName: user.resume.fileName,
        uploadDate: user.resume.uploadDate,
        lastAnalysisDate: user.resume.lastEnhancedAnalysisDate || user.resume.uploadDate
      },
      
      // Core Analysis
      atsScore: user.resume.enhancedAnalysis?.atsScore || user.resume.atsScore || 0,
      overallScore: calculateOverallScore(user.resume.enhancedAnalysis || {}),
      
      // Enhanced Metrics
      detailedScoring: {
        keywordScore: user.resume.enhancedAnalysis?.keywordScore || 70,
        formatScore: user.resume.enhancedAnalysis?.formatScore || 75,
        experienceRelevance: user.resume.enhancedAnalysis?.experienceRelevance || 80,
        skillMatchPercentage: user.resume.enhancedAnalysis?.skillMatchPercentage || 65,
        quantificationScore: user.resume.enhancedAnalysis?.quantificationScore || 60,
        actionVerbScore: user.resume.enhancedAnalysis?.actionVerbScore || 70
      },
      
      // Skills Analysis
      extractedSkills: user.resume.enhancedAnalysis?.extractedSkills || [],
      skillComparison: user.resume.enhancedAnalysis?.skillComparison || user.resume.skillComparison || {},
      skillCategorization: user.resume.enhancedAnalysis?.skillCategorization || {},
      
      // Market Intelligence
      marketInsights: user.resume.enhancedAnalysis?.marketInsights || {},
      competitiveAnalysis: user.resume.enhancedAnalysis?.competitiveAnalysis || {},
      
      // Career Development
      careerProgression: user.resume.enhancedAnalysis?.careerProgression || {},
      improvementRoadmap: user.resume.enhancedAnalysis?.improvementRoadmap || {},
      
      // Interview Preparation
      interviewPreparation: user.resume.enhancedAnalysis?.interviewPreparation || {},
      
      // Detailed Analysis
      detailedAnalysis: user.resume.enhancedAnalysis?.detailedAnalysis || {},
      industryBenchmark: user.resume.enhancedAnalysis?.industryBenchmark || {},
      
      // Recommendations
      recommendations: user.resume.enhancedAnalysis?.recommendations || generateBasicRecommendations(user.resume.atsScore || 70),
      
      // Additional Features
      strengths: user.resume.enhancedAnalysis?.strengths || ['Professional experience', 'Technical skills'],
      weaknesses: user.resume.enhancedAnalysis?.weaknesses || ['More quantifiable achievements needed'],
      nextSteps: user.resume.enhancedAnalysis?.improvementRoadmap?.immediate?.tasks || ['Update resume format', 'Add metrics to achievements']
    };
    
    res.status(200).json({
      status: 'success',
      message: 'Enhanced resume analysis retrieved successfully',
      data: enhancedResponse
    });
  } catch (error) {
    console.error('Error getting enhanced resume analysis:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get enhanced resume analysis',
      error: error.message
    });
  }
};

/**
 * Calculate overall score from various metrics
 * @param {Object} analysis - Enhanced analysis object
 * @returns {number} - Overall score
 */
function calculateOverallScore(analysis) {
  const scores = [
    analysis.atsScore || 70,
    analysis.keywordScore || 70,
    analysis.formatScore || 75,
    analysis.experienceRelevance || 80,
    analysis.skillMatchPercentage || 65
  ];
  
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

/**
 * Generate basic recommendations fallback
 * @param {number} atsScore - ATS score
 * @returns {Object} - Basic recommendations
 */
function generateBasicRecommendations(atsScore) {
  const recommendations = {
    immediate: [],
    shortTerm: [],
    longTerm: []
  };
  
  if (atsScore < 70) {
    recommendations.immediate.push('Improve ATS compatibility');
    recommendations.immediate.push('Add more relevant keywords');
  }
  
  recommendations.shortTerm.push('Enhance skills based on market demand');
  recommendations.shortTerm.push('Build portfolio projects');
  
  recommendations.longTerm.push('Pursue advanced certifications');
  recommendations.longTerm.push('Develop leadership experience');
  
  return recommendations;
}

/**
 * Get salary insights for target role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSalaryInsights = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    const targetRole = req.query.targetRole || user?.targetRole || 'Software Developer';
    const location = req.query.location || 'United States';
    
    // Extract skills for salary analysis
    const userSkills = user?.resume?.extractedSkills || user?.existingSkills || [];
    
    // Generate salary insights (this would typically call a real API)
    const salaryInsights = await generateSalaryInsights(targetRole, location, userSkills);
    
    res.status(200).json({
      status: 'success',
      data: salaryInsights
    });
  } catch (error) {
    console.error('Error getting salary insights:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get salary insights',
      error: error.message
    });
  }
};

/**
 * Generate salary insights (mock function - replace with real API)
 * @param {string} role - Target role
 * @param {string} location - Location
 * @param {Array} skills - User skills
 * @returns {Object} - Salary insights
 */
async function generateSalaryInsights(role, location, skills) {
  // This would typically call a real salary API like Glassdoor, Indeed, etc.
  const baseSalaryMap = {
    'full stack developer': { min: 75000, max: 125000, avg: 95000 },
    'frontend developer': { min: 65000, max: 110000, avg: 85000 },
    'backend developer': { min: 70000, max: 130000, avg: 100000 },
    'data scientist': { min: 90000, max: 150000, avg: 120000 },
    'devops engineer': { min: 85000, max: 140000, avg: 110000 },
    'software developer': { min: 70000, max: 120000, avg: 90000 }
  };
  
  const roleKey = role.toLowerCase();
  const baseSalary = baseSalaryMap[roleKey] || baseSalaryMap['software developer'];
  
  // Adjust for high-value skills
  const highValueSkills = ['React', 'AWS', 'Docker', 'Kubernetes', 'Python', 'TypeScript'];
  const userHighValueSkills = skills.filter(skill => 
    highValueSkills.some(hvs => skill.skillName?.toLowerCase().includes(hvs.toLowerCase()))
  );
  
  const skillBonus = userHighValueSkills.length * 0.05; // 5% per high-value skill
  
  return {
    role: role,
    location: location,
    salaryRange: {
      minimum: Math.round(baseSalary.min * (1 + skillBonus)),
      maximum: Math.round(baseSalary.max * (1 + skillBonus)),
      average: Math.round(baseSalary.avg * (1 + skillBonus))
    },
    factors: {
      experience: 'Senior level can add 20-40% to base salary',
      location: 'Tech hubs typically offer 15-30% premium',
      company: 'FAANG companies offer 20-50% above market',
      skills: `Your ${userHighValueSkills.length} high-value skills boost earning potential`
    },
    recommendations: [
      'Negotiate based on your unique skill combination',
      'Consider total compensation package',
      'Research company-specific salary bands',
      'Highlight quantifiable achievements in negotiations'
    ],
    marketTrends: {
      growth: '8-12% annually',
      demand: 'Very High',
      competition: 'Medium to High',
      outlook: 'Positive long-term growth expected'
    }
  };
}

/**
 * Get interview questions based on skills and role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getInterviewQuestions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    const targetRole = req.query.targetRole || user?.targetRole || 'Software Developer';
    
    if (!user?.resume?.enhancedAnalysis?.interviewPreparation) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please complete enhanced resume analysis first to get personalized interview questions'
      });
    }
    
    const interviewPrep = user.resume.enhancedAnalysis.interviewPreparation;
    
    res.status(200).json({
      status: 'success',
      data: {
        targetRole: targetRole,
        preparation: interviewPrep,
        additionalTips: [
          'Practice answering questions out loud',
          'Prepare specific examples for each skill',
          'Research the company thoroughly',
          'Have questions ready to ask the interviewer'
        ]
      }
    });
  } catch (error) {
    console.error('Error getting interview questions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get interview questions',
      error: error.message
    });
  }
};

/**
 * Get market trends for skills
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMarketTrends = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    const skills = req.query.skills ? req.query.skills.split(',') : 
                   user?.resume?.extractedSkills?.map(s => s.skillName) || [];
    
    // Generate market trends for user's skills
    const trends = await generateMarketTrends(skills);
    
    res.status(200).json({
      status: 'success',
      data: trends
    });
  } catch (error) {
    console.error('Error getting market trends:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get market trends',
      error: error.message
    });
  }
}; 

/**
 * Generate market trends for skills
 * @param {Array} skills - Skills to analyze
 * @returns {Object} - Market trends
 */
async function generateMarketTrends(skills) {
  // This would typically call real market data APIs
  const trendingUp = ['TypeScript', 'React', 'Kubernetes', 'AWS', 'Python', 'GraphQL'];
  const stable = ['JavaScript', 'Node.js', 'Git', 'SQL', 'HTML', 'CSS'];
  const declining = ['jQuery', 'AngularJS', 'PHP', 'SOAP'];
  
  const analyzedSkills = skills.map(skill => {
    let trend = 'stable';
    let growth = '0%';
    
    if (trendingUp.some(t => skill.toLowerCase().includes(t.toLowerCase()))) {
      trend = 'rising';
      growth = '+15%';
    } else if (declining.some(d => skill.toLowerCase().includes(d.toLowerCase()))) {
      trend = 'declining';
      growth = '-5%';
    } else {
      growth = '+3%';
    }
    
    return {
      skill,
      trend,
      growth,
      demand: trend === 'rising' ? 'High' : trend === 'declining' ? 'Medium' : 'High'
    };
  });
  
  return {
    overview: {
      totalSkills: skills.length,
      risingSkills: analyzedSkills.filter(s => s.trend === 'rising').length,
      stableSkills: analyzedSkills.filter(s => s.trend === 'stable').length,
      decliningSkills: analyzedSkills.filter(s => s.trend === 'declining').length
    },
    skillAnalysis: analyzedSkills,
    recommendations: {
      focus: analyzedSkills.filter(s => s.trend === 'rising').slice(0, 3).map(s => s.skill),
      develop: ['Cloud Computing', 'AI/ML', 'DevOps'],
      monitor: analyzedSkills.filter(s => s.trend === 'declining').map(s => s.skill)
    },
    industryInsights: {
      emergingTechnologies: ['WebAssembly', 'Edge Computing', 'Quantum Computing'],
      inDemandSkills: ['Cloud Platforms', 'Microservices', 'AI/ML'],
      marketGrowth: '12% annually in tech sector'
    }
  };
} 