import React from 'react';
import './CareerGuidanceView.css';

const CareerGuidanceView = ({ careerGuidance, targetRole }) => {
  return (
    <div className="career-guidance-view">
      <div className="guidance-header">
        <h2>AI Career Guidance</h2>
        <div className="target-role-badge">
          {targetRole || 'Data Scientist'}
        </div>
      </div>
      
      <div className="guidance-content">
        <div className="guidance-intro">
          <p>Here's a practical path to becoming a {targetRole || 'Data Scientist'} based on your current skills.</p>
        </div>
        
        <div className="guidance-section">
          <h3>Skill Profile Assessment</h3>
          <div className="guidance-body">
            <p>
              You have a decent technical foundation, but need a strong data science focus. 
              Your existing Python, SQL, Data Structures, and Algorithms knowledge are valuable building blocks.
            </p>
          </div>
        </div>
        
        <div className="guidance-section">
          <h3>Recommended Learning Path</h3>
          <div className="guidance-body">
            <div className="learning-path-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Strengthen Core Data Science Skills</h4>
                <ul className="guidance-list">
                  <li>Complete a structured Python for Data Science course</li>
                  <li>Master SQL for data querying and manipulation</li>
                  <li>Learn data visualization with libraries like Matplotlib and Seaborn</li>
                </ul>
              </div>
            </div>
            
            <div className="learning-path-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Develop Statistical Knowledge</h4>
                <ul className="guidance-list">
                  <li>Study probability and statistics fundamentals</li>
                  <li>Learn hypothesis testing and experimental design</li>
                  <li>Practice with real-world statistical analysis projects</li>
                </ul>
              </div>
            </div>
            
            <div className="learning-path-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Master Machine Learning</h4>
                <ul className="guidance-list">
                  <li>Learn supervised and unsupervised learning algorithms</li>
                  <li>Study feature engineering and model evaluation</li>
                  <li>Complete projects using scikit-learn and other ML libraries</li>
                </ul>
              </div>
            </div>
            
            <div className="learning-path-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Build Specialized Skills</h4>
                <ul className="guidance-list">
                  <li>Explore deep learning with TensorFlow or PyTorch</li>
                  <li>Learn natural language processing or computer vision</li>
                  <li>Study big data technologies like Spark and Hadoop</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="guidance-section">
          <h3>Project Recommendations</h3>
          <div className="guidance-body">
            <ul className="guidance-list">
              <li>Build a data cleaning and analysis pipeline for a real-world dataset</li>
              <li>Create a machine learning model to solve a business problem</li>
              <li>Develop a dashboard for data visualization using tools like Tableau or Power BI</li>
              <li>Contribute to open-source data science projects</li>
            </ul>
          </div>
        </div>
        
        <div className="guidance-section">
          <h3>Career Development Tips</h3>
          <div className="guidance-body">
            <ul className="guidance-list">
              <li>Create a strong GitHub portfolio showcasing your data science projects</li>
              <li>Network with data professionals through LinkedIn and industry events</li>
              <li>Consider obtaining relevant certifications (AWS ML, Azure Data Scientist, etc.)</li>
              <li>Practice explaining technical concepts in simple terms for interviews</li>
            </ul>
          </div>
        </div>
        
        <div className="guidance-section">
          <h3>Estimated Timeline</h3>
          <div className="guidance-body">
            <p>With focused study and practice:</p>
            <ul className="guidance-list">
              <li><strong>3-6 months:</strong> Core data science fundamentals</li>
              <li><strong>6-9 months:</strong> Statistical analysis and basic machine learning</li>
              <li><strong>9-12 months:</strong> Advanced topics and specialization</li>
              <li><strong>12+ months:</strong> Industry-ready with a strong portfolio</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerGuidanceView; 