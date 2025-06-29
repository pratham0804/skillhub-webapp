import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import './ResumeUpload.css';

const ResumeUpload = () => {
  const { currentUser, api } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [resumeData, setResumeData] = useState(null);
  const [skillComparison, setSkillComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [addingSkills, setAddingSkills] = useState(false);
  const [skillsToAdd, setSkillsToAdd] = useState([]);
  const [addSkillsSuccess, setAddSkillsSuccess] = useState(false);
  const [addedSkills, setAddedSkills] = useState([]);

  // Clear resume data on component mount to ensure fresh state
  useEffect(() => {
    // Reset all state when component mounts to prevent data persistence
    setResumeData(null);
    setSkillComparison(null);
    setFile(null);
    setFileName('');
    setError(null);
    setSuccess(false);
    setAddingSkills(false);
    setSkillsToAdd([]);
    setAddSkillsSuccess(false);
    setAddedSkills([]);
    
    const fetchResumeData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/resume/analysis');
        if (response.data && response.data.status === 'success' && response.data.data && response.data.data.resume) {
          setResumeData(response.data.data.resume);
          setError(null); // Clear any existing error messages once we have successful data
        }
      } catch (error) {
        if (error.response && error.response.status !== 404) {
          // Don't show error if resume not found (404)
          setError('Failed to fetch resume data');
        }
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchResumeData();
    }
  }, [currentUser, api]);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);
    }
  };

  // Handle resume upload
  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    // Check file type
    const validFileTypes = ['.txt', '.pdf', '.doc', '.docx'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validFileTypes.includes(fileExtension)) {
      setError('Invalid file type. Please upload a .txt, .pdf, .doc, or .docx file');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setSkillComparison(null);
      setAddSkillsSuccess(false);

      // Create form data
      const formData = new FormData();
      formData.append('resume', file);

      // Upload file with extended timeout for large files and AI processing
      const response = await api.post('/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 seconds for file upload and AI processing
      });

      if (response.data.status === 'success') {
        setResumeData(response.data.data.resume);
        if (response.data.data.skillComparison) {
          setSkillComparison(response.data.data.skillComparison);
        }
        setSuccess(true);
        setError(null); // Ensure any previous errors are cleared
        setFile(null);
        setFileName('');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      // Get more detailed error information
      let errorMessage = 'Failed to upload resume';
      
      if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
        errorMessage = 'Upload timed out. Your file may be too large or the server is busy. Please try again with a smaller file.';
      } else if (error.response) {
        const responseData = error.response.data;
        if (responseData.message) {
          errorMessage = responseData.message;
        }
        if (responseData.error) {
          errorMessage += `: ${responseData.error}`;
        }
        if (responseData.details) {
          errorMessage += ` (${responseData.details})`;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection and try again.';
      } else {
        errorMessage = `Upload error: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle skill selection for adding to profile
  const handleSkillSelect = (skill) => {
    setSkillsToAdd(prev => {
      // Check if skill is already in the list
      const isAlreadySelected = prev.some(s => s.skillName === skill.skillName);
      
      if (isAlreadySelected) {
        // Remove skill if already selected
        return prev.filter(s => s.skillName !== skill.skillName);
      } else {
        // Add skill if not selected
        return [...prev, skill];
      }
    });
  };

  // Handle adding selected missing skills to profile
  const handleAddMissingSkills = async () => {
    if (skillsToAdd.length === 0) {
      setError('Please select at least one skill to add');
      return;
    }

    try {
      setAddingSkills(true);
      setError(null);
      setAddSkillsSuccess(false);

      const response = await api.post('/resume/add-missing-skills', {
        skills: skillsToAdd
      });

      if (response.data.status === 'success') {
        setAddSkillsSuccess(true);
        setSkillsToAdd([]);
        
        // Update the skillComparison to remove added skills
        if (skillComparison) {
          const updatedMissingSkills = skillComparison.missing.filter(
            skill => !response.data.data.addedSkills.includes(skill.skillName)
          );
          
          setSkillComparison({
            ...skillComparison,
            missing: updatedMissingSkills
          });
        }
      }
    } catch (error) {
      console.error('Error adding missing skills:', error);
      setError('Failed to add skills to your profile');
    } finally {
      setAddingSkills(false);
    }
  };

  // Handle resume deletion
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your resume?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.delete('/resume');
      
      if (response.data.status === 'success') {
        setResumeData(null);
        setSuccess(false);
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      setError(error.response?.data?.message || 'Failed to delete resume');
    } finally {
      setLoading(false);
    }
  };

  // Inside the component, add a new function to handle adding a single skill
  const handleAddSingleSkill = async (skill) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Adding skill to profile:', skill);
      
      // Make sure skill object has the right format expected by backend
      const formattedSkill = {
        skillName: skill.skillName,
        confidenceScore: skill.confidenceScore || 0.8 // Provide default if missing
      };
      
      console.log('Sending skill to backend:', formattedSkill);
      
      // Prevent empty skill names
      if (!formattedSkill.skillName || formattedSkill.skillName.trim() === '') {
        setError('Cannot add skill with empty name');
        setLoading(false);
        return;
      }
      
      const response = await api.post('/resume/add-missing-skills', {
        skills: [formattedSkill]
      });

      console.log('Backend response:', response.data);

      if (response.data.status === 'success') {
        // Add skill to added skills list
        setAddedSkills(prev => [...prev, skill.skillName]);
        
        // Show a temporary success message
        setSuccess(`Added ${skill.skillName} to your profile`);
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        // Handle non-error but unsuccessful response
        setError(`Failed to add ${skill.skillName}: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error adding skill ${skill.skillName}:`, error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      setError(`Failed to add ${skill.skillName} to your profile: ${error.response?.data?.error || error.message}`);
      
      // Also try using the debug endpoint as a fallback
      try {
        console.log('Attempting debug endpoint as fallback');
        const debugUrl = `/resume/debug-add-skill?skillName=${encodeURIComponent(skill.skillName)}&userId=${encodeURIComponent(currentUser._id)}`;
        console.log('Debug URL:', debugUrl);
        
        const debugResponse = await api.get(debugUrl);
        console.log('Debug endpoint response:', debugResponse.data);
        
        if (debugResponse.data.status === 'success') {
          setAddedSkills(prev => [...prev, skill.skillName]);
          setSuccess(`Added ${skill.skillName} to your profile (via debug endpoint)`);
          
          setTimeout(() => {
            setSuccess(false);
          }, 3000);
        }
      } catch (debugError) {
        console.error('Debug endpoint also failed:', debugError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-upload-container">
      <h2>Resume Analysis</h2>
      <p>Upload your resume to extract skills and get an ATS score</p>
      
      {/* Only show error messages if they're not "Failed to fetch" errors when we already have resume data */}
      {error && (!resumeData || !error.includes('fetch resume data')) && (
        <div className="alert alert-error">{error}</div>
      )}
      {success && <div className="alert alert-success">Resume uploaded and processed successfully!</div>}
      {addSkillsSuccess && <div className="alert alert-success">Selected skills added to your profile!</div>}
      
      {/* Upload Form */}
      <form onSubmit={handleUpload} className="resume-upload-form">
        <div className="file-input-container">
          <input
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            onChange={handleFileChange}
            id="resume-file"
            disabled={loading}
          />
          <label htmlFor="resume-file" className={`file-input-label ${fileName ? 'has-file' : ''}`}>
            {fileName || 'Choose a file'}
          </label>
        </div>
        
        <button 
          type="submit" 
          className="upload-button" 
          disabled={!file || loading}
        >
          {loading ? 'Processing...' : 'Upload & Analyze'}
        </button>
      </form>

      {/* Resume Analysis Results */}
      {resumeData && (
        <div className="resume-info-container">
          <h3>Resume Analysis Results</h3>
          
          <div className="resume-info">
            <p><strong>File:</strong> {resumeData.fileName}</p>
            <p><strong>Uploaded:</strong> {new Date(resumeData.uploadDate).toLocaleDateString()}</p>
          </div>
          
          {/* If no target role is set, show message */}
          {(!currentUser || !currentUser.targetRole) && (
            <div className="no-target-role">
              <p>Please set a target role in your profile to see personalized analysis.</p>
            </div>
          )}
          
          <div className="extracted-skills">
            <h4>Extracted Skills</h4>
            <ul className="skills-list with-buttons">
              {resumeData.extractedSkills.map((skill, index) => (
                <li key={index} className="skill-item with-button">
                  <div className="skill-details">
                    <span className="skill-name">{skill.skillName}</span>
                    <span className="confidence-badge" 
                      title={`${Math.round(skill.confidenceScore * 100)}% confidence`}>
                      {Math.round(skill.confidenceScore * 100)}%
                    </span>
                  </div>
                  {addedSkills.includes(skill.skillName) ? (
                    <span className="skill-added-badge">Added ✓</span>
                  ) : (
                    <button 
                      className="add-single-skill-button"
                      onClick={() => handleAddSingleSkill(skill)}
                      disabled={loading}
                    >
                      Add to Profile
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Skill Comparison */}
          {skillComparison && (
            <div className="skill-comparison">
              <h4>Skill Gap Analysis</h4>
              
              <div className="skill-analysis">
                <p>{skillComparison.analysis}</p>
              </div>
              
              {skillComparison.matching && skillComparison.matching.length > 0 && (
                <div className="matching-skills">
                  <h5>Skills Matching Your Target Role</h5>
                  <ul className="skills-list">
                    {skillComparison.matching.map((skill, index) => (
                      <li key={index} className="skill-item matching">
                        <span className="skill-name">{skill.skillName}</span>
                        <span className="match-badge">
                          Relevant
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {skillComparison.missing && skillComparison.missing.length > 0 && (
                <div className="missing-skills">
                  <h5>Skills Missing for Your Target Role</h5>
                  <p className="missing-skills-help">
                    Select skills to add them to your profile
                  </p>
                  
                  <ul className="skills-list selectable">
                    {skillComparison.missing.map((skill, index) => (
                      <li 
                        key={index} 
                        className={`skill-item missing ${skillsToAdd.some(s => s.skillName === skill.skillName) ? 'selected' : ''}`}
                        onClick={() => handleSkillSelect(skill)}
                      >
                        <span className="skill-name">{skill.skillName}</span>
                        <span className={`importance-badge ${skill.importance.toLowerCase()}`}>
                          {skill.importance}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  {skillComparison.missing.length > 0 && (
                    <button 
                      className="add-skills-button"
                      onClick={handleAddMissingSkills}
                      disabled={skillsToAdd.length === 0 || addingSkills}
                    >
                      {addingSkills ? 'Adding Skills...' : `Add Selected Skills (${skillsToAdd.length})`}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          
          <button 
            onClick={handleDelete} 
            className="delete-button"
            disabled={loading}
          >
            Delete Resume
          </button>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload; 