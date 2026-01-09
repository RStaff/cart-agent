import { test, expect } from '@playwright/test';

const routes = ['/', '/pricing', '/v2'];

for (const path of routes) {
  test(`200 + CTA visible → ${path}`, async ({ page, baseURL }) => {
    const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(res, `navigate ${path}`).not.toBeNull();
    expect(res!.ok()).toBeTruthy();
    await expect(page.getByRole('button', { name: 'Install' })).toBeVisible();
  });
}
