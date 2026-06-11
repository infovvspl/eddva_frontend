import { readFileSync } from 'fs';

async function test() {
  const env = readFileSync('d:\\edtech\\eddva_frontend\\.env', 'utf-8');
  const token = env.split('\n').find(l => l.startsWith('VITE_TEST_TOKEN='))?.split('=')[1].trim();
  
  const res = await fetch('http://localhost:3000/api/v1/school/materials', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
