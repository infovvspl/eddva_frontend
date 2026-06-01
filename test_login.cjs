const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:3000/api/v1/school/auth/login', {
      email: "iter@gmail.com",
      password: "123"
    }, {
      headers: {
        'X-Tenant-Subdomain': 'odm',
        'Content-Type': 'application/json'
      }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Failed:", err.response?.status, err.response?.data);
  }
}

testLogin();
