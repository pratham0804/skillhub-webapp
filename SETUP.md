# 🚀 SkillHub - Skill Enhancement Companion

## Project Setup Guide

This guide will help you set up the SkillHub project on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v16.0.0 or higher)
- **npm** (v7.0.0 or higher) or **yarn**
- **MongoDB** (v4.4 or higher)
- **Git**

## 🏗️ Project Structure

```
SkillHub/
├── frontend/          # React.js frontend application
├── backend/           # Node.js/Express backend API
├── README.md          # Project documentation
├── SETUP.md          # This setup guide
└── .env.example      # Environment variables template
```

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SkillHub
```

### 2. Install Dependencies

#### Install Frontend Dependencies
```bash
cd frontend
npm install
```

#### Install Backend Dependencies
```bash
cd ../backend
npm install
```

### 3. Environment Configuration

#### Backend Environment Setup
Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Configure the following environment variables in `backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/skillhub

# JWT Secret
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Google Services
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key

# Email Configuration (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Firebase Configuration (Optional)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
```

#### Frontend Environment Setup
Create a `.env` file in the `frontend` directory:

```bash
cd ../frontend
touch .env
```

Add the following to `frontend/.env`:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NODE_ENV=development

# Firebase Configuration (if using)
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

### 4. Database Setup

#### Start MongoDB
Make sure MongoDB is running on your system:

```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Linux
sudo systemctl start mongod

# On Windows
# Start MongoDB service from Services or run mongod.exe
```

### 5. Start the Application

#### Start Backend Server
```bash
cd backend
npm run dev
# or
npm start
```

The backend server will start on `http://localhost:5000`

#### Start Frontend Development Server
```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:3000`

## 📦 Dependencies Overview

### Frontend Dependencies
- **React** (^18.2.0) - UI framework
- **React Router DOM** (^6.16.0) - Client-side routing
- **Axios** (^1.5.1) - HTTP client
- **Chart.js** (^4.4.9) - Data visualization
- **React-Chartjs-2** (^5.3.0) - React wrapper for Chart.js
- **Recharts** (^2.15.3) - Alternative charting library
- **Firebase** (^8.10.1) - Authentication and hosting
- **FontAwesome** - Icons

### Backend Dependencies
- **Express** (^4.18.2) - Web framework
- **Mongoose** (^7.5.3) - MongoDB ODM
- **JSON Web Token** (^9.0.2) - Authentication
- **Axios** (^1.8.4) - HTTP client
- **CORS** (^2.8.5) - Cross-origin resource sharing
- **Multer** (^1.4.5) - File upload handling
- **PDF-Parse** (^1.1.1) - PDF processing
- **Google Generative AI** (^0.1.3) - AI integration
- **Google APIs** (^126.0.1) - Google services
- **Nodemailer** (^6.9.7) - Email sending
- **CSV Parser** (^3.2.0) - CSV file processing

## 🔧 Development Scripts

### Frontend Scripts
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App
```

### Backend Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
```

## 🌐 API Endpoints

The backend API will be available at `http://localhost:5000/api`

Key endpoints include:
- `/api/auth` - Authentication routes
- `/api/users` - User management
- `/api/skills` - Skill tracking
- `/api/analysis` - Skill gap analysis
- `/api/upload` - File upload handling

## 📱 Features

- **User Authentication** - Secure login/signup
- **Profile Management** - User profile customization
- **Skill Tracking** - Add and track skills
- **Resume Analysis** - AI-powered resume parsing
- **Gap Analysis** - Identify skill gaps
- **Progress Tracking** - Monitor learning progress
- **Data Visualization** - Charts and analytics

## 🚀 Production Deployment

### Build Frontend
```bash
cd frontend
npm run build
```

### Environment Variables for Production
Update your environment variables for production use:
- Change `NODE_ENV` to `production`
- Update API URLs to production endpoints
- Configure production database
- Set secure JWT secrets

## 🛠️ Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Change port in backend `.env` file
   - Kill process using the port: `lsof -ti:5000 | xargs kill -9`

2. **MongoDB Connection Issues**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify MongoDB version compatibility

3. **Frontend Build Issues**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Clear npm cache: `npm cache clean --force`

4. **API Connection Issues**
   - Verify backend server is running
   - Check CORS configuration
   - Ensure API URLs are correct

## 📋 Additional Setup

### Google Services Setup (Optional)
1. Create a Google Cloud Project
2. Enable required APIs (Gemini AI, Sheets, etc.)
3. Create service account and download credentials
4. Add API keys to environment variables

### Firebase Setup (Optional)
1. Create Firebase project
2. Enable Authentication
3. Get configuration keys
4. Add to environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review troubleshooting section

---

**Happy Coding! 🚀** 