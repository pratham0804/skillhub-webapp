const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const dataRoutes = require('./routes/dataRoutes');
const trendingRoutes = require('./routes/trendingRoutes');
const contributionRoutes = require('./routes/contributionRoutes');
const learningResourcesRoutes = require('./routes/learningResourcesRoutes');
const adminRoutes = require('./routes/adminRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const axios = require('axios');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enhanced CORS configuration with better error handling
const corsOptions = {
  origin: function(origin, callback) {
    // In development, be more permissive with CORS
    if (process.env.NODE_ENV !== 'production') {
      console.log(`CORS allowing all origins in development mode. Origin: ${origin || 'No origin'}`);
      callback(null, true);
      return;
    }
    
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://localhost:5001',
      'http://localhost:5001/', // Add trailing slash version
      'https://skillhub-webapp.vercel.app', // Production frontend URL
      'https://skillhub-webapp.vercel.app/', // With trailing slash
      undefined // Allow requests with no origin (like mobile apps, curl, postman)
    ];
    
    // Add production frontend URL from environment variables
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
      allowedOrigins.push(process.env.FRONTEND_URL + '/'); // With trailing slash
    }
    
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes(origin)) {
      console.log(`CORS allowed for origin: ${origin || 'No origin'}`);
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      console.warn(`Allowed origins:`, allowedOrigins);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400 // Cache preflight requests for 24 hours
};

app.use(cors(corsOptions));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Debug environment variables
console.log('Environment variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('GOOGLE_SHEETS_API_KEY:', process.env.GOOGLE_SHEETS_API_KEY ? 'Set' : 'Not set');
console.log('SKILL_SHEET_ID:', process.env.SKILL_SHEET_ID ? 'Set' : 'Not set');
console.log('TOOL_SHEET_ID:', process.env.TOOL_SHEET_ID ? 'Set' : 'Not set');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', dataRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/learning', learningResourcesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/resume', resumeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to view all contributions (remove in production)
app.get('/api/debug/contributions', async (req, res) => {
  try {
    const Contribution = require('./models/Contribution');
    const contributions = await Contribution.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      count: contributions.length,
      data: contributions
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching contributions',
      error: error.message
    });
  }
});

// Proxy route for Firebase Authentication (to help with CORS issues in development)
app.use('/firebase-auth-proxy', async (req, res) => {
  try {
    const targetUrl = `https://www.googleapis.com/identitytoolkit/v3${req.url}`;
    console.log(`Proxying request to: ${targetUrl}`);
    
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Firebase auth proxy error:', error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

// Debug registered routes
console.log('Registered routes:');
app._router.stack.forEach(middleware => {
  if (middleware.route) {
    // Routes registered directly on the app
    console.log(`${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    // Router middleware
    middleware.handle.stack.forEach(handler => {
      if (handler.route) {
        const path = handler.route.path;
        const methods = Object.keys(handler.route.methods).join(', ').toUpperCase();
        console.log(`${methods} ${middleware.regexp} ${path}`);
      }
    });
  }
});

// Start server
const startServer = (port) => {
  // Ensure port is within valid range (0-65535)
  if (port >= 65536) {
    console.error('No available ports found. Exiting.');
    process.exit(1);
  }

  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying port ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(PORT);

// YouTube API service is configured with fallback resources
console.log('\n===== YOUTUBE API SERVICE STATUS =====');
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
if (YOUTUBE_API_KEY) {
  console.log('YouTube API Key configured - Service will attempt to use YouTube API with fallback to curated resources');
} else {
  console.log('YouTube API Key not configured - Service will use curated learning resources');
} 