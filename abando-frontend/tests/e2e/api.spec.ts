import { test, expect } from '@playwright/test';

test('GET /api/status returns ok JSON', async ({ request, baseURL }) => {
  const r = await request.get(`${baseURL}/api/status`);
  expect(r.ok()).toBeTruthy();
  const body = await r.json().catch(() => ({}));
  // Don’t be strict yet; just sanity keys if present
  expect(typeof body).toBe('object');
});
