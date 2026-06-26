const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const axios = require('axios');

function extractData(response) {
  const d = response.data;
  if (d && typeof d === 'object' && 'data' in d) {
    return d.data;
  }
  return d;
}

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:eddva-dev@eddva-dev.cpo2kqqgu55d.ap-south-1.rds.amazonaws.com:5432/eddva_coaching',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query(`SELECT id, email FROM users WHERE role = 'super_admin' AND status = 'active' LIMIT 1`);
    if (res.rows.length === 0) {
      console.log('No super admin found');
      return;
    }
    
    const admin = res.rows[0];
    const token = jwt.sign(
      { sub: admin.id, email: admin.email, role: 'super_admin' },
      'your-super-secret-jwt-key-change-in-production',
      { expiresIn: '1h' }
    );

    console.log('--- 1. Calling /admin/stats endpoint ---');
    const response = await axios.get('http://localhost:3000/api/v1/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('\n--- 2. Raw JSON Response (response.data) ---');
    console.log(JSON.stringify(response.data, null, 2));

    console.log('\n--- 3. Extracted Stats Object (extractData(response)) ---');
    const stats = extractData(response);
    
    console.log('\n--- 4. Checking Data Loss ---');
    console.log('stats.studentFocus exists?', !!stats.studentFocus);
    console.log('stats.studentFocus:', JSON.stringify(stats.studentFocus, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) console.error(err.response.data);
  } finally {
    await client.end();
  }
}

run();
