import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SkillResources from './SkillResources';
import './SkillGapAnalysis.css';
import CareerGuidanceView from '../career/CareerGuidanceView';

// Resource Modal Component
const ResourceModal = ({ isOpen, skillName, onClose }) => {
  if (!isOpen || !skillName) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Learning Resources for {skillName}</h3>
          <button onClick={onClose} className="modal-close-btn">×</button>
        </div>
        <div className="modal-body">
          <SkillResources 
            skillName={skillName} 
            isVisible={true}
            onToggle={onClose}
          />
        </div>
      </div>
    </div>
  );
};

const SkillGapAnalysis = () => {
  const { api, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [userSkills, setUserSkills] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [recommendedSkills, setRecommendedSkills] = useState([]);
  const [careerAnalysis] = useState(null);
  
  // New state for UI enhancements
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [skillsPerPage] = useState(6);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [selectedSkillForModal, setSelectedSkillForModal] = useState(null);
  
  // Ref to track if component is visible
  const isComponentVisible = useRef(true);
  const lastRefreshTime = useRef(Date.now());
  
  // Check authentication on mount and when currentUser changes
  useEffect(() => {
    setIsAuthenticated(currentUser !== null);
  }, [currentUser]);
  
  // Refresh user profile data
  const refreshUserProfile = async () => {
    if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const response = await api.get('/users/profile');
      if (response.data.status === 'success') {
        const userData = response.data.data.user;
        setUserSkills(userData.existingSkills || []);
        setTargetRole(userData.targetRole || '');
        console.log('✅ Refreshed user profile:', {
          skillsCount: userData.existingSkills?.length || 0,
          targetRole: userData.targetRole
        });
        }
      } catch (error) {
      console.error('Error refreshing profile:', error);
      setError('Failed to refresh profile data');
      } finally {
          setLoading(false);
    }
  };

  // Fetch recommended skills for the target role
  const fetchRecommendedSkills = useCallback(async (role = targetRole) => {
    if (!role) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching recommended skills for role: ${role}`);
      
      // Use the enhanced API endpoint that asks Gemini for more skills
      const response = await api.get(`/users/public/required-skills/${encodeURIComponent(role)}`);
      
      if (response.data.status === 'success') {
        const skills = response.data.data.skills || [];
        console.log(`Received ${skills.length} recommended skills:`, skills);
        setRecommendedSkills(skills);
      } else {
        throw new Error(response.data.message || 'Failed to fetch recommended skills');
      }
    } catch (error) {
      console.error('Error fetching recommended skills:', error);
      setError(`Failed to load recommended skills: ${error.response?.data?.message || error.message}`);
      setRecommendedSkills([]);
    } finally {
      setLoading(false);
    }
  }, [api, targetRole]);

  // Auto-refresh functionality - listen for visibility changes and profile updates
  useEffect(() => {
    let refreshInterval;
    
    // Function to check if we should refresh data
    const checkAndRefresh = async () => {
      if (isAuthenticated && isComponentVisible.current) {
        const now = Date.now();
        // Refresh if it's been more than 10 seconds since last refresh
        if (now - lastRefreshTime.current > 10000) {
          console.log('🔄 Auto-refreshing skill gap data...');
          await refreshUserProfile();
          lastRefreshTime.current = now;
        }
      }
    };

    // Listen for visibility changes (when user switches tabs/windows)
    const handleVisibilityChange = () => {
      isComponentVisible.current = !document.hidden;
      if (!document.hidden && isAuthenticated) {
        console.log('👀 Page became visible, refreshing data...');
        checkAndRefresh();
      }
    };

    // Listen for focus events (when user returns to window)
    const handleFocus = () => {
      if (isAuthenticated) {
        console.log('🎯 Window gained focus, checking for updates...');
        checkAndRefresh();
      }
    };

    // Listen for localStorage changes (when profile is updated in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'profileUpdated' && isAuthenticated) {
        console.log('📱 Profile updated in another tab, refreshing...');
        checkAndRefresh();
        // Remove the flag
        localStorage.removeItem('profileUpdated');
      }
    };

    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);
    
    // Set up interval to check periodically (every 30 seconds)
    refreshInterval = setInterval(checkAndRefresh, 30000);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isAuthenticated]);

  // Load user data when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      console.log('🔍 Loading user data:', {
        targetRole: currentUser.targetRole,
        existingSkillsCount: currentUser.existingSkills?.length || 0,
        existingSkills: currentUser.existingSkills
      });
      
      setTargetRole(currentUser.targetRole || '');
      setUserSkills(currentUser.existingSkills || []);
      
      // If user has a target role, fetch recommended skills
      if (currentUser.targetRole) {
        fetchRecommendedSkills(currentUser.targetRole);
      }
      
      // Update last refresh time
      lastRefreshTime.current = Date.now();
    } else {
      console.log('❌ User not authenticated or no current user');
    }
  }, [isAuthenticated, currentUser, fetchRecommendedSkills]);

  // Handle target role form submission
  const handleTargetRoleChange = async (e) => {
    e.preventDefault();
    if (!targetRole.trim()) {
      setError('Please enter a target role');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Update user's target role in database
      const response = await api.put('/users/profile', {
        targetRole: targetRole.trim()
      });
      
      if (response.data.status === 'success') {
        // Fetch recommended skills for the new role
        await fetchRecommendedSkills(targetRole.trim());
      }
    } catch (error) {
      console.error('Error updating target role:', error);
      setError('Failed to update target role');
    } finally {
      setLoading(false);
    }
  };

  // Add skill to user's skill list
  const handleAddSkill = async (skillName) => {
    try {
      setLoading(true);
      setError(null);
      
      const skillData = {
        skillName,
        proficiency: 'Beginner',
        category: 'Technical',
        status: 'Not Started'
      };
      
      console.log('Adding skill:', skillData);
      const response = await api.patch('/users/skills', skillData);
      
      if (response.data.status === 'success') {
        // Update local user skills
        setUserSkills(prev => [...prev, skillData]);
        
        // Show success message
        console.log(`✅ Successfully added skill: ${skillName}`);
        
        // Also refetch user profile to ensure consistency
        if (currentUser) {
          try {
            const profileResponse = await api.get('/users/profile');
            if (profileResponse.data.status === 'success') {
              setUserSkills(profileResponse.data.data.user.existingSkills || []);
            }
          } catch (profileError) {
            console.error('Error refreshing profile:', profileError);
          }
        }
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      setError(`Failed to add skill "${skillName}": ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle showing skill resources in modal
  const handleShowSkillResources = (skillName) => {
    console.log(`Opening resource modal for skill: ${skillName}`);
    setSelectedSkillForModal(skillName);
    setResourceModalOpen(true);
  };

  // Close resource modal
  const closeResourceModal = () => {
    setResourceModalOpen(false);
    setSelectedSkillForModal(null);
  };
  
  // Run analysis
  const handleRunAnalysis = async () => {
    if (!isAuthenticated) {
      setError('Please log in to run the analysis.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setAnalysis(null);
      
      if (!targetRole) {
        setError('Please set a target role before running the analysis.');
        setLoading(false);
        return;
      }
      
      // First, fetch the required skills for the role
      const response = await api.get(`/users/public/required-skills/${encodeURIComponent(targetRole)}`);
      
      if (response.data.status === 'success') {
        // Then get the skill gap analysis
        const gapResponse = await api.get('/users/analysis/skill-gap');
        
        if (gapResponse.data.status === 'success') {
          // Ensure all expected properties exist in the data
          const data = gapResponse.data.data;
          const requiredSkills = response.data.data.skills || [];
          
          const processedAnalysis = {
            targetRole: data.targetRole || targetRole,
            userSkills: data.userSkills || [],
            missingSkills: data.missingSkills || [],
            skillsToImprove: data.skillsToImprove || [],
            requiredSkills: requiredSkills,
            recommendations: data.recommendations || [],
            enhancedAnalysis: data.enhancedAnalysis || ''
          };
          setAnalysis(processedAnalysis);
          console.log('Analysis data:', processedAnalysis);
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
        setError(error.response?.data?.message || 'Failed to run analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Get the skills to display (with pagination)
  const getDisplayedSkills = () => {
    if (showAllSkills) {
      return userSkills;
    }
    return userSkills.slice(0, skillsPerPage);
  };



  // Note: fetchCareerGuidance and createPlaceholderCareerGuidance functions removed as they were unused
  
  // Display a login message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="skill-gap-analysis">
        <h2>Skill Gap Analysis</h2>
        <div className="auth-error">
          <p>{error || 'Please log in to access the Skill Gap Analysis feature.'}</p>
          <a href="/login" className="login-button">Log In</a>
        </div>
      </div>
    );
  }
  
  return (
    <div className="skill-gap-analysis">
      <h2>Skill Gap Analysis</h2>
      
      {/* Target Role Section */}
      <div className="target-role-section">
        <h3>Your Target Role</h3>
        <form onSubmit={handleTargetRoleChange}>
          <div className="form-group">
            <label htmlFor="targetRole">What role are you targeting?</label>
            <input
              type="text"
              id="targetRole"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Frontend Developer, Data Scientist"
              className="target-role-input"
            />
          </div>
          <button type="submit" disabled={loading} className="primary-button">
            {loading ? 'Updating...' : 'Update Target Role'}
          </button>
        </form>
      </div>
      
      {/* Required Skills for Role Section */}
      {recommendedSkills.length > 0 && (
        <div className="required-skills-overview">
          <h3>Skills Required for {targetRole}</h3>
          <p className="section-description">
            These key skills are recommended by AI for your target role:
            <span className="ai-badge">
              <img 
                src="https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/smart_toy/default/24px.svg"
                alt="AI"
                width="16"
                height="16"
              />
            </span>
          </p>
          
          {/* Two-column grid for suggested skills */}
          <div className="suggested-skills-grid">
            {recommendedSkills.map((skill, index) => (
              <div key={index} className={`skill-card-half ${skill.importance?.toLowerCase() || ''}`}>
                <div className="skill-header">
                  <h4>{skill.skillName}</h4>
                  {skill.importance && (
                    <span className={`importance-badge ${skill.importance?.toLowerCase()}`}>
                      {skill.importance}
                    </span>
                  )}
                </div>
                <p className="skill-description">{skill.description || ''}</p>
                {skill.learningTimeMonths && (
                  <div className="learning-time">
                    <span className="time-icon">⏱️</span>
                    <span>~{skill.learningTimeMonths} {skill.learningTimeMonths === 1 ? 'month' : 'months'} to learn</span>
                  </div>
                )}
                
                <div className="skill-actions">
                  <button 
                    onClick={() => handleAddSkill(skill.skillName)}
                    className="primary-button"
                  >
                    Add to My Skills
                  </button>
                  <button 
                    onClick={() => handleShowSkillResources(skill.skillName)}
                    className="secondary-button"
                  >
                    📚 Resources
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Your Skills Section with Pagination */}
      <div className="your-skills-section">
        <div className="skills-header">
        <h3>Your Skills</h3>
          <button 
            onClick={refreshUserProfile}
            disabled={loading}
            className="refresh-btn"
            title="Refresh skills data"
          >
            {loading ? '⟳' : '🔄'} Refresh
          </button>
        </div>
        {userSkills.length > 0 ? (
          <>
          <ul className="skills-list">
              {getDisplayedSkills().map((skill, index) => (
              <li key={index} className="skill-item">
                <div className="skill-name">{skill.skillName}</div>
                <div className="skill-proficiency">
                  <span className={`badge badge-${skill.proficiency.toLowerCase()}`}>
                    {skill.proficiency}
                  </span>
                </div>
                <div className="skill-status">
                  <span className={`status status-${skill.status.toLowerCase().replace(' ', '-')}`}>
                    {skill.status}
                  </span>
                </div>
                  <div className="skill-actions">
                    <button 
                      onClick={() => handleShowSkillResources(skill.skillName)}
                      className="resources-btn"
                    >
                      📚 Resources
                    </button>
                  </div>
              </li>
            ))}
          </ul>
            
            {/* Pagination Controls */}
            {userSkills.length > skillsPerPage && (
              <div className="skills-pagination">
                <button 
                  onClick={() => setShowAllSkills(!showAllSkills)}
                  className="skills-pagination-button"
                >
                  {showAllSkills ? 'Show Less' : `Show More (${userSkills.length - skillsPerPage} more)`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-skills-yet">
            <p>No skills added yet. {targetRole ? `Here are recommended skills for ${targetRole}:` : 'Set your target role to see recommended skills.'}</p>
            
            {targetRole ? (
              <div className="recommended-skills">
                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading recommended skills...</p>
                  </div>
                ) : error ? (
                  <div className="error-message">
                    <p>{error}</p>
                    <button onClick={() => fetchRecommendedSkills()} className="retry-btn">
                      Retry
                    </button>
                  </div>
                ) : recommendedSkills.length > 0 ? (
                  <div className="suggested-skills-grid">
                    {recommendedSkills.map((skill, index) => {
                      // Case insensitive check if this skill is already in the user's profile
                      const alreadyHasSkill = userSkills.some(
                        userSkill => userSkill.skillName.toLowerCase() === skill.skillName.toLowerCase()
                      );
                      
                      return (
                        <div key={index} className={`skill-card-half ${skill.importance?.toLowerCase() || ''}`}>
                          <div className="skill-header">
                            <h5>{skill.skillName}</h5>
                            {skill.importance && (
                              <span className={`importance-badge ${skill.importance?.toLowerCase()}`}>
                                {skill.importance}
                              </span>
                            )}
                          </div>
                          <p className="skill-description">{skill.description || ''}</p>
                          {skill.learningTimeMonths && (
                            <div className="learning-time">
                              <span className="time-icon">⏱️</span>
                              <span>~{skill.learningTimeMonths} {skill.learningTimeMonths === 1 ? 'month' : 'months'} to learn</span>
                            </div>
                          )}
                          
                          <div className="skill-actions">
                            {!alreadyHasSkill ? (
                              <>
                                <button 
                                  onClick={() => handleAddSkill(skill.skillName)}
                                  disabled={loading}
                                  className="add-skill-btn"
                                >
                                  {loading ? 'Adding...' : 'Add to My Skills'}
                                </button>
                                <button 
                                  onClick={() => handleShowSkillResources(skill.skillName)}
                                  className="resources-btn"
                                >
                                  📚 Resources
                                </button>
                              </>
                            ) : (
                              <div className="already-skilled">
                                <span className="check-icon">✓</span> You're already skilled in this!
                                <button 
                                  onClick={() => handleShowSkillResources(skill.skillName)}
                                  className="resources-btn small"
                                >
                                  📚 Resources
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="no-recommendations">No specific skills found for this role. Try running a full analysis.</p>
                )}
              </div>
            ) : (
              <p className="hint">Set your target role above to see recommended skills.</p>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <div className="error-message-card">
          <div className="error-icon">❌</div>
          <div className="error-content">
            <h4>Analysis Failed</h4>
            <p>{error}</p>
            <button onClick={handleRunAnalysis} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Call to Action for Analysis */}
      {!analysis && (
        <div className="analysis-cta">
          <div className="cta-content">
            <h3>Ready to analyze your skill gap?</h3>
            <p className="cta-description">
              Run a comprehensive analysis to identify missing skills, skills to improve, and personalized recommendations.
            </p>
            <button 
              onClick={handleRunAnalysis} 
              disabled={loading || !targetRole}
              className="cta-button"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Running Analysis...
                </>
              ) : (
                'Run Skill Gap Analysis'
              )}
            </button>
            {!targetRole && <p className="hint">Set your target role above to run the analysis.</p>}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="analysis-results">
          <h3>Skill Gap Analysis Results for {analysis.targetRole}</h3>
          
          {/* Missing Skills */}
          <div className="analysis-section">
            <h4>Skills to Acquire</h4>
            <p className="section-description">These are the skills you need to learn for your target role.</p>
            
            {analysis.missingSkills.length === 0 ? (
              <p>No critical missing skills identified - great job!</p>
            ) : (
              <div className="suggested-skills-grid">
                {analysis.missingSkills.map((skill, index) => {
                  // Case insensitive check if this skill is already in the user's profile
                  const alreadyHasSkill = userSkills.some(
                    userSkill => userSkill.skillName.toLowerCase() === skill.skillName.toLowerCase()
                  );
                  
                  return (
                    <div key={index} className={`skill-card-half ${skill.importance?.toLowerCase() || ''}`}>
                      <div className="skill-header">
                        <h5>{skill.skillName}</h5>
                        {skill.importance && (
                          <span className={`importance-badge ${skill.importance?.toLowerCase()}`}>
                            {skill.importance}
                          </span>
                        )}
                      </div>
                      <p className="skill-description">{skill.description}</p>
                      {skill.learningTimeMonths && (
                        <div className="learning-time">
                          <span className="time-icon">⏱️</span>
                          <span>~{skill.learningTimeMonths} {skill.learningTimeMonths === 1 ? 'month' : 'months'} to learn</span>
                        </div>
                      )}
                      
                      <div className="skill-actions">
                        {!alreadyHasSkill ? (
                          <>
                            <button 
                              onClick={() => handleAddSkill(skill.skillName)}
                              disabled={loading}
                              className="add-skill-btn"
                            >
                              {loading ? 'Adding...' : 'Add to My Skills'}
                            </button>
                            <button 
                              onClick={() => handleShowSkillResources(skill.skillName)}
                              className="resources-btn"
                            >
                              📚 Resources
                            </button>
                          </>
                        ) : (
                          <div className="already-skilled">
                            <span className="check-icon">✓</span> You're already skilled in this!
                            <button 
                              onClick={() => handleShowSkillResources(skill.skillName)}
                              className="resources-btn small"
                            >
                              📚 Resources
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Skills to Improve */}
          <div className="analysis-section">
            <h4>Skills to Improve</h4>
            <p className="section-description">You already have these skills, but should improve them for your target role.</p>
            
            {analysis.skillsToImprove.length === 0 ? (
              <p>No skills identified for improvement.</p>
            ) : (
              <div className="suggested-skills-grid">
                {analysis.skillsToImprove.map((skill, index) => {
                  const userSkill = analysis.userSkills.find(
                    us => us.skillName.toLowerCase() === skill.skillName.toLowerCase()
                  );
                  return (
                    <div key={index} className={`skill-card-half improvement ${skill.importance?.toLowerCase() || ''}`}>
                      <div className="skill-header">
                        <h5>{skill.skillName}</h5>
                        {skill.importance && (
                          <span className={`importance-badge ${skill.importance?.toLowerCase()}`}>
                            {skill.importance}
                          </span>
                        )}
                      </div>
                      <p className="skill-description">{skill.description}</p>
                      <div className="proficiency-info">
                        <div className="current-level">
                          <span className="level-label">Current:</span> 
                          <span className="level-value">{userSkill?.proficiency || 'Beginner'}</span>
                        </div>
                        <div className="target-level">
                          <span className="level-label">Target:</span> 
                          <span className="level-value">Advanced</span>
                        </div>
                      </div>
                      
                      <div className="skill-actions">
                        <button 
                          onClick={() => handleShowSkillResources(skill.skillName)}
                          className="resources-btn"
                        >
                          📚 Learning Resources
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* AI Enhanced Analysis */}
          {analysis.enhancedAnalysis && (
            <div className="enhanced-analysis">
              <h4>AI Career Guidance</h4>
              <div className="analysis-content">
                {analysis.enhancedAnalysis.split('\n\n').map((paragraph, i) => {
                  // Check if paragraph is a heading
                  if (paragraph.startsWith('##')) {
                    return <h3 key={i}>{paragraph.replace('##', '').trim()}</h3>;
                  } else if (paragraph.startsWith('#')) {
                    return <h4 key={i}>{paragraph.replace('#', '').trim()}</h4>;
                  } else if (paragraph.startsWith('###')) {
                    return <h5 key={i}>{paragraph.replace('###', '').trim()}</h5>;
                  } else if (paragraph.includes('**')) {
                    // Handle bold text with markdown ** syntax
                    return (
                      <p key={i} dangerouslySetInnerHTML={{
                        __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }} />
                    );
                  } else {
                    return <p key={i}>{paragraph}</p>;
                  }
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {careerAnalysis && (
        <div className="gap-analysis-section">
          <CareerGuidanceView 
            careerGuidance={careerAnalysis} 
            targetRole={targetRole}
          />
        </div>
      )}

      {/* Resource Modal */}
      <ResourceModal 
        isOpen={resourceModalOpen}
        skillName={selectedSkillForModal}
        onClose={closeResourceModal}
      />
    </div>
  );
};

export default SkillGapAnalysis; 