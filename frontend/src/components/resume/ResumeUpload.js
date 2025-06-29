import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import './ResumeUpload.css';

const ResumeUpload = () => {
  const { currentUser, api } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [resumeData, setResumeData] = useState(null);

  // Clear resume data on component mount to ensure fresh state
  useEffect(() => {
    // Reset all state when component mounts
    setResumeData(null);
    setFile(null);
    setFileName('');
    setError(null);
    setSuccess(false);
    
    const fetchResumeData = async () => {
      try {
        const response = await api.get('/resume');
        if (response.data && response.data.status === 'success' && response.data.data && response.data.data.resume) {
          setResumeData(response.data.data.resume);
        }
      } catch (error) {
        // Don't show error if resume not found (404)
        if (error.response?.status !== 404) {
          setError('Failed to fetch resume data');
        }
      }
    };

    if (currentUser && api) {
      fetchResumeData();
    }
  }, [currentUser, api]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  // Handle resume upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await api.post('/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.status === 'success') {
        setResumeData(response.data.data.resume);
        setSuccess(true);
        setFile(null);
        setFileName('');
        
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      
      let errorMessage = 'Failed to upload resume';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 413) {
        errorMessage = 'File too large. Please upload a smaller file (max 5MB).';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle resume deletion
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your resume?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.delete('/resume');
      setResumeData(null);
      setSuccess('Resume deleted successfully');
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error deleting resume:', error);
      setError('Failed to delete resume');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-upload-container">
      <h2>Resume Upload</h2>
      <p>Upload your resume file for storage and basic management</p>
      
      {error && (
        <div className="alert alert-error">{error}</div>
      )}
      {success && <div className="alert alert-success">{typeof success === 'string' ? success : 'Resume uploaded successfully!'}</div>}
      
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
          {loading ? 'Uploading...' : 'Upload Resume'}
        </button>
      </form>

      {/* Resume Info */}
      {resumeData && (
        <div className="resume-info-container">
          <h3>Current Resume</h3>
          
          <div className="resume-info">
            <p><strong>File:</strong> {resumeData.fileName}</p>
            <p><strong>Uploaded:</strong> {new Date(resumeData.uploadDate).toLocaleDateString()}</p>
            <p><strong>Size:</strong> {resumeData.fileSize ? `${(resumeData.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</p>
          </div>
          
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