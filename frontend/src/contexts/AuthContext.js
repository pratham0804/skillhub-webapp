import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import firebase from 'firebase/app';
import 'firebase/auth';
import axios from 'axios';

// Firebase configuration - using environment variables with fallbacks
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDK5bWVwwJQECwclFW_5udpP1RTWpoZSR8",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "my-skill-project-425.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "my-skill-project-425",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "my-skill-project-425.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "684740813985",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "684740813985"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  
  // Only for development - override Firebase authentication API endpoint to use our proxy
  if (window.location.hostname === 'localhost') {
    firebase.auth().useDeviceLanguage();
    
    // This is a workaround for CORS issues during development
    const auth = firebase.auth();
    auth.tenantId = null;
    
    // Override Firebase's internal API endpoints to go through our proxy
    // This is just for local development to bypass CORS issues
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (url.includes('www.googleapis.com/identitytoolkit')) {
        // Extract the path after identitytoolkit/v3
        const path = url.split('identitytoolkit/v3')[1];
        // Use our proxy instead
        return originalFetch(`/firebase-auth-proxy${path}`, options);
      }
      return originalFetch(url, options);
    };
  }
}

export const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up API client - use useMemo to prevent recreation on every render
  const api = useMemo(() => {
    const client = axios.create({
      baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
    headers: {
      'Content-Type': 'application/json'
    },
      withCredentials: true,
      timeout: 30000 // 30 second timeout (increased for file operations)
  });

    // Add response interceptor for error handling
    client.interceptors.response.use(response => {
    return response;
  }, error => {
    if (error.response) {
        console.error(`API Error: ${error.response.status}`, error.response.data);
    } else if (error.request) {
        console.error('Network Error: No response received');
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  });

    return client;
  }, []); // Empty dependency array - create once

  // Add token to requests
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Intentionally excluding api.defaults.headers.common to prevent infinite loop

  // Register with email/password
  const register = async (email, password, username) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', {
        email,
        password,
        username
      });
      
      if (response.data.token) {
        setToken(response.data.token);
        setCurrentUser(response.data.user);
        localStorage.setItem('token', response.data.token);
        return response.data;
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  // Login with email/password
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', {
        email,
        password
      });
      
      if (response.data.token) {
        setToken(response.data.token);
        setCurrentUser(response.data.user);
        localStorage.setItem('token', response.data.token);
        return response.data;
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setError(null);
      const provider = new firebase.auth.GoogleAuthProvider();
      // Force account selection even if user is already signed in
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // Sign in with Firebase
      const result = await firebase.auth().signInWithPopup(provider);
      
      // Get the user from the result
      const { user } = result;
      const email = user.email;
      const username = user.displayName || email.split('@')[0];
      
      // We don't need to send the idToken to our backend anymore
      // const idToken = await user.getIdToken();
      
      // Create our own JWT token via the server (don't send the Google token)
      const response = await api.post('/auth/google-login', {
        email: email,
        username: username,
        firebaseUid: user.uid
      });
      
      if (response.data.token) {
        setToken(response.data.token);
        setCurrentUser(response.data.user);
        localStorage.setItem('token', response.data.token);
        return response.data;
      }
    } catch (error) {
      console.error('Google login error:', error);
      setError('Google login failed: ' + (error.message || ''));
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await firebase.auth().signOut();
      setCurrentUser(null);
      setToken(null);
      localStorage.removeItem('token');
    } catch (error) {
      setError('Logout failed');
      throw error;
    }
  };

  // Check token and set user on mount
  useEffect(() => {
    const checkToken = async () => {
      try {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
          // Set token in axios headers
          api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          
          // Validate token by getting user profile
          const response = await api.get('/users/profile');
          
          if (response.data.status === 'success') {
            setToken(savedToken);
            setCurrentUser(response.data.data.user);
          } else {
            // Token is invalid
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        // Token is invalid
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    checkToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally excluding api to prevent infinite loop - run only once on mount

  const value = {
    currentUser,
    token,
    loading,
    error,
    register,
    login,
    loginWithGoogle,
    logout,
    api
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 