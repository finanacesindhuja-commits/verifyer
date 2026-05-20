const axios = require('axios');
require('dotenv').config();

const PORT = process.env.PORT || 5006;
const apiUrl = `http://localhost:${PORT}`;

async function testStats() {
  try {
    console.log(`Testing endpoint: ${apiUrl}/api/stats`);
    const res = await axios.get(`${apiUrl}/api/stats`);
    console.log('Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Test failed:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    }
  }
}

testStats();
