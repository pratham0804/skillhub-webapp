# 🚀 SkillHub Deployment Guide

## 📋 Pre-Deployment Checklist

✅ **Your project is READY for deployment!**

- ✅ Backend API with Node.js/Express
- ✅ Frontend React application  
- ✅ MongoDB database integration
- ✅ Environment configuration
- ✅ Docker configurations created
- ✅ Health checks implemented
- ✅ Documentation complete

## 🎯 Quick Start Options

### Option 1: Docker Deployment (Recommended)

#### Prerequisites
- Docker installed on your system
- Docker Compose installed

#### Steps
1. **Set up environment variables**:
   ```bash
   cp backend/env.example backend/.env
   # Edit backend/.env with your actual values
   ```

2. **Deploy with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

3. **Access your application**:
   - Frontend: http://localhost
   - Backend API: http://localhost:5000
   - Database: localhost:27017

#### Stop the application:
```bash
docker-compose down
```

### Option 2: Cloud Deployment

#### A) Render.com (Free Tier Available)

**Backend Deployment**:
1. Push code to GitHub
2. Create account on [Render.com](https://render.com)
3. Create new "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variables**: Copy from `backend/.env.example`

**Frontend Deployment**:
1. Create new "Static Site" on Render
2. Configure:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`

#### B) Vercel + Railway

**Frontend (Vercel)**:
1. Connect GitHub to [Vercel](https://vercel.com)
2. Import your repository
3. Set root directory to `frontend`
4. Deploy automatically

**Backend (Railway)**:
1. Connect GitHub to [Railway.app](https://railway.app)
2. Import your repository
3. Set root directory to `backend`
4. Add environment variables
5. Deploy

#### C) AWS (Production)

**Backend (Elastic Beanstalk)**:
```bash
# Install AWS CLI and EB CLI
npm install -g aws-cli eb-cli

# Initialize Elastic Beanstalk
cd backend
eb init
eb create production
eb deploy
```

**Frontend (S3 + CloudFront)**:
```bash
# Build the app
cd frontend
npm run build

# Deploy to S3 (configure AWS CLI first)
aws s3 sync build/ s3://your-bucket-name
```

### Option 3: Traditional VPS Deployment

#### Prerequisites
- Ubuntu/Debian server with SSH access
- Domain name (optional)

#### Steps
1. **Set up server**:
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install MongoDB
   sudo apt-get install -y mongodb
   
   # Install Nginx
   sudo apt-get install -y nginx
   
   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Deploy application**:
   ```bash
   # Clone your repository
   git clone https://github.com/yourusername/yourrepo.git
   cd yourrepo
   
   # Set up backend
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your values
   
   # Start backend with PM2
   pm2 start server.js --name "skillhub-backend"
   
   # Build and deploy frontend
   cd ../frontend
   npm install
   npm run build
   
   # Copy build to nginx directory
   sudo cp -r build/* /var/www/html/
   ```

3. **Configure Nginx**:
   ```bash
   sudo nano /etc/nginx/sites-available/skillhub
   ```
   
   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       # Frontend
       location / {
           root /var/www/html;
           try_files $uri $uri/ /index.html;
       }
       
       # Backend API
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Enable site and restart services**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/skillhub /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   pm2 startup
   pm2 save
   ```

## 🔧 Environment Variables Setup

### Required Variables
Create `backend/.env` with these variables:

```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/skillhub

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters

# Google Services (Optional)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
GOOGLE_SHEETS_API_KEY=your_sheets_api_key

# Email (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Firebase (Optional)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
```

## 🔄 CI/CD Setup (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd backend && npm install
        cd ../frontend && npm install
    
    - name: Build frontend
      run: cd frontend && npm run build
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.4
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /path/to/your/app
          git pull origin main
          cd backend && npm install
          cd ../frontend && npm install && npm run build
          pm2 restart skillhub-backend
```

## 🔍 Testing Your Deployment

### Health Checks
- **Backend**: Visit `http://your-domain/api/health`
- **Frontend**: Visit `http://your-domain`

### API Testing
```bash
# Test backend
curl http://your-domain/api/health

# Test with specific endpoints
curl http://your-domain/api/users
```

## 🛡️ Security Considerations

### Production Security Checklist
- [ ] Change default database passwords
- [ ] Use HTTPS (SSL certificates)
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Regular security updates
- [ ] Monitor logs
- [ ] Backup database regularly

### SSL Setup (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 📊 Monitoring & Maintenance

### PM2 Commands
```bash
pm2 status          # Check app status
pm2 logs            # View logs
pm2 restart all     # Restart all apps
pm2 stop all        # Stop all apps
```

### Database Backup
```bash
# Backup MongoDB
mongodump --host localhost --port 27017 --out /backup/$(date +%Y%m%d)

# Restore MongoDB
mongorestore --host localhost --port 27017 /backup/20231201
```

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   sudo netstat -tlnp | grep :5000
   sudo kill -9 <PID>
   ```

2. **Permission errors**:
   ```bash
   sudo chown -R $USER:$USER /path/to/app
   ```

3. **Frontend not loading**:
   - Check nginx configuration
   - Verify build directory exists
   - Check file permissions

4. **Backend API errors**:
   - Check PM2 logs: `pm2 logs`
   - Verify environment variables
   - Test database connection

### Log Locations
- **Nginx**: `/var/log/nginx/`
- **PM2**: `pm2 logs`
- **MongoDB**: `/var/log/mongodb/`

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review application logs
3. Verify environment variables
4. Test database connectivity

---

**🎉 Congratulations! Your SkillHub application is now deployed and ready for users!** 