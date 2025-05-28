# 🔐 Google Sheets Credentials Setup Guide

## 📋 **Problem Solved**

This guide shows how to use your `credentials.json` file **locally** while keeping it **secure in production** using environment variables.

---

## 🏠 **Local Development Setup**

### **1. Keep Your credentials.json File**

1. **Place your `credentials.json` file** in the `backend/` directory
2. **Make sure it's in `.gitignore`** (already configured)
3. **Your code will automatically use it locally**

### **2. Local Environment Variables**

Create `backend/.env` with:

```env
# Required for Google Sheets
SKILL_SHEET_ID=your_actual_google_sheet_id_for_skills
TOOL_SHEET_ID=your_actual_google_sheet_id_for_tools

# Other variables...
MONGODB_URI=mongodb://localhost:27017/skillhub
JWT_SECRET=your_jwt_secret
```

---

## 🚀 **Production Deployment Setup**

### **Step 1: Extract Values from credentials.json**

Open your local `credentials.json` file and extract these values:

```json
{
  "type": "service_account",
  "project_id": "your-project-123456",           // → GOOGLE_PROJECT_ID
  "private_key_id": "abc123...",                 // → GOOGLE_PRIVATE_KEY_ID
  "private_key": "-----BEGIN PRIVATE KEY-----\n...", // → GOOGLE_PRIVATE_KEY
  "client_email": "service@project.iam.gserviceaccount.com", // → GOOGLE_SERVICE_ACCOUNT_EMAIL
  "client_id": "123456789",                      // → GOOGLE_CLIENT_ID
}
```

### **Step 2: Configure Render Environment Variables**

In your Render dashboard, add these environment variables:

```env
NODE_ENV=production

# Google Service Account (from credentials.json)
GOOGLE_PROJECT_ID=your-project-123456
GOOGLE_PRIVATE_KEY_ID=abc123...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour full private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_SERVICE_ACCOUNT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=123456789

# Google Sheets IDs
SKILL_SHEET_ID=your_skills_sheet_id
TOOL_SHEET_ID=your_tools_sheet_id

# Other required variables
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillhub
JWT_SECRET=your_production_jwt_secret
```

### **Step 3: Configure Vercel Environment Variables**

In your Vercel dashboard, add:

```env
REACT_APP_API_URL=https://your-backend-name.onrender.com
REACT_APP_ENV=production
```

---

## 🔄 **How Authentication Works**

Your updated code now uses this logic:

```javascript
// 1. Production: Use environment variables
if (NODE_ENV === 'production' && GOOGLE_SERVICE_ACCOUNT_EMAIL) {
  // Use env vars
}

// 2. Local Development: Use credentials.json
else if (credentials.json exists) {
  // Use local file
}

// 3. Fallback: Use API key
else if (GOOGLE_SHEETS_API_KEY) {
  // Use simple API key
}
```

---

## ✅ **Benefits of This Approach**

1. **🔒 Security**: No credentials in your code repository
2. **🏠 Local Development**: Easy to use with your existing credentials.json
3. **🚀 Production Ready**: Environment variables for deployment
4. **🔄 Flexible**: Supports multiple authentication methods

---

## 🛠️ **Testing Your Setup**

### **Local Testing:**
```bash
cd backend
npm install
npm start
# Should show: "Using local credentials.json for Google Sheets authentication"
```

### **Production Testing:**
After deployment, check your Render logs for:
```
"Using production environment variables for Google Sheets authentication"
```

---

## 🚨 **Important Security Notes**

1. **Never commit `credentials.json`** to Git (already in .gitignore)
2. **Keep your private key secure** in environment variables
3. **Use different service accounts** for development and production (recommended)
4. **Regularly rotate your credentials** for security

---

## ❓ **Troubleshooting**

### **"No valid Google authentication method found"**
- Check if `credentials.json` exists locally
- Verify all environment variables are set in production

### **"Error accessing skills sheet"**
- Verify `SKILL_SHEET_ID` and `TOOL_SHEET_ID` are correct
- Check that your service account has access to the sheets
- Ensure sheets are shared with your service account email

### **"Authentication error"**
- Check if private key is properly formatted (include \n characters)
- Verify service account email is correct

---

**✅ Your Google Sheets integration will work perfectly in both development and production!** 