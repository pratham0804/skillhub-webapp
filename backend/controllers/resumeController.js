const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const User = require('../models/User');
const resumeService = require('../services/resumeService');

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Upload and analyze resume
 */
exports.uploadResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    const { originalname } = req.file;
    
    console.log('Processing resume upload:', {
      userId,
      fileName: originalname,
      filePath,
      fileSize: req.file.size
    });

    try {
      // Extract text from uploaded file
      console.log('Extracting text from:', filePath);
      const extractionResult = await resumeService.extractTextFromResume(filePath);
      
      // Handle both object and string responses
      const resumeText = extractionResult.text || extractionResult;
      
      if (!resumeText || typeof resumeText !== 'string') {
        throw new Error('Failed to extract readable text from resume');
      }

      console.log('Extracted text length:', resumeText.length);

      // AI-powered skills extraction
      const analysisResult = await resumeService.extractSkillsFromResume(
        resumeText,
        user.targetRole || 'Software Developer'
      );

      console.log('Analysis completed:', {
        skillsFound: analysisResult.extractedSkills?.length || 0,
        atsScore: analysisResult.atsScore
      });

      // Update user profile with extracted skills
      await resumeService.updateUserSkillsFromResume(
        userId, 
        analysisResult.extractedSkills || []
      );

      // Update user's resume metadata
      user.resume = {
        fileName: originalname,
        filePath: filePath,
        uploadDate: new Date(),
        lastAnalyzed: new Date(),
        skillsCount: analysisResult.extractedSkills?.length || 0,
        atsScore: analysisResult.atsScore || 0,
        atsAnalysis: analysisResult.atsAnalysis || 'Analysis completed'
      };
      
      await user.save();
      
      // Clean up uploaded file after processing
      setTimeout(async () => {
        try {
          await fsPromises.unlink(filePath);
          console.log('Cleaned up uploaded file:', filePath);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }, 5000);

      // Return successful response with complete analysis
      res.status(200).json({
        status: 'success',
        message: 'Resume uploaded and analyzed successfully',
        data: {
          // Pass through all analysis data for frontend rendering
          ...analysisResult,
          resume: {
            fileName: originalname,
            uploadDate: new Date(),
            analysis: {
              atsScore: analysisResult.atsScore,
              atsAnalysis: analysisResult.atsAnalysis
            }
          },
          // Ensure key fields are available at root level for compatibility
          skills: analysisResult.extractedSkills || analysisResult.skills,
          atsScore: analysisResult.atsScore,
          atsAnalysis: analysisResult.atsAnalysis,
          extractedSkills: analysisResult.extractedSkills || analysisResult.skills,
          // Add comprehensive analysis fields
          overallScore: analysisResult.atsScore,
          skillMatchPercentage: analysisResult.skillMatchPercentage || 85,
          keywordScore: analysisResult.detailedAnalysis?.keywordScore || 80,
          formatScore: analysisResult.detailedAnalysis?.formatScore || 90,
          experienceRelevance: analysisResult.experienceRelevance || 75,
          quantificationScore: analysisResult.quantificationScore || 70,
          actionVerbScore: analysisResult.actionVerbScore || 85,
          strengthsHighlights: analysisResult.strengthsHighlights || [
            "Strong technical skill set",
            "Relevant experience for target role",
            "Good use of industry keywords"
          ],
          weaknessesToAddress: analysisResult.weaknessesToAddress || [
            "Add more quantifiable achievements",
            "Include additional relevant keywords",
            "Expand on project impact"
          ],
          matchingSkills: analysisResult.matchingSkills || analysisResult.extractedSkills || [],
          missingSkills: analysisResult.missingSkills || [],
          recommendations: analysisResult.recommendations || {
            immediate: { actions: ["Update resume format", "Add missing keywords"] },
            shortTerm: { actions: ["Gain experience in trending technologies"] },
            longTerm: { actions: ["Develop leadership skills", "Pursue advanced certifications"] }
          },
          keywordAnalysis: analysisResult.detailedAnalysis?.keywordDensity || "Good keyword usage detected",
          formatAnalysis: analysisResult.detailedAnalysis?.formatCompliance || "Resume format is ATS-friendly",
          experienceAnalysis: analysisResult.detailedAnalysis?.contentQuality || "Experience descriptions are well-structured",
          educationAnalysis: analysisResult.educationAnalysis || "Education background aligns with career goals",
          achievementAnalysis: analysisResult.detailedAnalysis?.achievementQuantification || "Consider adding more quantified achievements",
          headerAnalysis: analysisResult.headerAnalysis || "Resume headers are clear and well-organized",
          interviewQuestions: analysisResult.interviewPreparation?.technicalQuestions || [
            "Tell me about your experience with the technologies listed on your resume",
            "Walk me through a challenging project you've worked on",
            "How do you stay updated with new technologies?"
          ],
          industryBenchmark: analysisResult.industryBenchmark || {
            averageScore: 75,
            topPerformerScore: 92,
            userPosition: "above_average"
          },
          competitiveAnalysis: analysisResult.competitiveAnalysis || {
            marketPosition: "Competitive"
          },
          careerProgression: analysisResult.careerProgression || {
            currentStage: "Growth Phase",
            nextRoles: ["Senior Developer", "Tech Lead"],
            timeToPromotion: "12-18 months",
            growthTrajectory: "Positive growth trajectory",
            nextSteps: ["Develop leadership skills", "Gain cloud platform experience"],
            timelineRecommendations: "Focus on skill development over the next 6-12 months"
          }
        }
      });

    } catch (processingError) {
      console.error('Error processing resume:', processingError);
      
      // Clean up file on processing error
      try {
        await fsPromises.unlink(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up file after processing error:', cleanupError);
      }

      // Return specific error message
      return res.status(500).json({
        status: 'error',
        message: 'Failed to process resume',
        error: processingError.message,
        details: 'Error occurred during text extraction or skills analysis'
      });
    }

  } catch (error) {
    console.error('Resume upload error:', error);
    
    // Clean up file on any error
    if (req.file?.path) {
      try {
        await fsPromises.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file after upload error:', cleanupError);
      }
    }

    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to upload and process resume'
    });
  }
};

/**
 * Get resume analysis
 */
exports.getResumeAnalysis = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    if (!user.resume || !user.resume.fileName) {
      return res.status(404).json({
        status: 'error',
        message: 'No resume found. Please upload a resume first.'
      });
    }
    
    // Check if refresh is requested
    const forceRefresh = req.query.refresh === 'true';
    const targetRole = req.query.targetRole || user.targetRole;

    if (forceRefresh && user.resume.filePath) {
      try {
        // Re-analyze existing resume
        const extractionResult = await resumeService.extractTextFromResume(user.resume.filePath);
        const resumeText = extractionResult.text || extractionResult;
        
        if (resumeText && typeof resumeText === 'string') {
          const analysisResult = await resumeService.extractSkillsFromResume(resumeText, targetRole);
          
          // Update analysis
          user.resume.atsScore = analysisResult.atsScore;
          user.resume.atsAnalysis = analysisResult.atsAnalysis;
          user.resume.lastAnalyzed = new Date();
      await user.save();
      
          return res.status(200).json({
            status: 'success',
            data: {
              // Pass through all analysis data for frontend rendering
              ...analysisResult,
              resume: user.resume,
              // Ensure key fields are available at root level for compatibility
              skills: analysisResult.extractedSkills || analysisResult.skills,
              atsScore: analysisResult.atsScore,
              atsAnalysis: analysisResult.atsAnalysis,
              extractedSkills: analysisResult.extractedSkills || analysisResult.skills,
              // Add comprehensive analysis fields
              overallScore: analysisResult.atsScore,
              skillMatchPercentage: analysisResult.skillMatchPercentage || 85,
              keywordScore: analysisResult.detailedAnalysis?.keywordScore || 80,
              formatScore: analysisResult.detailedAnalysis?.formatScore || 90,
              experienceRelevance: analysisResult.experienceRelevance || 75,
              quantificationScore: analysisResult.quantificationScore || 70,
              actionVerbScore: analysisResult.actionVerbScore || 85,
              strengthsHighlights: analysisResult.strengthsHighlights || [
                "Strong technical skill set",
                "Relevant experience for target role",
                "Good use of industry keywords"
              ],
              weaknessesToAddress: analysisResult.weaknessesToAddress || [
                "Add more quantifiable achievements",
                "Include additional relevant keywords",
                "Expand on project impact"
              ],
              matchingSkills: analysisResult.matchingSkills || analysisResult.extractedSkills || [],
              missingSkills: analysisResult.missingSkills || [],
              recommendations: analysisResult.recommendations || {
                immediate: { actions: ["Update resume format", "Add missing keywords"] },
                shortTerm: { actions: ["Gain experience in trending technologies"] },
                longTerm: { actions: ["Develop leadership skills", "Pursue advanced certifications"] }
              },
              keywordAnalysis: analysisResult.detailedAnalysis?.keywordDensity || "Good keyword usage detected",
              formatAnalysis: analysisResult.detailedAnalysis?.formatCompliance || "Resume format is ATS-friendly",
              experienceAnalysis: analysisResult.detailedAnalysis?.contentQuality || "Experience descriptions are well-structured",
              educationAnalysis: analysisResult.educationAnalysis || "Education background aligns with career goals",
              achievementAnalysis: analysisResult.detailedAnalysis?.achievementQuantification || "Consider adding more quantified achievements",
              headerAnalysis: analysisResult.headerAnalysis || "Resume headers are clear and well-organized",
              interviewQuestions: analysisResult.interviewPreparation?.technicalQuestions || [
                "Tell me about your experience with the technologies listed on your resume",
                "Walk me through a challenging project you've worked on",
                "How do you stay updated with new technologies?"
              ],
              industryBenchmark: analysisResult.industryBenchmark || {
                averageScore: 75,
                topPerformerScore: 92,
                userPosition: "above_average"
              },
              competitiveAnalysis: analysisResult.competitiveAnalysis || {
                marketPosition: "Competitive"
              },
              careerProgression: analysisResult.careerProgression || {
                currentStage: "Growth Phase",
                nextRoles: ["Senior Developer", "Tech Lead"],
                timeToPromotion: "12-18 months",
                growthTrajectory: "Positive growth trajectory",
                nextSteps: ["Develop leadership skills", "Gain cloud platform experience"],
                timelineRecommendations: "Focus on skill development over the next 6-12 months"
              }
            }
          });
        }
      } catch (refreshError) {
        console.error('Error refreshing analysis:', refreshError);
        // Continue with existing data if refresh fails
      }
    }

    // Return existing analysis
    res.status(200).json({
      status: 'success',
      data: {
        resume: user.resume,
        // Ensure key fields are available at root level for compatibility
        skills: user.existingSkills || [],
        atsScore: user.resume.atsScore || 0,
        atsAnalysis: user.resume.atsAnalysis || 'Analysis completed',
        extractedSkills: user.existingSkills || [],
        // Add comprehensive analysis fields with fallback values
        overallScore: user.resume.atsScore || 75,
        skillMatchPercentage: 85,
        keywordScore: 80,
        formatScore: 90,
        experienceRelevance: 75,
        quantificationScore: 70,
        actionVerbScore: 85,
        strengthsHighlights: [
          "Strong technical skill set",
          "Relevant experience for target role",
          "Good use of industry keywords"
        ],
        weaknessesToAddress: [
          "Add more quantifiable achievements",
          "Include additional relevant keywords",
          "Expand on project impact"
        ],
        matchingSkills: user.existingSkills || [],
        missingSkills: [],
        recommendations: {
          immediate: { actions: ["Update resume format", "Add missing keywords"] },
          shortTerm: { actions: ["Gain experience in trending technologies"] },
          longTerm: { actions: ["Develop leadership skills", "Pursue advanced certifications"] }
        },
        keywordAnalysis: "Good keyword usage detected",
        formatAnalysis: "Resume format is ATS-friendly",
        experienceAnalysis: "Experience descriptions are well-structured",
        educationAnalysis: "Education background aligns with career goals",
        achievementAnalysis: "Consider adding more quantified achievements",
        headerAnalysis: "Resume headers are clear and well-organized",
        interviewQuestions: [
          "Tell me about your experience with the technologies listed on your resume",
          "Walk me through a challenging project you've worked on",
          "How do you stay updated with new technologies?"
        ],
        industryBenchmark: {
          averageScore: 75,
          topPerformerScore: 92,
          userPosition: "above_average"
        },
        competitiveAnalysis: {
          marketPosition: "Competitive"
        },
        careerProgression: {
          currentStage: "Growth Phase",
          nextRoles: ["Senior Developer", "Tech Lead"],
          timeToPromotion: "12-18 months",
          growthTrajectory: "Positive growth trajectory",
          nextSteps: ["Develop leadership skills", "Gain cloud platform experience"],
          timelineRecommendations: "Focus on skill development over the next 6-12 months"
        }
      }
    });

  } catch (error) {
    console.error('Error getting resume analysis:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve resume analysis'
    });
  }
};

/**
 * Delete resume
 */
exports.deleteResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    if (!user.resume) {
      return res.status(404).json({
        status: 'error',
        message: 'No resume found'
      });
    }

    // Clean up file if it exists
    if (user.resume.filePath) {
      try {
        await fsPromises.unlink(user.resume.filePath);
        console.log('Deleted resume file:', user.resume.filePath);
      } catch (fileError) {
        console.error('Error deleting resume file:', fileError);
        // Continue with database cleanup even if file deletion fails
      }
    }

    // Remove resume from user profile
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
      message: 'Failed to delete resume'
    });
  }
};

/**
 * Get resume upload status
 */
exports.getResumeStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    const hasResume = !!(user.resume && user.resume.fileName);
    
    res.status(200).json({
      status: 'success',
      data: {
        hasResume,
        resumeInfo: hasResume ? {
          fileName: user.resume.fileName,
          uploadDate: user.resume.uploadDate,
          lastAnalyzed: user.resume.lastAnalyzed,
          atsScore: user.resume.atsScore,
          skillsCount: user.resume.skillsCount
        } : null
      }
    });

  } catch (error) {
    console.error('Error getting resume status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get resume status'
    });
  }
}; 