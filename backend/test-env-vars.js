require('dotenv').config();

console.log('=== ENVIRONMENT VARIABLES TEST ===');
console.log('');

// Check all Google-related environment variables
const googleVars = [
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_PRIVATE_KEY',
    'GOOGLE_PROJECT_ID',
    'GOOGLE_PRIVATE_KEY_ID',
    'GOOGLE_CLIENT_ID',
    'SKILL_SHEET_ID',
    'TOOL_SHEET_ID',
    'GOOGLE_GEMINI_API_KEY'
];

googleVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        if (varName === 'GOOGLE_PRIVATE_KEY') {
            console.log(`✅ ${varName}: [PRIVATE KEY SET - ${value.length} characters]`);
        } else {
            console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
        }
    } else {
        console.log(`❌ ${varName}: NOT SET`);
    }
});

console.log('');

// Test the credentials function
const { getCredentials } = require('./services/sheetsUpdateService');
try {
    const creds = getCredentials();
    if (creds) {
        console.log('✅ Google Sheets credentials detected successfully');
        console.log('   - client_email:', creds.client_email);
        console.log('   - private_key length:', creds.private_key ? creds.private_key.length : 0);
    } else {
        console.log('❌ Google Sheets credentials NOT detected');
    }
} catch (error) {
    console.log('❌ Error testing credentials:', error.message);
} 