import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({
    email: '',
    password: ''
  });
  
  const { login, loginWithGoogle, error } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const checkProfileCompletion = (user) => {
    // Check for essential profile fields
    const requiredFields = ['username', 'targetRole', 'location', 'experience', 'bio'];
    return requiredFields.every(field => user[field] && user[field].trim() !== '');
  };
  
  const isMobileView = () => {
    return window.innerWidth <= 768;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    
    try {
      const response = await login(email, password);
      const user = response.user;
      
      // Check if profile is complete or mobile view
      if (!checkProfileCompletion(user) || isMobileView()) {
        // First time user, incomplete profile, or mobile user
        navigate('/profile', { state: { isFirstTime: !checkProfileCompletion(user) } });
      } else {
        // Returning user with complete profile on desktop
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage(err.message || error || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsLoading(true);
    
    try {
      const response = await loginWithGoogle();
      const user = response.user;
      
      // Check if profile is complete or mobile view
      if (!checkProfileCompletion(user) || isMobileView()) {
        // First time user, incomplete profile, or mobile user
        navigate('/profile', { state: { isFirstTime: !checkProfileCompletion(user) } });
      } else {
        // Returning user with complete profile on desktop
        navigate('/');
      }
    } catch (err) {
      console.error('Google login error:', err);
      setErrorMessage(err.message || error || 'Failed to login with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_URL}/admin/login`, adminCredentials);
      
      if (response.data.status === 'success') {
        localStorage.setItem('adminToken', response.data.token);
        navigate('/admin');
      } else {
        setErrorMessage('Invalid admin credentials');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setErrorMessage(error.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminInputChange = (e) => {
    const { name, value } = e.target;
    setAdminCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  return (
    <div className="login-container">
      <h2>Login to Your Account</h2>
      
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div className="social-login">
        <button 
          onClick={handleGoogleLogin}
          className="btn btn-google"
          disabled={isLoading}
        >
          Login with Google
        </button>
      </div>
      
      <div className="admin-section">
        {!showAdminLogin ? (
          <button 
            onClick={() => setShowAdminLogin(true)}
            className="btn btn-admin-toggle"
            type="button"
          >
            🔐 Admin Access
          </button>
        ) : (
          <div className="admin-login-form">
            <h3>Admin Login</h3>
            <form onSubmit={handleAdminLogin}>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Admin Email"
                  value={adminCredentials.email}
                  onChange={handleAdminInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Admin Password"
                  value={adminCredentials.password}
                  onChange={handleAdminInputChange}
                  required
                />
              </div>
              <div className="admin-actions">
                <button 
                  type="submit" 
                  className="btn btn-admin-login"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login as Admin'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  className="btn btn-admin-cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      
      <p className="register-link">
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};

export default Login; 