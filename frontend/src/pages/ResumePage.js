import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import ResumeUpload from '../components/resume/ResumeUpload';
import './ResumePage.css';

const ResumePage = () => {
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set loading to false when component mounts
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="resume-loading">
        <div className="spinner"></div>
        <p>Loading resume data...</p>
      </div>
    );
  }

  return (
    <div className="resume-page-container">
      <div className="resume-header">
        <h1>Resume Analysis</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="resume-content">
        {/* Resume Upload Section */}
        <ResumeUpload />

        {/* ResumeAnalysis component is now handled within ResumeUpload component itself */}
        {/* Only show additional analysis if needed in the future */}
      </div>
    </div>
  );
};

export default ResumePage; 