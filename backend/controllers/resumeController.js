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
 * Get resume analysis with comprehensive scoring
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
      
      // Generate comprehensive analysis using enhanced AI prompts
      const comprehensiveAnalysis = await generateComprehensiveAnalysis(
        resumeText,
        targetRole,
        extractedSkills,
        skillComparisonResults,
        atsScore
      );
      
      // Update user's resume with fresh analysis
      user.resume.atsScore = atsScore;
      user.resume.atsAnalysis = atsAnalysis;
      user.resume.extractedSkills = extractedSkills;
      user.resume.skillComparison = skillComparisonResults;
      user.resume.comprehensiveAnalysis = comprehensiveAnalysis;
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
    
    // Calculate enhanced scores
    const enhancedScores = calculateEnhancedScores(
      user.resume.atsScore,
      user.resume.skillComparison,
      user.resume.comprehensiveAnalysis
    );
    
    // Generate priority-based recommendations
    const recommendations = generatePriorityRecommendations(
      user.resume.atsScore,
      user.resume.skillComparison,
      user.resume.comprehensiveAnalysis,
      targetRole
    );
    
    // Create enhanced response with all new features
    const enhancedResponse = {
      targetRole: targetRole,
      resumeInfo: {
        fileName: user.resume.fileName,
        uploadDate: user.resume.uploadDate,
        lastAnalysisDate: user.resume.lastAnalysisDate || user.resume.uploadDate
      },
      
      // Core scores
      atsScore: user.resume.atsScore,
      atsAnalysis: user.resume.atsAnalysis,
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
      
      // Skills and comparison
      extractedSkills: user.resume.extractedSkills,
      skillComparison: user.resume.skillComparison || {},
      requiredSkills: requiredSkills,
      userSkills: user.existingSkills,
      
      // Enhanced recommendations
      recommendations: recommendations
    };
    
    // Standardized response format following the guide
    const responseData = {
      analysisId: user._id.toString(),
      overallScore: enhancedResponse.overallScore,
      atsScore: enhancedResponse.atsScore,
      skillsAnalysis: {
        extractedSkills: enhancedResponse.extractedSkills || [],
        skillComparison: enhancedResponse.skillComparison || {},
        skillMatchPercentage: enhancedResponse.skillMatchPercentage,
        userSkills: enhancedResponse.userSkills || [],
        requiredSkills: enhancedResponse.requiredSkills || []
      },
      sectionScores: {
        keywordScore: enhancedResponse.keywordScore,
        formatScore: enhancedResponse.formatScore,
        headerScore: enhancedResponse.headerScore,
        experienceRelevance: enhancedResponse.experienceRelevance,
        quantificationScore: enhancedResponse.quantificationScore,
        actionVerbScore: enhancedResponse.actionVerbScore
      },
      recommendations: enhancedResponse.recommendations || [],
      industryBenchmarks: {
        averageAtsScore: 75,
        averageSkillMatch: 60,
        averageOverallScore: 70
      },
      resumeInfo: enhancedResponse.resumeInfo,
      generatedAt: new Date().toISOString(),
      fromCache: true // This was from cached results
    };

    console.log('✅ Sending standardized analysis response:', {
      success: true,
      dataKeys: Object.keys(responseData),
      overallScore: responseData.overallScore,
      atsScore: responseData.atsScore,
      fromCache: responseData.fromCache
    });

    res.status(200).json({
      success: true,
      data: responseData,
      metadata: {
        targetRole: targetRole,
        processingTime: 0 // Cache hit
      }
    });
  } catch (error) {
    console.error('❌ Resume Analysis Error - getResumeAnalysis:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to get resume analysis',
        context: 'getResumeAnalysis',
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Generate comprehensive analysis using AI
 */
async function generateComprehensiveAnalysis(resumeText, targetRole, extractedSkills, skillComparison, atsScore) {
  try {
    // Enhanced AI prompt for comprehensive analysis
    const comprehensivePrompt = `
Analyze this resume comprehensively for the role of ${targetRole}. Provide detailed analysis in the following areas:

1. KEYWORD ANALYSIS:
   - Identify missing industry-specific keywords
   - Assess keyword density and relevance
   - Suggest specific terms to include

2. FORMAT ANALYSIS:
   - Evaluate ATS compatibility
   - Check section organization
   - Assess overall structure

3. EXPERIENCE ANALYSIS:
   - Rate experience relevance (0-100)
   - Identify quantification opportunities
   - Assess action verb usage

4. SPECIFIC RECOMMENDATIONS:
   - List exactly what to improve
   - Provide specific examples
   - Estimate impact of each change

Resume Text: ${resumeText}

Provide analysis in JSON format with these fields:
{
  "keywordAnalysis": "detailed keyword assessment",
  "formatAnalysis": "format and structure evaluation", 
  "experienceAnalysis": "experience quality assessment",
  "quantificationAnalysis": "metrics and numbers assessment",
  "actionVerbAnalysis": "action verb strength assessment",
  "recommendations": [
    {
      "priority": "Critical|High|Medium|Low",
      "title": "specific improvement title",
      "description": "what needs to be changed",
      "impact": "expected improvement",
      "timeToFix": "estimated time",
      "examples": ["specific example 1", "specific example 2"]
    }
  ]
}
`;

    const analysisResult = await geminiService.callGeminiAPI(comprehensivePrompt);
    
    try {
      return JSON.parse(analysisResult);
    } catch (parseError) {
      console.error('Error parsing comprehensive analysis JSON:', parseError);
      return {
        keywordAnalysis: "Analysis completed - see recommendations",
        formatAnalysis: "Format evaluation completed",
        experienceAnalysis: "Experience assessment completed",
        recommendations: []
      };
    }
  } catch (error) {
    console.error('Error generating comprehensive analysis:', error);
    return {
      keywordAnalysis: "Unable to analyze keywords at this time",
      formatAnalysis: "Format analysis unavailable",
      experienceAnalysis: "Experience analysis unavailable",
      recommendations: []
    };
  }
}

/**
 * Calculate enhanced scores for the dashboard
 */
function calculateEnhancedScores(atsScore, skillComparison, comprehensiveAnalysis) {
  // Base scores
  const baseAtsScore = atsScore || 0;
  
  // Calculate skill match percentage
  const matchingSkills = skillComparison?.matching?.length || 0;
  const missingSkills = skillComparison?.missing?.length || 0;
  const totalSkills = matchingSkills + missingSkills;
  const skillMatchPercentage = totalSkills > 0 ? Math.round((matchingSkills / totalSkills) * 100) : 0;
  
  // Enhanced scoring factors
  const keywordScore = Math.max(0, Math.min(100, baseAtsScore + (skillMatchPercentage - 50))); // Adjust ATS based on skill match
  const formatScore = Math.min(100, baseAtsScore + 15); // Assume good format if ATS score is decent
  const headerScore = Math.min(100, baseAtsScore + 20); // Headers usually score well
  
  // Experience and content scores
  const experienceRelevance = skillMatchPercentage; // Base on skill alignment
  const quantificationScore = Math.max(20, Math.min(80, baseAtsScore - 20)); // Most resumes lack quantification
  const actionVerbScore = Math.max(40, Math.min(90, baseAtsScore)); // Action verbs usually present
  
  // Calculate overall score
  const overallScore = Math.round(
    baseAtsScore * 0.3 + 
    skillMatchPercentage * 0.3 + 
    experienceRelevance * 0.25 + 
    formatScore * 0.15
  );
  
  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    keywordScore: Math.max(0, Math.min(100, keywordScore)),
    formatScore: Math.max(0, Math.min(100, formatScore)),
    headerScore: Math.max(0, Math.min(100, headerScore)),
    experienceRelevance: Math.max(0, Math.min(100, experienceRelevance)),
    quantificationScore: Math.max(0, Math.min(100, quantificationScore)),
    actionVerbScore: Math.max(0, Math.min(100, actionVerbScore)),
    skillMatchPercentage: skillMatchPercentage
  };
}

/**
 * Generate priority-based recommendations
 */
function generatePriorityRecommendations(atsScore, skillComparison, comprehensiveAnalysis, targetRole) {
  const recommendations = [];
  
  // Use AI-generated recommendations if available
  if (comprehensiveAnalysis?.recommendations && comprehensiveAnalysis.recommendations.length > 0) {
    return comprehensiveAnalysis.recommendations;
  }
  
  // Fallback to rule-based recommendations
  const skillMatchPercentage = skillComparison ? 
    Math.round(((skillComparison.matching?.length || 0) / 
    ((skillComparison.matching?.length || 0) + (skillComparison.missing?.length || 0))) * 100) : 0;
  
  // Critical recommendations
  if (atsScore < 60) {
    recommendations.push({
      priority: "Critical",
      title: "Improve ATS Compatibility",
      description: `Your ATS score of ${atsScore} is below the recommended threshold of 60`,
      impact: "+20 points",
      timeToFix: "2-3 hours",
      examples: [
        "Use standard section headers (Experience, Education, Skills)",
        "Include relevant keywords from job descriptions",
        "Use a clean, simple format without graphics or tables"
      ]
    });
  }
  
  if (skillMatchPercentage < 50) {
    recommendations.push({
      priority: "Critical",
      title: `Add ${targetRole} Keywords`,
      description: `Only ${skillMatchPercentage}% of required skills are present in your resume`,
      impact: "+15 points",
      timeToFix: "1-2 hours",
      examples: [
        "Research job descriptions for common technical terms",
        "Include specific technologies, frameworks, and methodologies",
        "Add relevant certifications and tools"
      ]
    });
  }
  
  // High priority recommendations
  if (atsScore < 80) {
    recommendations.push({
      priority: "High",
      title: "Add Quantified Achievements",
      description: "Include specific metrics and numbers to demonstrate impact",
      impact: "+12 points",
      timeToFix: "45 minutes",
      examples: [
        "Increased system performance by 40%",
        "Managed a team of 8 developers",
        "Reduced deployment time from 2 hours to 15 minutes"
      ]
    });
  }
  
  // Medium priority recommendations
  recommendations.push({
    priority: "Medium",
    title: "Strengthen Action Verbs",
    description: "Replace weak verbs with powerful action words",
    impact: "+8 points",
    timeToFix: "30 minutes",
    examples: [
      "Replace 'Responsible for' with 'Led', 'Managed', 'Directed'",
      "Use 'Implemented' instead of 'Worked on'",
      "Choose 'Optimized' over 'Improved'"
    ]
  });
  
  // Low priority recommendations
  if (skillMatchPercentage > 70) {
    recommendations.push({
      priority: "Low",
      title: "Fine-tune Technical Skills Section",
      description: "Organize skills by category and proficiency level",
      impact: "+5 points",
      timeToFix: "20 minutes",
      examples: [
        "Group by: Programming Languages, Frameworks, Tools, Cloud Platforms",
        "List most relevant skills first",
        "Remove outdated or irrelevant technologies"
      ]
    });
  }
  
  return recommendations;
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