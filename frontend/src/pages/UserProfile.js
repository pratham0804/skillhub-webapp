import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './UserProfile.css';

const UserProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFirstTime = location.state?.isFirstTime;
  const [user, setUser] = useState({
    username: '',
    email: '',
    targetRole: '',
    existingSkills: [],
    profilePicture: '',
    bio: '',
    location: '',
    website: '',
    linkedIn: '',
    github: '',
    twitter: '',
    experience: '',
    careerGoals: '',
    availability: 'Available',
    preferredWorkType: 'Full-time',
    salaryRange: '',
    profileVisibility: 'Public',
    emailNotifications: true,
    skillUpdateNotifications: true,
    marketingEmails: false
  });
  
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({});
  const [newSkill, setNewSkill] = useState({
    skillName: '',
    proficiency: 'Beginner',
    category: 'Technical'
  });

  // Available options
  const proficiencyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const skillCategories = ['Technical', 'Soft Skills', 'Tools', 'Frameworks', 'Languages', 'Methodologies'];
  const experienceLevels = ['Entry Level', '1-2 years', '3-5 years', '5-10 years', '10+ years'];
  const workTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Remote Only', 'Hybrid'];
  const availabilityOptions = ['Available', 'Open to Opportunities', 'Not Looking', 'Busy'];

  // Sample achievements data (in real app, this would come from backend)
  const [achievements, setAchievements] = useState([
    { id: 1, title: 'Skills Master', description: 'Added 10+ skills to profile', icon: '🏆', unlocked: true },
    { id: 2, title: 'Goal Setter', description: 'Set career goals', icon: '🎯', unlocked: true },
    { id: 3, title: 'Community Contributor', description: 'Contributed to skill database', icon: '🤝', unlocked: false },
    { id: 4, title: 'Resume Optimizer', description: 'Uploaded and analyzed resume', icon: '📄', unlocked: false }
  ]);

  // Profile Tabs Configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { 
      id: 'skills', 
      label: 'Skills', 
      icon: '🚀',
      extraContent: (
        <Link to="/resume-builder" className="resume-upload-btn">
          <span className="icon">📄</span>
          Upload Resume
        </Link>
      )
    },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' }
  ];

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.status === 'success') {
          const userData = response.data.data.user;
          const mergedUser = { ...user, ...userData };
          setUser(mergedUser);
          setFormData(mergedUser);
          
          // If it's not first time and profile is incomplete, show warning
          if (!isFirstTime && !checkProfileCompletion(mergedUser)) {
            setError('Please complete your profile to access all features.');
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load profile. Please try again later.');
        
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate, isFirstTime]);

  const checkProfileCompletion = (userData) => {
    const requiredFields = ['username', 'targetRole', 'location', 'experience', 'bio'];
    return requiredFields.every(field => userData[field] && userData[field].trim() !== '');
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle new skill input changes
  const handleSkillInputChange = (e) => {
    const { name, value } = e.target;
    setNewSkill(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle existing skill changes
  const handleSkillChange = (index, field, value) => {
    const updatedSkills = [...formData.existingSkills];
    updatedSkills[index] = {
      ...updatedSkills[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      existingSkills: updatedSkills
    }));
  };

  // Add a new skill
  const handleAddSkill = () => {
    if (!newSkill.skillName.trim()) return;
    
    const skillExists = formData.existingSkills.some(
      skill => skill.skillName.toLowerCase() === newSkill.skillName.toLowerCase()
    );
    
    if (skillExists) {
      setError('This skill is already in your list.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      existingSkills: [
        ...prev.existingSkills,
        {
          skillName: newSkill.skillName,
          proficiency: newSkill.proficiency,
          category: newSkill.category,
          status: 'Not Started',
          notes: '',
          dateAdded: new Date().toISOString()
        }
      ]
    }));

    setNewSkill({
      skillName: '',
      proficiency: 'Beginner',
      category: 'Technical'
    });
    
    setError(null);
  };

  // Remove a skill
  const handleRemoveSkill = (index) => {
    const updatedSkills = [...formData.existingSkills];
    updatedSkills.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      existingSkills: updatedSkills
    }));
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // In a real app, you'd upload to a service like AWS S3
    // For now, we'll use a placeholder URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({
        ...prev,
        profilePicture: event.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  // Submit profile changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.put('/api/users/profile', formData, {
          headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setUser(response.data.data.user);
        setSuccess(true);
        setEditMode(false);
        
        // If profile is now complete and it was first time, redirect to home
        if (isFirstTime && checkProfileCompletion(response.data.data.user)) {
          navigate('/');
        }
        
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
      
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setFormData(user);
    setEditMode(false);
    setError(null);
  };

  // Get skill stats
  const getSkillStats = () => {
    const skills = user.existingSkills || [];
    return {
      total: skills.length,
      expert: skills.filter(s => s.proficiency === 'Expert').length,
      advanced: skills.filter(s => s.proficiency === 'Advanced').length,
      intermediate: skills.filter(s => s.proficiency === 'Intermediate').length,
      beginner: skills.filter(s => s.proficiency === 'Beginner').length
    };
  };

  // Group skills by category
  const getSkillsByCategory = () => {
    const skills = user.existingSkills || [];
    return skills.reduce((acc, skill) => {
      const category = skill.category || 'Technical';
      if (!acc[category]) acc[category] = [];
      acc[category].push(skill);
      return acc;
    }, {});
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  const skillStats = getSkillStats();
  const skillsByCategory = getSkillsByCategory();

  return (
    <div className="enhanced-profile-container">
      {isFirstTime && (
        <div className="welcome-banner">
          <h2>Welcome to SkillHub!</h2>
          <p>Please complete your profile to get started. This information helps us personalize your experience.</p>
        </div>
      )}
      
      {/* Profile Header */}
      <div className="profile-header-enhanced">
        <div className="profile-banner">
          <div className="profile-picture-container">
            {editMode ? (
              <div className="profile-picture-upload">
                <img 
                  src={formData.profilePicture || user?.googleUser?.imageUrl || '/default-avatar.png'} 
                  alt="Profile" 
                  className="profile-picture"
                />
              </div>
            ) : (
              <img 
                src={user?.profilePicture || user?.googleUser?.imageUrl || '/default-avatar.png'} 
                alt="Profile" 
                className="profile-picture"
              />
            )}
          </div>
          
          <div className="profile-header-info">
            <div className="profile-name-section">
              <h1>{user.username}</h1>
              <p className="profile-role">{user.targetRole || 'Tech Professional'}</p>
              <p className="profile-location">
                <span className="icon">📍</span>
                {user.location || 'Location not set'}
              </p>
            </div>
            
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-number">{skillStats.total}</span>
                <span className="stat-label">Skills</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{skillStats.expert + skillStats.advanced}</span>
                <span className="stat-label">Advanced+</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{achievements.filter(a => a.unlocked).length}</span>
                <span className="stat-label">Achievements</span>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            {!editMode ? (
          <button 
                className="edit-profile-btn primary"
            onClick={() => setEditMode(true)}
          >
                <span className="icon">✏️</span>
            Edit Profile
          </button>
            ) : (
              <div className="edit-actions">
                <button onClick={handleSubmit} className="save-btn">
                  <span className="icon">💾</span>
                  Save Changes
                </button>
                <button onClick={handleCancel} className="cancel-btn">
                  <span className="icon">❌</span>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Social Links */}
        {!editMode && (user.website || user.linkedIn || user.github || user.twitter) && (
          <div className="social-links">
            {user.website && (
              <a href={user.website} target="_blank" rel="noopener noreferrer" className="social-link">
                <span className="icon">🌐</span>
                Website
              </a>
            )}
            {user.linkedIn && (
              <a href={user.linkedIn} target="_blank" rel="noopener noreferrer" className="social-link">
                <span className="icon">💼</span>
                LinkedIn
              </a>
            )}
            {user.github && (
              <a href={user.github} target="_blank" rel="noopener noreferrer" className="social-link">
                <span className="icon">🐙</span>
                GitHub
              </a>
            )}
            {user.twitter && (
              <a href={user.twitter} target="_blank" rel="noopener noreferrer" className="social-link">
                <span className="icon">🐦</span>
                Twitter
              </a>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      {error && <div className="error-message">
        <span>⚠️</span>
        {error}
      </div>}
      {success && <div className="success-message">
        <span>✅</span>
        Profile updated successfully!
      </div>}

      {/* Profile Navigation */}
      <div className="profile-navigation-wrapper">
        <div className="profile-tabs">
          <div className="tab-wrapper">
            <button 
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span className="icon">👤</span>
              Overview
            </button>
          </div>

          <div className="tab-wrapper">
            <button 
              className={`tab ${activeTab === 'skills' ? 'active' : ''}`}
              onClick={() => setActiveTab('skills')}
            >
              <span className="icon">🚀</span>
              Skills
            </button>
            {activeTab === 'skills' && (
              <Link to="/resume-builder" className="resume-upload-btn">
                <span className="icon">📄</span>
                Upload Resume
              </Link>
            )}
          </div>

          <div className="tab-wrapper">
            <button 
              className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              <span className="icon">⚙️</span>
              Preferences
            </button>
          </div>

          <div className="tab-wrapper">
            <button 
              className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => setActiveTab('achievements')}
            >
              <span className="icon">🏆</span>
              Achievements
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {editMode ? (
              <form onSubmit={handleSubmit} className="profile-edit-form">
                <div className="form-sections">
                  <div className="form-section">
                    <h3>Personal Information</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Username</label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          disabled
                        />
                </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled
                        />
                </div>
                      <div className="form-group">
                        <label>Location</label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., San Francisco, CA"
                        />
                </div>
                      <div className="form-group">
                        <label>Target Role</label>
                        <input
                          type="text"
                          name="targetRole"
                          value={formData.targetRole || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., Full Stack Developer"
                        />
              </div>
            </div>

                    <div className="form-group">
                      <label>Bio</label>
                      <textarea
                        name="bio"
                        value={formData.bio || ''}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself, your experience, and career aspirations..."
                        rows="4"
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Social Links</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Website</label>
                        <input
                          type="url"
                          name="website"
                          value={formData.website || ''}
                          onChange={handleInputChange}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                      <div className="form-group">
                        <label>LinkedIn</label>
                        <input
                          type="url"
                          name="linkedIn"
                          value={formData.linkedIn || ''}
                          onChange={handleInputChange}
                          placeholder="https://linkedin.com/in/username"
                        />
                        </div>
                      <div className="form-group">
                        <label>GitHub</label>
                        <input
                          type="url"
                          name="github"
                          value={formData.github || ''}
                          onChange={handleInputChange}
                          placeholder="https://github.com/username"
                        />
                          </div>
                      <div className="form-group">
                        <label>Twitter</label>
                        <input
                          type="url"
                          name="twitter"
                          value={formData.twitter || ''}
                          onChange={handleInputChange}
                          placeholder="https://twitter.com/username"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Career Information</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Experience Level</label>
                        <select
                          name="experience"
                          value={formData.experience || ''}
                          onChange={handleInputChange}
                        >
                          <option value="">Select experience level</option>
                          {experienceLevels.map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
          </div>
              <div className="form-group">
                        <label>Preferred Work Type</label>
                        <select
                          name="preferredWorkType"
                          value={formData.preferredWorkType || ''}
                          onChange={handleInputChange}
                        >
                          {workTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
              </div>
              <div className="form-group">
                        <label>Availability</label>
                        <select
                          name="availability"
                          value={formData.availability || ''}
                          onChange={handleInputChange}
                        >
                          {availabilityOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
              </div>
              <div className="form-group">
                        <label>Salary Range</label>
                <input
                  type="text"
                          name="salaryRange"
                          value={formData.salaryRange || ''}
                  onChange={handleInputChange}
                          placeholder="e.g., $80k - $120k"
                />
              </div>
            </div>

                    <div className="form-group">
                      <label>Career Goals</label>
                      <textarea
                        name="careerGoals"
                        value={formData.careerGoals || ''}
                        onChange={handleInputChange}
                        placeholder="Describe your short and long-term career goals..."
                        rows="3"
                      />
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="profile-overview">
                <div className="overview-sections">
                  <div className="overview-section">
                    <h3>About</h3>
                    <p className="bio">{user.bio || 'No bio available. Add one to tell others about yourself!'}</p>
                  </div>

                  <div className="overview-section">
                    <h3>Career Information</h3>
                    <div className="career-info-grid">
                      <div className="info-item">
                        <span className="label">Experience</span>
                        <span className="value">{user.experience || 'Not specified'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Work Type</span>
                        <span className="value">{user.preferredWorkType || 'Full-time'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Salary Range</span>
                        <span className="value">{user.salaryRange || 'Not specified'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Availability</span>
                        <span className="value">{user.availability || 'Available'}</span>
                      </div>
                    </div>
                  </div>

                  {user.careerGoals && (
                    <div className="overview-section">
                      <h3>Career Goals</h3>
                      <p>{user.careerGoals}</p>
                    </div>
                  )}

                  <div className="overview-section">
                    <h3>Skill Overview</h3>
                    <div className="skill-overview-stats">
                      <div className="skill-stat">
                        <span className="stat-number">{skillStats.expert}</span>
                        <span className="stat-label">Expert</span>
                        <div className="stat-bar">
                          <div 
                            className="stat-fill expert" 
                            style={{width: `${(skillStats.expert / skillStats.total) * 100}%`}}
                          ></div>
                        </div>
                      </div>
                      <div className="skill-stat">
                        <span className="stat-number">{skillStats.advanced}</span>
                        <span className="stat-label">Advanced</span>
                        <div className="stat-bar">
                          <div 
                            className="stat-fill advanced" 
                            style={{width: `${(skillStats.advanced / skillStats.total) * 100}%`}}
                          ></div>
                        </div>
                      </div>
                      <div className="skill-stat">
                        <span className="stat-number">{skillStats.intermediate}</span>
                        <span className="stat-label">Intermediate</span>
                        <div className="stat-bar">
                          <div 
                            className="stat-fill intermediate" 
                            style={{width: `${(skillStats.intermediate / skillStats.total) * 100}%`}}
                          ></div>
                        </div>
                      </div>
                      <div className="skill-stat">
                        <span className="stat-number">{skillStats.beginner}</span>
                        <span className="stat-label">Beginner</span>
                        <div className="stat-bar">
                          <div 
                            className="stat-fill beginner" 
                            style={{width: `${(skillStats.beginner / skillStats.total) * 100}%`}}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="skills-tab">
            {editMode ? (
              <div className="skills-edit-mode">
              {/* Existing Skills */}
                <div className="skills-section">
                  <h3>Your Skills</h3>
              {formData.existingSkills && formData.existingSkills.length > 0 ? (
                <div className="skills-edit-list">
                  {formData.existingSkills.map((skill, index) => (
                    <div className="skill-edit-card" key={index}>
                      <div className="skill-edit-header">
                                <h4>{skill.skillName}</h4>
                        <button 
                          type="button" 
                          className="remove-skill-btn"
                          onClick={() => handleRemoveSkill(index)}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="skill-edit-details">
                        <div className="form-group">
                                  <label>Proficiency</label>
                          <select
                            value={skill.proficiency}
                            onChange={(e) => handleSkillChange(index, 'proficiency', e.target.value)}
                          >
                            {proficiencyLevels.map(level => (
                              <option key={level} value={level}>{level}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                                  <label>Category</label>
                                  <select
                                    value={skill.category || 'Technical'}
                                    onChange={(e) => handleSkillChange(index, 'category', e.target.value)}
                                  >
                                    {skillCategories.map(category => (
                                      <option key={category} value={category}>{category}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="form-group">
                                  <label>Status</label>
                          <select
                            value={skill.status}
                            onChange={(e) => handleSkillChange(index, 'status', e.target.value)}
                          >
                            <option value="Not Started">Not Started</option>
                                    <option value="Learning">Learning</option>
                                    <option value="Practicing">Practicing</option>
                                    <option value="Proficient">Proficient</option>
                                    <option value="Mastered">Mastered</option>
                          </select>
                        </div>
                                <div className="form-group full-width">
                                  <label>Notes</label>
                          <textarea
                            value={skill.notes || ''}
                            onChange={(e) => handleSkillChange(index, 'notes', e.target.value)}
                                    placeholder="Add notes about your experience, projects, or certifications..."
                                  />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                    <p className="no-skills">No skills added yet.</p>
              )}
              
                  {/* Add New Skill Section with Resume Upload */}
              <div className="add-skill-section">
                    <div className="add-skill-header">
                      <h4>Add New Skill</h4>
                      <div className="resume-upload-section">
                        <div className="resume-upload-info">
                          <h5>Quick Skill Import</h5>
                          <p>Upload your resume to automatically extract and add your skills</p>
                        </div>
                        <Link to="/resume-builder" className="resume-upload-btn">
                          <span className="icon">📄</span>
                          Upload Resume
                        </Link>
                      </div>
                    </div>
                <div className="add-skill-form">
                  <div className="form-group">
                            <label>Skill Name</label>
                    <input
                      type="text"
                      name="skillName"
                      value={newSkill.skillName}
                      onChange={handleSkillInputChange}
                              placeholder="e.g., React, Python, Project Management"
                    />
                  </div>
                  <div className="form-group">
                            <label>Proficiency</label>
                    <select
                      name="proficiency"
                      value={newSkill.proficiency}
                      onChange={handleSkillInputChange}
                    >
                      {proficiencyLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                          <div className="form-group">
                            <label>Category</label>
                            <select
                              name="category"
                              value={newSkill.category}
                              onChange={handleSkillInputChange}
                            >
                              {skillCategories.map(category => (
                                <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    type="button" 
                    className="add-skill-btn"
                    onClick={handleAddSkill}
                  >
                    Add Skill
                  </button>
                </div>
              </div>
            </div>
              </div>
            ) : (
              <div className="skills-view-mode">
                {Object.keys(skillsByCategory).length > 0 ? (
                  Object.entries(skillsByCategory).map(([category, skills]) => (
                    <div key={category} className="skill-category">
                      <h3 className="category-title">
                        <span className="category-icon">
                          {category === 'Technical' && '💻'}
                          {category === 'Soft Skills' && '🤝'}
                          {category === 'Tools' && '🔧'}
                          {category === 'Frameworks' && '🏗️'}
                          {category === 'Languages' && '🗣️'}
                          {category === 'Methodologies' && '📋'}
                        </span>
                        {category}
                        <span className="skill-count">({skills.length})</span>
                      </h3>
                      <div className="skills-grid">
                        {skills.map((skill, index) => (
                          <div key={index} className="skill-card-enhanced">
                            <div className="skill-header">
                              <h4>{skill.skillName}</h4>
                              <span className={`proficiency-badge ${skill.proficiency.toLowerCase()}`}>
                                {skill.proficiency}
                              </span>
                            </div>
                            <div className="skill-progress">
                              <div className="progress-bar">
                                <div 
                                  className={`progress-fill ${skill.proficiency.toLowerCase()}`}
                                  style={{
                                    width: `${
                                      skill.proficiency === 'Beginner' ? '25%' :
                                      skill.proficiency === 'Intermediate' ? '50%' :
                                      skill.proficiency === 'Advanced' ? '75%' : '100%'
                                    }`
                                  }}
                                />
                              </div>
                            </div>
                            <div className="skill-details">
                              <p className="skill-status">
                                <span className="status-icon">
                                  {skill.status === 'Mastered' && '🏆'}
                                  {skill.status === 'Proficient' && '✅'}
                                  {skill.status === 'Practicing' && '🎯'}
                                  {skill.status === 'Learning' && '📚'}
                                  {skill.status === 'Not Started' && '⭕'}
                                </span>
                                {skill.status}
                              </p>
                              {skill.notes && (
                                <p className="skill-notes">{skill.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-skills-placeholder">
                    <div className="placeholder-icon">🚀</div>
                    <h3>No skills added yet</h3>
                    <p>Start building your skill profile by uploading your resume or adding skills manually.</p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                      <Link to="/resume-builder" className="resume-upload-btn">
                        <span className="icon">📄</span>
                        Upload Resume
                      </Link>
              <button 
                        className="add-first-skill-btn"
                        onClick={() => setEditMode(true)}
              >
                        Add Manually
              </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="preferences-tab">
            {editMode ? (
              <div className="preferences-edit">
                <div className="preferences-sections">
                  <div className="preference-section">
                    <h3>Privacy Settings</h3>
                    <div className="preference-group">
                      <label>Profile Visibility</label>
                      <select
                        name="profileVisibility"
                        value={formData.profileVisibility || 'Public'}
                        onChange={handleInputChange}
                      >
                        <option value="Public">Public - Anyone can view</option>
                        <option value="Community">Community - Only SkillHub members</option>
                        <option value="Private">Private - Only me</option>
                      </select>
                    </div>
                  </div>

                  <div className="preference-section">
                    <h3>Notification Preferences</h3>
                    <div className="preference-checkboxes">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="emailNotifications"
                          checked={formData.emailNotifications || false}
                          onChange={handleInputChange}
                        />
                        <span className="checkmark"></span>
                        Email notifications for profile activity
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="skillUpdateNotifications"
                          checked={formData.skillUpdateNotifications || false}
                          onChange={handleInputChange}
                        />
                        <span className="checkmark"></span>
                        Notifications for skill trend updates
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="marketingEmails"
                          checked={formData.marketingEmails || false}
                          onChange={handleInputChange}
                        />
                        <span className="checkmark"></span>
                        Marketing emails and newsletters
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="preferences-view">
                <div className="preference-section">
                  <h3>Privacy Settings</h3>
                  <div className="preference-item">
                    <span className="preference-label">Profile Visibility:</span>
                    <span className="preference-value">
                      <span className="visibility-icon">
                        {user.profileVisibility === 'Public' && '🌍'}
                        {user.profileVisibility === 'Community' && '👥'}
                        {user.profileVisibility === 'Private' && '🔒'}
                      </span>
                      {user.profileVisibility || 'Public'}
                    </span>
                  </div>
                </div>

                <div className="preference-section">
                  <h3>Notification Preferences</h3>
                  <div className="notification-preferences">
                    <div className="preference-item">
                      <span className="preference-label">Email Notifications:</span>
                      <span className={`preference-toggle ${user.emailNotifications ? 'enabled' : 'disabled'}`}>
                        {user.emailNotifications ? '✅ Enabled' : '❌ Disabled'}
                      </span>
                    </div>
                    <div className="preference-item">
                      <span className="preference-label">Skill Updates:</span>
                      <span className={`preference-toggle ${user.skillUpdateNotifications ? 'enabled' : 'disabled'}`}>
                        {user.skillUpdateNotifications ? '✅ Enabled' : '❌ Disabled'}
                      </span>
                    </div>
                    <div className="preference-item">
                      <span className="preference-label">Marketing Emails:</span>
                      <span className={`preference-toggle ${user.marketingEmails ? 'enabled' : 'disabled'}`}>
                        {user.marketingEmails ? '✅ Enabled' : '❌ Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="achievements-tab">
            <div className="achievements-header">
              <h3>Your Achievements</h3>
              <p>Track your progress and unlock new achievements as you grow your skills!</p>
            </div>
            
            <div className="achievements-grid">
              {achievements.map(achievement => (
                <div 
                  key={achievement.id} 
                  className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                >
                  <div className="achievement-icon">
                    {achievement.unlocked ? achievement.icon : '🔒'}
                  </div>
                  <div className="achievement-content">
                    <h4>{achievement.title}</h4>
                    <p>{achievement.description}</p>
                    {achievement.unlocked && (
                      <span className="achievement-date">
                        Unlocked recently
                      </span>
                    )}
                  </div>
                  {achievement.unlocked && (
                    <div className="achievement-badge">
                      <span>✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="achievements-stats">
              <div className="progress-section">
                <h4>Achievement Progress</h4>
                <div className="progress-bar-container">
                  <div className="progress-bar large">
                    <div 
                      className="progress-fill"
                      style={{
                        width: `${(achievements.filter(a => a.unlocked).length / achievements.length) * 100}%`
                      }}
                    />
                  </div>
                  <span className="progress-text">
                    {achievements.filter(a => a.unlocked).length} / {achievements.length} unlocked
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {!checkProfileCompletion(user) && (
        <div className="error-message">
          <span>⚠️</span>
          Please complete your profile to access all features.
        </div>
      )}
    </div>
  );
};

export default UserProfile; 