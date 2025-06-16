import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './ResumePage.css';
import { 
  BarChart3, 
  FileText, 
  GraduationCap,
  Briefcase,
  Lightbulb,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  DollarSign,
  Users,
  Flame,
  Target
} from 'lucide-react';

const ResumePage = () => {
  const { user, api } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [targetRole, setTargetRole] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Debug log to see what analysisResult contains
  console.log('ResumePage render - analysisResult:', analysisResult);

  useEffect(() => {
    console.log('ResumePage mounted, user:', user);
    if (user?.targetRole) {
      setTargetRole(user.targetRole);
    }
    fetchExistingAnalysis();
  }, [user]);

  const fetchExistingAnalysis = async () => {
    try {
      const response = await api.get('/resume/analysis');
      if (response.data?.status === 'success') {
        setAnalysisResult(response.data.data);
      }
    } catch (error) {
      // Ignore 404 errors (no resume uploaded yet)
      if (error.response?.status !== 404) {
        console.error('Error fetching existing analysis:', error);
      }
    }
  };

  // File validation
  const validateFile = (file) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a PDF, DOC, DOCX, or TXT file';
    }
    
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }
    
    return null;
  };

  // Handle file upload
  const handleFileUpload = async (uploadFile) => {
    const validationError = validateFile(uploadFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('resume', uploadFile);

    try {
      console.log('Uploading resume:', uploadFile.name);
      
      const response = await api.post('/resume/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 second timeout for AI processing
      });

      console.log('Upload successful:', response.data);
      
      if (response.data?.status === 'success') {
        console.log('Setting analysis result:', response.data.data);
        setAnalysisResult(response.data.data);
        setFile(uploadFile);
        setShowUploadForm(false); // Hide upload form to show analysis results
        
        // Show success notification
        showNotification('Resume analyzed successfully!', 'success');
      } else {
        throw new Error(response.data?.message || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Failed to analyze resume. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 413) {
        errorMessage = 'File too large. Please upload a smaller file (max 10MB).';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid file format. Please upload a PDF, DOC, DOCX, or TXT file.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. Please try again with a smaller file.';
      } else if (!error.response) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
    setLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Helper function for score styling
  const getScoreClass = (score) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
  };

  // Show notification
  const showNotification = (message, type) => {
    // You can implement a toast notification system here
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  // Dismiss error
  const dismissError = () => {
    setError('');
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 85) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const ScoreCard = ({ title, score, description, icon: Icon }) => (
    <div className={`p-6 rounded-lg ${getScoreBgColor(score)} border-2 border-gray-200`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Icon className="h-6 w-6 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
          {score}%
        </span>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );

  const SkillCard = ({ skill, isMatching = true }) => (
    <div className={`p-3 rounded-lg border-2 ${isMatching ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-800">{skill.skillName}</h4>
          <p className="text-sm text-gray-600">{skill.category || 'Technical'}</p>
        </div>
        <div className="text-right">
          {skill.confidenceScore && (
            <span className="text-sm font-medium text-gray-700">
              {Math.round(skill.confidenceScore * 100)}%
            </span>
          )}
          {skill.importance && (
            <p className="text-xs text-gray-500">{skill.importance}</p>
          )}
        </div>
      </div>
    </div>
  );

  const RecommendationCard = ({ recommendations, type, icon: Icon, bgColor }) => (
    <div className={`p-6 rounded-lg ${bgColor} border-2 border-gray-200`}>
      <div className="flex items-center mb-4">
        <Icon className="h-6 w-6 text-gray-700 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800 capitalize">{type} Actions</h3>
      </div>
      <ul className="space-y-2">
        {recommendations?.actions?.map((action, index) => (
          <li key={index} className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-700">{action}</span>
          </li>
        ))}
      </ul>
      {recommendations?.timeframe && (
        <div className="mt-4 p-3 bg-white rounded-md">
          <p className="text-sm font-medium text-gray-600">
            Timeline: {recommendations.timeframe}
          </p>
        </div>
      )}
    </div>
  );

  if (!analysisResult && !showUploadForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <FileText className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Resume Analysis</h1>
            <p className="text-xl text-gray-600 mb-8">
              Upload your resume to get comprehensive analysis and career insights
            </p>
            <button
              onClick={() => setShowUploadForm(true)}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Upload Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showUploadForm || !analysisResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Your Resume</h1>
            
            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={dismissError}
                      className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100"
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg className="h-3 w-3" viewBox="0 0 6 6">
                        <path d="m.75.75 4.5 4.5m0-4.5-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Role (Optional)
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g., Full Stack Developer, Data Scientist"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resume File
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
              </p>
            </div>

            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  Analyzing your resume...
                </p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setShowUploadForm(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Resume Analysis</h1>
              <p className="text-gray-600 mt-1">
                Comprehensive analysis for {analysisResult?.targetRole || 'your career'}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowUploadForm(true)}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Upload New Resume
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={dismissError}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-3 w-3" viewBox="0 0 6 6">
                      <path d="m.75.75 4.5 4.5m0-4.5-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overall Score Section - Professional Design with Mobile Optimization */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full mb-4">
              <span className="text-2xl sm:text-3xl font-bold text-indigo-600">
                {analysisResult?.overallScore || analysisResult?.atsScore}%
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Resume Analysis Score</h2>
            <p className="text-sm sm:text-base text-gray-600">Comprehensive evaluation of your resume's effectiveness</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{analysisResult?.atsScore}%</div>
              <div className="text-xs sm:text-sm font-medium text-gray-600">ATS Compatibility</div>
              <div className="text-xs text-gray-500 mt-1 hidden sm:block">Applicant Tracking System</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{analysisResult?.skillMatchPercentage}%</div>
              <div className="text-xs sm:text-sm font-medium text-gray-600">Skill Match</div>
              <div className="text-xs text-gray-500 mt-1 hidden sm:block">Role Relevance</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{analysisResult?.keywordScore}%</div>
              <div className="text-xs sm:text-sm font-medium text-gray-600">Keywords</div>
              <div className="text-xs text-gray-500 mt-1 hidden sm:block">Industry Terms</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{analysisResult?.formatScore}%</div>
              <div className="text-xs sm:text-sm font-medium text-gray-600">Format</div>
              <div className="text-xs text-gray-500 mt-1 hidden sm:block">Structure & Layout</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Professional Design with Equal Spacing and Gaps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex justify-center">
            <div className="flex w-full max-w-4xl gap-4">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'skills', label: 'Skills Analysis', icon: GraduationCap },
                { id: 'recommendations', label: 'Recommendations', icon: Lightbulb }
              ].map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col sm:flex-row items-center justify-center px-4 py-4 rounded-t-lg font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white border-b-2 border-indigo-600'
                      : 'bg-gray-100 text-white hover:bg-gray-200 hover:text-gray-800'
                  }`}
                  style={{
                    backgroundColor: activeTab === tab.id ? '#4f46e5' : '#6b7280',
                    color: 'white'
                  }}
                >
                  <tab.icon className="h-5 w-5 mb-1 sm:mb-0 sm:mr-2" />
                  <span className="text-xs sm:text-sm text-center font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Score Breakdown */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Score Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ScoreCard
                  title="ATS Compatibility"
                  score={analysisResult?.atsScore || 0}
                  description="How well your resume passes Applicant Tracking Systems"
                  icon={FileText}
                />
                <ScoreCard
                  title="Keyword Optimization"
                  score={analysisResult?.keywordScore || 0}
                  description="Relevance and density of industry keywords"
                  icon={Flame}
                />
                <ScoreCard
                  title="Format Score"
                  score={analysisResult?.formatScore || 0}
                  description="Resume structure and formatting quality"
                  icon={CheckCircle}
                />
                <ScoreCard
                  title="Experience Relevance"
                  score={analysisResult?.experienceRelevance || 0}
                  description="How relevant your experience is to target role"
                  icon={Briefcase}
                />
                <ScoreCard
                  title="Achievement Quantification"
                  score={analysisResult?.quantificationScore || 0}
                  description="Use of numbers and measurable achievements"
                  icon={Star}
                />
                <ScoreCard
                  title="Action Verb Usage"
                  score={analysisResult?.actionVerbScore || 0}
                  description="Effective use of strong action verbs"
                  icon={TrendingUp}
                />
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Analysis Summary</h3>
              <p className="text-gray-700 leading-relaxed">
                {analysisResult?.atsAnalysis || "Your resume analysis is being processed..."}
              </p>
            </div>

            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2" />
                  Key Strengths
                </h3>
                <ul className="space-y-2">
                  {analysisResult?.strengthsHighlights?.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <Star className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-green-800">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-200">
                <h3 className="text-xl font-bold text-yellow-800 mb-4 flex items-center">
                  <AlertTriangle className="h-6 w-6 mr-2" />
                  Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {analysisResult?.weaknessesToAddress?.map((weakness, index) => (
                    <li key={index} className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-yellow-800">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Skills Overview - Mobile Optimized */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border-l-4 border-blue-500">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2">Total Skills</h3>
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {analysisResult?.extractedSkills?.length || 0}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Skills identified</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border-l-4 border-green-500">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2">Matching Skills</h3>
                <div className="text-2xl sm:text-3xl font-bold text-green-600">
                  {analysisResult?.matchingSkills?.length || 0}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Role-relevant skills</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border-l-4 border-red-500">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2">Missing Skills</h3>
                <div className="text-2xl sm:text-3xl font-bold text-red-600">
                  {analysisResult?.missingSkills?.length || 0}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Skills to develop</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border-l-4 border-purple-500">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2">Skill Match</h3>
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                  {analysisResult?.skillMatchPercentage || 0}%
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Overall relevance</p>
              </div>
            </div>

            {/* Skill Categories - Mobile Optimized */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Skills by Category</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Object.entries(analysisResult?.categories || {}).map(([category, skills]) => (
                  skills && skills.length > 0 && (
                    <div key={category} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center text-sm sm:text-base">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {skills.slice(0, 5).map((skill, index) => (
                          <div key={index} className="text-xs sm:text-sm text-gray-600 bg-white px-2 sm:px-3 py-1 rounded">
                            {typeof skill === 'string' ? skill : skill.skillName}
                          </div>
                        ))}
                        {skills.length > 5 && (
                          <div className="text-xs text-gray-500 italic">
                            +{skills.length - 5} more skills
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Skills Analysis - Mobile Optimized */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2" />
                  Your Skills Portfolio
                </h3>
                <div className="space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                  {analysisResult?.extractedSkills?.map((skill, index) => (
                    <div key={index} className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <h4 className="font-medium text-gray-800 text-sm sm:text-base mb-2 sm:mb-0">{skill.skillName}</h4>
                        <div className="flex items-center space-x-2">
                          {skill.confidenceScore && (
                            <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                              {Math.round(skill.confidenceScore * 100)}%
                            </span>
                          )}
                          {skill.proficiencyLevel && (
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {skill.proficiencyLevel}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        <span className="font-medium">Category:</span> {skill.category || 'Technical'}
                      </div>
                      {skill.evidenceFound && (
                        <div className="text-xs text-gray-500 mt-1 italic">
                          Evidence: {skill.evidenceFound}
                        </div>
                      )}
                      {skill.marketDemand && (
                        <div className="text-xs text-gray-500 mt-1">
                          Market Demand: <span className={`font-medium ${
                            skill.marketDemand === 'Very High' ? 'text-green-600' :
                            skill.marketDemand === 'High' ? 'text-blue-600' :
                            skill.marketDemand === 'Medium' ? 'text-yellow-600' : 'text-gray-600'
                          }`}>{skill.marketDemand}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 mr-2" />
                  Skills to Develop
                </h3>
                <div className="space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                  {analysisResult?.missingSkills?.map((skill, index) => (
                    <div key={index} className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <h4 className="font-medium text-gray-800 text-sm sm:text-base mb-2 sm:mb-0">{skill.skillName}</h4>
                        <div className="flex items-center space-x-2">
                          {skill.importance && (
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              skill.importance === 'Critical' ? 'bg-red-100 text-red-700' :
                              skill.importance === 'High' ? 'bg-orange-100 text-orange-700' :
                              skill.importance === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {skill.importance}
                            </span>
                          )}
                          {skill.priority && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              skill.priority === 'High' ? 'bg-red-100 text-red-600' :
                              skill.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {skill.priority} Priority
                            </span>
                          )}
                        </div>
                      </div>
                      {skill.reason && (
                        <div className="text-xs sm:text-sm text-gray-600 mb-2">
                          <span className="font-medium">Why important:</span> {skill.reason}
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 space-y-1 sm:space-y-0">
                        {skill.timeToLearn && (
                          <span>Learning time: {skill.timeToLearn}</span>
                        )}
                        {skill.learningDifficulty && (
                          <span className={`font-medium ${
                            skill.learningDifficulty === 'Easy' ? 'text-green-600' :
                            skill.learningDifficulty === 'Medium' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {skill.learningDifficulty} to learn
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skill Gaps Analysis */}
            {analysisResult?.skillGaps && analysisResult.skillGaps.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Skill Gap Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analysisResult.skillGaps.map((gap, index) => (
                    <div key={index} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-3">{gap.category}</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Missing Skills:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {gap.gaps?.map((skill, skillIndex) => (
                              <span key={skillIndex} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Impact:</span> {gap.impact}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Solutions:</span>
                          <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                            {gap.solutions?.map((solution, solutionIndex) => (
                              <li key={solutionIndex}>{solution}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-8">
            {/* Priority Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center mb-4">
                  <Clock className="h-6 w-6 text-red-600 mr-2" />
                  <h3 className="text-lg font-semibold text-red-800">Immediate Actions</h3>
                  <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                    {analysisResult?.recommendations?.immediate?.timeframe || '1-2 weeks'}
                  </span>
                </div>
                <ul className="space-y-3">
                  {analysisResult?.recommendations?.immediate?.actions?.map((action, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-red-800">{action}</span>
                    </li>
                  ))}
                </ul>
                {analysisResult?.recommendations?.immediate?.expectedImpact && (
                  <div className="mt-4 p-3 bg-red-100 rounded-md">
                    <p className="text-xs font-medium text-red-700">
                      Expected Impact: {analysisResult.recommendations.immediate.expectedImpact}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 rounded-lg p-6 border-l-4 border-yellow-500">
                <div className="flex items-center mb-4">
                  <TrendingUp className="h-6 w-6 text-yellow-600 mr-2" />
                  <h3 className="text-lg font-semibold text-yellow-800">Short-term Goals</h3>
                  <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                    {analysisResult?.recommendations?.shortTerm?.timeframe || '1-3 months'}
                  </span>
                </div>
                <ul className="space-y-3">
                  {analysisResult?.recommendations?.shortTerm?.actions?.map((action, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-yellow-800">{action}</span>
                    </li>
                  ))}
                </ul>
                {analysisResult?.recommendations?.shortTerm?.expectedImpact && (
                  <div className="mt-4 p-3 bg-yellow-100 rounded-md">
                    <p className="text-xs font-medium text-yellow-700">
                      Expected Impact: {analysisResult.recommendations.shortTerm.expectedImpact}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center mb-4">
                  <GraduationCap className="h-6 w-6 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-green-800">Long-term Development</h3>
                  <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    {analysisResult?.recommendations?.longTerm?.timeframe || '3-12 months'}
                  </span>
                </div>
                <ul className="space-y-3">
                  {analysisResult?.recommendations?.longTerm?.actions?.map((action, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-green-800">{action}</span>
                    </li>
                  ))}
                </ul>
                {analysisResult?.recommendations?.longTerm?.expectedImpact && (
                  <div className="mt-4 p-3 bg-green-100 rounded-md">
                    <p className="text-xs font-medium text-green-700">
                      Expected Impact: {analysisResult.recommendations.longTerm.expectedImpact}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Improvement Roadmap */}
            {analysisResult?.improvementRoadmap && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Career Development Roadmap</h3>
                <div className="space-y-6">
                  {Object.entries(analysisResult.improvementRoadmap).map(([phase, details], index) => (
                    <div key={phase} className="relative">
                      {index < Object.keys(analysisResult.improvementRoadmap).length - 1 && (
                        <div className="absolute left-4 top-8 w-0.5 h-16 bg-gray-300"></div>
                      )}
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">{index + 1}</span>
                        </div>
                        <div className="ml-4 flex-1">
                          <h4 className="text-lg font-semibold text-gray-900">{details.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">Duration: {details.duration}</p>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="font-medium text-gray-800 mb-2">Key Tasks:</h5>
                            <ul className="space-y-1">
                              {details.tasks?.map((task, taskIndex) => (
                                <li key={taskIndex} className="text-sm text-gray-600 flex items-start">
                                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                  {task}
                                </li>
                              ))}
                            </ul>
                            <div className="mt-3 p-2 bg-indigo-50 rounded">
                              <p className="text-xs font-medium text-indigo-700">
                                Expected Outcome: {details.outcome}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-6 w-6 text-blue-600 mr-2" />
                  Content Analysis
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Keyword Optimization</h4>
                    <p className="text-sm text-blue-700">
                      {analysisResult?.detailedAnalysis?.keywordDensity || analysisResult?.keywordAnalysis || "Keyword analysis completed"}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Format Assessment</h4>
                    <p className="text-sm text-green-700">
                      {analysisResult?.detailedAnalysis?.formatCompliance || analysisResult?.formatAnalysis || "Format analysis completed"}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2">Experience Quality</h4>
                    <p className="text-sm text-purple-700">
                      {analysisResult?.detailedAnalysis?.contentQuality || analysisResult?.experienceAnalysis || "Experience analysis completed"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Target className="h-6 w-6 text-orange-600 mr-2" />
                  Performance Metrics
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-orange-800 mb-2">Achievement Quantification</h4>
                    <p className="text-sm text-orange-700">
                      {analysisResult?.detailedAnalysis?.achievementQuantification || analysisResult?.achievementAnalysis || "Achievement analysis completed"}
                    </p>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-lg">
                    <h4 className="font-medium text-teal-800 mb-2">Action Verb Usage</h4>
                    <p className="text-sm text-teal-700">
                      {analysisResult?.detailedAnalysis?.actionVerbUsage || "Action verb analysis completed"}
                    </p>
                  </div>
                  <div className="p-4 bg-pink-50 rounded-lg">
                    <h4 className="font-medium text-pink-800 mb-2">Skill Relevance</h4>
                    <p className="text-sm text-pink-700">
                      {analysisResult?.detailedAnalysis?.skillRelevance || "Skill relevance analysis completed"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Experience Analysis */}
            {analysisResult?.experienceAnalysis && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Briefcase className="h-6 w-6 text-gray-600 mr-2" />
                  Professional Experience Assessment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {analysisResult.experienceAnalysis.totalYears || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Total Experience</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {analysisResult.experienceAnalysis.relevantYears || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Relevant Experience</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {analysisResult.experienceAnalysis.careerProgression || 'Positive'}
                    </div>
                    <div className="text-sm text-gray-600">Career Growth</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {analysisResult.experienceAnalysis.roleAlignment || 'Good'}
                    </div>
                    <div className="text-sm text-gray-600">Role Alignment</div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Industry Experience</h4>
                    <p className="text-sm text-gray-600">
                      {analysisResult.experienceAnalysis.industryExperience || 'Industry background assessment completed'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Leadership Evidence</h4>
                    <p className="text-sm text-gray-600">
                      {analysisResult.experienceAnalysis.leadershipExperience || 'Leadership experience evaluation completed'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Project Complexity</h4>
                    <p className="text-sm text-gray-600">
                      {analysisResult.experienceAnalysis.projectComplexity || 'Project complexity assessment completed'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Impact Demonstration</h4>
                    <p className="text-sm text-gray-600">
                      {analysisResult.experienceAnalysis.impactDemonstration || 'Impact demonstration analysis completed'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumePage; 