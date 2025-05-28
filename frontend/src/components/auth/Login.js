import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { login, loginWithGoogle, error } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const checkProfileCompletion = (user) => {
    // Check for essential profile fields
    const requiredFields = ['username', 'targetRole', 'location', 'experience', 'bio'];
    return requiredFields.every(field => user[field] && user[field].trim() !== '');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    
    try {
      const response = await login(email, password);
      const user = response.user;
      
      // Check if profile is complete
      if (!checkProfileCompletion(user)) {
        // First time user or incomplete profile
        navigate('/profile', { state: { isFirstTime: true } });
      } else {
        // Returning user with complete profile
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
      
      // Check if profile is complete
      if (!checkProfileCompletion(user)) {
        // First time user or incomplete profile
        navigate('/profile', { state: { isFirstTime: true } });
      } else {
        // Returning user with complete profile
        navigate('/');
      }
    } catch (err) {
      console.error('Google login error:', err);
      setErrorMessage(err.message || error || 'Failed to login with Google.');
    } finally {
      setIsLoading(false);
    }
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
      
      <p className="register-link">
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};

export default Login; 