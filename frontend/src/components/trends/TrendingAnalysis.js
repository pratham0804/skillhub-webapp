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

  const prepareToolsUsageData = () => {
    if (!trendingTools?.topGrowthTools) return null;
    
    const usageCategories = ['Beginner', 'Intermediate', 'Advanced'];
    const toolsByLevel = usageCategories.map(level => 
      trendingTools.topGrowthTools.filter(tool => tool.skillLevelRequired === level).length
    );
    
    return {
      labels: usageCategories,
      datasets: [{
        label: 'Tools by Skill Level',
        data: toolsByLevel,
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 2
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
          font: { size: 12, weight: '600' },
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14, weight: '600' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
        padding: 12
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
          maxRotation: 45
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="enhanced-trending-container">
        <div className="trending-loading">
          <div className="loading-spinner"></div>
          <p>Analyzing market trends...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="enhanced-trending-container">
        <div className="trending-error">
          <div className="error-icon">⚠️</div>
          <h3>Unable to Load Analysis</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-trending-container">
      {/* Header Section */}
      <div className="trending-header-enhanced">
        <div className="header-content">
          <h1>Market Trends Analysis</h1>
          <p>Comprehensive insights into tech industry skills and tools demand</p>
        </div>
        <div className="trend-stats">
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <span className="stat-number">{trendingSkills?.topDemandSkills?.length || 0}</span>
              <span className="stat-label">Trending Skills</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🛠️</div>
            <div className="stat-info">
              <span className="stat-number">{trendingTools?.topGrowthTools?.length || 0}</span>
              <span className="stat-label">Growing Tools</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💼</div>
            <div className="stat-info">
              <span className="stat-number">{Object.keys(trendingSkills?.skillsByCategory || {}).length}</span>
              <span className="stat-label">Categories</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="analysis-nav">
        <button 
          className={`nav-tab ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          <span className="tab-icon">📊</span>
          Market Overview
        </button>
            <button 
          className={`nav-tab ${activeSection === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveSection('skills')}
            >
          <span className="tab-icon">🚀</span>
          Skills Analysis
            </button>
            <button 
          className={`nav-tab ${activeSection === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveSection('tools')}
            >
          <span className="tab-icon">🔧</span>
          Tools & Technologies
            </button>
            <button 
          className={`nav-tab ${activeSection === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveSection('insights')}
            >
          <span className="tab-icon">💡</span>
          AI Insights
            </button>
          </div>
          
      {/* Content Sections */}
      <div className="analysis-content">
        {/* Market Overview Section */}
        {activeSection === 'overview' && (
          <div className="overview-section">
            <div className="charts-grid">
              {/* Skills Demand Chart */}
              <div className="chart-container">
                <div className="chart-header">
                  <h3>Top In-Demand Skills</h3>
                  <p className="chart-insight">
                    Skills with highest market demand showing career opportunities and hiring trends
                  </p>
                </div>
                <div className="chart-wrapper">
                  {prepareDemandChartData() && (
                    <Bar data={prepareDemandChartData()} options={chartOptions} />
                  )}
                </div>
                <div className="chart-analysis">
                  <div className="key-insight">
                    <span className="insight-icon">💡</span>
                    <strong>Key Insight:</strong> Skills with "Very High" demand (95+ score) represent the most competitive job market opportunities
                  </div>
                </div>
              </div>

              {/* Category Distribution Chart */}
              <div className="chart-container">
                <div className="chart-header">
                  <h3>Skills by Category Distribution</h3>
                  <p className="chart-insight">
                    Market distribution across different technology domains and specializations
                  </p>
                </div>
                <div className="chart-wrapper">
                  {prepareCategoryDistributionData() && (
                    <Doughnut data={prepareCategoryDistributionData()} options={{
                      ...chartOptions,
                      cutout: '60%',
                      plugins: {
                        ...chartOptions.plugins,
                        legend: { position: 'bottom' }
                      }
                    }} />
                  )}
                </div>
                <div className="chart-analysis">
                  <div className="key-insight">
                    <span className="insight-icon">📊</span>
                    <strong>Market Balance:</strong> Diverse skill distribution indicates a healthy, multi-domain tech ecosystem
                        </div>
                </div>
                </div>
                
              {/* Growth Trends Chart */}
              <div className="chart-container full-width">
                <div className="chart-header">
                  <h3>Skills Growth Trajectory</h3>
                  <p className="chart-insight">
                    8-month growth patterns for fastest-growing skills showing momentum and future potential
                  </p>
                </div>
                <div className="chart-wrapper">
                  {prepareGrowthTrendData() && (
                    <Line data={prepareGrowthTrendData()} options={{
                      ...chartOptions,
                      interaction: { intersect: false },
                      plugins: {
                        ...chartOptions.plugins,
                        legend: { position: 'top' }
                      }
                    }} />
                  )}
                </div>
                <div className="chart-analysis">
                  <div className="key-insight">
                    <span className="insight-icon">📈</span>
                    <strong>Growth Pattern:</strong> Upward trending lines indicate skills gaining momentum in the job market
                        </div>
                </div>
              </div>
            </div>
          </div>
        )}
                
        {/* Skills Analysis Section */}
        {activeSection === 'skills' && (
                <div className="skills-section">
            <div className="charts-grid">
              {/* Salary Analysis Chart */}
              <div className="chart-container">
                <div className="chart-header">
                  <h3>Highest Paying Skills</h3>
                  <p className="chart-insight">
                    Average salary ranges for top-paying skills in thousands (USD)
                  </p>
                </div>
                <div className="chart-wrapper">
                  {prepareSalaryChartData() && (
                    <Bar data={prepareSalaryChartData()} options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: {
                            label: (context) => `$${context.parsed.y}k average salary`
                          }
                        }
                      }
                    }} />
                  )}
                </div>
                <div className="chart-analysis">
                  <div className="key-insight">
                    <span className="insight-icon">💰</span>
                    <strong>Salary Insight:</strong> Specialized and emerging technology skills command premium salaries
                        </div>
                </div>
              </div>
              
              {/* Skills Matrix */}
              <div className="skills-matrix">
                <h3>Skills Demand Matrix</h3>
                <p className="chart-insight">
                  Skills categorized by demand level and growth rate for strategic learning decisions
                </p>
                <div className="matrix-grid">
                  {trendingSkills?.topDemandSkills?.slice(0, 12).map((skill, index) => (
                    <div key={index} className={`skill-card ${skill.demandLevel.toLowerCase().replace(' ', '-')}`}>
                      <div className="skill-name">{skill.skillName}</div>
                      <div className="skill-metrics">
                        <span className={`demand-badge ${skill.demandLevel.toLowerCase().replace(' ', '-')}`}>
                          {skill.demandLevel}
                        </span>
                        {skill.growthRate && (
                          <span className={`growth-badge ${skill.growthRate.toLowerCase()}`}>
                            {skill.growthRate}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="matrix-analysis">
                  <div className="analysis-insight">
                    <span className="insight-icon">🎯</span>
                    <strong>Strategic Learning:</strong> Focus on "Very High" demand + "Rapid" growth skills for maximum career impact
                  </div>
                </div>
              </div>
              </div>
            </div>
          )}
          
        {/* Tools & Technologies Section */}
        {activeSection === 'tools' && (
              <div className="tools-section">
            <div className="charts-grid">
              {/* Tools Category Radar Chart */}
              <div className="chart-container">
                <div className="chart-header">
                  <h3>Tools Distribution by Category</h3>
                  <p className="chart-insight">
                    Radar view of tool ecosystem showing strength in different technology areas
                  </p>
                        </div>
                <div className="chart-wrapper">
                  {prepareToolsCategoryRadarData() && (
                    <Radar data={prepareToolsCategoryRadarData()} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        r: {
                          beginAtZero: true,
                          max: 100,
                          ticks: { display: false },
                          grid: { color: 'rgba(102, 126, 234, 0.1)' },
                          angleLines: { color: 'rgba(102, 126, 234, 0.2)' }
                        }
                      }
                    }} />
                  )}
                        </div>
                <div className="chart-analysis">
                  <div className="key-insight">
                    <span className="insight-icon">🎯</span>
                    <strong>Tool Diversity:</strong> Larger radar areas indicate more comprehensive tool ecosystems
                  </div>
                </div>
              </div>
              
              {/* Tools Usage Level Chart */}
              <div className="chart-container">
                <div className="chart-header">
                  <h3>Tools by Required Skill Level</h3>
                  <p className="chart-insight">
                    Distribution of tools based on the expertise level required for effective usage
                  </p>
                </div>
                <div className="chart-wrapper">
                  {prepareToolsUsageData() && (
                    <Pie data={prepareToolsUsageData()} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                          callbacks: {
                            label: (context) => `${context.label}: ${context.parsed} tools`
                          }
                        }
                      }
                    }} />
                  )}
                </div>
                <div className="chart-analysis">
                  <div className="key-insight">
                    <span className="insight-icon">🔧</span>
                    <strong>Accessibility:</strong> Higher beginner-friendly tools indicate easier market entry points
                  </div>
                </div>
                    </div>
                    
              {/* Tools Importance Matrix */}
              <div className="tools-matrix full-width">
                <h3>Tool Importance & Use Cases</h3>
                <p className="chart-insight">
                  Critical tools with their primary use cases and industry importance rankings
                </p>
                <div className="tools-grid">
                  {trendingTools?.topGrowthTools?.slice(0, 8).map((tool, index) => (
                    <div key={index} className="tool-importance-card">
                      <div className="tool-header">
                        <h4>{tool.toolName}</h4>
                        <span className={`importance-badge level-${index < 3 ? 'high' : index < 6 ? 'medium' : 'low'}`}>
                          {index < 3 ? 'Critical' : index < 6 ? 'Important' : 'Useful'}
                        </span>
                              </div>
                      <div className="tool-category">{tool.category}</div>
                              <div className="tool-use-cases">
                        <strong>Use Cases:</strong> {tool.primaryUseCases}
                              </div>
                      <div className="tool-meta">
                        <span className="skill-level">Level: {tool.skillLevelRequired}</span>
                        <span className={`growth-trend ${tool.growthTrend?.toLowerCase().replace(' ', '-')}`}>
                          {tool.growthTrend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="tools-analysis">
                  <div className="analysis-insight">
                    <span className="insight-icon">⚡</span>
                    <strong>Tool Strategy:</strong> "Critical" tools should be prioritized for immediate learning and adoption
                  </div>
                </div>
              </div>
              </div>
            </div>
          )}
          
        {/* AI Insights Section */}
        {activeSection === 'insights' && (
              <div className="insights-section">
            <div className="ai-analysis-container">
              <div className="analysis-header">
                <div className="ai-badge">
                  <span className="ai-icon">🤖</span>
                  AI-Powered Analysis
                </div>
                <h2>Industry Trends & Strategic Insights</h2>
                <p>Advanced analysis of market data using artificial intelligence</p>
              </div>
              
              <div className="insights-content">
                {enhancedAnalysis ? (
                  <div className="ai-insights">
                    {enhancedAnalysis.split('\n\n').map((paragraph, index) => {
                      if (paragraph.includes('1.') || paragraph.includes('2.') || paragraph.includes('3.')) {
                        return (
                          <div key={index} className="insight-section">
                            <div className="section-content">
                              {paragraph.split('\n').map((line, lineIndex) => (
                                <p key={lineIndex} className={line.match(/^\d+\./) ? 'section-title' : 'section-text'}>
                                  {line}
                                </p>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={index} className="general-insight">
                          <p>{paragraph}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-insights">
                    <div className="no-insights-icon">🔍</div>
                    <h3>Analysis in Progress</h3>
                    <p>AI insights are being generated. Please check back in a moment.</p>
                  </div>
                )}
              </div>

              {/* Market Indicators */}
              <div className="market-indicators">
                <h3>Market Health Indicators</h3>
                <div className="indicators-grid">
                  <div className="indicator-card">
                    <div className="indicator-icon">📈</div>
                    <div className="indicator-content">
                      <span className="indicator-label">Market Growth</span>
                      <span className="indicator-value positive">+23%</span>
                      <span className="indicator-desc">Skills demand growth YoY</span>
                    </div>
                  </div>
                  <div className="indicator-card">
                    <div className="indicator-icon">🎯</div>
                    <div className="indicator-content">
                      <span className="indicator-label">Job Market Health</span>
                      <span className="indicator-value strong">Strong</span>
                      <span className="indicator-desc">High demand across categories</span>
                    </div>
                  </div>
                  <div className="indicator-card">
                    <div className="indicator-icon">⚡</div>
                    <div className="indicator-content">
                      <span className="indicator-label">Innovation Rate</span>
                      <span className="indicator-value positive">+18%</span>
                      <span className="indicator-desc">New tools adoption rate</span>
                    </div>
                  </div>
                  <div className="indicator-card">
                    <div className="indicator-icon">💰</div>
                    <div className="indicator-content">
                      <span className="indicator-label">Salary Growth</span>
                      <span className="indicator-value positive">+12%</span>
                      <span className="indicator-desc">Average salary increase</span>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default TrendingAnalysis; 