import { readFileSync } from 'fs';
import axios from 'axios';

async function test() {
  const env = readFileSync('d:\\edtech\\eddva_frontend\\.env', 'utf-8');
  const token = env.split('\n').find(l => l.startsWith('VITE_TEST_TOKEN='))?.split('=')[1];
  
  const res = await axios.get('http://localhost:3000/school/materials', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  console.log(JSON.stringify(res.data.data.slice(0, 3), null, 2));
}

test();
