import { test, expect } from '@playwright/test';

test('pricing page has plan cards and Install CTA', async ({ page }) => {
  const res = await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
  expect(res!.ok()).toBeTruthy();

  // CTA presence (be flexible on wording)
  const cta = page.getByRole('button', { name: /install|start trial|get started/i });
  await expect(cta).toBeVisible();

  // Plan headings: try h2, then h3 as a fallback
  const h2 = page.getByRole('heading', { level: 2 });
  let count = await h2.count();
  if (count < 2) {
    const h3 = page.getByRole('heading', { level: 3 });
    count = Math.max(count, await h3.count());
  }

  expect(count).toBeGreaterThan(1); // at least 2 plan-like headings
});
