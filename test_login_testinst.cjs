const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:3000/api/v1/school/auth/login', {
      email: "testadmin@gmail.com",
      password: "password123"
    }, {
      headers: {
        'X-Tenant-Subdomain': 'testinst',
        'Content-Type': 'application/json'
      }
    });
    console.log("Login Success:", res.data);
  } catch (err) {
    console.error("Login Failed:", err.response?.status, err.response?.data);
  }
}

testLogin();
