const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Helper function to get credentials
const getCredentials = () => {
  try {
    // Try credentials.json first
    const credentialsPath = path.resolve(__dirname, 'credentials.json');
    if (fs.existsSync(credentialsPath)) {
      console.log(`${colors.blue}✓ Found credentials.json file${colors.reset}`);
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      return {
        client_email: credentials.client_email,
        private_key: credentials.private_key
      };
    }
    
    // Try environment variables
    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      console.log(`${colors.blue}✓ Found Google credentials in environment variables${colors.reset}`);
      return {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      };
    }
    
    return null;
  } catch (error) {
    console.error(`${colors.red}✗ Error reading credentials: ${error.message}${colors.reset}`);
    return null;
  }
};

// Test Google Sheets connection and setup
const testGoogleSheetsSetup = async () => {
  console.log(`${colors.blue}=== Google Sheets Integration Test ===${colors.reset}\n`);
  
  try {
    // Step 1: Check credentials
    console.log(`${colors.yellow}Step 1: Checking credentials...${colors.reset}`);
    const credentials = getCredentials();
    
    if (!credentials) {
      console.log(`${colors.red}✗ No valid credentials found!${colors.reset}`);
      console.log(`\nTo fix this, you need to either:`);
      console.log(`1. Place credentials.json in the backend/ directory, OR`);
      console.log(`2. Set environment variables GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY`);
      console.log(`\nSee GOOGLE_SHEETS_SETUP.md for detailed instructions.`);
      return;
    }
    
    console.log(`${colors.green}✓ Credentials loaded successfully${colors.reset}`);
    console.log(`   Service Account: ${credentials.client_email}`);
    
    // Step 2: Check Sheet IDs
    console.log(`\n${colors.yellow}Step 2: Checking Sheet IDs...${colors.reset}`);
    
    if (!process.env.SKILL_SHEET_ID) {
      console.log(`${colors.red}✗ SKILL_SHEET_ID not set in .env file${colors.reset}`);
      return;
    }
    
    if (!process.env.TOOL_SHEET_ID) {
      console.log(`${colors.red}✗ TOOL_SHEET_ID not set in .env file${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}✓ Sheet IDs configured${colors.reset}`);
    console.log(`   SKILL_SHEET_ID: ${process.env.SKILL_SHEET_ID}`);
    console.log(`   TOOL_SHEET_ID: ${process.env.TOOL_SHEET_ID}`);
    
    // Step 3: Test connection to Skills sheet
    console.log(`\n${colors.yellow}Step 3: Testing Skills Sheet connection...${colors.reset}`);
    
    const skillDoc = new GoogleSpreadsheet(process.env.SKILL_SHEET_ID);
    await skillDoc.useServiceAccountAuth(credentials);
    await skillDoc.loadInfo();
    
    console.log(`${colors.green}✓ Connected to spreadsheet: ${skillDoc.title}${colors.reset}`);
    
    // Find Trending Skill Data sheet
    const skillSheet = Object.values(skillDoc.sheetsById).find(s => s.title === 'Trending Skill Data');
    
    if (!skillSheet) {
      console.log(`${colors.red}✗ "Trending Skill Data" sheet not found!${colors.reset}`);
      console.log(`\nAvailable sheets in this spreadsheet:`);
      Object.values(skillDoc.sheetsById).forEach(sheet => {
        console.log(`   - "${sheet.title}"`);
      });
      console.log(`\n${colors.yellow}Please create a sheet named exactly "Trending Skill Data"${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}✓ Found "Trending Skill Data" sheet${colors.reset}`);
    console.log(`   Sheet ID: ${skillSheet.sheetId}`);
    console.log(`   Rows: ${skillSheet.rowCount}, Columns: ${skillSheet.columnCount}`);
    
    // Step 4: Test connection to Tools sheet
    console.log(`\n${colors.yellow}Step 4: Testing Tools Sheet connection...${colors.reset}`);
    
    const toolDoc = new GoogleSpreadsheet(process.env.TOOL_SHEET_ID);
    await toolDoc.useServiceAccountAuth(credentials);
    await toolDoc.loadInfo();
    
    // Find Trending Tool Data sheet
    const toolSheet = Object.values(toolDoc.sheetsById).find(s => s.title === 'Trending Tool Data');
    
    if (!toolSheet) {
      console.log(`${colors.red}✗ "Trending Tool Data" sheet not found!${colors.reset}`);
      console.log(`\nAvailable sheets in this spreadsheet:`);
      Object.values(toolDoc.sheetsById).forEach(sheet => {
        console.log(`   - "${sheet.title}"`);
      });
      console.log(`\n${colors.yellow}Please create a sheet named exactly "Trending Tool Data"${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}✓ Found "Trending Tool Data" sheet${colors.reset}`);
    console.log(`   Sheet ID: ${toolSheet.sheetId}`);
    console.log(`   Rows: ${toolSheet.rowCount}, Columns: ${toolSheet.columnCount}`);
    
    // Step 5: Check headers
    console.log(`\n${colors.yellow}Step 5: Checking sheet headers...${colors.reset}`);
    
    // Load headers for skills sheet
    await skillSheet.loadHeaderRow();
    const skillHeaders = skillSheet.headerValues;
    
    const expectedSkillHeaders = [
      'SkillID', 'SkillName', 'Category', 'Demand Level', 'Growth Rate', 
      'Average Salary', 'Required Experience', 'Learning Resources', 
      'Related Skills', 'Last Updated', 'Contributor ID'
    ];
    
    console.log(`Skills sheet headers: ${skillHeaders.join(', ')}`);
    
    const missingSkillHeaders = expectedSkillHeaders.filter(h => !skillHeaders.includes(h));
    if (missingSkillHeaders.length > 0) {
      console.log(`${colors.yellow}⚠ Missing skill headers: ${missingSkillHeaders.join(', ')}${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ All required skill headers present${colors.reset}`);
    }
    
    // Load headers for tools sheet
    await toolSheet.loadHeaderRow();
    const toolHeaders = toolSheet.headerValues;
    
    const expectedToolHeaders = [
      'ToolID', 'ToolName', 'Category', 'Primary Use Cases', 'Skill Level Required',
      'Pricing Model', 'Integration Capabilities', 'Relevant Industries', 
      'Growth Trend', 'Last Updated', 'Contributor ID'
    ];
    
    console.log(`Tools sheet headers: ${toolHeaders.join(', ')}`);
    
    const missingToolHeaders = expectedToolHeaders.filter(h => !toolHeaders.includes(h));
    if (missingToolHeaders.length > 0) {
      console.log(`${colors.yellow}⚠ Missing tool headers: ${missingToolHeaders.join(', ')}${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ All required tool headers present${colors.reset}`);
    }
    
    // Step 6: Test adding a sample row
    console.log(`\n${colors.yellow}Step 6: Testing sample data insertion...${colors.reset}`);
    
    const testSkillData = {
      'SkillID': `TEST_SKILL_${Date.now()}`,
      'SkillName': 'Test Skill',
      'Category': 'Testing',
      'Demand Level': 'High',
      'Growth Rate': 'Growing',
      'Average Salary': '$75,000',
      'Required Experience': '1-2 years',
      'Learning Resources': 'This is a test skill entry',
      'Related Skills': 'JavaScript, Python',
      'Last Updated': new Date().toISOString().split('T')[0],
      'Contributor ID': 'test-user@example.com'
    };
    
    const newRow = await skillSheet.addRow(testSkillData);
    console.log(`${colors.green}✓ Successfully added test row to skills sheet${colors.reset}`);
    console.log(`   Row number: ${newRow.rowNumber}`);
    
    // Step 7: Success summary
    console.log(`\n${colors.green}=== SETUP VERIFICATION COMPLETE ===${colors.reset}`);
    console.log(`✅ Google Sheets integration is properly configured!`);
    console.log(`✅ Your admin panel will now save approved contributions to:`);
    console.log(`   - Skills: "${skillSheet.title}" sheet`);
    console.log(`   - Tools: "${toolSheet.title}" sheet`);
    console.log(`✅ Spreadsheet: ${skillDoc.title}`);
    
  } catch (error) {
    console.error(`\n${colors.red}✗ Setup test failed: ${error.message}${colors.reset}`);
    
    if (error.message.includes('Unable to parse range')) {
      console.log(`\n${colors.yellow}This might be a permissions issue. Make sure:${colors.reset}`);
      console.log(`1. You shared the spreadsheet with your service account email`);
      console.log(`2. The service account has "Editor" permissions`);
    }
    
    if (error.message.includes('PERMISSION_DENIED')) {
      console.log(`\n${colors.yellow}Permission denied. Please:${colors.reset}`);
      console.log(`1. Share your Google Spreadsheet with: ${credentials?.client_email || 'your-service-account'}`);
      console.log(`2. Give "Editor" permissions`);
      console.log(`3. Make sure Google Sheets API is enabled in your Google Cloud project`);
    }
    
    console.log(`\n${colors.blue}For detailed setup instructions, see: GOOGLE_SHEETS_SETUP.md${colors.reset}`);
  }
};

// Run the test
if (require.main === module) {
  testGoogleSheetsSetup().catch(console.error);
}

module.exports = { testGoogleSheetsSetup }; 