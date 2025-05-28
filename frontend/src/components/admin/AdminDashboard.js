import React, { useState, useEffect } from 'react';
import AdminContributions from './AdminContributions';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Configure axios with retry logic and better error handling
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000 // 30 seconds
});

// Add retry logic
axiosInstance.interceptors.response.use(null, async (error) => {
  const config = error.config;
  
  // Set maximum retry count if not already set
  if (!config || !config.retry) {
    config.retry = 3;
    config.retryDelay = 1000;
    config.retryCount = 0;
  }
  
  // If we still have retries left
  if (config.retryCount < config.retry) {
    config.retryCount += 1;
    console.log(`Retrying admin request (${config.retryCount}/${config.retry}): ${config.url}`);
    
    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, config.retryDelay));
    
    // Increase delay for next retry (exponential backoff)
    config.retryDelay *= 2;
    
    // Retry the request
    return axiosInstance(config);
  }
  
  // No more retries, propagate the error
  return Promise.reject(error);
});

// Debug logging
axiosInstance.interceptors.request.use(config => {
  console.log(`Admin API Request: ${config.method.toUpperCase()} ${config.url}`);
  return config;
}, error => {
  console.error('Admin API Request Error:', error);
  return Promise.reject(error);
});

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    // Check if admin is authenticated
    const adminToken = localStorage.getItem('adminToken');
    
    if (adminToken) {
      // Verify token with backend
      const verifyToken = async () => {
        try {
          console.log('Verifying admin token...');
          const response = await axiosInstance.get(`/admin/verify`, {
            headers: {
              Authorization: `Bearer ${adminToken}`
            }
          });
          
          if (response.data.status === 'success') {
            console.log('Admin token verified successfully');
            setIsAuthenticated(true);
          } else {
            console.warn('Admin token verification failed:', response.data);
            localStorage.removeItem('adminToken');
          }
        } catch (error) {
          console.error('Token verification error:', error);
          if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
          } else if (error.request) {
            console.error('No response received:', error.request);
          } else {
            console.error('Error setting up request:', error.message);
          }
          localStorage.removeItem('adminToken');
        } finally {
          setIsLoading(false);
        }
      };
      
      verifyToken();
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      console.log('Attempting admin login...');
      const response = await axiosInstance.post(`/admin/login`, credentials);
      
      if (response.data.status === 'success') {
        console.log('Admin login successful');
        localStorage.setItem('adminToken', response.data.token);
        setIsAuthenticated(true);
      } else {
        console.warn('Unexpected login response format:', response.data);
        setLoginError('Unexpected response format. Please try again.');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        setLoginError(error.response.data?.message || `Server error: ${error.response.status}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        setLoginError('No response from server. Please check your connection and try again.');
      } else {
        console.error('Error setting up request:', error.message);
        setLoginError(`Error: ${error.message}`);
      }
    }
  };

  if (isLoading) {
    return <div className="admin-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-form">
          <h2>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                name="email"
                value={credentials.email}
                onChange={handleInputChange}
                className="form-control" 
                placeholder="admin@gmail.com" 
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                className="form-control" 
                placeholder="Enter password" 
                required
              />
            </div>
            {loginError && <div className="login-error">{loginError}</div>}
            <button type="submit" className="admin-login-btn">
              Login
            </button>
          </form>
          <p className="login-note">
            Hint: Use admin@gmail.com with password 'thisisadmin'
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-title">
          <h2>Manage Contributions</h2>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
      <div className="admin-content">
        <AdminContributions />
      </div>
    </div>
  );
};

export default AdminDashboard; 