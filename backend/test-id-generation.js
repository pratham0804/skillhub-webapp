const sheetsUpdateService = require('./services/sheetsUpdateService');

async function testIdGeneration() {
  console.log('=== Testing ID Generation and Formatting ===');
  
  try {
    // Test skill data
    const testSkillData = {
      skillName: 'Test Skill - Delete Me',
      category: 'Testing',
      description: 'This is a test skill that can be deleted',
      contributorEmail: 'test@example.com'
    };
    
    console.log('\n1. Testing Skill ID Generation...');
    const skillResult = await sheetsUpdateService.addSkillToSheet(testSkillData);
    console.log('Skill Result:', skillResult);
    
    // Test tool data
    const testToolData = {
      toolName: 'Test Tool - Delete Me',
      category: 'Testing',
      description: 'This is a test tool that can be deleted',
      contributorEmail: 'test@example.com'
    };
    
    console.log('\n2. Testing Tool ID Generation...');
    const toolResult = await sheetsUpdateService.addToolToSheet(testToolData);
    console.log('Tool Result:', toolResult);
    
    console.log('\n=== Test Complete ===');
    console.log('✅ Check your Google Sheets to verify:');
    console.log('   - Skills have IDs like SK001, SK002, etc.');
    console.log('   - Tools have IDs like T001, T002, etc.');
    console.log('   - New rows have proper borders and formatting');
    console.log('   - You can delete the test entries manually');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  process.exit(0);
}

testIdGeneration(); 