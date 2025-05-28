import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useContext(AuthContext);
  const [refreshKey, setRefreshKey] = useState(0);

  // Simulated real-time data updates
  const updateStats = useCallback(() => {
    if (dashboardData) {
      setDashboardData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          totalHoursLearned: prev.user.totalHoursLearned + Math.random() * 0.1,
          skillsInProgress: prev.user.skillsInProgress
        },
        progress: {
          ...prev.progress,
          overall: Math.min(100, prev.progress.overall + Math.random() * 0.05)
        }
      }));
    }
  }, [dashboardData]);

  useEffect(() => {
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updateStats]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Replace with actual API call
        const response = await new Promise(resolve => setTimeout(() => {
          resolve({
            data: {
              user: {
                name: user?.displayName || "User",
                targetRole: "Full Stack Developer",
                completedSkills: 12,
                totalSkills: 20,
                learningStreak: 5,
                lastActive: new Date().toISOString(),
                totalHoursLearned: 48,
                skillsInProgress: 3
              },
              progress: {
                overall: 65,
                frontend: 75,
                backend: 60,
                database: 55,
                devops: 40,
                softSkills: 70
              },
              recommendedSkills: [
                { 
                  name: "React.js", 
                  priority: "High", 
                  relevance: 95,
                  description: "Modern UI development",
                  estimatedHours: 20,
                  category: "Frontend",
                  progress: 0
                },
                // ... other skills
              ],
              learningPaths: [
                {
                  name: "Frontend Master",
                  progress: 75,
                  totalModules: 12,
                  completedModules: 9,
                  nextModule: "Advanced React Patterns"
                },
                // ... other paths
              ],
              recentActivities: [
                { 
                  type: "skill_completed", 
                  skill: "JavaScript Basics", 
                  date: new Date().toISOString(),
                  xpGained: 100
                },
                // ... other activities
              ]
            }
          });
        }, 1000));

        setDashboardData(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load dashboard data");
        setLoading(false);
      }
    };

    fetchData();
  }, [user, refreshKey]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  if (loading) {
    return (
      <motion.div 
        className="dashboard-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="loading-spinner"></div>
        <p>Loading your personalized dashboard...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="dashboard-error"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <i className="fas fa-exclamation-circle"></i>
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
        <button onClick={() => setRefreshKey(prev => prev + 1)} className="retry-btn">
          Try Again
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="dashboard-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.section 
        className="dashboard-hero"
        variants={itemVariants}
      >
        <div className="hero-content">
          <div className="hero-main">
            <div className="hero-text">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Welcome back, {dashboardData.user.name}
              </motion.h1>
              <motion.p 
                className="hero-subtitle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Your journey to becoming a {dashboardData.user.targetRole}
              </motion.p>
            </div>
            <div className="hero-cta">
              <motion.button 
                className="primary-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-play-circle"></i>
                Continue Learning
              </motion.button>
              <motion.button 
                className="secondary-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-chart-bar"></i>
                View Progress
              </motion.button>
            </div>
          </div>
          
          <motion.div 
            className="quick-stats-grid"
            variants={containerVariants}
          >
            {/* Stats Cards */}
            <StatsCard
              icon="chart-line"
              value={`${Math.round(dashboardData.progress.overall)}%`}
              label="Overall Progress"
              trend="up"
              color="blue"
            />
            <StatsCard
              icon="fire"
              value={`${dashboardData.user.learningStreak} Days`}
              label="Learning Streak"
              trend="up"
              color="orange"
            />
            <StatsCard
              icon="clock"
              value={`${Math.round(dashboardData.user.totalHoursLearned)}h`}
              label="Total Learning Time"
              trend="up"
              color="green"
            />
            <StatsCard
              icon="layer-group"
              value={dashboardData.user.skillsInProgress}
              label="Skills in Progress"
              trend="neutral"
              color="purple"
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Rest of the dashboard content */}
      <motion.div 
        className="dashboard-grid"
        variants={containerVariants}
      >
        {/* Learning Paths, Skill Progress, etc. sections */}
        {/* ... existing sections with added animations ... */}
      </motion.div>
    </motion.div>
  );
};

// Stats Card Component with animations
const StatsCard = ({ icon, value, label, trend, color }) => {
  return (
    <motion.div 
      className="stat-card"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`stat-icon ${color}`}>
        <i className={`fas fa-${icon}`}></i>
      </div>
      <div className="stat-info">
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {value}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {label}
        </motion.p>
      </div>
      {trend && (
        <motion.div 
          className={`trend-indicator ${trend}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <i className={`fas fa-arrow-${trend === 'up' ? 'up' : 'right'}`}></i>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Dashboard; 