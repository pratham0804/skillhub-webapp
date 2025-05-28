const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

// Google Sheets API config with flexible authentication
const createGoogleAuth = () => {
  try {
    // For production: Use environment variables
    if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      console.log('Using production environment variables for Google Sheets authentication');
      
      return new google.auth.GoogleAuth({
        credentials: {
          type: 'service_account',
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          client_id: process.env.GOOGLE_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL)}`
        },
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets.readonly',
          'https://www.googleapis.com/auth/spreadsheets'
        ],
      });
    }
    
    // For local development: Use credentials.json file
    const credentialsPath = path.join(__dirname, '..', 'credentials.json');
    if (fs.existsSync(credentialsPath)) {
      console.log('Using local credentials.json for Google Sheets authentication');
      
      return new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets.readonly',
          'https://www.googleapis.com/auth/spreadsheets'
        ],
      });
    }
    
    // Fallback to API key method (if available)
    if (process.env.GOOGLE_SHEETS_API_KEY) {
      console.log('Using API key for Google Sheets authentication');
      
      return new google.auth.GoogleAuth({
        apiKey: process.env.GOOGLE_SHEETS_API_KEY,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    }
    
    throw new Error('No valid Google authentication method found');
    
  } catch (error) {
    console.error('Error creating Google Auth:', error);
    throw error;
  }
};

const auth = createGoogleAuth();
const sheets = google.sheets('v4');

// Function to get skills data
const getSkillsData = async () => {
  try {
    if (!process.env.SKILL_SHEET_ID) {
      console.warn('SKILL_SHEET_ID not configured');
      return [];
    }
    
    console.log('Fetching skills data from Google Sheets...');
    
    const authClient = await auth.getClient();
    const response = await sheets.spreadsheets.values.get({
      auth: authClient,
      spreadsheetId: process.env.SKILL_SHEET_ID,
      range: 'Sheet1!A:Z', // Adjust range as needed
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No skills data found');
      return [];
    }
    
    // Process the data (adjust based on your sheet structure)
    const headers = rows[0];
    const skillsData = rows.slice(1).map(row => {
      const skill = {};
      headers.forEach((header, index) => {
        skill[header] = row[index] || '';
      });
      return skill;
    });
    
    console.log(`Successfully fetched ${skillsData.length} skills`);
    return skillsData;
    
  } catch (error) {
    console.error('Error accessing skills sheet:', error);
    throw error;
  }
};

// Function to get tools data
const getToolsData = async () => {
  try {
    if (!process.env.TOOL_SHEET_ID) {
      console.warn('TOOL_SHEET_ID not configured');
      return [];
    }
    
    console.log('Fetching tools data from Google Sheets...');
    
    const authClient = await auth.getClient();
    const response = await sheets.spreadsheets.values.get({
      auth: authClient,
      spreadsheetId: process.env.TOOL_SHEET_ID,
      range: 'Sheet1!A:Z', // Adjust range as needed
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No tools data found');
      return [];
    }
    
    // Process the data (adjust based on your sheet structure)
    const headers = rows[0];
    const toolsData = rows.slice(1).map(row => {
      const tool = {};
      headers.forEach((header, index) => {
        tool[header] = row[index] || '';
      });
      return tool;
    });
    
    console.log(`Successfully fetched ${toolsData.length} tools`);
    return toolsData;
    
  } catch (error) {
    console.error('Error accessing tools sheet:', error);
    throw error;
  }
};

module.exports = {
  getSkillsData,
  getToolsData,
  auth
}; 