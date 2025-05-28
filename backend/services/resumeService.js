const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const pdfParse = require('pdf-parse');

// Initialize Gemini API
let genAI;
let model;

try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log('Gemini API initialized successfully for resume service');
  } else {
    console.warn('GEMINI_API_KEY not set for resume service. Using mock model.');
    // Create a mock model for development
    model = {
      generateContent: async (prompt) => {
        console.log('Mock Gemini model called with prompt:', prompt.substring(0, 100) + '...');
        return {
          response: {
            text: () => JSON.stringify({
              skills: [
                { skillName: "JavaScript", confidenceScore: 0.9 },
                { skillName: "React", confidenceScore: 0.8 },
                { skillName: "Node.js", confidenceScore: 0.7 }
              ],
              atsScore: 75,
              analysis: "This is a mock ATS analysis. The resume is good but could use improvements in formatting and specific achievements."
            })
          }
        };
      }
    };
  }
} catch (error) {
  console.error('Error initializing Gemini for resume service:', error);
  // Fallback to mock model
  model = {
    generateContent: async (prompt) => {
      console.log('Mock Gemini model called with prompt:', prompt.substring(0, 100) + '...');
      return {
        response: {
          text: () => JSON.stringify({
            skills: [
              { skillName: "JavaScript", confidenceScore: 0.9 },
              { skillName: "React", confidenceScore: 0.8 },
              { skillName: "Node.js", confidenceScore: 0.7 }
            ],
            atsScore: 75,
            analysis: "This is a mock ATS analysis. The resume is good but could use improvements in formatting and specific achievements."
          })
        }
      };
    }
  };
}

/**
 * Extract text content from a resume file
 * @param {string} filePath - Path to the resume file
 * @returns {string} - Extracted text content
 */
const extractTextFromResume = async (filePath) => {
  try {
    // Get file extension to determine how to process it
    const fileExtension = path.extname(filePath).toLowerCase();
    
    // Process based on file type
    if (fileExtension === '.pdf') {
      // Handle PDF file using pdf-parse
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(pdfBuffer);
      return pdfData.text;
    } else if (fileExtension === '.txt') {
      // Handle plain text files
      return fs.readFileSync(filePath, 'utf8');
    } else if (fileExtension === '.doc' || fileExtension === '.docx') {
      // For now, we'll just try to read them as text
      // In production, you should use a proper library like mammoth for docx files
      try {
        return fs.readFileSync(filePath, 'utf8');
      } catch (docError) {
        console.error('Error reading doc/docx as text:', docError);
        return "Error extracting text from document file. Document parsing needs additional libraries.";
      }
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  } catch (error) {
    console.error('Error extracting text from resume:', error);
    throw new Error(`Failed to extract text from resume file: ${error.message}`);
  }
};

/**
 * Extract skills from resume text using Gemini API
 * @param {string} resumeText - Text content of the resume
 * @param {string} targetRole - User's target role (optional)
 * @returns {Object} - Extracted skills, ATS score, and analysis
 */
const extractSkillsFromResume = async (resumeText, targetRole = '') => {
  try {
    // Create a prompt for Gemini API
    const prompt = `
    I have a resume text that I need to analyze for technical skills and provide an ATS (Applicant Tracking System) score.
    
    Resume text:
    ${resumeText}
    
    ${targetRole ? `The person is targeting a ${targetRole} role.` : ''}
    
    Please perform the following tasks:
    
    1. Extract all technical skills (programming languages, tools, frameworks, methodologies, etc.) mentioned in the resume.
    2. For each skill, assign a confidence score between 0 and 1 indicating how certain you are that this is a real skill the person has.
    3. Provide an ATS score from 0-100 based on how well this resume would perform in an Applicant Tracking System.
    4. Provide a brief analysis (100-200 words) of the resume's strengths and weaknesses, with specific suggestions for improvement.
    
    Format your response as a JSON object with the following structure:
    {
      "skills": [
        {"skillName": "Skill1", "confidenceScore": 0.9},
        {"skillName": "Skill2", "confidenceScore": 0.8},
        ...
      ],
      "atsScore": 85,
      "analysis": "Analysis text here..."
    }
    `;
    
    // Call Gemini API
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      // Parse the JSON response
      // Find the JSON part (it might be surrounded by other text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error('No valid JSON found in Gemini response');
        throw new Error('Invalid response format');
      }
      
      const jsonStr = jsonMatch[0];
      const parsedResponse = JSON.parse(jsonStr);
      
      // Validate the response structure
      if (!parsedResponse.skills || !Array.isArray(parsedResponse.skills) || 
          typeof parsedResponse.atsScore !== 'number' || 
          typeof parsedResponse.analysis !== 'string') {
        console.error('Invalid response structure from Gemini');
        throw new Error('Invalid response structure');
      }
      
      return {
        extractedSkills: parsedResponse.skills,
        atsScore: parsedResponse.atsScore,
        atsAnalysis: parsedResponse.analysis
      };
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw response:', responseText);
      throw new Error('Failed to parse skills extraction response');
    }
  } catch (error) {
    console.error('Error extracting skills from resume:', error);
    throw error;
  }
};

/**
 * Update user profile with extracted skills from resume
 * @param {string} userId - User ID
 * @param {Array} extractedSkills - Skills extracted from resume
 * @returns {Promise<Object>} - Updated user object
 */
const updateUserSkillsFromResume = async (userId, extractedSkills) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get existing skill names for comparison
    const existingSkillNames = user.existingSkills.map(skill => 
      skill.skillName.toLowerCase()
    );
    
    // Add new skills from resume
    extractedSkills.forEach(skill => {
      // Only add skills with confidence score above 0.7
      if (skill.confidenceScore >= 0.7) {
        const skillNameLower = skill.skillName.toLowerCase();
        
        // Check if skill already exists
        if (!existingSkillNames.includes(skillNameLower)) {
          user.existingSkills.push({
            skillName: skill.skillName,
            proficiency: 'Beginner', // Default proficiency
            status: 'Not Started',
            startDate: null,
            notes: 'Added from resume'
          });
          
          // Update existingSkillNames to prevent duplicates
          existingSkillNames.push(skillNameLower);
        }
      }
    });
    
    await user.save();
    return user;
  } catch (error) {
    console.error('Error updating user skills from resume:', error);
    throw error;
  }
};

/**
 * Compare extracted resume skills with required skills for target role
 * @param {Array} extractedSkills - Skills extracted from resume
 * @param {string} targetRole - User's target role
 * @returns {Promise<Object>} - Comparison results with matching and missing skills
 */
const compareSkillsWithTargetRole = async (extractedSkills, targetRole) => {
  try {
    if (!targetRole) {
      return {
        matching: extractedSkills,
        missing: [],
        analysis: "No target role specified. Set a target role to see skill gap analysis."
      };
    }

    // Create a prompt for Gemini API
    const prompt = `
    I have a list of skills extracted from a resume, and I need to compare them against skills typically required for a "${targetRole}" role.

    Skills extracted from resume:
    ${extractedSkills.map(skill => skill.skillName).join(', ')}

    Please perform the following tasks:
    1. Identify which of the extracted skills are relevant for a ${targetRole} role
    2. List important skills typically required for a ${targetRole} role that are missing from the extracted skills
    3. Provide a brief analysis of the skill match (3-4 sentences)

    Format your response as a JSON object with the following structure:
    {
      "relevantSkills": ["Skill1", "Skill2", ...],
      "missingSkills": [
        {"skillName": "Missing Skill 1", "importance": "High/Medium/Low"},
        {"skillName": "Missing Skill 2", "importance": "High/Medium/Low"},
        ...
      ],
      "analysis": "Brief analysis text here..."
    }
    `;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    try {
      // Parse the JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error('No valid JSON found in Gemini response for skill comparison');
        throw new Error('Invalid response format');
      }
      
      const jsonStr = jsonMatch[0];
      const parsedResponse = JSON.parse(jsonStr);
      
      // Convert extractedSkills to a map for easy lookup
      const extractedSkillsMap = new Map();
      extractedSkills.forEach(skill => {
        extractedSkillsMap.set(skill.skillName.toLowerCase(), skill);
      });
      
      // Create matching skills array with confidence scores
      const matchingSkills = parsedResponse.relevantSkills.map(skillName => {
        // Find the skill in extractedSkills (case-insensitive)
        const matchKey = Array.from(extractedSkillsMap.keys()).find(
          key => key === skillName.toLowerCase()
        );
        
        if (matchKey) {
          return extractedSkillsMap.get(matchKey);
        }
        
        // If not found (shouldn't happen), return with default confidence
        return {
          skillName: skillName,
          confidenceScore: 0.7
        };
      });
      
      return {
        matching: matchingSkills,
        missing: parsedResponse.missingSkills,
        analysis: parsedResponse.analysis
      };
    } catch (parseError) {
      console.error('Error parsing Gemini response for skill comparison:', parseError);
      console.error('Raw response:', responseText);
      
      // Return a default response if parsing fails
      return {
        matching: extractedSkills,
        missing: [],
        analysis: "Failed to analyze skills gap. Please try again later."
      };
    }
  } catch (error) {
    console.error('Error comparing skills:', error);
    
    // Return a default response if the API call fails
    return {
      matching: extractedSkills,
      missing: [],
      analysis: "Failed to analyze skills gap. Please try again later."
    };
  }
};

/**
 * Generate personalized career recommendations based on resume skills and target role
 * @param {Array} extractedSkills - Skills extracted from resume
 * @param {Object} skillComparison - Results of skill comparison with target role
 * @param {string} targetRole - User's target role
 * @returns {Promise<Object>} - Personalized career recommendations
 */
const generateCareerRecommendations = async (extractedSkills, skillComparison, targetRole) => {
  try {
    // Create a prompt for Gemini API
    const prompt = `
    I need to generate highly personalized career recommendations for someone targeting a "${targetRole}" role.
    
    Their current skills from their resume:
    ${extractedSkills.map(skill => `- ${skill.skillName} (Confidence: ${skill.confidenceScore})`).join('\n')}
    
    Skills that match the target role requirements:
    ${skillComparison.matching?.map(skill => `- ${skill.skillName}`).join('\n') || 'None identified'}
    
    Skills missing for the target role:
    ${skillComparison.missing?.map(skill => `- ${skill.skillName} (Importance: ${skill.importance || 'Medium'})`).join('\n') || 'None identified'}
    
    Please provide:
    1. A personalized learning path with clear prioritization (what to learn first, second, etc.)
    2. Specific course or certification recommendations for the highest priority missing skills
    3. Career development advice specifically for pursuing a ${targetRole} position
    4. Suggested projects to build that would demonstrate the required skills
    5. Tips for highlighting existing skills in interviews and on their resume
    
    Format your response as a JSON object with the following structure:
    {
      "learningPath": [
        {"skillName": "Skill1", "priority": "High/Medium/Low", "rationale": "Why this should be learned first"},
        {"skillName": "Skill2", "priority": "High/Medium/Low", "rationale": "Why this should be learned next"},
        ...
      ],
      "courseRecommendations": [
        {"skillName": "Skill1", "courses": ["Course1", "Course2"], "certifications": ["Cert1"]},
        {"skillName": "Skill2", "courses": ["Course3"], "certifications": []},
        ...
      ],
      "careerAdvice": "Personalized career development advice text",
      "projectIdeas": [
        {"name": "Project idea 1", "description": "Brief description", "skills": ["Skill1", "Skill2"]},
        {"name": "Project idea 2", "description": "Brief description", "skills": ["Skill3", "Skill4"]},
        ...
      ],
      "interviewTips": "Advice for highlighting skills in interviews"
    }
    
    Keep the response focused on the ${targetRole} role specifically.
    `;
    
    // Call Gemini API
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      // Parse the JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error('No valid JSON found in Gemini response for career recommendations');
        throw new Error('Invalid response format');
      }
      
      const jsonStr = jsonMatch[0];
      const parsedResponse = JSON.parse(jsonStr);
      
      return parsedResponse;
    } catch (parseError) {
      console.error('Error parsing Gemini response for career recommendations:', parseError);
      console.error('Raw response:', responseText);
      
      // Return a simplified response if parsing fails
      return {
        learningPath: skillComparison.missing?.map(skill => ({
          skillName: skill.skillName,
          priority: skill.importance || 'Medium',
          rationale: `This skill is important for the ${targetRole} role`
        })) || [],
        courseRecommendations: [],
        careerAdvice: `Focus on building the missing skills for your target ${targetRole} role. Consider online courses from platforms like Coursera, Udemy, or edX.`,
        projectIdeas: [{
          name: `${targetRole} Portfolio Project`,
          description: `Create a project that showcases your abilities relevant to the ${targetRole} position`,
          skills: skillComparison.missing?.slice(0, 3).map(s => s.skillName) || []
        }],
        interviewTips: `Highlight your experience with ${skillComparison.matching?.map(s => s.skillName).join(', ') || 'relevant technologies'} during interviews.`
      };
    }
  } catch (error) {
    console.error('Error generating career recommendations:', error);
    
    // Return a basic response if the API call fails
    return {
      error: "Could not generate personalized recommendations. Please try again later.",
      generalAdvice: `To pursue a career as a ${targetRole}, focus on building the missing skills identified in your skill gap analysis.`
    };
  }
};

module.exports = {
  extractTextFromResume,
  extractSkillsFromResume,
  updateUserSkillsFromResume,
  compareSkillsWithTargetRole,
  generateCareerRecommendations
}; 