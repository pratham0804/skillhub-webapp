# 🚀 Vercel + Render Deployment Guide

## ✅ **Your Project is 100% Ready for Vercel + Render Deployment!**

### **What We're Deploying:**
- 🎨 **Frontend (React)** → **Vercel** (Free tier available)
- 🔧 **Backend (Node.js/Express)** → **Render** (Free tier available)
- 🗄️ **Database (MongoDB)** → **MongoDB Atlas** (Free tier available)

---

## 🔧 **Step 1: Deploy Backend to Render**

### **Prerequisites:**
1. Push your code to GitHub (if not already done)
2. Create account on [Render.com](https://render.com)

### **Backend Deployment Steps:**

1. **Login to Render** and click "New +" → "Web Service"

2. **Connect Repository:**
   - Connect your GitHub account
   - Select your repository
   - Set **Root Directory**: `backend`

3. **Configure Build & Deploy:**
   ```
   Name: skillhub-backend (or your preferred name)
   Environment: Node
   Region: Choose closest to your users
   Branch: main (or your default branch)
   
   Build Command: npm install
   Start Command: npm start
   ```

4. **Add Environment Variables:**
   Click "Environment" and add these variables from your `backend/.env.example`:
   
   ```env
   NODE_ENV=production
   PORT=10000
   
   # Database (MongoDB Atlas - see Step 1.1)
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillhub
   
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
   
   # CORS Origins (Include your future Vercel URL)
   CORS_ORIGINS=https://your-frontend-name.vercel.app,http://localhost:3000
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Your backend will be available at: `https://your-backend-name.onrender.com`

### **Step 1.1: Set Up MongoDB Atlas (Database)**

1. **Create MongoDB Atlas Account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create free account and cluster

2. **Configure Database:**
   - Create a database user
   - Add your IP to whitelist (or use 0.0.0.0/0 for all IPs)
   - Get connection string

3. **Update MONGODB_URI in Render:**
   - Copy the connection string from Atlas
   - Update the `MONGODB_URI` environment variable in Render

---

## 🎨 **Step 2: Deploy Frontend to Vercel**

### **Prerequisites:**
1. Backend must be deployed and running on Render
2. Note your Render backend URL

### **Frontend Deployment Steps:**

1. **Update Environment Variables:**
   Edit `frontend/env.production` with your actual Render backend URL:
   ```env
   REACT_APP_API_URL=https://your-backend-name.onrender.com
   ```

2. **Login to Vercel:**
   - Go to [Vercel.com](https://vercel.com)
   - Sign up/login with GitHub

3. **Import Project:**
   - Click "New Project"
   - Import your GitHub repository
   - Set **Framework Preset**: "Create React App"
   - Set **Root Directory**: `frontend`

4. **Configure Build:**
   ```
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

5. **Add Environment Variables:**
   In Vercel dashboard, go to Settings → Environment Variables:
   ```env
   REACT_APP_API_URL=https://your-backend-name.onrender.com
   REACT_APP_ENV=production
   GENERATE_SOURCEMAP=false
   
   # Add Firebase variables if using Firebase
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   ```

6. **Deploy:**
   - Click "Deploy"
   - Wait for deployment (3-5 minutes)
   - Your frontend will be available at: `https://your-project-name.vercel.app`

7. **Update Backend CORS:**
   Go back to Render and update the `CORS_ORIGINS` environment variable:
   ```env
   CORS_ORIGINS=https://your-project-name.vercel.app,http://localhost:3000
   ```

---

## 🔄 **Step 3: Test Your Deployment**

### **Testing Checklist:**

1. **Backend Health Check:**
   ```bash
   curl https://your-backend-name.onrender.com/api/health
   ```
   Should return: `{"status":"OK","message":"API is running"}`

2. **Frontend Access:**
   - Visit: `https://your-project-name.vercel.app`
   - Should load your React application

3. **API Connectivity:**
   - Test login/registration
   - Check if frontend can communicate with backend
   - Verify database operations

---

## 🔧 **Step 4: Configure Custom Domains (Optional)**

### **Custom Domain for Vercel:**
1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### **Custom Domain for Render:**
1. In Render dashboard → Settings → Custom Domains
2. Add your custom domain
3. Configure DNS records as instructed

---

## 🛠️ **Automatic Deployments**

Both Vercel and Render will automatically redeploy when you push to your main branch:

- **Frontend**: Push to `main` → Vercel auto-deploys
- **Backend**: Push to `main` → Render auto-deploys

---

## 📊 **Monitoring & Logs**

### **Vercel Monitoring:**
- **Logs**: Vercel Dashboard → Functions → View Function Logs
- **Analytics**: Available in Vercel dashboard
- **Performance**: Built-in performance monitoring

### **Render Monitoring:**
- **Logs**: Render Dashboard → Logs tab
- **Metrics**: Resource usage in dashboard
- **Health Checks**: Automatic health monitoring

---

## 🆘 **Common Issues & Solutions**

### **1. CORS Errors**
**Problem**: Frontend can't connect to backend
**Solution**: 
- Ensure `CORS_ORIGINS` in Render includes your Vercel URL
- Check environment variables are set correctly

### **2. Environment Variables Not Working**
**Problem**: API calls failing
**Solution**:
- Ensure all environment variables are set in both platforms
- Restart deployments after adding new variables

### **3. Build Failures**
**Problem**: Deployment fails during build
**Solution**:
- Check build logs in respective dashboards
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### **4. Database Connection Issues**
**Problem**: Backend can't connect to MongoDB
**Solution**:
- Verify MongoDB Atlas connection string
- Check network access (whitelist IPs)
- Ensure database user has proper permissions

---

## 💰 **Pricing Information**

### **Free Tier Limits:**
- **Vercel**: 100GB bandwidth, unlimited static deployments
- **Render**: 750 hours/month (enough for 1 service), 500MB RAM
- **MongoDB Atlas**: 512MB storage, shared cluster

### **Upgrade Path:**
- Both platforms offer affordable paid plans for production use
- Consider upgrading for better performance and higher limits

---

## 🎉 **Final Checklist**

Before going live:

- [ ] Backend deployed and accessible on Render
- [ ] Frontend deployed and accessible on Vercel  
- [ ] Database connected and working
- [ ] Environment variables configured
- [ ] CORS properly configured
- [ ] Custom domains configured (if applicable)
- [ ] SSL certificates active (automatic)
- [ ] Performance tested
- [ ] Monitoring set up

---

## 📝 **Your Deployment URLs**

After deployment, update these with your actual URLs:

- **Frontend**: `https://your-project-name.vercel.app`
- **Backend**: `https://your-backend-name.onrender.com`
- **API Health Check**: `https://your-backend-name.onrender.com/api/health`

---

**🚀 Congratulations! Your SkillHub application is now live on Vercel + Render!** 