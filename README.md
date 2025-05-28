# 🚀 SkillHub - AI-Powered Skill Enhancement Companion

> **Transform your career journey with intelligent skill gap analysis and personalized learning recommendations.**

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4%2B-green.svg)](https://mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🌟 Overview

SkillHub is a comprehensive skill enhancement platform that helps professionals identify skill gaps, track learning progress, and receive AI-powered recommendations for career growth. Our platform combines advanced analytics with intuitive design to make skill development engaging and effective.

### ✨ Key Features

- 🔍 **AI-Powered Skill Gap Analysis** - Advanced algorithms identify missing skills for your target role
- 📄 **Smart Resume Analysis** - Upload resumes for automatic skill extraction and analysis  
- 📊 **Progress Tracking Dashboard** - Visual analytics to monitor your learning journey
- 🎯 **Personalized Learning Paths** - Customized recommendations based on your goals
- 🔐 **Secure Authentication** - Google OAuth and Firebase integration
- 📱 **Responsive Design** - Perfect experience across all devices
- 🤖 **AI-Powered Insights** - Google Gemini AI for intelligent recommendations

## 🏗️ Technology Stack

### Frontend
- **React 18.2.0** - Modern UI framework
- **React Router DOM 6.16.0** - Client-side routing
- **Chart.js & Recharts** - Data visualization
- **Axios** - HTTP client
- **Firebase** - Authentication & hosting
- **FontAwesome** - Icon library

### Backend
- **Node.js & Express 4.18.2** - Server framework
- **MongoDB & Mongoose 7.5.3** - Database
- **JSON Web Tokens** - Authentication
- **Google Generative AI** - AI integration
- **Multer** - File upload handling
- **PDF-Parse** - Resume processing

### DevOps & Tools
- **Google Cloud Platform** - AI services
- **Firebase** - Authentication & hosting
- **MongoDB Atlas** - Cloud database
- **Nodemon** - Development server

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (v4.4+)
- npm or yarn
- Google Cloud account (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd skillhub
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment setup**
   ```bash
   # Backend configuration
   cd backend
   cp env.example .env
   # Edit .env with your configuration

   # Frontend configuration  
   cd ../frontend
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**
   ```bash
   # Start backend (Terminal 1)
   cd backend
   npm run dev

   # Start frontend (Terminal 2)
   cd frontend
   npm start
   ```

Visit `http://localhost:3000` to access the application.

## 📁 Project Structure

```
skillhub/
├── frontend/                 # React.js frontend application
│   ├── public/              # Static assets
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── assets/         # Images, styles
│   │   └── utils/          # Helper functions
│   ├── package.json        # Frontend dependencies
│   └── env.example         # Environment variables template
├── backend/                 # Node.js/Express backend
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── services/           # Business logic
│   ├── uploads/            # File uploads directory
│   ├── package.json        # Backend dependencies
│   └── env.example         # Environment variables template
├── SETUP.md                # Detailed setup guide
├── README.md               # Project documentation
└── .gitignore             # Git ignore rules
```

## 🔧 Configuration

### Backend Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `GOOGLE_GEMINI_API_KEY` - Google AI API key
- `FIREBASE_CONFIG` - Firebase configuration

### Frontend Environment Variables
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_FIREBASE_CONFIG` - Firebase configuration
- `REACT_APP_GOOGLE_CLIENT_ID` - Google OAuth client ID

See `env.example` files for complete configuration options.

## 🌐 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Skill Management
- `GET /api/skills` - Get user skills
- `POST /api/skills` - Add new skill
- `PUT /api/skills/:id` - Update skill
- `DELETE /api/skills/:id` - Delete skill

### Analysis & AI
- `POST /api/analysis/gap` - Perform skill gap analysis
- `POST /api/upload/resume` - Upload and analyze resume
- `GET /api/recommendations` - Get learning recommendations

## 📊 Features Deep Dive

### 🔍 Skill Gap Analysis
Our AI-powered analysis compares your current skills against target job requirements:
- Industry-standard skill benchmarking
- Real-time job market analysis
- Personalized skill recommendations
- Progress tracking and milestones

### 📄 Resume Intelligence
Advanced resume processing capabilities:
- Automatic skill extraction from PDFs
- Industry keyword recognition
- Experience level assessment
- Gap identification and recommendations

### 📈 Analytics Dashboard
Comprehensive progress tracking:
- Skill progression charts
- Learning activity timeline
- Achievement badges
- Performance metrics

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Input Validation** - Comprehensive request validation
- **Rate Limiting** - API abuse prevention
- **CORS Protection** - Cross-origin request security
- **File Upload Security** - Safe file processing

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm start
```

### Environment Configuration
- Set `NODE_ENV=production`
- Configure production database
- Update CORS origins
- Set secure JWT secrets

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write comprehensive tests
- Update documentation
- Follow semantic commit messages

## 📋 Dependencies

### Core Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| React | ^18.2.0 | Frontend framework |
| Express | ^4.18.2 | Backend framework |
| MongoDB | ^7.5.3 | Database ODM |
| Firebase | ^8.10.1 | Authentication |
| Chart.js | ^4.4.9 | Data visualization |

See `package.json` files for complete dependency lists.

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check MongoDB service
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

**Port Already in Use**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

**Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for intelligent recommendations
- Firebase for authentication services
- MongoDB for database solutions
- Chart.js for data visualization
- All open-source contributors

## 📞 Support

- 📧 Email: support@skillhub.dev
- 💬 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 📖 Documentation: [Wiki](https://github.com/your-repo/wiki)

---

**Built with ❤️ by the SkillHub Team**

*Empowering professionals to reach their full potential through intelligent skill development.* 