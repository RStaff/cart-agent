import pkg from "../../../abando-frontend/node_modules/playwright/index.js";

const { chromium, devices } = pkg;

const url = "https://no-kings-athletics.myshopify.com";
const outDir = "staffordos/audits/no_kings/evidence/before";

async function captureDesktop() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1
  });

  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

  await page.screenshot({
    path: `${outDir}/homepage_desktop_before.png`,
    fullPage: true
  });

  await browser.close();
}

async function captureMobile() {
  const browser = await chromium.launch({ headless: true });
  const iphone = devices["iPhone 13"];
  const context = await browser.newContext(iphone);
  const page = await context.newPage();

  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

  await page.screenshot({
    path: `${outDir}/homepage_mobile_before.png`,
    fullPage: true
  });

  await browser.close();
}

await captureDesktop();
await captureMobile();

console.log("Captured before evidence:");
console.log(`${outDir}/homepage_desktop_before.png`);
console.log(`${outDir}/homepage_mobile_before.png`);
