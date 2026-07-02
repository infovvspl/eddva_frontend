import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('success') || msg.text().includes('fail')) {
      console.log(`[CONSOLE] [${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('institutes') && ['PUT', 'POST'].includes(response.request().method())) {
      console.log(`[NETWORK] ${response.request().method()} ${response.url()} -> ${response.status()}`);
    }
  });

  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'schoolsuperadmin@gmail.com');
    await page.fill('input[type="password"]', '12345678');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/school/super-admin', { timeout: 10000 });
    console.log('Logged in.');
    
    console.log('Navigating to Institutes...');
    await page.goto('http://localhost:8080/school/super-admin/institutes', { waitUntil: 'networkidle' });
    
    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    console.log('Table loaded.');
    
    // Find a row with "Delhi Public School" or "Army Public School"
    const row = page.locator('tr').filter({ hasText: /Delhi Public School|Army Public School/ }).first();
    const schoolName = await row.locator('td').first().textContent();
    console.log(`Testing row: ${schoolName}`);
    
    // Check initial status
    const initialStatus = await row.locator('td').nth(4).textContent(); // Assuming status is in the 5th column
    console.log(`Initial Status: ${initialStatus.trim()}`);
    
    // Suspend
    console.log('Clicking Suspend...');
    await row.locator('button[title="Suspend"], button:has-text("Suspend")').click();
    
    // Wait for confirm dialog and click confirm
    console.log('Clicking Confirm on dialog...');
    await page.locator('button:has-text("Suspend")').nth(1).click();
    
    // Wait for network response and UI update
    await page.waitForTimeout(3000);
    
    const statusAfterSuspend = await row.locator('td').nth(4).textContent();
    console.log(`Status after Suspend: ${statusAfterSuspend.trim()}`);
    
    // Reactivate
    console.log('Clicking Reactivate...');
    await row.locator('button[title="Reactivate"], button:has-text("Reactivate")').click();
    
    // Wait for confirm dialog and click confirm
    console.log('Clicking Confirm on dialog...');
    await page.locator('button:has-text("Reactivate")').nth(1).click();
    
    // Wait for network response and UI update
    await page.waitForTimeout(3000);
    
    const statusAfterReactivate = await row.locator('td').nth(4).textContent();
    console.log(`Status after Reactivate: ${statusAfterReactivate.trim()}`);
    
  } catch (e) {
    console.log('[ERROR]', e.message);
  }

  await browser.close();
}

run().catch(console.error);
