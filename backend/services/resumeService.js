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
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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
                { skillName: "JavaScript", confidenceScore: 0.9, category: "Programming Languages" },
                { skillName: "React", confidenceScore: 0.8, category: "Frontend Frameworks" },
                { skillName: "Node.js", confidenceScore: 0.7, category: "Backend Technologies" },
                { skillName: "MongoDB", confidenceScore: 0.8, category: "Databases" },
                { skillName: "Docker", confidenceScore: 0.6, category: "DevOps Tools" }
              ],
              atsScore: 78,
              analysis: "Resume shows strong technical foundation with modern web development stack. Consider adding more quantifiable achievements and cloud platform experience.",
              categories: {
                "Programming Languages": ["JavaScript", "Python"],
                "Frontend Frameworks": ["React", "Angular"],
                "Backend Technologies": ["Node.js", "Express"],
                "Databases": ["MongoDB", "PostgreSQL"],
                "DevOps Tools": ["Docker", "Git"]
              },
              experienceLevel: "Mid-Level",
              marketDemand: "High",
              salaryRange: "$70,000 - $95,000",
              careerStage: "Growth Phase"
            })
          }
        };
      }
    };
  }
} catch (error) {
  console.error('Error initializing Gemini for resume service:', error);
  // Fallback to enhanced mock model
  model = {
    generateContent: async (prompt) => {
      console.log('Mock Gemini model called with prompt:', prompt.substring(0, 100) + '...');
      return {
        response: {
          text: () => JSON.stringify({
            skills: [
              { skillName: "JavaScript", confidenceScore: 0.9, category: "Programming Languages", yearsExperience: 3 },
              { skillName: "React", confidenceScore: 0.8, category: "Frontend Frameworks", yearsExperience: 2 },
              { skillName: "Node.js", confidenceScore: 0.7, category: "Backend Technologies", yearsExperience: 2 },
              { skillName: "MongoDB", confidenceScore: 0.8, category: "Databases", yearsExperience: 2 },
              { skillName: "Docker", confidenceScore: 0.6, category: "DevOps Tools", yearsExperience: 1 }
            ],
            atsScore: 78,
            analysis: "Resume demonstrates solid technical expertise with modern development stack. Strong foundation in full-stack development. Recommendations include adding cloud platform experience and more quantified achievements.",
            detailedAnalysis: {
              keywordDensity: "Good use of relevant technical keywords",
              formatCompliance: "Resume format is ATS-friendly with clear sections",
              contentQuality: "Well-structured experience descriptions with room for more metrics",
              skillRelevance: "Skills align well with current market demands"
            },
            categories: {
              "Programming Languages": ["JavaScript", "Python", "TypeScript"],
              "Frontend Frameworks": ["React", "Angular", "Vue.js"],
              "Backend Technologies": ["Node.js", "Express", "Spring Boot"],
              "Databases": ["MongoDB", "PostgreSQL", "Redis"],
              "DevOps Tools": ["Docker", "Git", "AWS", "Jenkins"]
            },
            marketInsights: {
              experienceLevel: "Mid-Level (2-4 years)",
              marketDemand: "Very High",
              growthProjection: "15% year over year",
              salaryRange: "$75,000 - $105,000",
              topCompanies: ["Google", "Microsoft", "Amazon", "Meta", "Netflix"],
              emergingSkills: ["Cloud Computing", "Microservices", "GraphQL", "Kubernetes"]
            },
            careerProgression: {
              currentStage: "Growth Phase",
              nextRoles: ["Senior Full Stack Developer", "Tech Lead", "Solution Architect"],
              skillGaps: ["Cloud Platforms", "System Design", "Leadership"],
              timeToPromotion: "12-18 months"
            }
          })
        }
      };
    }
  };
}

/**
 * Enhanced text extraction with better parsing capabilities
 * @param {string} filePath - Path to the resume file
 * @returns {string} - Extracted text content with metadata
 */
const extractTextFromResume = async (filePath) => {
  try {
    const fileExtension = path.extname(filePath).toLowerCase();
    let extractedText = '';
    let metadata = {};
    
    if (fileExtension === '.pdf') {
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(pdfBuffer);
      extractedText = pdfData.text;
      metadata = {
        pages: pdfData.numpages,
        wordCount: pdfData.text.split(/\s+/).length,
        extractionMethod: 'PDF Parser'
      };
    } else if (fileExtension === '.txt') {
      extractedText = fs.readFileSync(filePath, 'utf8');
      metadata = {
        wordCount: extractedText.split(/\s+/).length,
        extractionMethod: 'Text File'
      };
    } else if (fileExtension === '.doc' || fileExtension === '.docx') {
      try {
        extractedText = fs.readFileSync(filePath, 'utf8');
        metadata = {
          extractionMethod: 'Document File (Raw)',
          note: 'Consider using specialized document parser for better extraction'
        };
      } catch (docError) {
        console.error('Error reading doc/docx as text:', docError);
        throw new Error("Document parsing requires additional libraries. Please convert to PDF or text format.");
      }
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`);
    }
    
    // Clean and structure the text
    const cleanedText = cleanResumeText(extractedText);
    
    return {
      text: cleanedText,
      metadata: metadata,
      sections: identifyResumeSections(cleanedText)
    };
  } catch (error) {
    console.error('Error extracting text from resume:', error);
    throw new Error(`Failed to extract text from resume file: ${error.message}`);
  }
};

/**
 * Clean and structure resume text for better analysis
 * @param {string} rawText - Raw extracted text
 * @returns {string} - Cleaned text
 */
const cleanResumeText = (rawText) => {
  return rawText
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .replace(/[^\w\s\n.,;:()\-@]/g, '') // Remove special characters except common punctuation
    .trim();
};

/**
 * Identify resume sections for better analysis
 * @param {string} text - Cleaned resume text
 * @returns {Object} - Object with identified sections
 */
const identifyResumeSections = (text) => {
  const sections = {};
  const sectionPatterns = {
    contact: /contact|email|phone|address/i,
    summary: /summary|objective|profile|about/i,
    experience: /experience|employment|work|career/i,
    education: /education|academic|degree|university|college/i,
    skills: /skills|technologies|competencies|expertise/i,
    projects: /projects|portfolio|applications/i,
    certifications: /certifications|certificates|licenses/i,
    achievements: /achievements|awards|accomplishments/i
  };
  
  const lines = text.split('\n');
  let currentSection = 'general';
  
  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(lowerLine) && line.length < 50) { // Likely a header
        currentSection = sectionName;
        break;
      }
    }
    
    if (!sections[currentSection]) {
      sections[currentSection] = [];
    }
    sections[currentSection].push(line);
  });
  
  return sections;
};

/**
 * Enhanced skills extraction with categorization and market analysis
 * @param {string} resumeText - Text content of the resume
 * @param {string} targetRole - User's target role
 * @returns {Object} - Comprehensive analysis including skills, market insights, and recommendations
 */
const extractSkillsFromResume = async (resumeText, targetRole = '') => {
  try {
    const prompt = `
    Analyze this resume comprehensively for a ${targetRole || 'software development'} role:
    
    Resume Content: ${resumeText}
    
    Provide a detailed JSON analysis with the following structure:
    {
      "skills": [
        {
          "skillName": "Skill Name",
          "confidenceScore": 0.9,
          "category": "Programming Languages|Frontend Frameworks|Backend Technologies|Databases|DevOps Tools|Soft Skills|Domain Knowledge",
          "yearsExperience": 3,
          "proficiencyLevel": "Beginner|Intermediate|Advanced|Expert",
          "marketDemand": "Low|Medium|High|Very High",
          "relevanceToRole": 0.95
        }
      ],
      "atsScore": 85,
      "analysis": "Comprehensive analysis of the resume (200+ words)",
      "detailedAnalysis": {
        "keywordDensity": "Analysis of keyword usage",
        "formatCompliance": "ATS format assessment",
        "contentQuality": "Quality of experience descriptions",
        "skillRelevance": "How well skills match the target role",
        "achievementQuantification": "Assessment of quantifiable achievements",
        "actionVerbUsage": "Evaluation of action verbs used"
      },
      "categories": {
        "Programming Languages": ["List of programming languages found"],
        "Frontend Frameworks": ["Frontend technologies"],
        "Backend Technologies": ["Backend frameworks and tools"],
        "Databases": ["Database technologies"],
        "DevOps Tools": ["DevOps and deployment tools"],
        "Soft Skills": ["Communication, leadership, etc."],
        "Domain Knowledge": ["Industry-specific knowledge"]
      },
      "marketInsights": {
        "experienceLevel": "Entry|Junior|Mid-Level|Senior|Expert",
        "marketDemand": "Assessment of demand for this profile",
        "growthProjection": "Career growth outlook",
        "salaryRange": "Expected salary range",
        "topCompanies": ["Companies that typically hire this profile"],
        "emergingSkills": ["Skills gaining importance in the market"],
        "competitiveSkills": ["Skills that give competitive advantage"]
      },
      "careerProgression": {
        "currentStage": "Assessment of current career stage",
        "nextRoles": ["Potential next career moves"],
        "skillGaps": ["Skills needed for advancement"],
        "timeToPromotion": "Estimated time to next level",
        "learningPath": ["Recommended learning sequence"]
      },
      "interviewPreparation": {
        "technicalQuestions": ["Likely technical interview questions"],
        "behavioralQuestions": ["Behavioral interview questions"],
        "projectDiscussion": ["How to present projects effectively"],
        "weaknessesToAddress": ["Areas to prepare answers for"]
      },
      "industryBenchmark": {
        "averageScore": 75,
        "topPerformerScore": 92,
        "userPosition": "below_average|average|above_average|top_performer",
        "improvementAreas": ["Key areas for improvement"]
      }
    }
    
    Make the analysis detailed, actionable, and specific to the ${targetRole || 'software development'} field.
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No valid JSON found in Gemini response');
        throw new Error('Invalid response format');
      }
      
      const jsonStr = jsonMatch[0];
      const parsedResponse = JSON.parse(jsonStr);
      
      // Validate and enhance the response
      if (!parsedResponse.skills || !Array.isArray(parsedResponse.skills)) {
        throw new Error('Invalid skills format in response');
      }
      
      // Calculate additional metrics
      const enhancedResponse = {
        ...parsedResponse,
        extractedSkills: parsedResponse.skills,
        atsScore: parsedResponse.atsScore || 70,
        atsAnalysis: parsedResponse.analysis || "Resume analysis completed",
        skillCategorization: categorizeSkills(parsedResponse.skills),
        marketAnalysis: await generateMarketAnalysis(parsedResponse.skills, targetRole),
        recommendations: generateSkillRecommendations(parsedResponse.skills, parsedResponse.skillGaps || [])
      };
      
      return enhancedResponse;
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw response:', responseText);
      
      // Return enhanced fallback response
      return generateFallbackAnalysis(resumeText, targetRole);
    }
  } catch (error) {
    console.error('Error extracting skills from resume:', error);
    return generateFallbackAnalysis(resumeText, targetRole);
  }
};

/**
 * Generate fallback analysis when AI service fails
 * @param {string} resumeText - Resume text
 * @param {string} targetRole - Target role
 * @returns {Object} - Fallback analysis object
 */
const generateFallbackAnalysis = (resumeText, targetRole) => {
  const commonSkills = extractBasicSkills(resumeText);
  
  return {
    extractedSkills: commonSkills,
    atsScore: 75,
    atsAnalysis: "Resume analysis completed using fallback method. For enhanced analysis, please ensure all services are properly configured.",
    detailedAnalysis: {
      keywordDensity: "Basic keyword analysis completed",
      formatCompliance: "Standard format assessment",
      contentQuality: "Content review completed",
      skillRelevance: "Skills relevance evaluated"
    },
    categories: {
      "Programming Languages": commonSkills.filter(s => ['javascript', 'python', 'java', 'c++'].includes(s.skillName.toLowerCase())),
      "Frontend Frameworks": commonSkills.filter(s => ['react', 'angular', 'vue'].includes(s.skillName.toLowerCase())),
      "Backend Technologies": commonSkills.filter(s => ['node', 'express', 'spring'].includes(s.skillName.toLowerCase())),
      "Databases": commonSkills.filter(s => ['mongodb', 'mysql', 'postgresql'].includes(s.skillName.toLowerCase()))
    },
    marketInsights: {
      experienceLevel: "Mid-Level",
      marketDemand: "High",
      salaryRange: "$70,000 - $90,000",
      emergingSkills: ["Cloud Computing", "DevOps", "AI/ML"]
    },
    careerProgression: {
      currentStage: "Growth Phase",
      nextRoles: [`Senior ${targetRole}`, "Team Lead", "Solution Architect"],
      skillGaps: ["Leadership", "System Design"],
      timeToPromotion: "12-18 months"
    }
  };
};

/**
 * Extract basic skills using pattern matching
 * @param {string} text - Resume text
 * @returns {Array} - Array of basic skills
 */
const extractBasicSkills = (text) => {
  const skillPatterns = [
    'JavaScript', 'Python', 'Java', 'C++', 'React', 'Angular', 'Vue',
    'Node.js', 'Express', 'Spring', 'MongoDB', 'MySQL', 'PostgreSQL',
    'Git', 'Docker', 'AWS', 'HTML', 'CSS', 'REST', 'API'
  ];
  
  const foundSkills = [];
  const lowerText = text.toLowerCase();
  
  skillPatterns.forEach(skill => {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.push({
        skillName: skill,
        confidenceScore: 0.8,
        category: "Technical Skills",
        proficiencyLevel: "Intermediate"
      });
    }
  });
  
  return foundSkills;
};

/**
 * Categorize skills into meaningful groups
 * @param {Array} skills - Array of skills
 * @returns {Object} - Categorized skills
 */
const categorizeSkills = (skills) => {
  const categories = {};
  
  skills.forEach(skill => {
    const category = skill.category || 'Other';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(skill);
  });
  
  return categories;
};

/**
 * Generate market analysis for skills
 * @param {Array} skills - Array of skills
 * @param {string} targetRole - Target role
 * @returns {Object} - Market analysis
 */
const generateMarketAnalysis = async (skills, targetRole) => {
  try {
    const topSkills = skills.slice(0, 5).map(s => s.skillName).join(', ');
    
    const prompt = `
    Provide market analysis for someone with these skills: ${topSkills}
    Target role: ${targetRole}
    
    Return JSON with:
    {
      "demandLevel": "Low|Medium|High|Very High",
      "averageSalary": "Salary range",
      "jobGrowth": "Growth percentage",
      "topLocations": ["City names"],
      "competitiveLandscape": "Market competition analysis",
      "futureTrends": ["Emerging trends"]
    }
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error generating market analysis:', error);
  }
  
  // Fallback market analysis
  return {
    demandLevel: "High",
    averageSalary: "$75,000 - $95,000",
    jobGrowth: "12% annually",
    topLocations: ["San Francisco", "New York", "Seattle", "Austin"],
    competitiveLandscape: "Competitive but plenty of opportunities",
    futureTrends: ["Remote work", "Cloud technologies", "AI integration"]
  };
};

/**
 * Generate skill-based recommendations
 * @param {Array} skills - Current skills
 * @param {Array} skillGaps - Missing skills
 * @returns {Object} - Recommendations
 */
const generateSkillRecommendations = (skills, skillGaps) => {
  const recommendations = {
    immediate: [],
    shortTerm: [],
    longTerm: []
  };
  
  // Analyze skill levels and gaps
  const beginnerSkills = skills.filter(s => s.proficiencyLevel === 'Beginner');
  const emergingSkills = ['Cloud Computing', 'Kubernetes', 'GraphQL', 'TypeScript'];
  
  // Immediate recommendations
  if (beginnerSkills.length > 0) {
    recommendations.immediate.push(`Focus on improving ${beginnerSkills[0].skillName} proficiency`);
  }
  
  // Short-term recommendations
  if (skillGaps.length > 0) {
    recommendations.shortTerm.push(`Learn ${skillGaps.slice(0, 2).join(' and ')}`);
  }
  
  // Long-term recommendations
  recommendations.longTerm.push(`Explore emerging technologies: ${emergingSkills.slice(0, 2).join(', ')}`);
  
  return recommendations;
};

/**
 * Enhanced skill comparison with market data
 * @param {Array} extractedSkills - Skills from resume
 * @param {string} targetRole - Target job role
 * @returns {Object} - Comprehensive skill comparison
 */
const compareSkillsWithTargetRole = async (extractedSkills, targetRole) => {
  try {
    const prompt = `
    Compare these extracted skills with requirements for ${targetRole} position:
    
    Extracted Skills: ${extractedSkills.map(s => s.skillName).join(', ')}
    
    Provide analysis in JSON format:
    {
      "matchingSkills": [
        {
          "skillName": "Skill name",
          "matchStrength": "Exact|Close|Partial",
          "importance": "Critical|Important|Nice to have",
          "marketValue": "High|Medium|Low"
        }
      ],
      "missingSkills": [
        {
          "skillName": "Missing skill",
          "importance": "Critical|Important|Nice to have",
          "learningDifficulty": "Easy|Medium|Hard",
          "timeToLearn": "1-2 weeks|1-3 months|3-6 months|6+ months",
          "resources": ["Learning resource suggestions"]
        }
      ],
      "skillGaps": [
        {
          "area": "Gap area",
          "impact": "High|Medium|Low",
          "recommendations": ["Specific actions to take"]
        }
      ],
      "overallMatch": 85,
      "strengths": ["Key strength areas"],
      "improvementAreas": ["Areas needing development"],
      "marketReadiness": "Ready|Mostly Ready|Needs Development|Significant Gaps"
    }
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      
      // Add learning paths and resources
      analysis.learningPath = generateLearningPath(analysis.missingSkills || []);
      analysis.prioritySkills = prioritizeSkills(analysis.missingSkills || []);
      
      return analysis;
    }
  } catch (error) {
    console.error('Error comparing skills with target role:', error);
  }
  
  // Enhanced fallback comparison
  const skillNames = extractedSkills.map(s => s.skillName.toLowerCase());
  const commonRequiredSkills = getCommonSkillsForRole(targetRole);
  
  const matchingSkills = commonRequiredSkills.filter(skill => 
    skillNames.some(userSkill => userSkill.includes(skill.toLowerCase()))
  ).map(skill => ({
    skillName: skill,
    matchStrength: "Close",
    importance: "Important",
    marketValue: "High"
  }));
  
  const missingSkills = commonRequiredSkills.filter(skill => 
    !skillNames.some(userSkill => userSkill.includes(skill.toLowerCase()))
  ).map(skill => ({
    skillName: skill,
    importance: "Important",
    learningDifficulty: "Medium",
    timeToLearn: "1-3 months"
  }));
  
  return {
    matchingSkills,
    missingSkills,
    overallMatch: Math.round((matchingSkills.length / commonRequiredSkills.length) * 100),
    strengths: matchingSkills.slice(0, 3).map(s => s.skillName),
    improvementAreas: missingSkills.slice(0, 3).map(s => s.skillName),
    marketReadiness: matchingSkills.length >= commonRequiredSkills.length * 0.7 ? "Ready" : "Needs Development"
  };
};

/**
 * Get common skills for a role
 * @param {string} role - Target role
 * @returns {Array} - Array of common skills
 */
const getCommonSkillsForRole = (role) => {
  const roleSkillMap = {
    'full stack developer': ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Git', 'REST API', 'HTML', 'CSS'],
    'frontend developer': ['JavaScript', 'React', 'HTML', 'CSS', 'TypeScript', 'Webpack', 'Git'],
    'backend developer': ['Node.js', 'Express', 'MongoDB', 'REST API', 'Git', 'Database Design'],
    'data scientist': ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics', 'Pandas', 'NumPy'],
    'devops engineer': ['Docker', 'Kubernetes', 'AWS', 'Jenkins', 'Git', 'Linux', 'Terraform']
  };
  
  const lowerRole = role.toLowerCase();
  for (const [roleKey, skills] of Object.entries(roleSkillMap)) {
    if (lowerRole.includes(roleKey)) {
      return skills;
    }
  }
  
  return ['JavaScript', 'Git', 'Problem Solving', 'Communication']; // Default skills
};

/**
 * Generate learning path for missing skills
 * @param {Array} missingSkills - Array of missing skills
 * @returns {Object} - Learning path with timeline
 */
const generateLearningPath = (missingSkills) => {
  const beginnerPath = missingSkills.filter(s => s.learningDifficulty === 'Easy');
  const intermediatePath = missingSkills.filter(s => s.learningDifficulty === 'Medium');
  const advancedPath = missingSkills.filter(s => s.learningDifficulty === 'Hard');
  
  return {
    phase1: {
      title: "Foundation Building (1-2 months)",
      skills: beginnerPath.slice(0, 2),
      description: "Start with these foundational skills"
    },
    phase2: {
      title: "Skill Development (2-4 months)",
      skills: intermediatePath.slice(0, 3),
      description: "Build on your foundation with these intermediate skills"
    },
    phase3: {
      title: "Advanced Mastery (4-6 months)",
      skills: advancedPath.slice(0, 2),
      description: "Master these advanced skills for competitive advantage"
    }
  };
};

/**
 * Prioritize skills based on market demand and role importance
 * @param {Array} missingSkills - Array of missing skills
 * @returns {Array} - Prioritized skills
 */
const prioritizeSkills = (missingSkills) => {
  return missingSkills
    .filter(skill => skill.importance === 'Critical')
    .sort((a, b) => {
      const difficultyScore = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
      return difficultyScore[a.learningDifficulty] - difficultyScore[b.learningDifficulty];
    })
    .slice(0, 5);
};

/**
 * Enhanced user skill update with intelligent merging
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
    
    const existingSkillNames = user.existingSkills.map(skill => 
      skill.skillName.toLowerCase()
    );
    
    let addedCount = 0;
    let updatedCount = 0;
    
    extractedSkills.forEach(skill => {
      // Only process skills with confidence score above 0.6
      if (skill.confidenceScore >= 0.6) {
        const skillNameLower = skill.skillName.toLowerCase();
        const existingSkillIndex = existingSkillNames.indexOf(skillNameLower);
        
        if (existingSkillIndex === -1) {
          // Add new skill with enhanced metadata
          user.existingSkills.push({
            skillName: skill.skillName,
            proficiency: mapConfidenceToProficiency(skill.confidenceScore),
            status: 'In Progress',
            category: skill.category || 'Technical',
            startDate: new Date(),
            lastUpdated: new Date(),
            source: 'Resume Analysis',
            marketDemand: skill.marketDemand || 'Medium',
            notes: `Added from resume analysis. Confidence: ${(skill.confidenceScore * 100).toFixed(0)}%`
          });
          
          existingSkillNames.push(skillNameLower);
          addedCount++;
        } else {
          // Update existing skill if confidence is higher
          const existingSkill = user.existingSkills[existingSkillIndex];
          const newProficiency = mapConfidenceToProficiency(skill.confidenceScore);
          
          if (shouldUpdateSkill(existingSkill.proficiency, newProficiency)) {
            existingSkill.proficiency = newProficiency;
            existingSkill.lastUpdated = new Date();
            existingSkill.notes += ` | Updated from resume analysis: ${new Date().toLocaleDateString()}`;
            updatedCount++;
          }
        }
      }
    });
    
    await user.save();
    
    return {
      user,
      addedCount,
      updatedCount,
      totalSkills: user.existingSkills.length
    };
  } catch (error) {
    console.error('Error updating user skills from resume:', error);
    throw error;
  }
};

/**
 * Map confidence score to proficiency level
 * @param {number} confidence - Confidence score (0-1)
 * @returns {string} - Proficiency level
 */
const mapConfidenceToProficiency = (confidence) => {
  if (confidence >= 0.9) return 'Expert';
  if (confidence >= 0.7) return 'Advanced';
  if (confidence >= 0.5) return 'Intermediate';
  return 'Beginner';
};

/**
 * Determine if skill should be updated
 * @param {string} currentProficiency - Current proficiency level
 * @param {string} newProficiency - New proficiency level
 * @returns {boolean} - Whether to update
 */
const shouldUpdateSkill = (currentProficiency, newProficiency) => {
  const proficiencyRank = {
    'Beginner': 1,
    'Intermediate': 2,
    'Advanced': 3,
    'Expert': 4
  };
  
  return proficiencyRank[newProficiency] > proficiencyRank[currentProficiency];
};

/**
 * Generate comprehensive career recommendations
 * @param {Array} extractedSkills - Skills from resume
 * @param {Object} skillComparison - Skill comparison results
 * @param {string} targetRole - Target role
 * @returns {Object} - Career recommendations
 */
const generateCareerRecommendations = async (extractedSkills, skillComparison, targetRole) => {
  try {
    const prompt = `
    Generate comprehensive career recommendations based on:
    
    Current Skills: ${extractedSkills.map(s => s.skillName).join(', ')}
    Target Role: ${targetRole}
    Skill Match: ${skillComparison.overallMatch}%
    Missing Skills: ${skillComparison.missingSkills?.map(s => s.skillName).join(', ') || 'None'}
    
    Provide detailed recommendations in JSON format:
    {
      "immediate": {
        "actions": ["List of immediate actions (next 1-2 weeks)"],
        "priority": "High|Medium|Low",
        "timeframe": "1-2 weeks"
      },
      "shortTerm": {
        "actions": ["Short-term goals (1-3 months)"],
        "skillsToLearn": ["Priority skills to acquire"],
        "projects": ["Recommended projects to build"],
        "timeframe": "1-3 months"
      },
      "longTerm": {
        "actions": ["Long-term career moves (6+ months)"],
        "certifications": ["Relevant certifications to pursue"],
        "networking": ["Industry events and communities"],
        "timeframe": "6+ months"
      },
      "resumeImprovements": {
        "formatting": ["Format improvement suggestions"],
        "content": ["Content enhancement ideas"],
        "keywords": ["Important keywords to add"]
      },
      "interviewPrep": {
        "technicalTopics": ["Key technical areas to study"],
        "behavioralQuestions": ["Important behavioral questions"],
        "portfolioProjects": ["Projects to highlight"]
      },
      "salaryNegotiation": {
        "currentMarketValue": "Estimated salary range",
        "factorsToHighlight": ["Strengths to emphasize"],
        "improvementImpact": "How improvements affect salary potential"
      }
    }
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
    if (jsonMatch) {
      const recommendations = JSON.parse(jsonMatch[0]);
      
      // Add timeline and tracking
      recommendations.timeline = generateRecommendationTimeline(recommendations);
      recommendations.successMetrics = generateSuccessMetrics(targetRole, skillComparison);
      
      return recommendations;
    }
  } catch (error) {
    console.error('Error generating career recommendations:', error);
  }
  
  // Enhanced fallback recommendations
  return generateFallbackRecommendations(extractedSkills, skillComparison, targetRole);
};

/**
 * Generate fallback recommendations
 * @param {Array} extractedSkills - Current skills
 * @param {Object} skillComparison - Skill comparison
 * @param {string} targetRole - Target role
 * @returns {Object} - Fallback recommendations
 */
const generateFallbackRecommendations = (extractedSkills, skillComparison, targetRole) => {
  const missingSkills = skillComparison.missingSkills || [];
  const matchPercentage = skillComparison.overallMatch || 0;
  
        return {
    immediate: {
      actions: [
        "Update resume with quantifiable achievements",
        "Optimize LinkedIn profile",
        "Practice coding challenges"
      ],
      priority: matchPercentage > 70 ? "Medium" : "High",
      timeframe: "1-2 weeks"
    },
    shortTerm: {
      actions: [
        `Learn ${missingSkills.slice(0, 2).map(s => s.skillName).join(' and ')}`,
        "Build a portfolio project",
        "Network with industry professionals"
      ],
      skillsToLearn: missingSkills.slice(0, 3).map(s => s.skillName),
      timeframe: "1-3 months"
    },
    longTerm: {
      actions: [
        "Pursue advanced certifications",
        "Seek mentorship opportunities",
        "Consider specialized training"
      ],
      timeframe: "6+ months"
    },
    timeline: {
      week1: "Resume optimization",
      month1: "Skill development begins",
      month3: "First skill milestone",
      month6: "Advanced skill development"
    }
  };
};

/**
 * Generate recommendation timeline
 * @param {Object} recommendations - Career recommendations
 * @returns {Object} - Timeline with milestones
 */
const generateRecommendationTimeline = (recommendations) => {
      return {
    week1: recommendations.immediate?.actions?.[0] || "Begin immediate actions",
    week2: recommendations.immediate?.actions?.[1] || "Continue immediate focus",
    month1: recommendations.shortTerm?.actions?.[0] || "Start short-term goals",
    month2: recommendations.shortTerm?.skillsToLearn?.[0] || "Continue learning",
    month3: recommendations.shortTerm?.projects?.[0] || "Build portfolio project",
    month6: recommendations.longTerm?.actions?.[0] || "Begin long-term planning",
    year1: "Evaluate progress and set new goals"
  };
};

/**
 * Generate success metrics for tracking progress
 * @param {string} targetRole - Target role
 * @param {Object} skillComparison - Current skill comparison
 * @returns {Object} - Success metrics
 */
const generateSuccessMetrics = (targetRole, skillComparison) => {
  const currentMatch = skillComparison.overallMatch || 0;
  
      return {
    skillMatchTarget: Math.min(90, currentMatch + 20),
    timelineGoals: {
      "1 month": "5% skill match improvement",
      "3 months": "15% skill match improvement",
      "6 months": "25% skill match improvement"
    },
    keyPerformanceIndicators: [
      "Number of new skills acquired",
      "Portfolio projects completed",
      "Technical interview performance",
      "Network connections made"
    ],
    milestones: [
      `Achieve 80% skill match for ${targetRole}`,
      "Complete first portfolio project",
      "Receive positive technical interview feedback",
      "Land first interview for target role"
    ]
  };
};

/**
 * Generate advanced market insights with real-time data simulation
 * @param {Array} skills - Array of skills
 * @param {string} targetRole - Target role
 * @returns {Object} - Advanced market insights
 */
const generateAdvancedMarketInsights = async (skills, targetRole) => {
  try {
    const topSkills = skills.slice(0, 8).map(s => s.skillName).join(', ');
    
    const prompt = `
    Provide comprehensive market insights for a ${targetRole} with these skills: ${topSkills}
    
    Return detailed JSON analysis:
    {
      "salaryAnalysis": {
        "currentRange": "$X,XXX - $X,XXX",
        "averageSalary": "$XX,XXX",
        "topPercentile": "$XXX,XXX",
        "growthProjection": "X% annually",
        "factors": ["Key factors affecting salary"],
        "geographicVariation": {
          "highPaying": ["City names with highest salaries"],
          "costEffective": ["Cities with good salary-to-cost ratio"]
        }
      },
      "jobMarketAnalysis": {
        "demandLevel": "Very High|High|Medium|Low",
        "openings": "Estimated number of current openings",
        "competitionLevel": "Low|Medium|High|Very High",
        "hiringTrends": "Current hiring trends analysis",
        "seasonality": "Best months for job searching",
        "remoteOpportunities": "% of jobs that are remote"
      },
      "skillTrending": {
        "risingSkills": ["Skills gaining popularity"],
        "decliningSkills": ["Skills losing relevance"],
        "emergingTechnologies": ["New technologies to watch"],
        "skillDemandForecast": {
          "nextYear": ["Skills that will be in demand"],
          "next3Years": ["Long-term skill predictions"]
        }
      },
      "industryInsights": {
        "topCompanies": ["Companies actively hiring"],
        "startupVsCorporate": "Market split between startups and corporations",
        "industryGrowthSectors": ["Fastest growing industry sectors"],
        "jobTitleEvolution": ["How job titles are evolving"],
        "workCultureTrends": ["Remote, hybrid, office preferences"]
      },
      "careerPaths": {
        "traditionalProgression": ["Typical career advancement steps"],
        "alternativeRoutes": ["Non-traditional career paths"],
        "crossIndustryOpportunities": ["Other industries that value these skills"],
        "entrepreneurialPotential": "Potential for freelancing/consulting"
      },
      "learningRecommendations": {
        "urgentSkills": ["Skills needed immediately"],
        "strategicSkills": ["Skills for long-term career growth"],
        "certifications": ["Valuable certifications"],
        "learningPlatforms": ["Recommended learning resources"],
        "timeInvestment": "Weekly hours recommended for upskilling"
      }
    }
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error generating advanced market insights:', error);
  }
  
  // Enhanced fallback with more realistic data
  return generateEnhancedFallbackInsights(skills, targetRole);
};

/**
 * Generate enhanced fallback market insights
 * @param {Array} skills - Skills array
 * @param {string} targetRole - Target role
 * @returns {Object} - Fallback insights
 */
const generateEnhancedFallbackInsights = (skills, targetRole) => {
  const roleData = {
    'full stack developer': {
      salary: '$75,000 - $125,000',
      average: '$95,000',
      demand: 'Very High',
      remote: '85%'
    },
    'frontend developer': {
      salary: '$65,000 - $110,000',
      average: '$85,000',
      demand: 'High',
      remote: '90%'
    },
    'backend developer': {
      salary: '$70,000 - $130,000',
      average: '$100,000',
      demand: 'Very High',
      remote: '80%'
    },
    'data scientist': {
      salary: '$90,000 - $150,000',
      average: '$120,000',
      demand: 'Very High',
      remote: '75%'
    },
    'devops engineer': {
      salary: '$85,000 - $140,000',
      average: '$110,000',
      demand: 'Very High',
      remote: '70%'
    }
  };
  
  const data = roleData[targetRole.toLowerCase()] || roleData['full stack developer'];
  
  return {
    salaryAnalysis: {
      currentRange: data.salary,
      averageSalary: data.average,
      topPercentile: '$150,000+',
      growthProjection: '8-12% annually',
      factors: ['Experience level', 'Company size', 'Location', 'Skill specialization'],
      geographicVariation: {
        highPaying: ['San Francisco', 'New York', 'Seattle', 'Boston'],
        costEffective: ['Austin', 'Denver', 'Raleigh', 'Portland']
      }
    },
    jobMarketAnalysis: {
      demandLevel: data.demand,
      openings: '25,000+ nationwide',
      competitionLevel: 'Medium',
      hiringTrends: 'Strong growth in tech sector with increased remote opportunities',
      seasonality: 'Q1 and Q3 typically see highest hiring activity',
      remoteOpportunities: data.remote
    },
    skillTrending: {
      risingSkills: ['AI/ML', 'Cloud Computing', 'Kubernetes', 'TypeScript', 'GraphQL'],
      decliningSkills: ['jQuery', 'AngularJS', 'SOAP APIs'],
      emergingTechnologies: ['WebAssembly', 'Edge Computing', 'Quantum Computing'],
      skillDemandForecast: {
        nextYear: ['Cloud Platforms', 'Microservices', 'DevOps Tools'],
        next3Years: ['AI Integration', 'Blockchain', 'IoT Development']
      }
    },
    industryInsights: {
      topCompanies: ['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Stripe'],
      startupVsCorporate: '60% corporate, 40% startup/mid-size',
      industryGrowthSectors: ['FinTech', 'HealthTech', 'EdTech', 'GreenTech'],
      jobTitleEvolution: ['Full Stack Engineer', 'Platform Engineer', 'Site Reliability Engineer'],
      workCultureTrends: '70% prefer hybrid, 20% remote, 10% office'
    },
    careerPaths: {
      traditionalProgression: ['Junior → Mid → Senior → Staff → Principal'],
      alternativeRoutes: ['Technical Lead', 'Solution Architect', 'Product Manager'],
      crossIndustryOpportunities: ['Finance', 'Healthcare', 'Media', 'Gaming'],
      entrepreneurialPotential: 'High - strong freelance and consulting market'
    },
    learningRecommendations: {
      urgentSkills: ['Cloud Platforms (AWS/Azure)', 'Containerization', 'CI/CD'],
      strategicSkills: ['System Design', 'Leadership', 'Product Thinking'],
      certifications: ['AWS Solutions Architect', 'Google Cloud Professional', 'Kubernetes Administrator'],
      learningPlatforms: ['Coursera', 'Udemy', 'Pluralsight', 'A Cloud Guru'],
      timeInvestment: '10-15 hours per week for significant skill advancement'
    }
  };
};

/**
 * Generate personalized interview preparation materials
 * @param {Array} skills - User's skills
 * @param {string} targetRole - Target role
 * @param {Object} analysis - Resume analysis
 * @returns {Object} - Interview preparation materials
 */
const generateInterviewPreparation = async (skills, targetRole, analysis) => {
  try {
    const prompt = `
    Generate comprehensive interview preparation for a ${targetRole} role based on these skills: ${skills.map(s => s.skillName).join(', ')}
    
    Provide detailed JSON with:
    {
      "technicalQuestions": [
        {
          "question": "Technical question",
          "difficulty": "Easy|Medium|Hard",
          "topics": ["Related topics"],
          "preparationTips": "How to prepare for this question"
        }
      ],
      "behavioralQuestions": [
        {
          "question": "Behavioral question",
          "purpose": "What the interviewer is looking for",
          "starMethod": "Suggested STAR approach",
          "commonMistakes": ["What to avoid"]
        }
      ],
      "codingChallenges": [
        {
          "type": "Data Structures|Algorithms|System Design",
          "description": "Challenge description",
          "difficulty": "Easy|Medium|Hard",
          "preparationStrategy": "How to prepare"
        }
      ],
      "systemDesignQuestions": [
        {
          "question": "System design question",
          "keyAreas": ["Important areas to cover"],
          "commonPitfalls": ["What to avoid"],
          "studyResources": ["Recommended resources"]
        }
      ],
      "portfolioPresentation": {
        "projectsToHighlight": ["Which projects to showcase"],
        "presentationTips": ["How to present effectively"],
        "commonQuestions": ["Questions they might ask about projects"],
        "demoPreparation": "Tips for live coding/demo"
      },
      "companyResearch": {
        "keyAreas": ["What to research about the company"],
        "questionsToAsk": ["Smart questions to ask the interviewer"],
        "industryTrends": ["Industry knowledge to demonstrate"]
      },
      "negotiationPrep": {
        "salaryResearch": "How to research fair compensation",
        "negotiationTactics": ["Professional negotiation strategies"],
        "benefitsToConsider": ["Non-salary benefits to discuss"],
        "timingAdvice": "When and how to negotiate"
      }
    }
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error generating interview preparation:', error);
  }
  
  // Fallback interview preparation
  return generateFallbackInterviewPrep(targetRole);
};

/**
 * Generate fallback interview preparation
 * @param {string} targetRole - Target role
 * @returns {Object} - Interview preparation
 */
const generateFallbackInterviewPrep = (targetRole) => {
  return {
    technicalQuestions: [
      {
        question: "Explain the difference between REST and GraphQL APIs",
        difficulty: "Medium",
        topics: ["APIs", "Backend Development"],
        preparationTips: "Study both architectures, understand trade-offs, practice examples"
      },
      {
        question: "How would you optimize a slow-loading web application?",
        difficulty: "Medium",
        topics: ["Performance Optimization", "Frontend"],
        preparationTips: "Know about caching, bundling, code splitting, CDNs"
      },
      {
        question: "Describe your approach to testing in software development",
        difficulty: "Easy",
        topics: ["Testing", "Quality Assurance"],
        preparationTips: "Understand unit, integration, and e2e testing strategies"
      }
    ],
    behavioralQuestions: [
      {
        question: "Tell me about a challenging project you worked on",
        purpose: "Assess problem-solving and communication skills",
        starMethod: "Situation: Set context, Task: Explain your role, Action: Describe what you did, Result: Share the outcome",
        commonMistakes: ["Being too vague", "Not showing personal impact", "Focusing only on technical details"]
      },
      {
        question: "How do you handle disagreements with team members?",
        purpose: "Evaluate collaboration and conflict resolution skills",
        starMethod: "Use a specific example showing professional conflict resolution",
        commonMistakes: ["Avoiding the question", "Badmouthing colleagues", "Not showing resolution"]
      }
    ],
    codingChallenges: [
      {
        type: "Data Structures",
        description: "Array and string manipulation problems",
        difficulty: "Easy to Medium",
        preparationStrategy: "Practice on LeetCode, focus on time and space complexity"
      },
      {
        type: "Algorithms",
        description: "Sorting, searching, and graph traversal",
        difficulty: "Medium",
        preparationStrategy: "Understand common patterns, practice whiteboarding"
      }
    ],
    systemDesignQuestions: [
      {
        question: "Design a URL shortening service like bit.ly",
        keyAreas: ["Database design", "Caching strategy", "Load balancing"],
        commonPitfalls: ["Not considering scale", "Ignoring edge cases", "Poor data modeling"],
        studyResources: ["System Design Primer", "High Scalability blog"]
      }
    ],
    portfolioPresentation: {
      projectsToHighlight: ["Most complex project", "Project using target role's key technologies", "Project with measurable impact"],
      presentationTips: ["Start with problem statement", "Explain your role clearly", "Discuss challenges and solutions"],
      commonQuestions: ["What would you do differently?", "How did you handle challenges?", "What was the impact?"],
      demoPreparation: "Have a working demo ready, prepare for technical deep-dives"
    },
    companyResearch: {
      keyAreas: ["Company mission and values", "Recent news and developments", "Technology stack", "Company culture"],
      questionsToAsk: ["What are the biggest technical challenges?", "How do you measure success in this role?", "What's the team structure?"],
      industryTrends: ["Stay updated on relevant industry trends", "Understand competitive landscape"]
    },
    negotiationPrep: {
      salaryResearch: "Use Glassdoor, levels.fyi, and industry reports for salary data",
      negotiationTactics: ["Know your worth", "Consider total compensation", "Be professional and flexible"],
      benefitsToConsider: ["Health insurance", "401k matching", "Professional development budget", "Flexible working arrangements"],
      timingAdvice: "Negotiate after receiving an offer, be prepared to justify your ask"
    }
  };
};

/**
 * Enhanced skill extraction with market relevance scoring
 * @param {string} resumeText - Resume text
 * @param {string} targetRole - Target role
 * @returns {Object} - Enhanced extraction results
 */
const extractSkillsFromResumeEnhanced = async (resumeText, targetRole = '') => {
  try {
    // Get base analysis
    const baseAnalysis = await extractSkillsFromResume(resumeText, targetRole);
    
    // Add market insights
    const marketInsights = await generateAdvancedMarketInsights(baseAnalysis.extractedSkills, targetRole);
    
    // Add interview preparation
    const interviewPrep = await generateInterviewPreparation(baseAnalysis.extractedSkills, targetRole, baseAnalysis);
    
    // Enhance with additional scoring
    const enhancedAnalysis = {
      ...baseAnalysis,
      marketInsights,
      interviewPreparation: interviewPrep,
      competitiveAnalysis: {
        marketPosition: calculateMarketPosition(baseAnalysis.extractedSkills, targetRole),
        skillRarity: calculateSkillRarity(baseAnalysis.extractedSkills),
        experienceValue: calculateExperienceValue(resumeText, baseAnalysis.extractedSkills)
      },
      improvementRoadmap: generateImprovementRoadmap(baseAnalysis, marketInsights)
    };
    
    return enhancedAnalysis;
  } catch (error) {
    console.error('Error in enhanced skill extraction:', error);
    return extractSkillsFromResume(resumeText, targetRole);
  }
};

/**
 * Calculate market position based on skills
 * @param {Array} skills - User's skills
 * @param {string} targetRole - Target role
 * @returns {string} - Market position
 */
const calculateMarketPosition = (skills, targetRole) => {
  const highValueSkills = ['React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'Python', 'TypeScript'];
  const userHighValueSkills = skills.filter(skill => 
    highValueSkills.some(hvs => skill.skillName.toLowerCase().includes(hvs.toLowerCase()))
  );
  
  const ratio = userHighValueSkills.length / highValueSkills.length;
  
  if (ratio >= 0.7) return 'Top 10% - Highly Competitive';
  if (ratio >= 0.5) return 'Top 25% - Competitive';
  if (ratio >= 0.3) return 'Top 50% - Above Average';
  return 'Average - Room for Growth';
};

/**
 * Calculate skill rarity scores
 * @param {Array} skills - User's skills
 * @returns {Object} - Skill rarity analysis
 */
const calculateSkillRarity = (skills) => {
  const rareSkills = skills.filter(skill => skill.confidenceScore > 0.8);
  const commonSkills = skills.filter(skill => skill.confidenceScore <= 0.6);
  
      return {
    rareSkillsCount: rareSkills.length,
    rareSkills: rareSkills.map(s => s.skillName),
    uniquenessScore: Math.min(100, (rareSkills.length / skills.length) * 100),
    marketDifferentiators: rareSkills.slice(0, 3).map(s => s.skillName)
  };
};

/**
 * Calculate experience value from resume text
 * @param {string} resumeText - Resume text
 * @param {Array} skills - Extracted skills
 * @returns {Object} - Experience value analysis
 */
const calculateExperienceValue = (resumeText, skills) => {
  const experienceKeywords = ['led', 'managed', 'architected', 'designed', 'implemented', 'optimized'];
  const quantifiers = resumeText.match(/\d+[%$]|increased|decreased|improved|reduced/gi) || [];
  
  const leadershipScore = experienceKeywords.reduce((score, keyword) => {
    return score + (resumeText.toLowerCase().split(keyword).length - 1);
  }, 0);
  
    return {
    leadershipExperience: leadershipScore,
    quantifiedAchievements: quantifiers.length,
    experienceDepth: skills.filter(s => s.confidenceScore > 0.8).length,
    seniorityIndicators: leadershipScore > 5 ? 'Senior Level' : leadershipScore > 2 ? 'Mid Level' : 'Junior Level'
  };
};

/**
 * Generate improvement roadmap
 * @param {Object} analysis - Resume analysis
 * @param {Object} marketInsights - Market insights
 * @returns {Object} - Improvement roadmap
 */
const generateImprovementRoadmap = (analysis, marketInsights) => {
  const urgentSkills = marketInsights?.learningRecommendations?.urgentSkills || [];
  const strategicSkills = marketInsights?.learningRecommendations?.strategicSkills || [];
  
  return {
    immediate: {
      title: 'Next 4 Weeks',
      focus: 'Resume Optimization & Basic Skills',
      tasks: [
        'Update resume with quantifiable achievements',
        'Optimize for ATS compatibility',
        'Start learning priority skill: ' + (urgentSkills[0] || 'Cloud Computing')
      ]
    },
    shortTerm: {
      title: '1-3 Months',
      focus: 'Skill Development & Portfolio Building',
      tasks: [
        'Complete certification in ' + (urgentSkills[0] || 'Cloud Computing'),
        'Build portfolio project showcasing new skills',
        'Practice technical interview questions'
      ]
    },
    mediumTerm: {
      title: '3-6 Months',
      focus: 'Advanced Skills & Network Building',
      tasks: [
        'Master strategic skill: ' + (strategicSkills[0] || 'System Design'),
        'Attend industry events and conferences',
        'Seek mentorship or peer learning opportunities'
      ]
    },
    longTerm: {
      title: '6-12 Months',
      focus: 'Expertise & Leadership',
      tasks: [
        'Become proficient in emerging technologies',
        'Take on leadership roles in projects',
        'Consider speaking at events or writing technical content'
      ]
    }
  };
};

module.exports = {
  extractTextFromResume,
  extractSkillsFromResume,
  updateUserSkillsFromResume,
  compareSkillsWithTargetRole,
  generateCareerRecommendations,
  extractSkillsFromResumeEnhanced
}; 