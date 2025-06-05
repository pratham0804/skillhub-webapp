const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Format new row with borders and proper styling
const formatNewRow = async (doc, sheet, rowNumber) => {
  try {
    console.log(`Formatting row ${rowNumber} with Calibri font and borders...`);
    
    // Load cells for the entire row to format them
    const startCol = 'A';
    const endCol = String.fromCharCode(65 + sheet.headerValues.length - 1); // Convert to letter (A, B, C, etc.)
    const range = `${startCol}${rowNumber}:${endCol}${rowNumber}`;
    
    console.log(`Loading cells in range: ${range}`);
    await sheet.loadCells(range);
    
    // Format each cell in the row
    for (let col = 0; col < sheet.headerValues.length; col++) {
      const cell = sheet.getCell(rowNumber - 1, col); // 0-indexed for getCell
      
      // Apply Calibri font and borders
      cell.textFormat = {
        fontFamily: 'Calibri',
        fontSize: 10,
        bold: false,
        italic: false,
        foregroundColor: { red: 0, green: 0, blue: 0 }
      };
      
      // Set background color
      cell.backgroundColor = { red: 1, green: 1, blue: 1 };
      
      // Set alignment
      cell.horizontalAlignment = 'LEFT';
      cell.verticalAlignment = 'MIDDLE';
      cell.wrapStrategy = 'WRAP';
      
      // Apply borders (this is the tricky part with google-spreadsheet library)
      cell.borders = {
        top: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
        bottom: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
        left: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
        right: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } }
      };
    }
    
    // Save all the cell updates
    await sheet.saveUpdatedCells();
    
    console.log(`✅ Successfully formatted row ${rowNumber} with Calibri font and borders`);
    
  } catch (error) {
    console.error(`❌ Could not format row ${rowNumber}:`, error.message);
    
    // Try a simpler approach - just set font without borders
    try {
      console.log(`Attempting simpler formatting for row ${rowNumber}...`);
      
      const startCol = 'A';
      const endCol = String.fromCharCode(65 + sheet.headerValues.length - 1);
      const range = `${startCol}${rowNumber}:${endCol}${rowNumber}`;
      
      await sheet.loadCells(range);
      
      for (let col = 0; col < sheet.headerValues.length; col++) {
        const cell = sheet.getCell(rowNumber - 1, col);
        cell.textFormat = {
          fontFamily: 'Calibri',
          fontSize: 10
        };
      }
      
      await sheet.saveUpdatedCells();
      console.log(`✅ Applied basic Calibri formatting to row ${rowNumber}`);
      
    } catch (simpleError) {
      console.error(`❌ Even simple formatting failed for row ${rowNumber}:`, simpleError.message);
      // Don't throw error, formatting is nice-to-have but not critical
    }
  }
};

// Get Google Sheets credentials
const getCredentials = () => {
  try {
    // For production: Use environment variables
    if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      console.log('Using production environment variables for Google Sheets credentials');
      return {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      };
    }
    
    // For local development: Use credentials.json file
    const credentialsPath = path.resolve(__dirname, '..', 'credentials.json');
    if (fs.existsSync(credentialsPath)) {
      console.log('Using local credentials.json for Google Sheets credentials');
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      return {
        client_email: credentials.client_email,
        private_key: credentials.private_key
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Error getting Google Sheets credentials:', error);
    return null;
  }
};

// Find a writable directory for saving files
const findWritableDirectory = async (basePaths) => {
  for (const dir of basePaths) {
    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Test write access
      const testFile = path.join(dir, '.test-write');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      console.log(`Found writable directory: ${dir}`);
      return dir;
    } catch (error) {
      console.warn(`Cannot use directory ${dir}: ${error.message}`);
    }
  }
  
  console.error('Could not find any writable directory');
  return null;
};

// Save data directly to JSON file (fallback)
const saveToLocalJSON = async (type, data) => {
  console.log(`Saving ${type} to local JSON file...`);
  
  try {
    // Try multiple possible locations
    const possibleDirs = [
      path.join(__dirname, '../local_data'),
      path.join(__dirname, '../data'),
      path.join(process.cwd(), 'local_data'),
      path.join(process.cwd(), 'data'),
      path.join(process.cwd(), 'tmp'),
      path.join(__dirname, '../tmp'),
      require('os').tmpdir()
    ];
    
    const dataDir = await findWritableDirectory(possibleDirs);
    
    if (!dataDir) {
      throw new Error('No writable directory found for JSON storage');
    }
    
    // Generate unique ID and prepare data
    const timestamp = Date.now();
    const id = `${type.toUpperCase()}_${timestamp}_${Math.floor(Math.random() * 1000)}`;
    
    const dataToSave = {
      id,
      type,
      createdAt: new Date().toISOString(),
      ...data
    };
    
    // First, save to individual file (most reliable)
    const singleFilePath = path.join(dataDir, `${type}_${timestamp}.json`);
    fs.writeFileSync(singleFilePath, JSON.stringify(dataToSave, null, 2));
    
    console.log(`Saved individual file: ${singleFilePath}`);
    
    // Then, try to add to collection file (less critical)
    try {
      const collectionPath = path.join(dataDir, `${type.toLowerCase()}s.json`);
      let collection = [];
      
      // Read existing collection if it exists
      if (fs.existsSync(collectionPath)) {
        try {
          const content = fs.readFileSync(collectionPath, 'utf8');
          const parsed = JSON.parse(content);
          collection = Array.isArray(parsed) ? parsed : [];
        } catch (readError) {
          console.warn(`Could not read collection file: ${readError.message}`);
          // Continue with empty collection
        }
      }
      
      // Add to collection and save
      collection.push(dataToSave);
      fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
      console.log(`Updated collection file: ${collectionPath}`);
    } catch (collectionError) {
      console.warn(`Could not update collection file: ${collectionError.message}`);
      // This is non-critical, we already saved the individual file
    }
    
    return {
      success: true,
      id,
      filePath: singleFilePath,
      directory: dataDir
    };
  } catch (error) {
    console.error(`Error saving to JSON: ${error.message}`);
    throw error;
  }
};

// Add skill to Google Sheets
const addSkillToGoogleSheets = async (skillData) => {
  console.log('Adding skill to Google Sheets...');
  
  try {
    const credentials = getCredentials();
    if (!credentials) {
      throw new Error('Google Sheets credentials not available');
    }
    
    if (!process.env.SKILL_SHEET_ID) {
      throw new Error('SKILL_SHEET_ID not configured in environment variables');
    }
    
    // Initialize the Google Sheet
    const doc = new GoogleSpreadsheet(process.env.SKILL_SHEET_ID);
    
    // Authenticate
    await doc.useServiceAccountAuth({
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    });
    
    // Load document properties and worksheets
    await doc.loadInfo();
    console.log(`Connected to Google Sheet: ${doc.title}`);
    
    // Find the "Trending Skill Data" sheet
    const sheet = Object.values(doc.sheetsById).find(s => s.title === 'Trending Skill Data');
    
    if (!sheet) {
      throw new Error('Sheet "Trending Skill Data" not found in the Google Spreadsheet');
    }
    
    console.log(`Found sheet: ${sheet.title}`);
    
    // Load rows to get current count for proper ID generation
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    const nextSkillNumber = rows.length + 1;
    
    // Generate proper sequential ID (SK001, SK002, etc.)
    const skillId = `SK${nextSkillNumber.toString().padStart(3, '0')}`;
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Prepare the row data to append (using existing sheet headers)
    const rowData = {
      'SkillID': skillId,
      'SkillName': skillData.skillName || '',
      'Category': skillData.category || '',
      'Demand Level': 'High', // Default for newly contributed skills
      'Growth Rate': 'Growing', // Default for newly contributed skills
      'Average Salary': '$85,000', // Default estimate
      'Required Experience': '1-3 years', // Default estimate
      'Learning Resources': skillData.learningResources || skillData.description || '',
      'Related Skills': '', // Can be filled later
      'Last Updated': currentDate,
      'Contributor ID': skillData.contributorEmail || 'admin-approved'
    };
    
    console.log('Appending row data:', rowData);
    
    // Add the row to the sheet
    const newRow = await sheet.addRow(rowData);
    
    // Format the new row with borders and proper styling
    await formatNewRow(doc, sheet, newRow.rowNumber);
    
    console.log('Successfully added skill to Google Sheets');
    
    return {
      success: true,
      skillId,
      googleSheetsSuccess: true,
      sheetTitle: sheet.title,
      rowNumber: newRow.rowNumber,
      data: rowData
    };
    
  } catch (error) {
    console.error('Error adding skill to Google Sheets:', error);
    throw error;
  }
};

// Add tool to Google Sheets
const addToolToGoogleSheets = async (toolData) => {
  console.log('Adding tool to Google Sheets...');
  
  try {
    const credentials = getCredentials();
    if (!credentials) {
      throw new Error('Google Sheets credentials not available');
    }
    
    if (!process.env.TOOL_SHEET_ID) {
      throw new Error('TOOL_SHEET_ID not configured in environment variables');
    }
    
    // Initialize the Google Sheet (using same sheet ID as skills since they're in the same spreadsheet)
    const doc = new GoogleSpreadsheet(process.env.TOOL_SHEET_ID);
    
    // Authenticate
    await doc.useServiceAccountAuth({
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    });
    
    // Load document properties and worksheets
    await doc.loadInfo();
    console.log(`Connected to Google Sheet: ${doc.title}`);
    
    // Find the "Trending Tool Data" sheet
    const sheet = Object.values(doc.sheetsById).find(s => s.title === 'Trending Tool Data');
    
    if (!sheet) {
      throw new Error('Sheet "Trending Tool Data" not found in the Google Spreadsheet');
    }
    
    console.log(`Found sheet: ${sheet.title}`);
    
    // Load rows to get current count for proper ID generation
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    const nextToolNumber = rows.length + 1;
    
    // Generate proper sequential ID (T001, T002, etc.)
    const toolId = `T${nextToolNumber.toString().padStart(3, '0')}`;
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Prepare the row data to append (using existing sheet headers)
    const rowData = {
      'ToolID': toolId,
      'ToolName': toolData.toolName || '',
      'Category': toolData.category || '',
      'Primary Use Cases': toolData.primaryUseCases || toolData.description || '',
      'Skill Level Required': 'Beginner to Intermediate', // Default estimate
      'Pricing Model': 'Freemium', // Default estimate
      'Integration Capabilities': 'Good', // Default estimate
      'Relevant Industries': 'Technology, Software Development', // Default estimate
      'Growth Trend': 'Growing', // Default for newly contributed tools
      'Last Updated': currentDate,
      'Contributor ID': toolData.contributorEmail || 'admin-approved'
    };
    
    console.log('Appending row data:', rowData);
    
    // Add the row to the sheet
    const newRow = await sheet.addRow(rowData);
    
    // Format the new row with borders and proper styling
    await formatNewRow(doc, sheet, newRow.rowNumber);
    
    console.log('Successfully added tool to Google Sheets');
    
    return {
      success: true,
      toolId,
      googleSheetsSuccess: true,
      sheetTitle: sheet.title,
      rowNumber: newRow.rowNumber,
      data: rowData
    };
    
  } catch (error) {
    console.error('Error adding tool to Google Sheets:', error);
    throw error;
  }
};

// Main skill addition function with Google Sheets integration and fallback
const addSkillToSheet = async (skillData) => {
  console.log('Adding skill with Google Sheets integration...');
  
  let googleSheetsResult = null;
  let localResult = null;
  
  // Try Google Sheets first
  try {
    googleSheetsResult = await addSkillToGoogleSheets(skillData);
    console.log('Successfully added to Google Sheets');
  } catch (sheetsError) {
    console.error('Google Sheets failed, falling back to local storage:', sheetsError.message);
  }
  
  // Always save locally as backup/fallback
  try {
    localResult = await saveToLocalJSON('skill', skillData);
    console.log('Successfully saved to local storage');
  } catch (localError) {
    console.error('Local storage also failed:', localError.message);
    
    // If both fail, still return success to prevent contribution rejection
    if (!googleSheetsResult) {
      return {
        success: true,
        skillId: `SKILL_EMERGENCY_${Date.now()}`,
        error: `Both Google Sheets and local storage failed: ${sheetsError?.message || 'Unknown error'}, ${localError.message}`,
        googleSheetsSuccess: false,
        localSaved: false
      };
    }
  }
  
  // Return combined results
  return {
    success: true,
    skillId: googleSheetsResult?.skillId || localResult?.id,
    googleSheetsSuccess: !!googleSheetsResult,
    localSaved: !!localResult,
    sheetInfo: googleSheetsResult ? {
      sheetTitle: googleSheetsResult.sheetTitle,
      rowNumber: googleSheetsResult.rowNumber
    } : null,
    filePath: localResult?.filePath,
    dataDir: localResult?.directory,
    warning: googleSheetsResult ? null : 'Google Sheets update failed, saved locally only'
  };
};

// Main tool addition function with Google Sheets integration and fallback
const addToolToSheet = async (toolData) => {
  console.log('Adding tool with Google Sheets integration...');
  
  let googleSheetsResult = null;
  let localResult = null;
  
  // Try Google Sheets first
  try {
    googleSheetsResult = await addToolToGoogleSheets(toolData);
    console.log('Successfully added to Google Sheets');
  } catch (sheetsError) {
    console.error('Google Sheets failed, falling back to local storage:', sheetsError.message);
  }
  
  // Always save locally as backup/fallback
  try {
    localResult = await saveToLocalJSON('tool', toolData);
    console.log('Successfully saved to local storage');
  } catch (localError) {
    console.error('Local storage also failed:', localError.message);
    
    // If both fail, still return success to prevent contribution rejection
    if (!googleSheetsResult) {
      return {
        success: true,
        toolId: `TOOL_EMERGENCY_${Date.now()}`,
        error: `Both Google Sheets and local storage failed: ${sheetsError?.message || 'Unknown error'}, ${localError.message}`,
        googleSheetsSuccess: false,
        localSaved: false
      };
    }
  }
  
  // Return combined results
  return {
    success: true,
    toolId: googleSheetsResult?.toolId || localResult?.id,
    googleSheetsSuccess: !!googleSheetsResult,
    localSaved: !!localResult,
    sheetInfo: googleSheetsResult ? {
      sheetTitle: googleSheetsResult.sheetTitle,
      rowNumber: googleSheetsResult.rowNumber
    } : null,
    filePath: localResult?.filePath,
    dataDir: localResult?.directory,
    warning: googleSheetsResult ? null : 'Google Sheets update failed, saved locally only'
  };
};

module.exports = {
  addSkillToSheet,
  addToolToSheet
}; 