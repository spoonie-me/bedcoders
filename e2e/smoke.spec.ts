import { test, expect } from '@playwright/test';

test.describe('smoke: public marketing surface', () => {
  test('landing page loads with main heading', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/soft reset school/i);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('navigates to pricing', async ({ page }) => {
    await page.goto('/');
    const pricingLink = page.getByRole('link', { name: /pricing/i }).first();
    if (await pricingLink.count()) {
      await pricingLink.click();
      await expect(page).toHaveURL(/pricing/i);
    } else {
      await page.goto('/pricing');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  test('signup route renders the form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
  });

  test('404 page renders for unknown routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-abc123');
    await expect(page.getByText(/404|not found/i).first()).toBeVisible();
  });
});
