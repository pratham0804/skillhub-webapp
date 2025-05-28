import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './ResumeAnalysis.css';

const ResumeAnalysis = ({ targetRole }) => {
  const { api, currentUser } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  
  // Use a ref to store whether we've already fetched data to prevent continuous refreshing
  const hasFetchedRef = useRef(false);
  // Store the last target role to detect changes
  const lastTargetRoleRef = useRef(targetRole);

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
        
        // Only fetch if we have a current user with a resume and a target role
        if (!currentUser || !targetRole) {
          setLoading(false);
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
          setError('Failed to load analysis data');
        }
      } catch (error) {
        console.error('Error fetching resume analysis:', error);
        setError(error.response?.data?.message || 'An error occurred while fetching the analysis');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalysis();
    
    // Intentionally using a simpler dependency array to prevent unnecessary refreshes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetRole]);

  const refreshAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/resume/analysis?targetRole=${encodeURIComponent(targetRole)}&refresh=true`);
      
      if (response.data && response.data.status === 'success' && response.data.data) {
        setAnalysis(response.data.data);
      } else {
        setError('Failed to refresh analysis data');
      }
    } catch (error) {
      console.error('Error refreshing resume analysis:', error);
      setError(error.response?.data?.message || 'An error occurred while refreshing the analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="resume-analysis-loading">Loading personalized analysis...</div>;
  }

  if (error) {
    return (
      <div className="resume-analysis-error">
        <p>Error: {error}</p>
        <button onClick={refreshAnalysis} className="retry-button">Try Again</button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="resume-analysis-empty">
        <p>No analysis available. Please upload a resume and set a target role first.</p>
      </div>
    );
  }

  // Check if we have recommendations
  const hasRecommendations = analysis.recommendations && 
    !analysis.recommendations.error &&
    (analysis.recommendations.learningPath?.length > 0 || 
     analysis.recommendations.courseRecommendations?.length > 0 ||
     analysis.recommendations.projectIdeas?.length > 0);

  return (
    <div className="resume-analysis">
      <div className="resume-analysis-header">
        <h2>Personalized Career Analysis: {targetRole}</h2>
        <button onClick={refreshAnalysis} className="refresh-button">
          Refresh Analysis
        </button>
      </div>
      
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
          <div className="skills-column matching">
            <h3>Skills Matching {targetRole}</h3>
            {analysis.skillComparison?.matching?.length > 0 ? (
              <ul className="skills-list">
                {analysis.skillComparison.matching.map((skill, index) => (
                  <li key={index} className="skill-item match">
                    <span className="skill-name">{skill.skillName}</span>
                    <span className="confidence-score">
                      {Math.round((skill.confidenceScore || 0) * 100)}% confidence
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-skills">No matching skills found</p>
            )}
          </div>
          
          <div className="skills-column missing">
            <h3>Skills to Develop</h3>
            {analysis.skillComparison?.missing?.length > 0 ? (
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
            ) : (
              <p className="no-skills">No skill gaps identified</p>
            )}
          </div>
        </div>
      )}
      
      {/* Skill Gap Summary */}
      {analysis.skillComparison?.analysis && (
        <div className="skill-gap-summary">
          <h3>Skill Gap Summary</h3>
          <p>{analysis.skillComparison.analysis}</p>
        </div>
      )}
      
      {/* Personalized Recommendations */}
      {hasRecommendations && (
        <div className="personalized-recommendations">
          <h3>Personalized Career Plan for {targetRole}</h3>
          
          {/* Learning Path */}
          {analysis.recommendations.learningPath?.length > 0 && (
            <div className="recommendation-section learning-path">
              <h4>Recommended Learning Path</h4>
              <ol className="learning-path-list">
                {analysis.recommendations.learningPath
                  .slice(0, showAllRecommendations ? undefined : 3)
                  .map((item, index) => (
                    <li key={index} className={`priority-${item.priority?.toLowerCase() || 'medium'}`}>
                      <div className="learning-item-header">
                        <span className="skill-name">{item.skillName}</span>
                        <span className="priority">{item.priority || 'Medium'} Priority</span>
                      </div>
                      <p className="rationale">{item.rationale || 'Important skill for this role'}</p>
                    </li>
                  ))}
              </ol>
              {analysis.recommendations.learningPath.length > 3 && !showAllRecommendations && (
                <button 
                  className="show-more-button"
                  onClick={() => setShowAllRecommendations(true)}
                >
                  Show All ({analysis.recommendations.learningPath.length} items)
                </button>
              )}
            </div>
          )}
          
          {/* Course Recommendations */}
          {analysis.recommendations.courseRecommendations?.length > 0 && (
            <div className="recommendation-section courses">
              <h4>Recommended Courses & Certifications</h4>
              <div className="courses-grid">
                {analysis.recommendations.courseRecommendations
                  .slice(0, showAllRecommendations ? undefined : 2)
                  .map((item, index) => (
                    <div key={index} className="course-card">
                      <h5>{item.skillName}</h5>
                      {item.courses?.length > 0 && (
                        <div className="course-list">
                          <h6>Courses:</h6>
                          <ul>
                            {item.courses.map((course, i) => (
                              <li key={i}>{course}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {item.certifications?.length > 0 && (
                        <div className="cert-list">
                          <h6>Certifications:</h6>
                          <ul>
                            {item.certifications.map((cert, i) => (
                              <li key={i}>{cert}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
              {analysis.recommendations.courseRecommendations.length > 2 && !showAllRecommendations && (
                <button 
                  className="show-more-button"
                  onClick={() => setShowAllRecommendations(true)}
                >
                  Show All Courses ({analysis.recommendations.courseRecommendations.length} items)
                </button>
              )}
            </div>
          )}
          
          {/* Project Ideas */}
          {analysis.recommendations.projectIdeas?.length > 0 && (
            <div className="recommendation-section projects">
              <h4>Recommended Projects</h4>
              <div className="projects-grid">
                {analysis.recommendations.projectIdeas
                  .slice(0, showAllRecommendations ? undefined : 2)
                  .map((project, index) => (
                    <div key={index} className="project-card">
                      <h5>{project.name}</h5>
                      <p>{project.description}</p>
                      {project.skills?.length > 0 && (
                        <div className="project-skills">
                          <span>Skills:</span>
                          <div className="skill-tags">
                            {project.skills.map((skill, i) => (
                              <span key={i} className="skill-tag">{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
              {analysis.recommendations.projectIdeas.length > 2 && !showAllRecommendations && (
                <button 
                  className="show-more-button"
                  onClick={() => setShowAllRecommendations(true)}
                >
                  Show All Projects ({analysis.recommendations.projectIdeas.length} items)
                </button>
              )}
            </div>
          )}
          
          {/* Career Advice */}
          {analysis.recommendations.careerAdvice && (
            <div className="recommendation-section career-advice">
              <h4>Career Development Advice</h4>
              <div className="advice-card">
                <p>{analysis.recommendations.careerAdvice}</p>
              </div>
            </div>
          )}
          
          {/* Interview Tips */}
          {analysis.recommendations.interviewTips && (
            <div className="recommendation-section interview-tips">
              <h4>Interview Tips</h4>
              <div className="advice-card">
                <p>{analysis.recommendations.interviewTips}</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* If no personalized recommendations */}
      {!hasRecommendations && analysis.recommendations?.error && (
        <div className="recommendations-error">
          <h3>Recommendations</h3>
          <p>{analysis.recommendations.error}</p>
          {analysis.recommendations.generalAdvice && (
            <div className="general-advice">
              <p>{analysis.recommendations.generalAdvice}</p>
            </div>
          )}
          <button onClick={refreshAnalysis} className="retry-button">
            Retry Recommendations
          </button>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalysis; 