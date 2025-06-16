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
  // Validate input text
  if (!resumeText || typeof resumeText !== 'string') {
    console.error('extractSkillsFromResume received invalid text:', typeof resumeText);
    return generateFallbackAnalysis('', targetRole);
  }
  
  try {
    const prompt = `
    You are a SENIOR RESUME EXPERT and PROFESSIONAL HIRING MANAGER with 15+ years of experience in talent acquisition across Fortune 500 companies. You have reviewed over 10,000 resumes and have deep expertise in:
    - Applicant Tracking Systems (ATS) optimization
    - Industry-specific resume requirements
    - Modern hiring trends and best practices
    - Technical skill assessment and market demand
    - Career progression and professional development

    Your task is to provide a COMPREHENSIVE, PROFESSIONAL analysis of this resume for a ${targetRole || 'software development'} position.

    RESUME CONTENT TO ANALYZE:
    ${resumeText}
    
    PROVIDE A DETAILED JSON ANALYSIS with the following structure. Be thorough, specific, and actionable in your feedback:

    {
      "skills": [
        {
          "skillName": "Exact skill name found",
          "confidenceScore": 0.95,
          "category": "Programming Languages|Frontend Frameworks|Backend Technologies|Databases|DevOps Tools|Cloud Platforms|Soft Skills|Domain Knowledge",
          "yearsExperience": 3,
          "proficiencyLevel": "Beginner|Intermediate|Advanced|Expert",
          "marketDemand": "Low|Medium|High|Very High",
          "relevanceToRole": 0.95,
          "evidenceFound": "Specific mention or project where this skill was demonstrated"
        }
      ],
      "atsScore": 85,
      "keywordScore": 82,
      "formatScore": 90,
      "experienceRelevance": 88,
      "quantificationScore": 75,
      "actionVerbScore": 85,
      "overallScore": 86,
      "analysis": "Write a comprehensive 300+ word professional analysis covering: overall impression, key strengths, areas for improvement, ATS compatibility, and specific recommendations for the target role",
      "detailedAnalysis": {
        "keywordDensity": "Detailed analysis of keyword usage, density, and relevance to the role",
        "formatCompliance": "Comprehensive assessment of resume format, structure, and ATS compatibility",
        "contentQuality": "In-depth evaluation of content quality, clarity, and professional presentation",
        "skillRelevance": "Detailed analysis of how well skills match the target role requirements",
        "achievementQuantification": "Assessment of quantifiable achievements and impact metrics",
        "actionVerbUsage": "Evaluation of action verbs used and their effectiveness"
      },
      "strengthsHighlights": [
        "Specific strength 1 with detailed explanation",
        "Specific strength 2 with context and impact",
        "Specific strength 3 with professional assessment",
        "Additional strengths based on resume content"
      ],
      "weaknessesToAddress": [
        "Specific weakness 1 with actionable improvement suggestion",
        "Specific weakness 2 with clear guidance on how to fix",
        "Specific weakness 3 with professional recommendation",
        "Additional areas for improvement with specific actions"
      ],
      "matchingSkills": [
        {
          "skillName": "Skill that matches role requirements",
          "matchStrength": "Exact|Strong|Moderate|Weak",
          "importance": "Critical|High|Medium|Low",
          "evidenceQuality": "Strong|Moderate|Weak",
          "recommendation": "How to better showcase this skill"
        }
      ],
      "missingSkills": [
        {
          "skillName": "Important missing skill",
          "importance": "Critical|High|Medium|Low",
          "learningDifficulty": "Easy|Medium|Hard",
          "timeToLearn": "1-2 weeks|1-3 months|3-6 months|6+ months",
          "priority": "High|Medium|Low",
          "reason": "Why this skill is important for the role"
        }
      ],
      "recommendations": {
        "immediate": {
          "actions": [
            "Specific immediate action 1 with clear steps",
            "Specific immediate action 2 with implementation guide",
            "Specific immediate action 3 with expected impact"
          ],
          "timeframe": "1-2 weeks",
          "priority": "High",
          "expectedImpact": "Specific impact on resume effectiveness"
        },
        "shortTerm": {
          "actions": [
            "Specific short-term action 1 with learning path",
            "Specific short-term action 2 with skill development plan",
            "Specific short-term action 3 with career advancement focus"
          ],
          "timeframe": "1-3 months",
          "priority": "Medium",
          "expectedImpact": "Expected career and skill development outcomes"
        },
        "longTerm": {
          "actions": [
            "Specific long-term action 1 with career progression focus",
            "Specific long-term action 2 with leadership development",
            "Specific long-term action 3 with industry expertise building"
          ],
          "timeframe": "3-12 months",
          "priority": "Medium",
          "expectedImpact": "Long-term career advancement and expertise development"
        }
      },
      "skillGaps": [
        {
          "category": "Technical Skills",
          "gaps": ["Specific technical skills missing"],
          "impact": "How these gaps affect candidacy",
          "solutions": ["Specific learning recommendations"]
        },
        {
          "category": "Soft Skills",
          "gaps": ["Leadership, communication, etc."],
          "impact": "Professional impact of missing soft skills",
          "solutions": ["How to develop these skills"]
        }
      ],
      "categories": {
        "Programming Languages": ["List all programming languages found with proficiency assessment"],
        "Frontend Frameworks": ["Frontend technologies with experience level"],
        "Backend Technologies": ["Backend frameworks and tools with expertise level"],
        "Databases": ["Database technologies with usage context"],
        "DevOps Tools": ["DevOps and deployment tools with implementation experience"],
        "Cloud Platforms": ["Cloud services with specific usage"],
        "Soft Skills": ["Communication, leadership, teamwork skills identified"],
        "Domain Knowledge": ["Industry-specific knowledge and expertise"]
      },
      "experienceAnalysis": {
        "totalYears": "Estimated total years of experience",
        "relevantYears": "Years of relevant experience for target role",
        "careerProgression": "Assessment of career growth and advancement",
        "roleAlignment": "How well experience aligns with target position",
        "industryExperience": "Relevant industry background",
        "leadershipExperience": "Evidence of leadership and management",
        "projectComplexity": "Assessment of project complexity and scope",
        "impactDemonstration": "How well impact and achievements are shown"
      },
      "improvementRoadmap": {
        "phase1": {
          "title": "Immediate Resume Optimization",
          "duration": "1-2 weeks",
          "tasks": ["Specific tasks for immediate improvement"],
          "outcome": "Expected improvement in resume effectiveness"
        },
        "phase2": {
          "title": "Skill Development & Enhancement",
          "duration": "1-3 months", 
          "tasks": ["Specific skill development activities"],
          "outcome": "Enhanced technical and professional capabilities"
        },
        "phase3": {
          "title": "Career Advancement Preparation",
          "duration": "3-6 months",
          "tasks": ["Long-term career development activities"],
          "outcome": "Readiness for senior roles and leadership positions"
        }
      }
    }

    IMPORTANT INSTRUCTIONS:
    1. Be extremely thorough and specific in your analysis
    2. Provide actionable, concrete recommendations
    3. Base all assessments on actual resume content
    4. Use professional language and industry terminology
    5. Ensure all scores are realistic and well-justified
    6. Make recommendations specific to the ${targetRole || 'software development'} field
    7. Focus on both technical and soft skill development
    8. Provide clear learning paths and improvement strategies

    Analyze this resume with the expertise of a senior hiring manager who has seen thousands of resumes and knows exactly what makes a candidate stand out in today's competitive job market.
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
const generateFallbackAnalysis = async (resumeText, targetRole) => {
  // Ensure resumeText is valid before processing
  const validText = resumeText && typeof resumeText === 'string' ? resumeText : '';
  console.log('generateFallbackAnalysis called with text type:', typeof resumeText, 'length:', validText.length);
  const commonSkills = extractBasicSkills(validText);
  
  // Generate intelligent missing skills using Gemini
  let missingSkillsData;
  try {
    missingSkillsData = await generateMissingSkillsWithGemini(commonSkills, targetRole);
    console.log('Generated missing skills with Gemini:', missingSkillsData.missingSkills.length, 'skills');
  } catch (error) {
    console.error('Failed to generate missing skills with Gemini, using fallback:', error);
    missingSkillsData = generateFallbackMissingSkills(commonSkills, targetRole);
  }
  
  // Calculate comprehensive scores based on resume content
  const wordCount = validText.split(/\s+/).length;
  const hasQuantifiableAchievements = /\d+%|\d+\+|\$\d+|increased|improved|reduced|achieved/i.test(validText);
  const hasActionVerbs = /developed|implemented|created|managed|led|designed|built|optimized/i.test(validText);
  const hasRelevantKeywords = commonSkills.length > 0;
  const hasEducation = /education|degree|university|college|bachelor|master/i.test(validText);
  const hasExperience = /experience|work|employment|position|role/i.test(validText);
  
  // Calculate dynamic scores
  const atsScore = Math.min(95, Math.max(65, 70 + (commonSkills.length * 2) + (hasQuantifiableAchievements ? 10 : 0)));
  const keywordScore = Math.min(95, Math.max(60, 65 + (commonSkills.length * 3) + (hasRelevantKeywords ? 15 : 0)));
  const formatScore = Math.min(95, Math.max(75, 80 + (hasEducation ? 5 : 0) + (hasExperience ? 10 : 0)));
  const experienceRelevance = Math.min(95, Math.max(60, 70 + (commonSkills.length * 2) + (hasExperience ? 15 : 0)));
  const quantificationScore = hasQuantifiableAchievements ? Math.min(90, 75 + Math.floor(Math.random() * 15)) : Math.min(70, 45 + Math.floor(Math.random() * 25));
  const actionVerbScore = hasActionVerbs ? Math.min(95, 80 + Math.floor(Math.random() * 15)) : Math.min(75, 55 + Math.floor(Math.random() * 20));
  
  // Generate dynamic strengths and weaknesses
  const strengths = [];
  const weaknesses = [];
  
  if (commonSkills.length >= 5) strengths.push("Strong technical skill portfolio with diverse technologies");
  if (hasQuantifiableAchievements) strengths.push("Good use of quantifiable achievements and metrics");
  if (hasActionVerbs) strengths.push("Effective use of action verbs to describe accomplishments");
  if (keywordScore >= 80) strengths.push("Excellent keyword optimization for ATS systems");
  if (formatScore >= 85) strengths.push("Well-structured resume format that's ATS-friendly");
  
  if (commonSkills.length < 3) weaknesses.push("Limited technical skills mentioned - consider adding more relevant technologies");
  if (!hasQuantifiableAchievements) weaknesses.push("Add more quantifiable achievements with specific numbers and percentages");
  if (!hasActionVerbs) weaknesses.push("Use more strong action verbs to describe your accomplishments");
  if (keywordScore < 75) weaknesses.push("Include more industry-relevant keywords for better ATS compatibility");
  if (wordCount < 200) weaknesses.push("Resume content could be more comprehensive and detailed");
  
  // Ensure we have at least some default strengths and weaknesses
  if (strengths.length === 0) {
    strengths.push("Resume shows relevant experience for the target role");
    strengths.push("Clear presentation of technical skills");
    strengths.push("Professional resume structure");
  }
  
  if (weaknesses.length === 0) {
    weaknesses.push("Consider adding more specific achievements with measurable results");
    weaknesses.push("Include additional relevant technical skills");
    weaknesses.push("Expand on project details and impact");
  }
  
  return {
    extractedSkills: commonSkills,
    atsScore: atsScore,
    keywordScore: keywordScore,
    formatScore: formatScore,
    experienceRelevance: experienceRelevance,
    quantificationScore: quantificationScore,
    actionVerbScore: actionVerbScore,
    skillMatchPercentage: Math.min(95, Math.max(70, 75 + (commonSkills.length * 2))),
    overallScore: Math.round((atsScore + keywordScore + formatScore + experienceRelevance) / 4),
    atsAnalysis: `Resume analysis completed with ${atsScore}% ATS compatibility. ${commonSkills.length} technical skills identified. ${hasQuantifiableAchievements ? 'Good use of quantifiable achievements.' : 'Consider adding more measurable accomplishments.'} ${hasActionVerbs ? 'Strong action verb usage detected.' : 'Include more action verbs to strengthen impact.'}`,
    strengthsHighlights: strengths,
    weaknessesToAddress: weaknesses,
    matchingSkills: commonSkills,
    missingSkills: missingSkillsData.missingSkills || [
      { skillName: "Cloud Platforms (AWS/Azure)", category: "Cloud Technologies", importance: "High" },
      { skillName: "System Design", category: "Architecture", importance: "Medium" },
      { skillName: "Leadership Skills", category: "Soft Skills", importance: "Medium" }
    ],
    skillGaps: missingSkillsData.skillGaps || [],
    roleSpecificInsights: missingSkillsData.roleSpecificInsights || {},
    detailedAnalysis: {
      keywordDensity: `${keywordScore}% keyword optimization - ${commonSkills.length} relevant technical terms identified`,
      formatCompliance: `${formatScore}% ATS format compatibility - resume structure is ${formatScore >= 85 ? 'excellent' : formatScore >= 75 ? 'good' : 'adequate'}`,
      contentQuality: `${experienceRelevance}% content relevance - ${hasExperience ? 'professional experience clearly presented' : 'consider expanding experience descriptions'}`,
      skillRelevance: `${commonSkills.length} technical skills match industry requirements`,
      achievementQuantification: `${quantificationScore}% quantification score - ${hasQuantifiableAchievements ? 'good use of metrics' : 'add more specific numbers and results'}`,
      actionVerbUsage: `${actionVerbScore}% action verb effectiveness - ${hasActionVerbs ? 'strong impact language used' : 'incorporate more dynamic action verbs'}`
    },
    categories: {
      "Programming Languages": commonSkills.filter(s => ['javascript', 'python', 'java', 'c++', 'typescript'].includes(s.skillName.toLowerCase())),
      "Frontend Frameworks": commonSkills.filter(s => ['react', 'angular', 'vue'].includes(s.skillName.toLowerCase())),
      "Backend Technologies": commonSkills.filter(s => ['node', 'express', 'spring'].includes(s.skillName.toLowerCase())),
      "Databases": commonSkills.filter(s => ['mongodb', 'mysql', 'postgresql'].includes(s.skillName.toLowerCase())),
      "DevOps Tools": commonSkills.filter(s => ['docker', 'git', 'aws'].includes(s.skillName.toLowerCase()))
    },
    marketInsights: {
      experienceLevel: commonSkills.length >= 8 ? "Senior" : commonSkills.length >= 5 ? "Mid-Level" : "Junior",
      marketDemand: "High",
      growthProjection: "15% year over year growth in demand",
      salaryRange: commonSkills.length >= 8 ? "$90,000 - $130,000" : commonSkills.length >= 5 ? "$70,000 - $95,000" : "$50,000 - $70,000",
      topCompanies: ["Google", "Microsoft", "Amazon", "Meta", "Apple"],
      emergingSkills: ["Cloud Computing", "DevOps", "AI/ML", "Microservices"],
      competitiveSkills: commonSkills.slice(0, 3).map(s => s.skillName)
    },
    careerProgression: {
      currentStage: "Growth Phase",
      nextRoles: [`Senior ${targetRole || 'Developer'}`, "Tech Lead", "Solution Architect"],
      skillGaps: ["Leadership", "System Design", "Cloud Platforms"],
      timeToPromotion: commonSkills.length >= 6 ? "12-18 months" : "18-24 months",
      learningPath: ["Master current technologies", "Learn cloud platforms", "Develop leadership skills"],
      growthTrajectory: "Strong upward trajectory with solid technical foundation",
      nextSteps: ["Gain cloud platform experience", "Lead a technical project", "Mentor junior developers"],
      timelineRecommendations: "Focus on expanding cloud skills and leadership experience over the next 12 months"
    },
    recommendations: {
      immediate: { 
        actions: [
          "Add 2-3 quantifiable achievements with specific metrics",
          "Include more relevant technical keywords",
          "Strengthen action verb usage in experience descriptions"
        ],
        timeframe: "1-2 weeks"
      },
      shortTerm: { 
        actions: [
          "Learn cloud platform technologies (AWS/Azure)",
          "Complete relevant technical certifications",
          "Expand project portfolio with modern technologies"
        ],
        timeframe: "3-6 months"
      },
      longTerm: { 
        actions: [
          "Develop leadership and mentoring skills",
          "Gain experience in system design and architecture",
          "Build expertise in emerging technologies"
        ],
        timeframe: "6-12 months"
      }
    }
  };
};

/**
 * Extract basic skills using pattern matching
 * @param {string} text - Resume text
 * @returns {Array} - Array of basic skills
 */
const extractBasicSkills = (text) => {
  // Handle undefined, null, or non-string text
  if (!text || typeof text !== 'string') {
    console.warn('extractBasicSkills received invalid text input:', typeof text);
    return [];
  }
  
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
        category: "Technical",
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
            status: mapToValidStatus('In Progress'),
            category: mapToValidCategory(skill.category || 'Technical'),
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
 * Map category to valid enum value
 * @param {string} category - Category from AI
 * @returns {string} - Valid category enum
 */
const mapToValidCategory = (category) => {
  const validCategories = [
    'Technical', 'Soft Skills', 'Tools', 'Frameworks', 'Languages', 'Methodologies',
    'Frontend Frameworks', 'Backend Technologies', 'DevOps Tools', 'Domain Knowledge',
    'Programming Languages', 'Databases', 'Cloud Services', 'Testing', 'Mobile Development',
    'Web Development', 'Data Science', 'Machine Learning', 'Security', 'Project Management'
  ];
  
  // Direct match
  if (validCategories.includes(category)) {
    return category;
  }
  
  // Fuzzy matching for common variations
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('frontend') || categoryLower.includes('front-end')) {
    return 'Frontend Frameworks';
  }
  if (categoryLower.includes('backend') || categoryLower.includes('back-end')) {
    return 'Backend Technologies';
  }
  if (categoryLower.includes('devops') || categoryLower.includes('deployment')) {
    return 'DevOps Tools';
  }
  if (categoryLower.includes('programming') || categoryLower.includes('language')) {
    return 'Programming Languages';
  }
  if (categoryLower.includes('database') || categoryLower.includes('db')) {
    return 'Databases';
  }
  if (categoryLower.includes('cloud') || categoryLower.includes('aws') || categoryLower.includes('azure')) {
    return 'Cloud Services';
  }
  if (categoryLower.includes('test') || categoryLower.includes('qa')) {
    return 'Testing';
  }
  if (categoryLower.includes('mobile') || categoryLower.includes('ios') || categoryLower.includes('android')) {
    return 'Mobile Development';
  }
  if (categoryLower.includes('web') || categoryLower.includes('html') || categoryLower.includes('css')) {
    return 'Web Development';
  }
  if (categoryLower.includes('data') || categoryLower.includes('analytics')) {
    return 'Data Science';
  }
  if (categoryLower.includes('ml') || categoryLower.includes('ai') || categoryLower.includes('machine')) {
    return 'Machine Learning';
  }
  if (categoryLower.includes('security') || categoryLower.includes('cyber')) {
    return 'Security';
  }
  if (categoryLower.includes('management') || categoryLower.includes('project')) {
    return 'Project Management';
  }
  if (categoryLower.includes('soft') || categoryLower.includes('communication')) {
    return 'Soft Skills';
  }
  if (categoryLower.includes('tool') || categoryLower.includes('utility')) {
    return 'Tools';
  }
  if (categoryLower.includes('framework') || categoryLower.includes('library')) {
    return 'Frameworks';
  }
  if (categoryLower.includes('domain') || categoryLower.includes('business')) {
    return 'Domain Knowledge';
  }
  
  // Default fallback
  return 'Technical';
};

/**
 * Map status to valid enum value
 * @param {string} status - Status from AI
 * @returns {string} - Valid status enum
 */
const mapToValidStatus = (status) => {
  const validStatuses = [
    'Not Started', 'Learning', 'Practicing', 'Proficient', 'Mastered',
    'In Progress', 'Completed', 'Active', 'Inactive'
  ];
  
  // Direct match
  if (validStatuses.includes(status)) {
    return status;
  }
  
  // Fuzzy matching for common variations
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('progress') || statusLower.includes('working')) {
    return 'In Progress';
  }
  if (statusLower.includes('learn') || statusLower.includes('studying')) {
    return 'Learning';
  }
  if (statusLower.includes('practice') || statusLower.includes('improving')) {
    return 'Practicing';
  }
  if (statusLower.includes('proficient') || statusLower.includes('good')) {
    return 'Proficient';
  }
  if (statusLower.includes('master') || statusLower.includes('expert')) {
    return 'Mastered';
  }
  if (statusLower.includes('complete') || statusLower.includes('done')) {
    return 'Completed';
  }
  if (statusLower.includes('active') || statusLower.includes('current')) {
    return 'Active';
  }
  if (statusLower.includes('inactive') || statusLower.includes('old')) {
    return 'Inactive';
  }
  if (statusLower.includes('not') || statusLower.includes('new')) {
    return 'Not Started';
  }
  
  // Default fallback
  return 'Learning';
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

/**
 * Generate intelligent missing skills using Gemini API
 * @param {Array} extractedSkills - Current skills from resume
 * @param {string} targetRole - Target job role
 * @returns {Array} - Array of missing skills with detailed information
 */
const generateMissingSkillsWithGemini = async (extractedSkills, targetRole) => {
  try {
    const currentSkillNames = extractedSkills.map(skill => skill.skillName).join(', ');
    
    const prompt = `
    You are a SENIOR TECHNICAL RECRUITER and CAREER ADVISOR with deep expertise in ${targetRole || 'software development'} roles across top tech companies.

    CURRENT SKILLS ANALYSIS:
    The candidate currently has these skills: ${currentSkillNames}
    Target Role: ${targetRole || 'Software Developer'}

    TASK: Identify the most important missing skills for this specific role that would significantly improve their candidacy.

    PROVIDE RESPONSE IN THIS EXACT JSON FORMAT:
    {
      "missingSkills": [
        {
          "skillName": "Specific skill name",
          "importance": "Critical|High|Medium|Low",
          "category": "Programming Languages|Frontend Frameworks|Backend Technologies|Databases|DevOps Tools|Cloud Platforms|Soft Skills|Domain Knowledge",
          "learningDifficulty": "Easy|Medium|Hard",
          "timeToLearn": "1-2 weeks|1-3 months|3-6 months|6+ months",
          "priority": "High|Medium|Low",
          "reason": "Detailed explanation of why this skill is important for the target role",
          "learningResources": [
            "Specific resource 1 (e.g., course, book, platform)",
            "Specific resource 2",
            "Specific resource 3"
          ],
          "marketDemand": "Very High|High|Medium|Low",
          "salaryImpact": "High|Medium|Low",
          "jobOpportunities": "Number or description of additional opportunities this skill opens"
        }
      ],
      "skillGaps": [
        {
          "category": "Technical Skills",
          "gaps": ["List of missing technical skills"],
          "impact": "How these gaps affect candidacy for the target role",
          "solutions": ["Specific actionable steps to address these gaps"],
          "timeline": "Recommended timeline to address these gaps"
        },
        {
          "category": "Soft Skills", 
          "gaps": ["List of missing soft skills"],
          "impact": "Professional impact of missing soft skills",
          "solutions": ["How to develop these skills"],
          "timeline": "Development timeline"
        }
      ],
      "roleSpecificInsights": {
        "mustHaveSkills": ["Skills absolutely required for this role"],
        "niceToHaveSkills": ["Skills that would be advantageous"],
        "emergingSkills": ["New skills gaining importance in this field"],
        "industryTrends": ["Current trends affecting this role"],
        "competitiveAdvantage": ["Skills that would set candidate apart"]
      }
    }

    IMPORTANT GUIDELINES:
    1. Focus on skills specifically relevant to ${targetRole || 'software development'}
    2. Consider current market demands and industry trends
    3. Prioritize skills that have the highest impact on job prospects
    4. Provide realistic learning timelines
    5. Include both technical and soft skills
    6. Consider the candidate's current skill level when suggesting new skills
    7. Suggest 5-8 most impactful missing skills, not an exhaustive list
    8. Ensure learning resources are specific and actionable

    Analyze the skill gap with the expertise of someone who has hired hundreds of ${targetRole || 'software developers'} and knows exactly what skills are in demand.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No valid JSON found in Gemini missing skills response');
        throw new Error('Invalid response format');
      }
      
      const jsonStr = jsonMatch[0];
      const parsedResponse = JSON.parse(jsonStr);
      
      return {
        missingSkills: parsedResponse.missingSkills || [],
        skillGaps: parsedResponse.skillGaps || [],
        roleSpecificInsights: parsedResponse.roleSpecificInsights || {}
      };
    } catch (parseError) {
      console.error('Error parsing Gemini missing skills response:', parseError);
      console.error('Raw response:', responseText);
      throw parseError;
    }
  } catch (error) {
    console.error('Error generating missing skills with Gemini:', error);
    // Return fallback missing skills
    return generateFallbackMissingSkills(extractedSkills, targetRole);
  }
};

/**
 * Generate fallback missing skills when Gemini fails
 * @param {Array} extractedSkills - Current skills
 * @param {string} targetRole - Target role
 * @returns {Object} - Fallback missing skills data
 */
const generateFallbackMissingSkills = (extractedSkills, targetRole) => {
  const currentSkillNames = extractedSkills.map(skill => skill.skillName.toLowerCase());
  const commonMissingSkills = [];
  
  // Define role-specific skill requirements
  const roleSkillMap = {
    'frontend developer': ['React', 'TypeScript', 'Webpack', 'Testing (Jest)', 'CSS Frameworks'],
    'backend developer': ['Node.js', 'Database Design', 'API Development', 'Docker', 'Cloud Platforms'],
    'full stack developer': ['React', 'Node.js', 'Database Design', 'DevOps', 'Testing'],
    'data scientist': ['Python', 'Machine Learning', 'SQL', 'Data Visualization', 'Statistics'],
    'devops engineer': ['Docker', 'Kubernetes', 'CI/CD', 'Cloud Platforms', 'Infrastructure as Code'],
    'mobile developer': ['React Native', 'Mobile UI/UX', 'App Store Deployment', 'Mobile Testing'],
    'default': ['Cloud Platforms', 'Testing', 'CI/CD', 'System Design', 'Leadership Skills']
  };
  
  const targetSkills = roleSkillMap[targetRole?.toLowerCase()] || roleSkillMap['default'];
  
  targetSkills.forEach(skill => {
    if (!currentSkillNames.some(current => current.includes(skill.toLowerCase()))) {
      commonMissingSkills.push({
        skillName: skill,
        importance: 'High',
        category: 'Technical',
        learningDifficulty: 'Medium',
        timeToLearn: '1-3 months',
        priority: 'High',
        reason: `Essential skill for ${targetRole || 'software development'} roles`,
        learningResources: [
          'Online courses and tutorials',
          'Official documentation',
          'Hands-on projects'
        ],
        marketDemand: 'High',
        salaryImpact: 'Medium',
        jobOpportunities: 'Significantly increases job opportunities'
      });
    }
  });
  
    return {
    missingSkills: commonMissingSkills,
    skillGaps: [
      {
        category: 'Technical Skills',
        gaps: commonMissingSkills.map(skill => skill.skillName),
        impact: 'Missing these skills may limit job opportunities',
        solutions: ['Take online courses', 'Build practice projects', 'Get hands-on experience'],
        timeline: '3-6 months'
      }
    ],
    roleSpecificInsights: {
      mustHaveSkills: targetSkills.slice(0, 3),
      niceToHaveSkills: ['Communication', 'Problem Solving', 'Team Collaboration'],
      emergingSkills: ['AI/ML', 'Cloud Native', 'Microservices'],
      industryTrends: ['Remote work', 'Agile development', 'DevOps culture'],
      competitiveAdvantage: ['Leadership', 'System Design', 'Mentoring']
    }
  };
};

module.exports = {
  extractTextFromResume,
  extractSkillsFromResume,
  updateUserSkillsFromResume,
  compareSkillsWithTargetRole,
  generateCareerRecommendations,
  extractSkillsFromResumeEnhanced,
  mapToValidCategory,
  mapToValidStatus
}; 