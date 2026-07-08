import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5173/';
const out = process.argv[3] || '/tmp/opencode/screenshot_globe.png';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
await page.goto(url, { waitUntil: 'networkidle' });

// Click through launch -> name entry -> cover -> globe
await page.click('button:has-text("ENTER")');
await page.waitForTimeout(400);
await page.fill('input', 'Auditor');
await page.click('button:has-text("CONTINUE")');
await page.waitForTimeout(400);
await page.locator('.cover-card').first().click();
await page.waitForTimeout(500);

await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('globe screenshot saved to', out);
