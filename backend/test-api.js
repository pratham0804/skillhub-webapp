const axios = require('axios');

async function testAPI() {
  const ports = [5000, 50001];
  
  for (const port of ports) {
    try {
      console.log(`\nTesting port ${port}...`);
      const response = await axios.get(`http://localhost:${port}/api/learning/skill/javascript`);
      
      console.log(`✅ Port ${port} - Response status:`, response.status);
      console.log('Response data sample:');
      if (response.data.data && response.data.data.length > 0) {
        console.log(`Found ${response.data.data.length} resources:`);
        response.data.data.slice(0, 2).forEach((resource, index) => {
          console.log(`${index + 1}. ${resource.title} (${resource.source || 'Unknown source'})`);
        });
        console.log(`✅ Server is running on port ${port}`);
        return port;
      }
    } catch (error) {
      console.log(`❌ Port ${port} - Error:`, error.message);
    }
  }
  
  console.log('\n❌ No working server found on any port!');
}

testAPI(); 