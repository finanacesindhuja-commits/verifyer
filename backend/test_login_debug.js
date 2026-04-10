const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:5005/staff/login', {
      staff_id: 'TEST',
      password: 'TEST'
    });
    console.log('Response:', res.status, res.data);
  } catch (err) {
    console.error('Error:', err.response?.status, err.response?.data || err.message);
  }
}

testLogin();
