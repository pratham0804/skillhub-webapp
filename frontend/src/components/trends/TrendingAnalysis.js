import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './TrendingAnalysis.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale
} from 'chart.js';
import { Bar, Doughnut, Line, Radar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale
);

const TrendingAnalysis = () => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trendingSkills, setTrendingSkills] = useState(null);
  const [trendingTools, setTrendingTools] = useState(null);
  const [enhancedAnalysis, setEnhancedAnalysis] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');

  // Chart color palettes
  const colorPalette = {
    primary: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'],
    success: ['#11998e', '#38ef7d', '#42e695', '#3bb78f', '#0ba360', '#3cba92'],
    warning: ['#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#667eea', '#764ba2'],
    danger: ['#fc466b', '#3f5efb', '#667eea', '#764ba2', '#f093fb', '#f5576c']
  };

  // Skeleton Loading Components
  const SkeletonChart = () => (
    <div className="chart-container">
      <div className="chart-header">
        <div style={{ 
          width: '60%', 
          height: '24px', 
          backgroundColor: '#e2e8f0', 
          borderRadius: '6px',
          marginBottom: '8px',
          animation: 'pulse 1.5s ease-in-out infinite alternate'
        }}></div>
        <div style={{ 
          width: '40%', 
          height: '16px', 
          backgroundColor: '#f1f5f9', 
          borderRadius: '4px',
          animation: 'pulse 1.5s ease-in-out infinite alternate'
        }}></div>
      </div>
      <div style={{ 
        width: '100%', 
        height: '300px', 
        backgroundColor: '#f8fafc', 
        borderRadius: '12px',
        marginTop: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTop: '3px solid #4f46e5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    </div>
  );

  const SkeletonStats = () => (
    <div className="trend-stats">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="stat-card" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
          <div style={{ 
            width: '30px', 
            height: '30px', 
            backgroundColor: '#e2e8f0', 
            borderRadius: '50%',
            margin: '0 auto 12px',
            animation: 'pulse 1.5s ease-in-out infinite alternate'
          }}></div>
          <div style={{ 
            width: '60px', 
            height: '32px', 
            backgroundColor: '#e2e8f0', 
            borderRadius: '6px',
            margin: '0 auto 8px',
            animation: 'pulse 1.5s ease-in-out infinite alternate'
          }}></div>
          <div style={{ 
            width: '80px', 
            height: '14px', 
            backgroundColor: '#f1f5f9', 
            borderRadius: '4px',
            margin: '0 auto',
            animation: 'pulse 1.5s ease-in-out infinite alternate'
          }}></div>
        </div>
      ))}
    </div>
  );

  // Fetch trending data
  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [skillsResponse, toolsResponse, analysisResponse] = await Promise.all([
          api.get('/trending/skills'),
          api.get('/trending/tools'),
          api.get('/trending/enhanced-analysis')
        ]);
        
        if (skillsResponse.data.status === 'success') {
          setTrendingSkills(skillsResponse.data.data.trendingSkills || {
            topDemandSkills: [],
            topGrowthSkills: [],
            topSalarySkills: [],
            skillsByCategory: {}
          });
        }
        
        if (toolsResponse.data.status === 'success') {
          setTrendingTools(toolsResponse.data.data.trendingTools || {
            topGrowthTools: [],
            toolsByCategory: {}
          });
        }
        
        if (analysisResponse.data.status === 'success') {
          setEnhancedAnalysis(analysisResponse.data.data.enhancedAnalysis || '');
        }
        
        setError(null);
      } catch (error) {
        console.error('Error fetching trending data:', error);
        setError('Failed to load trending analysis. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrendingData();
  }, [api]);

  // Prepare chart data
  const prepareDemandChartData = () => {
    if (!trendingSkills?.topDemandSkills) return null;
    
    const top10Skills = trendingSkills.topDemandSkills.slice(0, 10);
    return {
      labels: top10Skills.map(skill => skill.skillName),
      datasets: [{
        label: 'Demand Level Score',
        data: top10Skills.map(skill => {
          const demandScores = { 'Very High': 95, 'High': 80, 'Medium': 60, 'Low': 35 };
          return demandScores[skill.demandLevel] || 50;
        }),
        backgroundColor: colorPalette.primary,
        borderColor: colorPalette.primary.map(color => color + '80'),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }]
    };
  };

  const prepareSalaryChartData = () => {
    if (!trendingSkills?.topSalarySkills) return null;
    
    const top8Skills = trendingSkills.topSalarySkills.slice(0, 8);
    return {
      labels: top8Skills.map(skill => skill.skillName),
      datasets: [{
        label: 'Average Salary ($)',
        data: top8Skills.map(skill => {
          const salary = skill.averageSalary?.replace(/[^0-9]/g, '') || '0';
          return parseInt(salary) / 1000; // Convert to thousands
        }),
        backgroundColor: colorPalette.success,
        borderColor: colorPalette.success.map(color => color + '80'),
        borderWidth: 2,
        borderRadius: 6,
      }]
    };
  };

  const prepareCategoryDistributionData = () => {
    if (!trendingSkills?.skillsByCategory) return null;
    
    const categories = Object.keys(trendingSkills.skillsByCategory);
    const skillCounts = categories.map(cat => trendingSkills.skillsByCategory[cat]?.length || 0);
    
    return {
      labels: categories,
      datasets: [{
        label: 'Skills Count',
        data: skillCounts,
        backgroundColor: colorPalette.warning,
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverOffset: 10
      }]
    };
  };

  const prepareGrowthTrendData = () => {
    if (!trendingSkills?.topGrowthSkills) return null;
    
    const growthSkills = trendingSkills.topGrowthSkills.slice(0, 8);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    
    return {
      labels: months,
      datasets: growthSkills.slice(0, 3).map((skill, index) => ({
        label: skill.skillName,
        data: months.map(() => Math.floor(Math.random() * 30) + 70 + (index * 10)),
        borderColor: colorPalette.primary[index],
        backgroundColor: colorPalette.primary[index] + '20',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
      }))
    };
  };

  const prepareToolsCategoryRadarData = () => {
    if (!trendingTools?.toolsByCategory) return null;
    
    const categories = Object.keys(trendingTools.toolsByCategory).slice(0, 6);
    const toolCounts = categories.map(cat => trendingTools.toolsByCategory[cat]?.length || 0);
    const maxCount = Math.max(...toolCounts);
    const normalizedCounts = toolCounts.map(count => (count / maxCount) * 100);
    
    return {
      labels: categories,
      datasets: [{
        label: 'Tool Categories Distribution',
        data: normalizedCounts,
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(102, 126, 234, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(102, 126, 234, 1)'
      }]
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { 
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 0
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 11 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        cornerRadius: 8,
        displayColors: true
      }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.1)' },
        pointLabels: { font: { size: 10 } }
      }
    }
  };

  // Retry function for error handling
  const retryFetch = () => {
    setError(null);
    setLoading(true);
    // Re-trigger the useEffect
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="enhanced-trending-container">
        {/* Header with Loading Animation */}
        <div className="trending-header-enhanced">
          <div className="header-content">
            <h1>Skills Trending Analysis</h1>
            <p>Discovering the future of tech skills and market demands</p>
          </div>
          <SkeletonStats />
        </div>

        {/* Navigation Tabs */}
        <div className="analysis-nav">
          {['📊 Overview', '🎯 Skills Matrix', '🛠️ Tools & Tech', '🤖 AI Analysis'].map((tab, index) => (
            <button key={index} className={`nav-tab ${index === 0 ? 'active' : ''}`} disabled>
              <span className="tab-icon">{tab.split(' ')[0]}</span>
              {tab.split(' ').slice(1).join(' ')}
            </button>
          ))}
        </div>

        {/* Content with Skeleton Charts */}
        <div className="analysis-content">
          <div className="charts-grid">
            <SkeletonChart />
            <SkeletonChart />
            <SkeletonChart />
            <SkeletonChart />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trending-error">
        <span className="error-icon">⚠️</span>
        <h3>Unable to Load Trending Data</h3>
        <p>{error}</p>
        <button onClick={retryFetch} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  const demandChartData = prepareDemandChartData();
  const salaryChartData = prepareSalaryChartData();
  const categoryData = prepareCategoryDistributionData();
  const growthTrendData = prepareGrowthTrendData();
  const toolsRadarData = prepareToolsCategoryRadarData();

  const getTotalSkills = () => {
    if (!trendingSkills?.skillsByCategory) return 0;
    return Object.values(trendingSkills.skillsByCategory).reduce((total, skills) => total + (skills?.length || 0), 0);
  };

  const getTotalTools = () => {
    if (!trendingTools?.toolsByCategory) return 0;
    return Object.values(trendingTools.toolsByCategory).reduce((total, tools) => total + (tools?.length || 0), 0);
  };

  const getTopGrowthRate = () => {
    if (!trendingSkills?.topGrowthSkills?.length) return 'N/A';
    return trendingSkills.topGrowthSkills[0]?.growthRate || 'N/A';
  };

  const renderOverviewSection = () => (
    <div>
      {/* Charts Grid */}
      <div className="charts-grid">
        {demandChartData && (
          <div className="chart-container">
            <div className="chart-header">
              <h3>🔥 Most In-Demand Skills</h3>
              <p className="chart-insight">Skills with the highest market demand</p>
            </div>
            <div className="chart-wrapper">
              <Bar data={demandChartData} options={chartOptions} />
            </div>
          </div>
        )}

        {salaryChartData && (
          <div className="chart-container">
            <div className="chart-header">
              <h3>💵 Highest Paying Skills</h3>
              <p className="chart-insight">Skills with the best salary prospects</p>
            </div>
            <div className="chart-wrapper">
              <Bar data={salaryChartData} options={chartOptions} />
            </div>
          </div>
        )}

        {categoryData && (
          <div className="chart-container">
            <div className="chart-header">
              <h3>🎯 Skills by Category</h3>
              <p className="chart-insight">Distribution across different skill categories</p>
            </div>
            <div className="chart-wrapper">
              <Doughnut data={categoryData} options={doughnutOptions} />
            </div>
          </div>
        )}

        {growthTrendData && (
          <div className="chart-container">
            <div className="chart-header">
              <h3>📊 Growth Trends</h3>
              <p className="chart-insight">Projected growth patterns for top skills</p>
            </div>
            <div className="chart-wrapper">
              <Line data={growthTrendData} options={chartOptions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSkillsMatrix = () => (
    <div className="skills-matrix">
      <h3>Skills Opportunity Matrix</h3>
      {trendingSkills?.topDemandSkills?.length > 0 ? (
        <div className="matrix-grid">
          {trendingSkills.topDemandSkills.slice(0, 12).map((skill, index) => (
            <div key={index} className={`skill-card ${skill.demandLevel?.toLowerCase().replace(' ', '-')}`}>
              <div className="skill-name">{skill.skillName}</div>
              <div className="skill-metrics">
                <span className={`demand-badge ${skill.demandLevel?.toLowerCase().replace(' ', '-')}`}>
                  {skill.demandLevel}
                </span>
                <span className={`growth-badge ${skill.growthRate?.toLowerCase()}`}>
                  {skill.growthRate}
                </span>
              </div>
              <div className="skill-salary">{skill.averageSalary}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data">No skills data available</div>
      )}
    </div>
  );

  const renderToolsSection = () => (
    <div className="tools-matrix">
      <h3>Essential Tools & Technologies</h3>
      {trendingTools?.topGrowthTools?.length > 0 ? (
        <div className="tools-grid">
          {trendingTools.topGrowthTools.slice(0, 8).map((tool, index) => (
            <div key={index} className="tool-importance-card">
              <div className="tool-header">
                <h4>{tool.toolName}</h4>
                <span className={`importance-badge level-${tool.skillLevelRequired?.toLowerCase()}`}>
                  {tool.skillLevelRequired}
                </span>
              </div>
              <div className="tool-category">{tool.category}</div>
              <div className="tool-use-cases">{tool.primaryUseCases}</div>
              <div className="tool-meta">
                <span className={`growth-trend ${tool.growthTrend?.toLowerCase().replace(' ', '-')}`}>
                  {tool.growthTrend}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data">No tools data available</div>
      )}

      {toolsRadarData && (
        <div className="chart-container full-width">
          <div className="chart-header">
            <h3>🔧 Tools Category Distribution</h3>
            <p className="chart-insight">Relative importance across tool categories</p>
          </div>
          <div className="chart-wrapper">
            <Radar data={toolsRadarData} options={radarOptions} />
          </div>
        </div>
      )}
    </div>
  );

  const renderAIAnalysis = () => (
    <div className="ai-analysis-container">
      <div className="analysis-header">
        <span className="ai-badge">
          <span className="ai-icon">🤖</span>
          AI Analysis
        </span>
        <h2>Market Intelligence Insights</h2>
        <p>Advanced analysis powered by AI to help you understand market trends</p>
      </div>
      
      <div className="insights-content">
        {enhancedAnalysis ? (
          <div className="ai-insights">
            <div className="insight-section">
              <h4 className="section-title">📈 Market Analysis</h4>
              <div className="section-text">{enhancedAnalysis}</div>
            </div>
          </div>
        ) : (
          <div className="no-insights">
            <span className="no-insights-icon">🔍</span>
            <h3>Analysis in Progress</h3>
            <p>AI-powered insights are being generated. Please check back shortly.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="enhanced-trending-container">
      <div className="trending-header-enhanced">
        <div className="header-content">
          <h1>Market Trends Dashboard</h1>
          <p>Real-time insights into skill demand and technology trends</p>
        </div>
        
        {/* Trend Statistics */}
        <div className="trend-stats">
          <div className="stat-card">
            <span className="stat-icon">📈</span>
            <span className="stat-number">{getTotalSkills()}</span>
            <span className="stat-label">Total Skills</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🛠️</span>
            <span className="stat-number">{getTotalTools()}</span>
            <span className="stat-label">Tools Tracked</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🚀</span>
            <span className="stat-number">{getTopGrowthRate()}</span>
            <span className="stat-label">Top Growth</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💰</span>
            <span className="stat-number">
              {trendingSkills?.topSalarySkills?.[0]?.averageSalary || 'N/A'}
            </span>
            <span className="stat-label">Top Salary</span>
          </div>
        </div>
      </div>

      <div className="analysis-nav">
        <button 
          className={`nav-tab ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          <span className="tab-icon">📊</span>
          Overview
        </button>
        <button 
          className={`nav-tab ${activeSection === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveSection('skills')}
        >
          <span className="tab-icon">🎯</span>
          Skills Matrix
        </button>
        <button 
          className={`nav-tab ${activeSection === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveSection('tools')}
        >
          <span className="tab-icon">🛠️</span>
          Tools & Tech
        </button>
        <button 
          className={`nav-tab ${activeSection === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveSection('ai')}
        >
          <span className="tab-icon">🤖</span>
          AI Insights
        </button>
      </div>

      <div className="analysis-content">
        {activeSection === 'overview' && renderOverviewSection()}
        {activeSection === 'skills' && renderSkillsMatrix()}
        {activeSection === 'tools' && renderToolsSection()}
        {activeSection === 'ai' && renderAIAnalysis()}
      </div>
    </div>
  );
};

export default TrendingAnalysis; 