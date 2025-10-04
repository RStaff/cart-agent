import { test, expect } from '@playwright/test';

test('pricing page has plan cards and Install CTA', async ({ page }) => {
  const res = await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
  expect(res!.ok()).toBeTruthy();

  // Be resilient to wording—look for multiple CTAs
  await expect(
    page.getByRole('button', { name: /install|start trial|get started/i })
  ).toBeVisible();

  // Generic card sanity: at least 2 headings that look like plans
  const headings = page.getByRole('heading', { level: 2 });
  await expect(headings).toHaveCountGreaterThan(1);
});
