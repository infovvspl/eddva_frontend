import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });
  
  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}\n${err.stack}`);
  });

  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    await page.goto('http://localhost:8080/school/super-admin/ai-usage', { waitUntil: 'networkidle', timeout: 10000 });
  } catch (e) {
    console.log('[GOTO ERROR]', e.message);
  }

  await browser.close();
}

run().catch(console.error);
