import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import './ResumeAnalysis.css';

const ResumeAnalysis = ({ targetRole }) => {
  const { currentUser, api } = useContext(AuthContext);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefreshed, setAutoRefreshed] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [userSkills, setUserSkills] = useState([]);
  const [addingSkill, setAddingSkill] = useState(false);
  const [addedSkills, setAddedSkills] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [lastFetchTime, setLastFetchTime] = useState(0);
  
  // Refs to track fetching state and last target role
  const hasFetchedRef = useRef(false);
  const lastTargetRoleRef = useRef('');
  const fetchingRef = useRef(false);

  // Debounced fetch function
  const debouncedFetch = useCallback((func, delay) => {
    const now = Date.now();
    if (now - lastFetchTime < delay) {
      console.log(`Skipping fetch - too soon (${now - lastFetchTime}ms since last fetch)`);
      return;
    }
    
    if (fetchingRef.current) {
      console.log('Skipping fetch - already fetching');
      return;
    }
    
    setLastFetchTime(now);
    func();
  }, [lastFetchTime]);

  // Fetch user profile to get current skills - with debouncing
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;
      
      try {
        console.log('Fetching user profile...');
        fetchingRef.current = true;
        
        const response = await api.get('/users/profile');
        if (response.data.status === 'success' && response.data.data.user) {
          const skills = response.data.data.user.existingSkills || [];
          setUserSkills(skills.map(skill => skill.skillName.toLowerCase()));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        fetchingRef.current = false;
      }
    };

    if (currentUser && userSkills.length === 0) {
      debouncedFetch(() => fetchUserProfile(), 3000);
    }
  }, [api, currentUser, debouncedFetch, userSkills.length]);

  // Main analysis fetch effect - with debouncing
  useEffect(() => {
    // Skip if we've already fetched and the target role hasn't changed
    if (hasFetchedRef.current && targetRole === lastTargetRoleRef.current) {
      return;
    }

    const fetchAnalysis = async () => {
      try {
        // Only set loading true on first fetch or target role change
        if (!hasFetchedRef.current || targetRole !== lastTargetRoleRef.current) {
          setLoading(true);
        }
        setError(null);
        fetchingRef.current = true;
        
        // Only fetch if we have a current user with a target role
        if (!currentUser || !targetRole) {
          setLoading(false);
          fetchingRef.current = false;
          return;
        }
        
        console.log(`Fetching resume analysis for target role: ${targetRole}`);
        const response = await api.get(`/resume/analysis?targetRole=${encodeURIComponent(targetRole)}&refresh=false`);
        
        if (response.data && response.data.status === 'success' && response.data.data) {
          setAnalysis(response.data.data);
          // Mark that we've fetched data
          hasFetchedRef.current = true;
          // Update the last target role
          lastTargetRoleRef.current = targetRole;
        } else {
          setError('Failed to load analysis data. Please check if you have uploaded a resume.');
        }
      } catch (error) {
        console.error('Error fetching resume analysis:', error);
        setError(error.response?.data?.message || 'An error occurred while fetching the analysis. Please ensure you have uploaded a resume.');
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };
    
    // Reduced debounce time for better UX - 1000ms instead of 5000ms
    debouncedFetch(() => fetchAnalysis(), 1000);
    
    // Intentionally using a simpler dependency array to prevent unnecessary refreshes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetRole]);

  // Auto-refresh effect
  useEffect(() => {
    const checkAndAutoRefresh = async () => {
      // Auto-refresh if analysis is incomplete
      if (
        analysis && 
        !autoRefreshed &&
        (!analysis.resumeSuggestions || 
          !analysis.projectIdeas || 
          analysis.projectIdeas.length === 0)
      ) {
        console.log('Incomplete analysis data, auto-refreshing...');
        setAutoRefreshed(true);
        
        // Minimal wait time to prevent rapid successive calls (reduced from 5 seconds to 1 second)
        const timeSinceLastFetch = Date.now() - lastFetchTime;
        if (timeSinceLastFetch < 1000) {
          await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastFetch));
        }
        
        await refreshAnalysis();
      }
    };
    
    if (!loading && !error) {
      debouncedFetch(() => checkAndAutoRefresh(), 2000); // Reduced from 10 seconds to 2 seconds
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis, loading, error, autoRefreshed]);

  const refreshAnalysis = async () => {
    // Prevent multiple refreshes in quick succession
    if (fetchingRef.current) {
      console.log('Already fetching - refresh cancelled');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      fetchingRef.current = true;
      
      // Update last fetch time to prevent further debounced fetches right after
      setLastFetchTime(Date.now());
      
      const response = await api.get(`/resume/analysis?targetRole=${encodeURIComponent(targetRole)}&refresh=true`);
      
      if (response.data && response.data.status === 'success' && response.data.data) {
        setAnalysis(response.data.data);
        console.log('Analysis refreshed successfully');
      } else {
        setError('Failed to refresh analysis data');
      }
    } catch (error) {
      console.error('Error refreshing resume analysis:', error);
      setError(error.response?.data?.message || 'An error occurred while refreshing the analysis');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  // Only refresh on explicit user action (when button is clicked), not automatically
  const handleRefreshClick = () => {
    // Reduced refresh cooldown from 10 seconds to 2 seconds for better UX
    const now = Date.now();
    if (now - lastFetchTime < 2000) {
      setToast({
        show: true,
        message: `Please wait ${Math.ceil((2000 - (now - lastFetchTime)) / 1000)} seconds before refreshing again`,
        type: 'error'
      });
      return;
    }
    
    refreshAnalysis();
  };

  // Add a skill to user profile
  const handleAddSkill = async (skillName) => {
    if (addingSkill) return;
    
    try {
      setAddingSkill(true);
      
      // Create skill object similar to what's in ResumeUpload component
      const skillToAdd = {
        skillName: skillName,
        confidenceScore: 0.8 // Default confidence
      };
      
      const response = await api.post('/resume/add-missing-skills', {
        skills: [skillToAdd]
      });
      
      if (response.data.status === 'success') {
        // Add to locally tracked added skills
        setAddedSkills(prev => [...prev, skillName.toLowerCase()]);
        // Show success toast
        setToast({
          show: true,
          message: `${skillName} added to your profile successfully!`,
          type: 'success'
        });
        console.log(`Successfully added ${skillName} to profile`);
      } else {
        console.error('Failed to add skill:', response.data);
        setToast({
          show: true,
          message: `Could not add ${skillName}: ${response.data.message || 'Unknown error'}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error adding skill to profile:', error);
      setToast({
        show: true,
        message: `Error adding ${skillName}: ${error.message || 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setAddingSkill(false);
    }
  };

  // Check if a skill is in the user's profile
  const isSkillInProfile = (skillName) => {
    return userSkills.includes(skillName.toLowerCase()) || 
           addedSkills.includes(skillName.toLowerCase());
  };

  // Add back the toast timeout effect
  // Hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Add copyToClipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // Show success toast
        setToast({
          show: true,
          message: `"${text}" copied to clipboard!`,
          type: 'success'
        });
      },
      (err) => {
        console.error('Could not copy text: ', err);
        setToast({
          show: true,
          message: 'Failed to copy to clipboard',
          type: 'error'
        });
      }
    );
  };

  if (loading) {
    return (
      <div className="resume-analysis-loading">
        <div className="loading-spinner"></div>
        <p>Loading personalized analysis for {targetRole}...</p>
        <p className="loading-subtext">This may take a moment as we analyze your resume against industry requirements</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="resume-analysis-error">
        <h3>Unable to Load Analysis</h3>
        <p>{error}</p>
        <div className="error-help">
          <p>This could be because:</p>
          <ul>
            <li>You haven't uploaded a resume yet</li>
            <li>Your resume needs to be processed</li>
            <li>There was a connection issue</li>
          </ul>
        </div>
        <button onClick={refreshAnalysis} className="retry-button">Try Again</button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="resume-analysis-empty">
        <div className="empty-icon">📄</div>
        <h3>No Resume Analysis Available</h3>
        <p>To get personalized career insights:</p>
        <ol className="empty-steps">
          <li>Upload your resume in the section above</li>
          <li>Ensure your target role is set to <strong>{targetRole}</strong></li>
          <li>Click "Upload & Analyze" to process your resume</li>
        </ol>
        <p className="empty-help">Your resume will be analyzed against industry requirements for <strong>{targetRole}</strong> positions.</p>
      </div>
    );
  }

  // Modify the hasRecommendations check to exclude career guidance
  const hasRecommendations = Boolean(
    analysis.recommendations && 
    !analysis.recommendations.error &&
    (
      (analysis.resumeSuggestions && analysis.resumeSuggestions.length > 0) || 
      (analysis.projectIdeas && analysis.projectIdeas.length > 0) ||
      (analysis.resumeKeywords && analysis.resumeKeywords.length > 0)
    )
  );

  // Function to show analysis data structure for debugging
  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  return (
    <div className="resume-analysis">
      <div className="resume-analysis-header">
        <div className="target-role-info">Target Role: <strong>{targetRole}</strong></div>
        <div className="analysis-actions">
          {/* Only show in development mode */}
          {process.env.NODE_ENV === 'development' && (
            <button onClick={toggleDebug} className="debug-button">
              {showDebug ? 'Hide Debug' : 'Debug Data'}
            </button>
          )}
          <button 
            onClick={handleRefreshClick} 
            className="refresh-button"
            disabled={loading || fetchingRef.current || (Date.now() - lastFetchTime < 2000)}
          >
            {loading ? 'Refreshing...' : 'Refresh Analysis'}
          </button>
        </div>
      </div>
      
      {/* Debug information panel */}
      {showDebug && (
        <div className="debug-panel">
          <h4>Analysis Data Structure:</h4>
          <pre>{JSON.stringify(analysis, null, 2)}</pre>
        </div>
      )}
      
      {analysis.resumeInfo && (
        <div className="resume-info">
          <p>
            <strong>Resume:</strong> {analysis.resumeInfo.fileName || 'Unknown'}
            {analysis.resumeInfo.lastAnalysisDate && (
              <span className="analysis-date">
                (Analyzed: {new Date(analysis.resumeInfo.lastAnalysisDate).toLocaleDateString()})
              </span>
            )}
          </p>
        </div>
      )}

      {/* Skills Summary Section - Replacing AI Career Guidance */}
      <div className="skills-summary-section">
        <h3>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          Skills Profile Summary
        </h3>
        <div className="skills-summary-content">
          <p className="skills-summary-text">
            Based on your resume, you show strong technical proficiency suitable for a <span className="skills-highlight">{targetRole}</span> role.
            Your experience demonstrates capabilities in key technical areas with potential for growth in certain specialized domains.
          </p>
          
          {analysis.skillComparison && (
            <div className="skills-summary-metrics">
              <div className="skill-metric">
                <span className="metric-value">{analysis.skillComparison.matching?.length || 0}</span>
                <span className="metric-label">Matching Skills</span>
              </div>
              
              <div className="skill-metric">
                <span className="metric-value">{analysis.skillComparison.missing?.length || 0}</span>
                <span className="metric-label">Skills to Develop</span>
              </div>
              
              {typeof analysis.atsScore === 'number' && (
                <div className="skill-metric">
                  <span className="metric-value">{analysis.atsScore}</span>
                  <span className="metric-label">ATS Score</span>
                </div>
              )}
              
              {analysis.extractedSkills && (
                <div className="skill-metric">
                  <span className="metric-value">{analysis.extractedSkills.length}</span>
                  <span className="metric-label">Skills Identified</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Extracted Skills Section - First major section */}
      {analysis.extractedSkills && analysis.extractedSkills.length > 0 && (
        <div className="extracted-skills-section">
          <h3>Extracted Skills</h3>
          <div className="skills-grid">
            {analysis.extractedSkills.map((skill, index) => (
              <div key={index} className={`skill-card ${isSkillInProfile(skill.skillName) ? 'in-profile' : ''}`}>
                <div className="skill-card-content">
                  <span className="skill-name">{skill.skillName}</span>
                  {skill.confidenceScore && (
                    <span className="confidence-badge">
                      {Math.round(skill.confidenceScore * 100)}%
                    </span>
                  )}
                </div>
                {isSkillInProfile(skill.skillName) ? (
                  <div className="skill-status">
                    <span className="in-profile-badge">Added to Profile ✓</span>
                  </div>
                ) : (
                  <button 
                    className="add-skill-btn"
                    onClick={() => handleAddSkill(skill.skillName)}
                    disabled={addingSkill}
                  >
                    {addingSkill ? 'Adding...' : 'Add to Profile'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* ATS Score Section */}
      {typeof analysis.atsScore === 'number' && (
        <div className="ats-score-section">
          <h3>ATS Score: {analysis.atsScore}/100</h3>
          <div className="score-bar-container">
            <div 
              className={`score-bar ${
                analysis.atsScore >= 80 ? 'high' : 
                analysis.atsScore >= 60 ? 'medium' : 'low'
              }`}
              style={{ width: `${analysis.atsScore}%` }}
            />
          </div>
          {analysis.atsAnalysis && (
            <div className="ats-analysis">
              <h4>Resume Analysis</h4>
              <p>{analysis.atsAnalysis}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Skills Matching Section */}
      {analysis.skillComparison && (
        <div className="skills-comparison">
          <h3>Skills Analysis</h3>
          <div className="skills-columns">
            {analysis.skillComparison.matching && analysis.skillComparison.matching.length > 0 && (
              <div className="skills-column matching">
                <h4>Skills Matching {targetRole}</h4>
                <ul className="skills-list">
                  {analysis.skillComparison.matching.map((skill, index) => (
                    <li key={index} className="skill-item match">
                      <span className="skill-name">{skill.skillName}</span>
                      <span className="confidence-score">
                        {Math.round((skill.confidenceScore || 0) * 100)}% match
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.skillComparison.missing && analysis.skillComparison.missing.length > 0 && (
              <div className="skills-column missing">
                <h4>Skills to Develop</h4>
                <ul className="skills-list">
                  {analysis.skillComparison.missing.map((skill, index) => (
                    <li key={index} className="skill-item missing">
                      <span className="skill-name">{skill.skillName}</span>
                      <span className={`importance ${skill.importance?.toLowerCase() || 'medium'}`}>
                        {skill.importance || 'Medium'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Learning Recommendations Section */}
      {hasRecommendations ? (
        <div className="recommendations-section">
          <h3>Resume Improvement Suggestions</h3>
          {analysis.resumeSuggestions ? (
            <div className="resume-suggestions">
              <div className="improvement-cards">
                {analysis.resumeSuggestions.map((suggestion, index) => (
                  <div key={index} className="suggestion-card">
                    <div className="suggestion-header">
                      <span className="suggestion-type">{suggestion.type || 'Suggestion'}</span>
                      <span className={`priority-badge ${suggestion.priority?.toLowerCase() || 'medium'}`}>
                        {suggestion.priority || 'Medium'}
                      </span>
                    </div>
                    <h4>{suggestion.title || `Improvement ${index + 1}`}</h4>
                    <p>{suggestion.description || 'No description provided'}</p>
                    {suggestion.example && (
                      <div className="suggestion-example">
                        <h5>Example:</h5>
                        <p>{suggestion.example}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-content-message">
              <p>Based on your resume analysis, here are some general improvements you could make:</p>
              <div className="suggestion-list">
                <div className="suggestion-item">
                  <div className="suggestion-icon">📊</div>
                  <div className="suggestion-content">
                    <h4>Quantify your achievements with specific metrics and results</h4>
                    <p>Instead of saying: <span className="example-weak">"Managed cloud resources"</span></p>
                    <p>Try: <span className="example-strong">"Optimized cloud infrastructure reducing operational costs by 30% while improving system uptime to 99.9%"</span></p>
                  </div>
                </div>
                
                <div className="suggestion-item">
                  <div className="suggestion-icon">🚀</div>
                  <div className="suggestion-content">
                    <h4>Use powerful action verbs to begin your bullet points</h4>
                    <p>Replace weak verbs like <span className="example-weak">"Responsible for"</span> or <span className="example-weak">"Worked on"</span></p>
                    <p>With stronger alternatives: <span className="example-strong">"Engineered"</span>, <span className="example-strong">"Implemented"</span>, <span className="example-strong">"Orchestrated"</span>, <span className="example-strong">"Deployed"</span></p>
                  </div>
                </div>
                
                <div className="suggestion-item">
                  <div className="suggestion-icon">🎯</div>
                  <div className="suggestion-content">
                    <h4>Customize your resume keywords to match job descriptions for {targetRole}</h4>
                    <p>Scan job descriptions for the exact technologies, methodologies, and skills needed</p>
                    <p>For Cloud Engineer positions, emphasize: <span className="example-strong">AWS/Azure/GCP, Infrastructure as Code, CI/CD, containerization, microservices</span></p>
                  </div>
                </div>
                
                <div className="suggestion-item">
                  <div className="suggestion-icon">🏆</div>
                  <div className="suggestion-content">
                    <h4>Ensure your most relevant skills for {targetRole} are prominently featured</h4>
                    <p>Place key skills in your summary, skills section, and within the first few bullet points of recent positions</p>
                    <p>Technical skills should be organized by categories: <span className="example-strong">Cloud Platforms, DevOps Tools, Programming Languages, Security</span></p>
                  </div>
                </div>
                
                <div className="suggestion-item">
                  <div className="suggestion-icon">📝</div>
                  <div className="suggestion-content">
                    <h4>Include a concise professional summary tailored to {targetRole}</h4>
                    <p>3-4 lines highlighting your years of experience, specializations, and key accomplishments</p>
                    <p>Example: <span className="example-strong">"Results-driven Cloud Engineer with 5+ years of experience designing and implementing secure, scalable AWS infrastructure. Specialist in automation and CI/CD pipelines, reducing deployment time by 40% while improving reliability."</span></p>
                  </div>
                </div>
                
                <div className="suggestion-item">
                  <div className="suggestion-icon">✂️</div>
                  <div className="suggestion-content">
                    <h4>Remove outdated or irrelevant experience</h4>
                    <p>Focus on the last 10 years of experience and roles directly related to {targetRole}</p>
                    <p>For older relevant positions, include them in a "Previous Experience" section with minimal details</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <h3>Recommended Projects for {targetRole}</h3>
          {analysis.projectIdeas && analysis.projectIdeas.length > 0 ? (
            <div className="project-recommendations">
              <div className="projects-grid">
                {analysis.projectIdeas.map((project, index) => (
                  <div key={index} className="project-card">
                    <h4>{project.title || `Project Idea ${index + 1}`}</h4>
                    <div className="project-details">
                      <span className="difficulty-badge">
                        {project.difficulty || 'Medium'} Difficulty
                      </span>
                      <span className="time-estimate">
                        {project.timeEstimate || '2-4 weeks'}
                      </span>
                    </div>
                    <p className="project-description">{project.description || 'No description provided'}</p>
                    {project.skills && project.skills.length > 0 && (
                      <div className="project-skills">
                        <h5>Skills Demonstrated:</h5>
                        <div className="skill-tags">
                          {project.skills.map((skill, skillIndex) => (
                            <span key={skillIndex} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {project.employerAppeal && (
                      <div className="employer-appeal">
                        <h5>Why Employers Value This:</h5>
                        <p>{project.employerAppeal}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="role-based-projects">
              <p>Here are some projects that would showcase your skills for the {targetRole} role:</p>
              <div className="projects-grid">
                <div className="project-card">
                  <h4>Portfolio Website with {targetRole} Focus</h4>
                  <div className="project-details">
                    <span className="difficulty-badge">Medium Difficulty</span>
                    <span className="time-estimate">2-3 weeks</span>
                  </div>
                  <p className="project-description">
                    Create a professional portfolio website that showcases your skills and projects relevant to the {targetRole} position.
                    Include sections for your technical skills, work samples, and accomplishments.
                  </p>
                  <div className="employer-appeal">
                    <h5>Why Employers Value This:</h5>
                    <p>Demonstrates both technical skills and ability to present your work professionally. Shows initiative and personal branding.</p>
                  </div>
                </div>
                
                <div className="project-card">
                  <h4>Industry-Specific Application</h4>
                  <div className="project-details">
                    <span className="difficulty-badge">Medium-High Difficulty</span>
                    <span className="time-estimate">3-5 weeks</span>
                  </div>
                  <p className="project-description">
                    Develop a small application that solves a problem in the industry related to {targetRole}.
                    Focus on implementing key technologies that are commonly used in this role.
                  </p>
                  <div className="employer-appeal">
                    <h5>Why Employers Value This:</h5>
                    <p>Shows domain knowledge, problem-solving abilities, and familiarity with relevant technologies.</p>
                  </div>
                </div>
                
                <div className="project-card">
                  <h4>Open Source Contribution</h4>
                  <div className="project-details">
                    <span className="difficulty-badge">Varies</span>
                    <span className="time-estimate">Ongoing</span>
                  </div>
                  <p className="project-description">
                    Contribute to open-source projects related to your target field. Start with small bug fixes or documentation
                    improvements and work up to more significant contributions.
                  </p>
                  <div className="employer-appeal">
                    <h5>Why Employers Value This:</h5>
                    <p>Demonstrates ability to work with existing code bases, collaborate with other developers, and contribute to larger projects.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Power Words Section */}
          <div className="power-words-section">
            <h3>Resume Power Words for {targetRole}</h3>
            <p>Replace generic terms with these impactful words to strengthen your resume. Click any word to copy it.</p>
            
            <div className="power-words-container">
              <div className="power-words-intro">
                <h4>Why Power Words Matter</h4>
                <ul className="power-words-benefits">
                  <li><span className="benefit-icon">🔍</span> <strong>Stand out to ATS systems</strong> that scan for action-oriented language</li>
                  <li><span className="benefit-icon">💪</span> <strong>Demonstrate impact</strong> rather than just describing responsibilities</li>
                  <li><span className="benefit-icon">👁️</span> <strong>Catch attention</strong> of recruiters and hiring managers who skim resumes</li>
                  <li><span className="benefit-icon">🎯</span> <strong>Appear more qualified</strong> by using industry-standard terminology</li>
                </ul>
              </div>
              
              <div className="power-words-grid">
                <div className="power-word-category">
                  <h4>Technical Implementation</h4>
                  <div className="word-list">
                    <span className="power-word" onClick={() => copyToClipboard("Architected")}>Architected</span>
                    <span className="power-word" onClick={() => copyToClipboard("Engineered")}>Engineered</span>
                    <span className="power-word" onClick={() => copyToClipboard("Deployed")}>Deployed</span>
                    <span className="power-word" onClick={() => copyToClipboard("Implemented")}>Implemented</span>
                    <span className="power-word" onClick={() => copyToClipboard("Developed")}>Developed</span>
                    <span className="power-word" onClick={() => copyToClipboard("Designed")}>Designed</span>
                    <span className="power-word" onClick={() => copyToClipboard("Configured")}>Configured</span>
                    <span className="power-word" onClick={() => copyToClipboard("Integrated")}>Integrated</span>
                  </div>
                </div>
                
                <div className="power-word-category">
                  <h4>Optimization & Improvement</h4>
                  <div className="word-list">
                    <span className="power-word" onClick={() => copyToClipboard("Optimized")}>Optimized</span>
                    <span className="power-word" onClick={() => copyToClipboard("Streamlined")}>Streamlined</span>
                    <span className="power-word" onClick={() => copyToClipboard("Enhanced")}>Enhanced</span>
                    <span className="power-word" onClick={() => copyToClipboard("Accelerated")}>Accelerated</span>
                    <span className="power-word" onClick={() => copyToClipboard("Improved")}>Improved</span>
                    <span className="power-word" onClick={() => copyToClipboard("Upgraded")}>Upgraded</span>
                    <span className="power-word" onClick={() => copyToClipboard("Refined")}>Refined</span>
                    <span className="power-word" onClick={() => copyToClipboard("Transformed")}>Transformed</span>
                  </div>
                </div>
                
                <div className="power-word-category">
                  <h4>Leadership & Management</h4>
                  <div className="word-list">
                    <span className="power-word" onClick={() => copyToClipboard("Led")}>Led</span>
                    <span className="power-word" onClick={() => copyToClipboard("Orchestrated")}>Orchestrated</span>
                    <span className="power-word" onClick={() => copyToClipboard("Spearheaded")}>Spearheaded</span>
                    <span className="power-word" onClick={() => copyToClipboard("Directed")}>Directed</span>
                    <span className="power-word" onClick={() => copyToClipboard("Championed")}>Championed</span>
                    <span className="power-word" onClick={() => copyToClipboard("Established")}>Established</span>
                    <span className="power-word" onClick={() => copyToClipboard("Guided")}>Guided</span>
                    <span className="power-word" onClick={() => copyToClipboard("Mentored")}>Mentored</span>
                  </div>
                </div>
                
                <div className="power-word-category">
                  <h4>Problem Solving</h4>
                  <div className="word-list">
                    <span className="power-word" onClick={() => copyToClipboard("Resolved")}>Resolved</span>
                    <span className="power-word" onClick={() => copyToClipboard("Troubleshot")}>Troubleshot</span>
                    <span className="power-word" onClick={() => copyToClipboard("Diagnosed")}>Diagnosed</span>
                    <span className="power-word" onClick={() => copyToClipboard("Mitigated")}>Mitigated</span>
                    <span className="power-word" onClick={() => copyToClipboard("Remedied")}>Remedied</span>
                    <span className="power-word" onClick={() => copyToClipboard("Overcame")}>Overcame</span>
                    <span className="power-word" onClick={() => copyToClipboard("Identified")}>Identified</span>
                    <span className="power-word" onClick={() => copyToClipboard("Eliminated")}>Eliminated</span>
                  </div>
                </div>
                
                <div className="power-word-category">
                  <h4>Innovation & Creation</h4>
                  <div className="word-list">
                    <span className="power-word" onClick={() => copyToClipboard("Pioneered")}>Pioneered</span>
                    <span className="power-word" onClick={() => copyToClipboard("Innovated")}>Innovated</span>
                    <span className="power-word" onClick={() => copyToClipboard("Created")}>Created</span>
                    <span className="power-word" onClick={() => copyToClipboard("Launched")}>Launched</span>
                    <span className="power-word" onClick={() => copyToClipboard("Initiated")}>Initiated</span>
                    <span className="power-word" onClick={() => copyToClipboard("Devised")}>Devised</span>
                    <span className="power-word" onClick={() => copyToClipboard("Formulated")}>Formulated</span>
                    <span className="power-word" onClick={() => copyToClipboard("Conceptualized")}>Conceptualized</span>
                  </div>
                </div>
                
                <div className="power-word-category">
                  <h4>Automation & Efficiency</h4>
                  <div className="word-list">
                    <span className="power-word" onClick={() => copyToClipboard("Automated")}>Automated</span>
                    <span className="power-word" onClick={() => copyToClipboard("Systematized")}>Systematized</span>
                    <span className="power-word" onClick={() => copyToClipboard("Programmed")}>Programmed</span>
                    <span className="power-word" onClick={() => copyToClipboard("Scripted")}>Scripted</span>
                    <span className="power-word" onClick={() => copyToClipboard("Standardized")}>Standardized</span>
                    <span className="power-word" onClick={() => copyToClipboard("Consolidated")}>Consolidated</span>
                    <span className="power-word" onClick={() => copyToClipboard("Simplified")}>Simplified</span>
                    <span className="power-word" onClick={() => copyToClipboard("Expedited")}>Expedited</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Only include keywords section if available */}
          {analysis.resumeKeywords && analysis.resumeKeywords.length > 0 && (
            <div className="keyword-section">
              <h3>Key Terms for {targetRole} Resumes</h3>
              <p className="keywords-intro">Include these keywords in your resume to improve visibility and relevance:</p>
              <div className="keywords-container">
                {analysis.resumeKeywords.map((keyword, index) => (
                  <div key={index} className="keyword-tag" onClick={() => copyToClipboard(keyword)}>
                    {keyword}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="no-recommendations">
          <h3>Resume Improvement Suggestions</h3>
          <p>Upload your resume and set a target role to get personalized resume improvement suggestions and project ideas.</p>
        </div>
      )}
      
      {analysis.overallFeedback && (
        <div className="overall-feedback">
          <h3>Overall Feedback</h3>
          <p>{analysis.overallFeedback}</p>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default ResumeAnalysis; 