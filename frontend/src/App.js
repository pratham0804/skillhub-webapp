import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import UserProfile from './pages/UserProfile';
import ResumePage from './pages/ResumePage';
import SkillGapAnalysis from './components/skills/SkillGapAnalysis';
import DataDashboard from './components/data/DataDashboard';
import ContributionPage from './components/contributions/ContributionPage';
import AdminDashboard from './components/admin/AdminDashboard';
import { initGA, trackPageView } from './utils/analytics';
import './App.css';

// Import Freepik images
import techDecoration from './assets/images/image_6974.jpg';
import innovationDecoration from './assets/images/image_657.jpg';
import growthDecoration from './assets/images/image_3352.jpg';

// Import the new PNG illustration (replace the SVG)
import skillDevelopmentIllustration from './assets/images/Multi-device targeting-amico.png';

// Page tracker component for route changes
const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);

  return null; // This component doesn't render anything
};

// NavLink component to handle active state
const NavLink = ({ to, children, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`nav-link ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

// Basic placeholder components
const Home = () => {
  useEffect(() => {
    // Counter animation
    const animateCounters = () => {
      const counters = document.querySelectorAll('.counter');
      counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const increment = target / 100;
        let current = 0;
        
        const updateCounter = () => {
          current += increment;
          if (current < target) {
            counter.textContent = Math.ceil(current).toLocaleString();
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target.toLocaleString();
          }
        };
        
        // Start animation when element is visible
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              counter.style.opacity = '1';
              updateCounter();
              observer.unobserve(entry.target);
            }
          });
        });
        
        observer.observe(counter);
      });
    };

    // Animate elements on scroll
    const animateOnScroll = () => {
      const elements = document.querySelectorAll('.animate-fade-in, .animate-slide-up');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });
      
      elements.forEach(element => {
        element.style.opacity = '0';
        if (element.classList.contains('animate-slide-up')) {
          element.style.transform = 'translateY(30px)';
        }
        observer.observe(element);
      });
    };

    // Hero image scroll animation for mobile
    const animateHeroImage = () => {
      const imageContainer = document.querySelector('.hero-image .image-container');
      if (imageContainer) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              // Add animation class when image comes into view
              entry.target.classList.add('animate-in');
              observer.unobserve(entry.target);
            }
          });
        }, {
          threshold: 0.3, // Trigger when 30% of image is visible
          rootMargin: '0px 0px -20px 0px'
        });
        
        observer.observe(imageContainer);
      }
    };

    // Initialize animations
    animateCounters();
    animateOnScroll();
    animateHeroImage();

    // Cleanup
    return () => {
      // Clean up observers if needed
    };
  }, []);

  return (
  <div className="home-container container">
      {/* Hero Section */}
    <div className="hero-section">
        {/* Decorative background elements */}
        <div className="hero-decorations">
          <div className="decoration-element decoration-1">
            <img src={techDecoration} alt="Tech decoration" />
          </div>
          <div className="decoration-element decoration-2">
            <img src={innovationDecoration} alt="Innovation decoration" />
          </div>
          <div className="decoration-element decoration-3">
            <img src={growthDecoration} alt="Growth decoration" />
          </div>
        </div>
        
      <div className="hero-content">
          <div className="hero-badge animate-fade-in">
            <span className="badge-icon">🚀</span>
            <span>Your Career Transformation Starts Here</span>
          </div>
          
          <h1 className="hero-title animate-slide-up">
            Level Up Your <span className="highlight-gradient">Tech Career</span>
          </h1>
          
          <p className="hero-description animate-slide-up delay-100">
          Discover in-demand skills, track industry trends, and connect with opportunities 
            that match your expertise. Join thousands of professionals advancing their careers 
            with data-driven insights.
        </p>
          <div className="hero-buttons animate-slide-up delay-200">
            <Link to="/skill-gap-analysis" className="hero-cta primary">
              <span className="btn-icon">📊</span>
              Analyze Your Skills
            </Link>
            <Link to="/data-dashboard" className="hero-cta secondary">
              <span className="btn-icon">📈</span>
              Explore Trends
            </Link>
        </div>
      </div>
        
      <div className="hero-image">
          <div className="image-container">
            <img src={skillDevelopmentIllustration} alt="Skill Development Workspace" />
          </div>
      </div>
    </div>
    
    {/* Features Section */}
    <div className="features-section">
      <div className="section-header">
        <div className="section-badge animate-fade-in">
          <span>✨ Features</span>
        </div>
        <h2 className="animate-slide-up">Why Choose SkillHub?</h2>
        <p className="subtitle animate-slide-up delay-100">Gain the competitive edge in the tech industry with our powerful tools</p>
      </div>
      
      <div className="features-grid">
        <div className="feature-card animate-slide-up delay-100">
          <div className="feature-icon">
            <div className="icon-bg">🚀</div>
          </div>
          <h3>AI-Powered Skill Analysis</h3>
          <p>Get personalized insights into your skillset with our advanced AI that identifies gaps and suggests learning paths.</p>
        </div>
        
        <div className="feature-card animate-slide-up delay-200">
          <div className="feature-icon">
            <div className="icon-bg">📊</div>
          </div>
          <h3>Real-Time Market Trends</h3>
          <p>Stay ahead with live data on the most in-demand skills, salary ranges, and emerging technologies in your field.</p>
        </div>
        
        <div className="feature-card animate-slide-up delay-300">
          <div className="feature-icon">
            <div className="icon-bg">🤝</div>
          </div>
          <h3>Community-Driven Insights</h3>
          <p>Contribute to and benefit from our growing database of skills and experiences shared by professionals like you.</p>
        </div>
        
        <div className="feature-card animate-slide-up delay-400">
          <div className="feature-icon">
            <div className="icon-bg">🎯</div>
          </div>
          <h3>Career Path Planning</h3>
          <p>Set goals, track progress, and get personalized recommendations to reach your dream tech career faster.</p>
        </div>
        
        <div className="feature-card animate-slide-up delay-500">
          <div className="feature-icon">
            <div className="icon-bg">📄</div>
          </div>
          <h3>Resume Optimization</h3>
          <p>Upload your resume and get AI-powered feedback on how to highlight your skills for maximum impact.</p>
        </div>
        
        <div className="feature-card animate-slide-up delay-600">
          <div className="feature-icon">
            <div className="icon-bg">🌟</div>
          </div>
          <h3>Skill Certification</h3>
          <p>Validate your expertise with our skill assessments and earn certificates recognized by top employers.</p>
        </div>
      </div>
    </div>

    {/* How It Works Section */}
    <div className="how-it-works-section">
      <div className="section-header">
        <div className="section-badge animate-fade-in">
          <span>🚀 Simple Process</span>
        </div>
        <h2 className="animate-slide-up">How SkillHub Works</h2>
        <p className="subtitle animate-slide-up delay-100">Transform your career with our streamlined approach</p>
  </div>
      
      <div className="process-container">
        <div className="process-step-card">
          <div className="step-icon-modern">👤</div>
          <div className="step-header">
            <div className="step-number-modern">1</div>
            <div className="step-title">
              <h3>Create Your Profile</h3>
            </div>
          </div>
          <div className="step-body">
            <p className="step-description">
              Build your professional profile by adding current skills, experience level, and career goals. Our system analyzes your background to understand your position in the tech landscape.
            </p>
            <ul className="step-features">
              <li><span className="feature-check">✓</span>Skills assessment</li>
              <li><span className="feature-check">✓</span>Experience mapping</li>
              <li><span className="feature-check">✓</span>Goal setting</li>
            </ul>
            <div className="step-cta">
              <a href="/profile" className="step-link">Complete Profile</a>
            </div>
          </div>
    </div>
    
        <div className="process-step-card">
          <div className="step-icon-modern">🤖</div>
          <div className="step-header">
            <div className="step-number-modern">2</div>
            <div className="step-title">
              <h3>AI-Powered Analysis</h3>
            </div>
          </div>
          <div className="step-body">
            <p className="step-description">
              Our advanced AI compares your profile with market demands, identifying skill gaps and growth opportunities specific to your career path.
            </p>
            <ul className="step-features">
              <li><span className="feature-check">✓</span>Market comparison</li>
              <li><span className="feature-check">✓</span>Gap identification</li>
              <li><span className="feature-check">✓</span>Opportunity mapping</li>
            </ul>
            <div className="step-cta">
              <a href="/skill-gap-analysis" className="step-link">Start Analysis</a>
            </div>
          </div>
      </div>
      
        <div className="process-step-card">
          <div className="step-icon-modern">📚</div>
          <div className="step-header">
            <div className="step-number-modern">3</div>
            <div className="step-title">
              <h3>Personalized Learning</h3>
            </div>
          </div>
          <div className="step-body">
            <p className="step-description">
              Receive curated learning paths, resources, and recommendations tailored to your goals. Track progress as you develop new skills and expertise.
            </p>
            <ul className="step-features">
              <li><span className="feature-check">✓</span>Custom learning paths</li>
              <li><span className="feature-check">✓</span>Progress tracking</li>
              <li><span className="feature-check">✓</span>Resource curation</li>
            </ul>
            <div className="step-cta">
              <a href="/data-dashboard" className="step-link">Explore Resources</a>
            </div>
          </div>
      </div>
      
        <div className="process-step-card">
          <div className="step-icon-modern">🚀</div>
          <div className="step-header">
            <div className="step-number-modern">4</div>
            <div className="step-title">
              <h3>Career Success</h3>
            </div>
          </div>
          <div className="step-body">
            <p className="step-description">
              Land your dream role with confidence, armed with in-demand skills and industry insights that employers actively seek in today's market.
            </p>
            <ul className="step-features">
              <li><span className="feature-check">✓</span>Industry insights</li>
              <li><span className="feature-check">✓</span>Job readiness</li>
              <li><span className="feature-check">✓</span>Career advancement</li>
            </ul>
            <div className="step-cta">
              <a href="/resume" className="step-link">Optimize Resume</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

const About = () => {
  return (
    <div className="about-container">
      <section className="about-hero-pro">
        <div className="hero-content-pro">
          <h1>Skill Enhancement Companion</h1>
          <p>
            Welcome to our innovative skill enhancement platform, where artificial intelligence meets career development. Our system goes beyond traditional learning platforms by providing intelligent skill analysis and personalized growth recommendations. We utilize advanced AI algorithms to analyze your current technical profile, identify crucial skill gaps based on industry demands, and create tailored learning paths that align with your career goals.
          </p>
          <p>
            What sets us apart is our data-driven approach to skill development. By continuously analyzing market trends, job requirements, and emerging technologies, we help you stay ahead in the rapidly evolving tech landscape. Our platform not only identifies what skills you need but also provides strategic insights on which skills will be most valuable for your target role.
          </p>
          <div className="hero-features">
            <div className="feature-item">
              <i className="fas fa-chart-bar"></i>
              <span>Real-time Skill Analysis</span>
            </div>
            <div className="feature-item">
              <i className="fas fa-road"></i>
              <span>Personalized Learning Paths</span>
    </div>
            <div className="feature-item">
              <i className="fas fa-brain"></i>
              <span>AI-Powered Career Insights</span>
      </div>
      </div>
      </div>
        <div className="hero-image-container">
          <img src={require('./assets/images/5911565_2953998.jpg')} alt="Skill Development" />
      </div>
      </section>

      <section className="get-started-section">
        <h2>Begin Your Growth Journey</h2>
        <p>Take the first step towards mastering the skills that matter in today's tech industry</p>
        <Link to="/register" className="get-started-btn">
          Start Now
          <i className="fas fa-arrow-right"></i>
        </Link>
      </section>
  </div>
);
};

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Add this near the top of the file, after imports
function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState('up');
  const [prevScroll, setPrevScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.pageYOffset;
      const direction = currentScroll > prevScroll ? 'down' : 'up';

      if (direction !== scrollDirection && 
          (Math.abs(currentScroll - prevScroll) > 10)) {
        setScrollDirection(direction);
      }
      setPrevScroll(currentScroll);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollDirection, prevScroll]);

  return scrollDirection;
}

// Header component
const Header = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const scrollDirection = useScrollDirection();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.pageYOffset > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.mobile-nav') && !event.target.closest('.mobile-menu-toggle')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);
  
  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  return (
    <header className={`main-header ${scrollDirection === 'down' && isScrolled ? 'nav-hidden' : ''} ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <div className="logo">
          <Link to="/" onClick={closeMobileMenu}>
            <span className="logo-text">SkillHub</span>
            <span className="logo-dot">.</span>
          </Link>
        </div>
        
        {/* Mobile Hamburger Menu Button */}
        <button 
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        
        {/* Desktop Navigation */}
        <nav className="main-nav desktop-nav">
          <ul className="nav-links">
            <li><NavLink to="/">Home</NavLink></li>
            <li><NavLink to="/about">About</NavLink></li>
            {currentUser ? (
              <>
                <li><NavLink to="/profile">Profile</NavLink></li>
                <li><NavLink to="/skill-gap-analysis">Skills</NavLink></li>
                <li><NavLink to="/resume-builder">Resume</NavLink></li>
                <li><NavLink to="/data-dashboard">Trends</NavLink></li>
                <li><NavLink to="/contribute">Contribute</NavLink></li>
              </>
            ) : (
              <li><NavLink to="/contribute">Contribute</NavLink></li>
            )}
          </ul>
        </nav>
        
        {/* Desktop Auth Actions */}
        <div className="auth-actions desktop-auth">
          {currentUser ? (
            <div className="user-menu">
              <span className="user-greeting">Hey, {currentUser.username || 'User'}</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
              {currentUser.email && currentUser.email.includes('admin') && (
                <Link to="/admin/contributions" className="admin-link">
                  <span className="admin-badge">Admin</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">Log In</Link>
              <Link to="/register" className="register-btn">Sign Up</Link>
            </div>
          )}
        </div>

        {/* Mobile Navigation Overlay */}
        <div 
          className={`mobile-nav-overlay ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={(e) => {
            // Close menu if clicking on overlay background (not on nav content)
            if (e.target.classList.contains('mobile-nav-overlay')) {
              setIsMobileMenuOpen(false);
            }
          }}
        >
          <nav className="mobile-nav">
            <ul className="mobile-nav-links">
              <li><NavLink to="/" onClick={closeMobileMenu}>🏠 Home</NavLink></li>
              <li><NavLink to="/about" onClick={closeMobileMenu}>ℹ️ About</NavLink></li>
              {currentUser ? (
                <>
                  <li><NavLink to="/profile" onClick={closeMobileMenu}>👤 Profile</NavLink></li>
                  <li><NavLink to="/skill-gap-analysis" onClick={closeMobileMenu}>📊 Skills Analysis</NavLink></li>
                  <li><NavLink to="/resume-builder" onClick={closeMobileMenu}>📄 Resume Builder</NavLink></li>
                  <li><NavLink to="/data-dashboard" onClick={closeMobileMenu}>📈 Market Trends</NavLink></li>
                  <li><NavLink to="/contribute" onClick={closeMobileMenu}>🤝 Contribute</NavLink></li>
                  {currentUser.email && currentUser.email.includes('admin') && (
                    <li><Link to="/admin/contributions" onClick={closeMobileMenu} className="admin-mobile-link">⚙️ Admin Panel</Link></li>
                  )}
                </>
              ) : (
                <li><NavLink to="/contribute" onClick={closeMobileMenu}>🤝 Contribute</NavLink></li>
              )}
            </ul>
            
            {/* Mobile Auth Section */}
            <div className="mobile-auth-section">
              {currentUser ? (
                <div className="mobile-user-info">
                  <div className="mobile-user-greeting">
                    <span className="user-avatar">👤</span>
                    <span>Hey, {currentUser.username || 'User'}!</span>
                  </div>
                  <button className="mobile-logout-btn" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
              ) : (
                <div className="mobile-auth-buttons">
                  <Link to="/login" className="mobile-login-btn" onClick={closeMobileMenu}>
                    🔑 Log In
                  </Link>
                  <Link to="/register" className="mobile-register-btn" onClick={closeMobileMenu}>
                    ✨ Sign Up
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

// Main App component
function AppContent() {
  // Initialize Google Analytics
  useEffect(() => {
    // Initialize Google Analytics
    initGA();
    
    // Track initial page view
    trackPageView(window.location.pathname + window.location.search, document.title);
  }, []);

  return (
    <Router>
      <PageTracker />
      <Header />
      <main className="app-main">
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            <Route path="/resume" element={
              <ProtectedRoute>
                <ResumePage />
              </ProtectedRoute>
            } />
            <Route path="/resume-builder" element={
              <ProtectedRoute>
                <ResumePage />
              </ProtectedRoute>
            } />
            <Route path="/skill-gap-analysis" element={
              <ProtectedRoute>
                <SkillGapAnalysis />
              </ProtectedRoute>
            } />
            <Route path="/data-dashboard" element={<DataDashboard />} />
            <Route path="/contribute" element={<ContributionPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/contributions" element={<AdminDashboard />} />
          </Routes>
        </div>
      </main>
      
      <footer className="app-footer">
        <div className="container">
          <div className="footer-content">
            {/* Footer Main Content */}
            <div className="footer-grid">
              {/* Brand Section */}
              <div className="footer-brand">
                <div className="footer-logo">
                  <span className="logo-text">SkillHub</span>
                  <span className="logo-dot">.</span>
                </div>
                <p className="footer-description">
                  Empowering tech professionals with AI-driven career insights and skill development tools.
                </p>
              </div>

              {/* Product Links */}
              <div className="footer-section">
                <h4>Features</h4>
                <ul className="footer-links">
                  <li><Link to="/skill-gap-analysis">Skill Analysis</Link></li>
                  <li><Link to="/data-dashboard">Market Trends</Link></li>
                  <li><Link to="/resume">Resume Optimizer</Link></li>
                  <li><Link to="/contribute">Contribute Data</Link></li>
                </ul>
              </div>

              {/* Quick Links */}
              <div className="footer-section">
                <h4>Quick Links</h4>
                <ul className="footer-links">
                  <li><Link to="/">Home</Link></li>
                  <li><Link to="/about">About</Link></li>
                  <li><Link to="/dashboard">Dashboard</Link></li>
                  <li><Link to="/profile">Profile</Link></li>
                </ul>
              </div>
            </div>

            {/* Footer Bottom */}
            <div className="footer-bottom">
              <div className="footer-bottom-content">
                <div className="footer-legal">
          <p>&copy; {new Date().getFullYear()} SkillHub. All rights reserved.</p>
                </div>
                <div className="footer-meta">
                  <div className="footer-stats">
                    <span className="footer-stat">
                      <span className="stat-icon">📊</span>
                      Real-time Analysis
                    </span>
                    <span className="footer-stat">
                      <span className="stat-icon">🤖</span>
                      AI-Powered
                    </span>
                    <span className="footer-stat">
                      <span className="stat-icon">🎯</span>
                      Career Focused
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 