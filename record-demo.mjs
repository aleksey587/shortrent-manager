import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function recordTikTokDemo() {
  const outputDir = path.resolve('C:/Users/User/.gemini/antigravity/brain/2082e158-a11e-4a08-87c8-a332f8f9b469/videos');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Launch Chromium
  const browser = await chromium.launch({ headless: true });
  
  // Mobile TikTok vertical viewport 9:16 (450 x 800)
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 }, // iPhone 15 Pro dimensions
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    recordVideo: {
      dir: outputDir,
      size: { width: 430, height: 932 }
    }
  });

  const page = await context.newPage();

  console.log('Navigating to GreekHost...');
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(1500);

  // Auto-login or register demo account
  try {
    await page.fill('input[type="email"]', 'alexis.mech87@gmail.com');
    await page.fill('input[type="password"]', '12345678');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2500);
  } catch (e) {
    console.log('Login attempt completed');
  }

  // Navigate to Dashboard Overview
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForTimeout(3000);

  // Scroll smoothly down overview
  await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
  await page.waitForTimeout(2000);

  // Navigate to Tax Hub & AADE (/dashboard/aade)
  await page.goto('http://localhost:3000/dashboard/aade');
  await page.waitForTimeout(3000);

  // Scroll down Tax Hub to highlight 8€/2€ Climate Fee & Tax scale
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollBy({ top: 450, behavior: 'smooth' }));
  await page.waitForTimeout(2500);

  // Navigate to Bookings (/dashboard/bookings)
  await page.goto('http://localhost:3000/dashboard/bookings');
  await page.waitForTimeout(3000);

  // Navigate to Pricing & Subscriptions (/dashboard/pricing)
  await page.goto('http://localhost:3000/dashboard/pricing');
  await page.waitForTimeout(3000);

  // Toggle between Monthly & Yearly
  try {
    const yearlyBtn = await page.locator('text=Ετήσια Χρέωση');
    if (await yearlyBtn.isVisible()) {
      await yearlyBtn.click();
      await page.waitForTimeout(2000);
    }
  } catch(e) {}

  await page.waitForTimeout(2000);

  console.log('Demo recording complete. Closing...');
  await page.close();
  await context.close();
  await browser.close();
}

recordTikTokDemo().catch(console.error);
