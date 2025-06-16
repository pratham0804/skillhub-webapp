import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Zap, Brain, RefreshCw, Moon, Sun, Sparkles, Rocket, Activity, Award, BookOpen, Code, Database, Globe, Lightbulb, ArrowRight, ArrowLeft } from 'lucide-react';
import axios from 'axios';
// Removed DataDashboard.css - using inline Tailwind classes

// Google Sheets configuration
const GOOGLE_SHEETS_API_KEY = 'AIzaSyDoESqBRvAU1-wVrjuuA89I2zmrtUMvjeg';
const SHEET_ID = '1R9jTOqP6YdjZMURbs4LJZ8I0y5s0dZ8YhF5DXdVxl3I';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff0000', '#00ffff', '#ff00ff'];

// Custom Card Component using Tailwind
const Card = ({ className = '', children, ...props }) => (
  <div className={`rounded-lg border bg-white text-gray-900 shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ className = '', children, ...props }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ className = '', children, ...props }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ className = '', children, ...props }) => (
  <p className={`text-sm text-gray-600 ${className}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ className = '', children, ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

// Custom Badge Component using Tailwind
const Badge = ({ variant = 'default', className = '', children, ...props }) => {
  const variants = {
    default: 'bg-blue-500 text-white',
    secondary: 'bg-gray-200 text-gray-900',
    outline: 'border border-gray-300 text-gray-700',
    destructive: 'bg-red-500 text-white'
  };
  
  return (
    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

// Custom Button Component using Tailwind
const Button = ({ variant = 'default', size = 'default', className = '', children, disabled, ...props }) => {
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    ghost: 'text-gray-700 hover:bg-gray-100'
  };
  
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3',
    lg: 'h-11 px-8'
  };
  
  return (
    <button 
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const AnimatedCounter = ({ value, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      setCount(Math.floor(value * percentage));
      
      if (percentage < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{count}</span>;
};

const MarketPulse = ({ skillsData }) => {
  const [pulseIntensity, setPulseIntensity] = useState(0);

  useEffect(() => {
    if (!skillsData || skillsData.length === 0) return;
    
    const highDemandCount = skillsData.filter(s => s.demandLevel === 'Very High' || s.demandLevel === 'High').length;
    const rapidGrowthCount = skillsData.filter(s => s.growthRate === 'Rapid').length;
    const intensity = ((highDemandCount + rapidGrowthCount) / skillsData.length) * 100;
    setPulseIntensity(intensity);
  }, [skillsData]);

  return (
    <div className="flex items-center space-x-3">
      <div className={`w-4 h-4 rounded-full animate-pulse ${pulseIntensity > 60 ? 'bg-green-500' : pulseIntensity > 30 ? 'bg-yellow-500' : 'bg-red-500'}`} />
      <span className="text-sm font-medium">Market Pulse: {pulseIntensity.toFixed(1)}%</span>
    </div>
  );
};

const DataDashboard = () => {
  const [skillsData, setSkillsData] = useState([]);
  const [toolsData, setToolsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try Google Sheets API first
      const skillsResponse = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Trending%20Skill%20Data!A:K?key=${GOOGLE_SHEETS_API_KEY}`
      );
      
      const toolsResponse = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Trending%20Tool%20Data!A:K?key=${GOOGLE_SHEETS_API_KEY}`
      );

      const skillsRows = skillsResponse.data.values || [];
      if (skillsRows.length > 1) {
        const processedSkills = skillsRows.slice(1).map((row, index) => ({
          skillId: row[0] || `skill-${index}`,
          skillName: row[1] || 'Unknown Skill',
          category: row[2] || 'General',
          demandLevel: row[3] || 'Medium',
          growthRate: row[4] || 'Steady',
          averageSalary: row[5] || '$0',
          requiredExperience: row[6] || 'Entry Level',
          learningResources: row[7] || '',
          relatedSkills: row[8] || '',
          lastUpdated: row[9] || new Date().toISOString(),
          contributorId: row[10] || 'anonymous'
        }));
        setSkillsData(processedSkills);
      }

      const toolsRows = toolsResponse.data.values || [];
      if (toolsRows.length > 1) {
        const processedTools = toolsRows.slice(1).map((row, index) => ({
          toolId: row[0] || `tool-${index}`,
          toolName: row[1] || 'Unknown Tool',
          category: row[2] || 'General',
          primaryUseCases: row[3] || '',
          skillLevelRequired: row[4] || 'Beginner',
          pricingModel: row[5] || 'Free',
          integrationCapabilities: row[6] || '',
          relevantIndustries: row[7] || '',
          growthTrend: row[8] || 'Stable',
          lastUpdated: row[9] || new Date().toISOString(),
          contributorId: row[10] || 'anonymous'
        }));
        setToolsData(processedTools);
      }
    } catch (error) {
      console.error('Error fetching Google Sheets data:', error);
      
      // Fallback to mock data
      setSkillsData([
        {
          skillId: 'S001',
          skillName: 'React.js',
          category: 'Frontend Development',
          demandLevel: 'Very High',
          growthRate: 'Rapid',
          averageSalary: '$110,000',
          requiredExperience: 'Mid Level',
          learningResources: 'React Documentation',
          relatedSkills: 'JavaScript, HTML, CSS',
          lastUpdated: new Date().toISOString(),
          contributorId: 'system'
        },
        {
          skillId: 'S002',
          skillName: 'Python',
          category: 'Programming Languages',
          demandLevel: 'Very High',
          growthRate: 'Rapid',
          averageSalary: '$120,000',
          requiredExperience: 'Entry Level',
          learningResources: 'Python.org',
          relatedSkills: 'Data Science, AI/ML',
          lastUpdated: new Date().toISOString(),
          contributorId: 'system'
        },
        {
          skillId: 'S003',
          skillName: 'Data Science',
          category: 'Data',
          demandLevel: 'High',
          growthRate: 'Rapid',
          averageSalary: '$130,000',
          requiredExperience: 'Mid Level',
          learningResources: 'Coursera, Kaggle',
          relatedSkills: 'Python, R, Statistics',
          lastUpdated: new Date().toISOString(),
          contributorId: 'system'
        },
        {
          skillId: 'S004',
          skillName: 'Cloud Architecture',
          category: 'Cloud Computing',
          demandLevel: 'Very High',
          growthRate: 'Rapid',
          averageSalary: '$150,000',
          requiredExperience: 'Senior Level',
          learningResources: 'AWS, Azure, GCP',
          relatedSkills: 'DevOps, Kubernetes',
          lastUpdated: new Date().toISOString(),
          contributorId: 'system'
        },
        {
          skillId: 'S005',
          skillName: 'DevOps',
          category: 'DevOps',
          demandLevel: 'High',
          growthRate: 'Rapid',
          averageSalary: '$125,000',
          requiredExperience: 'Mid Level',
          learningResources: 'Docker, Kubernetes',
          relatedSkills: 'CI/CD, Cloud',
          lastUpdated: new Date().toISOString(),
          contributorId: 'system'
        }
      ]);

      setToolsData([
        {
          toolId: 'T001',
          toolName: 'Visual Studio Code',
          category: 'Development Tools',
          primaryUseCases: 'Code editing, debugging',
          skillLevelRequired: 'Beginner',
          pricingModel: 'Free',
          integrationCapabilities: 'Extensions, Git',
          relevantIndustries: 'Software Development',
          growthTrend: 'Rapidly Growing',
          lastUpdated: new Date().toISOString(),
          contributorId: 'system'
        },
        {
          toolId: 'T002',
          toolName: 'Docker',
          category: 'DevOps',
          primaryUseCases: 'Containerization',
          skillLevelRequired: 'Intermediate',
          pricingModel: 'Freemium',
          integrationCapabilities: 'CI/CD, Kubernetes',
          relevantIndustries: 'Software Development',
          growthTrend: 'Rapidly Growing',
          lastUpdated: new Date().toISOString(),
          contributorId: 'system'
        }
      ]);
      
      setError('Using fallback data - Google Sheets unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getSalaryData = () => {
    return skillsData
      .filter(skill => skill.averageSalary && skill.averageSalary !== '$0')
      .map(skill => ({
        name: skill.skillName,
        salary: parseInt(skill.averageSalary.replace(/[$,]/g, '')) || 0,
        category: skill.category,
        demand: skill.demandLevel
      }))
      .sort((a, b) => b.salary - a.salary)
      .slice(0, 10);
  };

  const getSkillRadarData = () => {
    const categories = ['Frontend Development', 'Backend Development', 'AI/ML', 'DevOps', 'Cloud Computing'];
    return categories.map(category => {
      const categorySkills = skillsData.filter(skill => skill.category === category);
      const avgSalary = categorySkills.reduce((acc, skill) => {
        const salary = parseInt(skill.averageSalary.replace(/[$,]/g, '')) || 0;
        return acc + salary;
      }, 0) / (categorySkills.length || 1);
      
      const highDemandCount = categorySkills.filter(skill => 
        skill.demandLevel === 'Very High' || skill.demandLevel === 'High'
      ).length;

      return {
        category: category.split(' ')[0],
        salary: Math.round(avgSalary / 1000),
        demand: highDemandCount,
        growth: categorySkills.filter(skill => skill.growthRate === 'Rapid').length
      };
    });
  };

  const getDemandData = () => {
    const demandCounts = skillsData.reduce((acc, skill) => {
      acc[skill.demandLevel] = (acc[skill.demandLevel] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(demandCounts).map(([level, count]) => ({
      name: level,
      value: count
    }));
  };

  const getCategoryData = () => {
    const categoryCounts = skillsData.reduce((acc, skill) => {
      acc[skill.category] = (acc[skill.category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(categoryCounts).map(([category, count]) => ({
      name: category,
      skills: count,
      tools: toolsData.filter(tool => tool.category === category).length
    }));
  };

  const getGrowthTrendData = () => {
    const growthCounts = skillsData.reduce((acc, skill) => {
      acc[skill.growthRate] = (acc[skill.growthRate] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(growthCounts).map(([trend, count]) => ({
      name: trend,
      value: count
    }));
  };

  const getTopTools = () => {
    return toolsData
      .filter(tool => tool.growthTrend === 'Rapidly Growing' || tool.growthTrend === 'Growing')
      .slice(0, 8);
  };

  const stats = {
    totalSkills: skillsData.length,
    totalTools: toolsData.length,
    highDemandSkills: skillsData.filter(s => s.demandLevel === 'Very High' || s.demandLevel === 'High').length,
    rapidGrowthSkills: skillsData.filter(s => s.growthRate === 'Rapid').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Loading Community Data...</h2>
          <p className="text-gray-600">Fetching latest insights from Google Sheets</p>
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg border-b backdrop-blur-sm bg-opacity-95 sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Brain className="h-10 w-10 text-blue-600 animate-pulse" />
                <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-spin" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                  SkillHub Market Intelligence
                  <Rocket className="h-6 w-6 ml-2 text-orange-500 animate-bounce" />
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Real-time market intelligence from community data</p>
                  <MarketPulse skillsData={skillsData} />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setDarkMode(!darkMode)}
                variant="outline"
                size="sm"
                className="transition-all duration-300 hover:scale-105"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button 
                onClick={fetchData} 
                disabled={loading} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Target className="h-8 w-8 mb-2 animate-bounce" />
                  <p className="text-blue-100">Total Skills</p>
                  <p className="text-3xl font-bold">
                    <AnimatedCounter value={stats.totalSkills} />
                  </p>
                </div>
                <Activity className="h-12 w-12 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Zap className="h-8 w-8 mb-2 animate-pulse" />
                  <p className="text-green-100">Total Tools</p>
                  <p className="text-3xl font-bold">
                    <AnimatedCounter value={stats.totalTools} />
                  </p>
                </div>
                <Code className="h-12 w-12 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <TrendingUp className="h-8 w-8 mb-2 animate-bounce" />
                  <p className="text-purple-100">High Demand</p>
                  <p className="text-3xl font-bold">
                    <AnimatedCounter value={stats.highDemandSkills} />
                  </p>
                </div>
                <Award className="h-12 w-12 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Brain className="h-8 w-8 mb-2 animate-pulse" />
                  <p className="text-orange-100">Rapid Growth</p>
                  <p className="text-3xl font-bold">
                    <AnimatedCounter value={stats.rapidGrowthSkills} />
                  </p>
                </div>
                <Lightbulb className="h-12 w-12 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-xl hover:shadow-2xl transition-all duration-300`}>
            <CardHeader>
              <CardTitle className={`flex items-center ${darkMode ? 'text-white' : ''}`}>
                <DollarSign className="h-5 w-5 mr-2 text-green-600 animate-pulse" />
                Highest Paying Skills
                <Sparkles className="h-4 w-4 ml-2 text-yellow-500" />
              </CardTitle>
              <CardDescription className={darkMode ? 'text-gray-300' : ''}>
                Based on average salary data from the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getSalaryData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    stroke={darkMode ? '#9ca3af' : '#6b7280'}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${value/1000}k`}
                    stroke={darkMode ? '#9ca3af' : '#6b7280'}
                  />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Salary']}
                    contentStyle={{
                      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                      border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="salary" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-xl hover:shadow-2xl transition-all duration-300`}>
            <CardHeader>
              <CardTitle className={`flex items-center ${darkMode ? 'text-white' : ''}`}>
                <Users className="h-5 w-5 mr-2 text-blue-600 animate-pulse" />
                Market Demand Distribution
              </CardTitle>
              <CardDescription className={darkMode ? 'text-gray-300' : ''}>
                Current demand levels across all skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getDemandData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getDemandData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Category Analysis */}
        <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-xl hover:shadow-2xl transition-all duration-300 mb-8`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${darkMode ? 'text-white' : ''}`}>
              <Database className="h-5 w-5 mr-2 text-purple-600" />
              Skills vs Tools by Category
              <TrendingUp className="h-4 w-4 ml-2 text-green-500 animate-bounce" />
            </CardTitle>
            <CardDescription className={darkMode ? 'text-gray-300' : ''}>
              Comparative analysis of skills and tools across different categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={getCategoryData()}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  stroke={darkMode ? '#9ca3af' : '#6b7280'}
                />
                <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip contentStyle={{
                  backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                  border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                  borderRadius: '8px'
                }} />
                <Legend />
                <Bar dataKey="skills" fill="#3b82f6" name="Skills" />
                <Bar dataKey="tools" fill="#ef4444" name="Tools" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Skills List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-xl`}>
            <CardHeader>
              <CardTitle className={darkMode ? 'text-white' : ''}>Top Skills by Demand</CardTitle>
              <CardDescription className={darkMode ? 'text-gray-300' : ''}>Most in-demand skills in the market</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {skillsData
                  .filter(skill => skill.demandLevel === 'Very High' || skill.demandLevel === 'High')
                  .slice(0, 10)
                  .map((skill, index) => (
                    <div key={skill.skillId} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{skill.skillName}</p>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{skill.category}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant={skill.demandLevel === 'Very High' ? 'default' : 'secondary'}>
                          {skill.demandLevel}
                        </Badge>
                        <Badge variant="outline">{skill.averageSalary}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-xl`}>
            <CardHeader>
              <CardTitle className={darkMode ? 'text-white' : ''}>Trending Tools</CardTitle>
              <CardDescription className={darkMode ? 'text-gray-300' : ''}>Fast-growing tools and technologies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {getTopTools().map((tool, index) => (
                  <div key={tool.toolId} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{tool.toolName}</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{tool.category}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant={tool.growthTrend === 'Rapidly Growing' ? 'default' : 'secondary'}>
                        {tool.growthTrend}
                      </Badge>
                      <Badge variant="outline">{tool.pricingModel}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DataDashboard; 