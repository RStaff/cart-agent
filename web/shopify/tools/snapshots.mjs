import { chromium } from 'playwright';
const owner = process.env.GH_OWNER || "RStaff";
const repo  = process.env.GH_REPO  || "cart-agent";
const base  = `https://${owner}.github.io/${repo}/`;

const shots = [
  { name: 'landing-desktop', url: base, w: 1600, h: 900 },
  { name: 'landing-mobile',  url: base, w: 390,  h: 844 },   // iPhone 13-ish
];

const outDir = 'branding/screenshots';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 2, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  for (const s of shots) {
    await page.setViewportSize({ width: s.w, height: s.h });
    await page.goto(s.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600); // settle animations
    await page.screenshot({ path: `${outDir}/${s.name}.png` });
    console.log(`✓ ${s.name}.png`);
  }

  await browser.close();
})();
