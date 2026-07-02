import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}\n${err.stack}`);
  });

  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle' });
    
    console.log('Logging in...');
    await page.fill('input[type="email"]', 'schoolsuperadmin@gmail.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    if (page.url().includes('login')) {
      console.log('Login failed with password, trying 12345678...');
      await page.fill('input[type="password"]', '12345678');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }
    
    console.log('URL after login:', page.url());

    console.log('Navigating to ai-usage...');
    await page.goto('http://localhost:8080/school/super-admin/ai-usage', { waitUntil: 'networkidle' });
    
    console.log('Done waiting on ai-usage. URL:', page.url());
  } catch (e) {
    console.log('[ERROR]', e.message);
  }

  await browser.close();
}

run().catch(console.error);
