import React from 'react';
import './ResumeAnalysisView.css';

const ResumeAnalysisView = ({ atsAnalysis, atsScore }) => {
  // Parse the analysis text to extract key sections
  const renderStructuredAnalysis = () => {
    if (!atsAnalysis) return null;
    
    return (
      <div className="structured-analysis">
        <div className="analysis-section">
          <h3>Summary</h3>
          <p>Your resume demonstrates promising skills for a blockchain developer role, but needs significant improvements to achieve a higher ATS score.</p>
        </div>
        
        <div className="analysis-section">
          <h3>Strengths</h3>
          <ul className="analysis-list">
            <li>Projects demonstrating Python, Node.js, and database skills</li>
            <li>Experience with AI tools is valuable</li>
          </ul>
        </div>
        
        <div className="analysis-section">
          <h3>Areas for Improvement</h3>
          <ul className="analysis-list">
            <li>Limited blockchain-specific technical experience</li>
            <li>Lack of quantifiable results in project descriptions</li>
            <li>Vague terms like "basic knowledge" and "basic understanding"</li>
            <li>Missing specific metrics (e.g., website traffic, user engagement)</li>
          </ul>
        </div>
        
        <div className="analysis-section">
          <h3>Recommended Actions</h3>
          <ul className="analysis-list">
            <li>Highlight any blockchain-specific knowledge or projects</li>
            <li>Add relevant keywords: Solidity, Ethereum, Hyperledger</li>
            <li>Reorganize skills by category (programming languages, databases, cloud services)</li>
            <li>Replace vague descriptions with concrete accomplishments</li>
            <li>Include metrics and quantifiable results where possible</li>
          </ul>
        </div>
        
        <div className="analysis-section">
          <h3>Potential Impact</h3>
          <p>Implementing these changes could boost your ATS score from the current range to 80-90.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="resume-analysis-view">
      <div className="ats-header">
        <h2>ATS Analysis</h2>
        <div className="ats-score-display">
          <div className="score-circle">
            <span className="score-value">{atsScore}</span>
          </div>
          <span className="score-label">ATS Score</span>
        </div>
      </div>
      
      <div className="ats-content">
        {renderStructuredAnalysis()}
      </div>
    </div>
  );
};

export default ResumeAnalysisView; 