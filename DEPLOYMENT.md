# 🚀 SkillHub Deployment Guide

## Production Deployment Instructions

### 📋 Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account
- Firebase project setup
- Google Cloud Platform account (for APIs)
- Vercel/Netlify account (for frontend)
- Heroku/Railway account (for backend)

### 🔧 Backend Deployment (Heroku/Railway)

#### 1. Environment Variables Setup
Copy the following environment variables to your production backend:

```bash
# Database
MONGODB_URI=your_mongodb_connection_string

# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id

# AI Services
GEMINI_API_KEY=your_gemini_api_key

# Google Services
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key
SKILL_SHEET_ID=your_skill_sheet_id
TOOL_SHEET_ID=your_tool_sheet_id
YOUTUBE_API_KEY=your_youtube_api_key

# Security
JWT_SECRET=your_jwt_secret

# Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=your_frontend_url
```

#### 2. Deploy Backend
```bash
# For Heroku
heroku create your-app-name-backend
git subtree push --prefix backend heroku main

# For Railway
railway login
railway new
railway up
```

### 🌐 Frontend Deployment (Vercel/Netlify)

#### 1. Environment Variables Setup
Update the environment variables in your deployment platform:

```bash
# API Configuration
REACT_APP_API_URL=https://your-backend-url.herokuapp.com/api
REACT_APP_NODE_ENV=production

# Firebase
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id

# Production Settings
REACT_APP_ENABLE_DEBUG=false
REACT_APP_DEBUG_MODE=false
REACT_APP_USE_MOCK_DATA=false
```

#### 2. Deploy Frontend
```bash
# For Vercel
npm install -g vercel
cd frontend
vercel --prod

# For Netlify
npm install -g netlify-cli
cd frontend
npm run build
netlify deploy --prod --dir=build
```

### 🔧 Build Commands

#### Frontend Build Commands:
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server (if needed)
npm start
```

#### Backend Build Commands:
```bash
# Install dependencies
npm install

# Start production server
npm start
```

### 📱 Domain Setup

1. **Backend**: Update CORS settings in `backend/server.js` with your production domain
2. **Frontend**: Update API URLs in environment variables
3. **Firebase**: Add your production domains to Firebase Authentication settings

### 🔒 Security Checklist

- [ ] Remove all console.log statements in production
- [ ] Set NODE_ENV=production
- [ ] Use HTTPS for all API calls
- [ ] Update CORS settings for production domains
- [ ] Secure environment variables
- [ ] Enable rate limiting
- [ ] Set up proper error handling

### 📊 Monitoring & Analytics

1. **Error Tracking**: Consider integrating Sentry
2. **Analytics**: Google Analytics is pre-configured
3. **Performance**: Monitor Core Web Vitals
4. **Uptime**: Set up monitoring for backend health

### 🚀 Post-Deployment

1. Test all features in production
2. Verify database connections
3. Check API endpoints
4. Test authentication flow
5. Verify Google Sheets integration
6. Test resume upload functionality
7. Check mobile responsiveness

### 🔧 Troubleshooting

#### Common Issues:
- **CORS Errors**: Update backend CORS settings
- **API Connection**: Verify backend URL in frontend env
- **Firebase Auth**: Check Firebase project settings
- **Database**: Verify MongoDB connection string
- **Google APIs**: Check API key permissions

### 📝 Notes

- The Resume Page (`ResumePage.js`) is excluded from this deployment
- Resume upload functionality in Profile page is included
- All environment files are configured for production
- Follow security best practices for API keys 