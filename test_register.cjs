const axios = require('axios');

async function testRegister() {
  try {
    const res = await axios.post('http://localhost:3000/api/v1/school/auth/register', {
      instituteName: "Test Institute",
      name: "Test Admin",
      email: "testadmin@gmail.com",
      password: "password123",
      tenantDomain: "testinst",
      tenant_domain: "testinst"
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Failed:", err.response?.status, err.response?.data);
  }
}

testRegister();
