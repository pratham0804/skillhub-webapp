import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  Flame
} from 'lucide-react';

const ResumePage = () => {
  const { user } = useAuth();
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [targetRole, setTargetRole] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    if (user?.targetRole) {
      setTargetRole(user.targetRole);
    }
    fetchResumeAnalysis();
  }, [user]);

  const fetchResumeAnalysis = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/resume/analysis', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.data);
      }
    } catch (error) {
      console.error('Error fetching resume analysis:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setResumeFile(file);
    setUploading(true);
    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.data);
        setShowUploadForm(false);
        
        // Show success message
        alert('Resume uploaded and analyzed successfully!');
      } else {
        const errorData = await response.json();
        alert(`Upload failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const refreshAnalysis = async () => {
    setAnalyzing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resume/analysis?refresh=true&targetRole=${encodeURIComponent(targetRole)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.data);
      }
    } catch (error) {
      console.error('Error refreshing analysis:', error);
    } finally {
      setAnalyzing(false);
    }
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

  if (!analysis && !showUploadForm) {
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

  if (showUploadForm || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Your Resume</h1>
            
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
                onChange={handleFileUpload}
                disabled={uploading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
              </p>
            </div>

            {uploading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  {analyzing ? 'Analyzing your resume...' : 'Uploading...'}
                </p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setShowUploadForm(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                disabled={uploading}
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
                Comprehensive analysis for {analysis?.targetRole || 'your career'}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={refreshAnalysis}
                disabled={analyzing}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {analyzing ? 'Analyzing...' : 'Refresh Analysis'}
              </button>
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

      {/* Overall Score Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-2">{analysis?.overallScore || analysis?.atsScore}%</h2>
            <p className="text-xl opacity-90">Overall Resume Score</p>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{analysis?.atsScore}%</div>
                <div className="text-sm opacity-75">ATS Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analysis?.skillMatchPercentage}%</div>
                <div className="text-sm opacity-75">Skill Match</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analysis?.keywordScore}%</div>
                <div className="text-sm opacity-75">Keywords</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analysis?.formatScore}%</div>
                <div className="text-sm opacity-75">Format</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'skills', label: 'Skills Analysis', icon: GraduationCap },
              { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
              { id: 'market', label: 'Market Insights', icon: TrendingUp },
              { id: 'interview', label: 'Interview Prep', icon: Users },
              { id: 'progress', label: 'Career Path', icon: Briefcase }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
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
                  score={analysis?.atsScore || 0}
                  description="How well your resume passes Applicant Tracking Systems"
                  icon={FileText}
                />
                <ScoreCard
                  title="Keyword Optimization"
                  score={analysis?.keywordScore || 0}
                  description="Relevance and density of industry keywords"
                  icon={Flame}
                />
                <ScoreCard
                  title="Format Score"
                  score={analysis?.formatScore || 0}
                  description="Resume structure and formatting quality"
                  icon={CheckCircle}
                />
                <ScoreCard
                  title="Experience Relevance"
                  score={analysis?.experienceRelevance || 0}
                  description="How relevant your experience is to target role"
                  icon={Briefcase}
                />
                <ScoreCard
                  title="Achievement Quantification"
                  score={analysis?.quantificationScore || 0}
                  description="Use of numbers and measurable achievements"
                  icon={Star}
                />
                <ScoreCard
                  title="Action Verb Usage"
                  score={analysis?.actionVerbScore || 0}
                  description="Effective use of strong action verbs"
                  icon={TrendingUp}
                />
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Analysis Summary</h3>
              <p className="text-gray-700 leading-relaxed">
                {analysis?.atsAnalysis || "Your resume analysis is being processed..."}
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
                  {analysis?.strengthsHighlights?.map((strength, index) => (
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
                  {analysis?.weaknessesToAddress?.map((weakness, index) => (
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
          <div className="space-y-8">
            {/* Skills Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Skills</h3>
                <div className="text-3xl font-bold text-indigo-600">
                  {analysis?.extractedSkills?.length || 0}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Matching Skills</h3>
                <div className="text-3xl font-bold text-green-600">
                  {analysis?.matchingSkills?.length || 0}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Missing Skills</h3>
                <div className="text-3xl font-bold text-red-600">
                  {analysis?.missingSkills?.length || 0}
                </div>
              </div>
            </div>

            {/* Skills Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Your Skills</h3>
                <div className="space-y-3">
                  {analysis?.extractedSkills?.map((skill, index) => (
                    <SkillCard key={index} skill={skill} isMatching={true} />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Missing Skills</h3>
                <div className="space-y-3">
                  {analysis?.missingSkills?.map((skill, index) => (
                    <SkillCard key={index} skill={skill} isMatching={false} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RecommendationCard
                recommendations={analysis?.recommendations?.immediate}
                type="immediate"
                icon={Clock}
                bgColor="bg-red-50"
              />
              <RecommendationCard
                recommendations={analysis?.recommendations?.shortTerm}
                type="short-term"
                icon={TrendingUp}
                bgColor="bg-yellow-50"
              />
              <RecommendationCard
                recommendations={analysis?.recommendations?.longTerm}
                type="long-term"
                icon={GraduationCap}
                bgColor="bg-green-50"
              />
            </div>

            {/* Detailed Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Content Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800">Keywords</h4>
                    <p className="text-sm text-gray-600">{analysis?.keywordAnalysis}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Format</h4>
                    <p className="text-sm text-gray-600">{analysis?.formatAnalysis}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Experience</h4>
                    <p className="text-sm text-gray-600">{analysis?.experienceAnalysis}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Insights</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800">Education</h4>
                    <p className="text-sm text-gray-600">{analysis?.educationAnalysis}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Achievements</h4>
                    <p className="text-sm text-gray-600">{analysis?.achievementAnalysis}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Headers</h4>
                    <p className="text-sm text-gray-600">{analysis?.headerAnalysis}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="space-y-8">
            {/* Market Overview */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Market Position</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {analysis?.industryBenchmark?.userPosition || 'Average'}
                  </div>
                  <div className="text-sm text-gray-600">Market Position</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analysis?.competitiveAnalysis?.marketPosition || 'Competitive'}
                  </div>
                  <div className="text-sm text-gray-600">Competitiveness</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analysis?.careerProgression?.timeToPromotion || '12-18 months'}
                  </div>
                  <div className="text-sm text-gray-600">Time to Promotion</div>
                </div>
              </div>
            </div>

            {/* Detailed Market Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Industry Benchmark</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Average Score:</span>
                    <span className="font-semibold">{analysis?.industryBenchmark?.averageScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Top Performer:</span>
                    <span className="font-semibold">{analysis?.industryBenchmark?.topPerformerScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Your Position:</span>
                    <span className="font-semibold capitalize">{analysis?.industryBenchmark?.userPosition}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Career Progression</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800">Current Stage</h4>
                    <p className="text-gray-600">{analysis?.careerProgression?.growthTrajectory}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Next Steps</h4>
                    <ul className="list-disc list-inside text-gray-600">
                      {analysis?.careerProgression?.nextSteps?.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'interview' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Interview Preparation</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Likely Questions</h4>
                  <div className="space-y-3">
                    {analysis?.interviewQuestions?.map((question, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">{question}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Preparation Tips</h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-blue-800 mb-2">Technical Preparation</h5>
                      <p className="text-blue-700 text-sm">
                        Focus on your strongest technical skills and be ready to discuss projects where you used them.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h5 className="font-medium text-green-800 mb-2">Behavioral Questions</h5>
                      <p className="text-green-700 text-sm">
                        Prepare STAR (Situation, Task, Action, Result) examples for your key achievements.
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h5 className="font-medium text-purple-800 mb-2">Portfolio Discussion</h5>
                      <p className="text-purple-700 text-sm">
                        Be ready to walk through your projects, explaining your decisions and the impact of your work.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Career Progression Path</h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <DollarSign className="h-12 w-12 text-indigo-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-indigo-800">Current Level</h4>
                    <p className="text-indigo-600">{analysis?.careerProgression?.currentStage}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-green-800">Growth Potential</h4>
                    <p className="text-green-600">{analysis?.careerProgression?.timeToPromotion}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Star className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-purple-800">Next Role</h4>
                    <p className="text-purple-600">{analysis?.careerProgression?.nextRoles?.[0]}</p>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Recommended Timeline</h4>
                  <p className="text-gray-700">{analysis?.careerProgression?.timelineRecommendations}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumePage; 