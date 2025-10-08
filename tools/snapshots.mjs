import { chromium } from 'playwright';
const owner = process.env.GH_OWNER || "RStaff";
const repo  = process.env.GH_REPO  || "cart-agent";
const base  = `https://${owner}.github.io/${repo}/`;
const shots = [
  { name: 'abando-landing-desktop', url: base, w: 1600, h: 900 },
  { name: 'abando-landing-mobile',  url: base, w: 390,  h: 844 },
];
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  for (const s of shots) {
    await page.setViewportSize({ width: s.w, height: s.h });
    await page.goto(s.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `branding/screenshots/${s.name}.png` });
    console.log(`✓ ${s.name}.png`);
  }
  await browser.close();
})();
