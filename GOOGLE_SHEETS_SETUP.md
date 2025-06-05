# 📊 Google Sheets Integration Setup Guide

This comprehensive guide will help you set up Google Sheets integration for your SkillHub admin panel. When contributions are approved, they will be automatically added to your Google Sheets.

## 🎯 What You'll Achieve

- ✅ Admin panel approvals automatically add data to Google Sheets
- ✅ Skills go to "Trending Skill Data" sheet
- ✅ Tools go to "Trending Tool Data" sheet  
- ✅ Both sheets can be in the same Community-Sheet spreadsheet
- ✅ Robust fallback to local storage if Google Sheets fails

## 📋 Prerequisites

- Google account
- Google Cloud Console access
- Your SkillHub application running locally

## 🚀 Complete Setup Process

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create new project**:
   - Click "Select a project" dropdown → "New Project"
   - Project name: `skillhub-sheets-integration` (or any name)
   - Click "Create"
3. **Note your Project ID** (you'll need this later)

### Step 2: Enable Google Sheets API

1. **Navigate to APIs & Services**:
   - In Google Cloud Console, use the hamburger menu → "APIs & Services" → "Library"
2. **Enable Google Sheets API**:
   - Search for "Google Sheets API"
   - Click on "Google Sheets API" result
   - Click "ENABLE" button
   - Wait for confirmation (should show "API enabled")

### Step 3: Create Service Account

1. **Go to Credentials**:
   - APIs & Services → Credentials
2. **Create Service Account**:
   - Click "CREATE CREDENTIALS" → "Service Account"
   - Service account name: `skillhub-sheets-service`
   - Service account ID: `skillhub-sheets-service` (auto-filled)
   - Description: `Service account for SkillHub Google Sheets integration`
   - Click "CREATE AND CONTINUE"
3. **Skip Role Assignment**:
   - Click "CONTINUE" (no roles needed for this step)
4. **Skip User Access**:
   - Click "DONE"

### Step 4: Generate Service Account JSON Key

1. **Access your Service Account**:
   - In Credentials page, find your service account in the "Service Accounts" section
   - Click on the service account email
2. **Create JSON Key**:
   - Go to "KEYS" tab
   - Click "ADD KEY" → "Create new key"
   - Select "JSON" format
   - Click "CREATE"
3. **Download & Rename**:
   - A JSON file will download automatically
   - Rename it to `credentials.json`
   - **IMPORTANT**: Note the `client_email` in this file - you'll need it!

### Step 5: Create Your Google Spreadsheet

1. **Create New Spreadsheet**:
   - Go to https://sheets.google.com/
   - Click "Blank" to create new spreadsheet
   - Rename it to "Community-Sheet" (click on "Untitled spreadsheet")

2. **Get Spreadsheet ID**:
   - Look at the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Copy the `SPREADSHEET_ID` part (long string between `/d/` and `/edit`)
   - **Save this ID - you'll need it for your .env file!**

### Step 6: Create Required Sheets with Exact Headers

#### Sheet 1: "Trending Skill Data"

1. **Rename first sheet**:
   - Right-click "Sheet1" tab → "Rename" → "Trending Skill Data"

2. **Add these headers in Row 1** (exact spelling and case):
   ```
   A1: Skill ID
   B1: Skill Name  
   C1: Category
   D1: Demand Level
   E1: Growth Rate
   F1: Average Salary
   G1: Required Experience
   H1: Learning Resources
   I1: Related Skills
   J1: Last Updated
   K1: Contributor ID
   ```

#### Sheet 2: "Trending Tool Data"

1. **Create new sheet**:
   - Click "+" button at bottom to add new sheet
   - Rename it to "Trending Tool Data"

2. **Add these headers in Row 1** (exact spelling and case):
   ```
   A1: Tool ID
   B1: Tool Name
   C1: Category
   D1: Primary Use Cases
   E1: Skill Level Required
   F1: Pricing Model
   G1: Integration Capabilities
   H1: Relevant Industries
   I1: Growth Trend
   J1: Last Updated
   K1: Contributor ID
   ```

### Step 7: Share Spreadsheet with Service Account

1. **Open your spreadsheet**
2. **Click "Share" button** (top-right)
3. **Add service account**:
   - In "Add people and groups" field, paste the `client_email` from your `credentials.json`
   - It looks like: `skillhub-sheets-service@your-project.iam.gserviceaccount.com`
4. **Set permissions**:
   - Change permission from "Viewer" to "Editor"
   - Uncheck "Notify people"
5. **Click "Share"**

### Step 8: Configure Your Application

#### Place Credentials File

1. **Copy credentials.json**:
   ```bash
   # Place the downloaded credentials.json file in:
   backend/credentials.json
   ```

#### Update Environment Variables

1. **Open `backend/.env`**
2. **Update these values**:
   ```env
   # Replace YOUR_SPREADSHEET_ID with the actual ID from Step 5
   SKILL_SHEET_ID=YOUR_SPREADSHEET_ID
   TOOL_SHEET_ID=YOUR_SPREADSHEET_ID
   
   # Optional: Add Gemini API key for enhanced descriptions
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

**IMPORTANT**: Both `SKILL_SHEET_ID` and `TOOL_SHEET_ID` should have the same spreadsheet ID since both sheets are in the same spreadsheet.

### Step 9: Test the Setup

1. **Run the test script**:
   ```bash
   cd backend
   node setup-google-sheets.js
   ```

2. **Check for success messages**:
   - ✅ Credentials loaded successfully
   - ✅ Sheet IDs configured  
   - ✅ Connected to spreadsheet
   - ✅ Found both required sheets
   - ✅ Headers verified
   - ✅ Test data insertion successful

3. **If test fails**, see troubleshooting section below.

### Step 10: Start Your Application

1. **Start backend** (PowerShell):
   ```powershell
   cd backend
   npm start
   ```

2. **Start frontend** (new terminal):
   ```powershell
   cd frontend  
   npm start
   ```

3. **Test admin approval**:
   - Submit a test contribution
   - Approve it in admin panel
   - Check your Google Spreadsheet for new data

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### ❌ "No valid credentials found"
**Solution**:
- Ensure `credentials.json` is in `backend/` directory
- Check file is not empty and contains valid JSON
- Verify `client_email` and `private_key` fields exist

#### ❌ "SKILL_SHEET_ID not set in .env file"
**Solution**:
- Open `backend/.env` file
- Add: `SKILL_SHEET_ID=your_actual_spreadsheet_id`
- Add: `TOOL_SHEET_ID=your_actual_spreadsheet_id`

#### ❌ "Sheet 'Trending Skill Data' not found"
**Solution**:
- Check sheet name is exactly "Trending Skill Data" (case-sensitive)
- Ensure you created the sheet in the correct spreadsheet
- Verify spreadsheet ID in .env matches your actual spreadsheet

#### ❌ "Permission denied" / "Unable to parse range"
**Solution**:
- Share spreadsheet with service account email from `credentials.json`
- Set permission to "Editor" (not Viewer)
- Wait 1-2 minutes for permissions to propagate

#### ❌ "API not enabled"
**Solution**:
- Go to Google Cloud Console → APIs & Services → Library
- Search "Google Sheets API" and ensure it's enabled
- Wait a few minutes after enabling

### 🧪 Testing Your Setup

#### Quick Test Commands:
```bash
# Test Google Sheets connection
cd backend
node setup-google-sheets.js

# Test with debug output
DEBUG=* node setup-google-sheets.js
```

#### Check Your Spreadsheet:
1. Open your Google Spreadsheet
2. Verify both sheets exist with correct names
3. Check headers match exactly
4. Look for test data after running setup script

### 📝 Getting Your IDs

#### Spreadsheet ID:
- URL: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
- ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

#### Service Account Email:
- Found in `credentials.json` → `client_email` field
- Format: `service-name@project-id.iam.gserviceaccount.com`

## 🔒 Security Best Practices

- ✅ `credentials.json` is excluded from git (already in .gitignore)
- ✅ Never commit credentials to version control
- ✅ Use environment variables for production deployment
- ✅ Regularly rotate service account keys
- ✅ Only give "Editor" permissions (not "Owner")

## 🏃‍♂️ Quick Setup Checklist

- [ ] Google Cloud project created
- [ ] Google Sheets API enabled
- [ ] Service account created
- [ ] JSON key downloaded and renamed to `credentials.json`
- [ ] Google Spreadsheet created and named
- [ ] Two sheets created: "Trending Skill Data" and "Trending Tool Data"
- [ ] Correct headers added to both sheets
- [ ] Spreadsheet shared with service account email
- [ ] `credentials.json` placed in `backend/` directory
- [ ] `backend/.env` updated with spreadsheet ID
- [ ] Test script runs successfully
- [ ] Admin panel approval test works

## 🆘 Still Having Issues?

1. **Run the diagnostic script**: `node backend/setup-google-sheets.js`
2. **Check backend console logs** when starting server
3. **Verify all steps** in this guide were completed exactly
4. **Double-check** sheet names and headers (case-sensitive)
5. **Wait 1-2 minutes** after sharing spreadsheet for permissions

## 🎉 Success Indicators

When everything works correctly, you should see:

- ✅ **Backend logs**: "Connected to Google Sheet: Community-Sheet"
- ✅ **Admin panel**: "Data was saved to: Google Sheets, local storage"
- ✅ **Google Sheets**: New rows appear when you approve contributions
- ✅ **Test script**: All green checkmarks

Your Google Sheets integration is now complete and your admin panel approvals will automatically populate your Community-Sheet! 🚀 