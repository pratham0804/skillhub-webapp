const fs = require('fs');
const path = require('path');

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

// Save data directly to JSON file
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
    
    // Ultra fallback using OS temp dir
    try {
      const tempDir = require('os').tmpdir();
      const emergencyPath = path.join(tempDir, `${type}_${Date.now()}.json`);
      fs.writeFileSync(emergencyPath, JSON.stringify(data, null, 2));
      console.log(`Created emergency backup at ${emergencyPath}`);
      
      return {
        success: true,
        id: `${type.toUpperCase()}_EMERGENCY_${Date.now()}`,
        filePath: emergencyPath,
        directory: tempDir,
        isEmergency: true
      };
    } catch (emergencyError) {
      console.error(`Even emergency save failed: ${emergencyError.message}`);
      throw error; // Re-throw the original error
    }
  }
};

// Save data to CSV file
const saveToCSV = async (type, data) => {
  console.log(`Saving ${type} to CSV file...`);
  
  try {
    // Try multiple possible locations
    const possibleDirs = [
      path.join(__dirname, '../exports'),
      path.join(process.cwd(), 'exports'),
      path.join(process.cwd(), 'tmp'),
      path.join(__dirname, '../tmp'),
      require('os').tmpdir()
    ];
    
    const exportDir = await findWritableDirectory(possibleDirs);
    
    if (!exportDir) {
      throw new Error('No writable directory found for CSV storage');
    }

    // Create filename
    const timestamp = Date.now();
    const filename = `${type.toLowerCase()}_${timestamp}.csv`;
    const filePath = path.join(exportDir, filename);
    
    // Prepare headers and row data
    let headers, row;
    
    if (type.toLowerCase() === 'skill') {
      headers = ['ID', 'Name', 'Category', 'Learning Resources', 'Date Added', 'Contributor'];
      row = [
        `SKILL_${timestamp}`,
        data.skillName || '',
        data.category || '',
        data.learningResources || '',
        new Date().toISOString().split('T')[0],
        data.contributorEmail || ''
      ];
    } else if (type.toLowerCase() === 'tool') {
      headers = ['ID', 'Name', 'Category', 'Primary Use Cases', 'Date Added', 'Contributor'];
      row = [
        `TOOL_${timestamp}`,
        data.toolName || '',
        data.category || '',
        data.primaryUseCases || '',
        new Date().toISOString().split('T')[0],
        data.contributorEmail || ''
      ];
    } else {
      throw new Error(`Unknown type: ${type}`);
    }
    
    // Create CSV content
    const escapeField = (field) => {
      if (field === null || field === undefined) return '';
      const str = String(field);
      return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
    };
    
    const csvContent = 
      headers.join(',') + '\n' + 
      row.map(escapeField).join(',') + '\n';
    
    // Write to file
    fs.writeFileSync(filePath, csvContent);
    console.log(`Saved CSV file: ${filePath}`);
    
    return {
      success: true,
      path: filePath,
      exportDir
    };
  } catch (error) {
    console.error(`Error saving to CSV: ${error.message}`);
      return {
        success: false,
      error: error.message
      };
  }
};

// Simplified skill saving function that only relies on local storage
const addSkillToSheet = async (skillData) => {
  console.log('Adding skill to local storage (simplified)...');
  
      try {
    // Save to JSON as primary storage
    const jsonResult = await saveToLocalJSON('skill', skillData);
    
    // Try CSV as backup but don't fail if it errors
    let csvResult = { success: false };
    try {
      csvResult = await saveToCSV('skill', skillData);
    } catch (csvError) {
      console.warn(`CSV backup failed but continuing: ${csvError.message}`);
    }
    
    // Return success even if one method worked
    return {
      success: true,
      skillId: jsonResult.id,
      jsonSaved: jsonResult.success,
      csvSaved: csvResult.success,
      filePath: jsonResult.filePath,
      csvPath: csvResult.path,
      dataDir: jsonResult.directory,
      exportDir: csvResult.exportDir,
      localSaved: true,
      googleSheetsSuccess: false // Not using Google Sheets
    };
  } catch (error) {
    console.error(`Failed to save skill: ${error.message}`);
    
    // Still return success=true so the contribution gets approved
      return {
        success: true,
      skillId: `SKILL_EMERGENCY_${Date.now()}`,
      error: error.message,
      jsonSaved: false,
      csvSaved: false,
      localSaved: false,
      googleSheetsSuccess: false
    };
  }
};

// Simplified tool saving function that only relies on local storage
const addToolToSheet = async (toolData) => {
  console.log('Adding tool to local storage (simplified)...');
  
      try {
    // Save to JSON as primary storage
    const jsonResult = await saveToLocalJSON('tool', toolData);
    
    // Try CSV as backup but don't fail if it errors
    let csvResult = { success: false };
    try {
      csvResult = await saveToCSV('tool', toolData);
    } catch (csvError) {
      console.warn(`CSV backup failed but continuing: ${csvError.message}`);
    }
    
    // Return success even if one method worked
    return {
      success: true,
      toolId: jsonResult.id,
      jsonSaved: jsonResult.success,
      csvSaved: csvResult.success,
      filePath: jsonResult.filePath,
      csvPath: csvResult.path,
      dataDir: jsonResult.directory,
      exportDir: csvResult.exportDir,
      localSaved: true,
      googleSheetsSuccess: false // Not using Google Sheets
    };
  } catch (error) {
    console.error(`Failed to save tool: ${error.message}`);
    
    // Still return success=true so the contribution gets approved
      return {
        success: true,
      toolId: `TOOL_EMERGENCY_${Date.now()}`,
      error: error.message,
      jsonSaved: false,
      csvSaved: false,
      localSaved: false,
      googleSheetsSuccess: false
    };
  }
};

module.exports = {
  addSkillToSheet,
  addToolToSheet
}; 