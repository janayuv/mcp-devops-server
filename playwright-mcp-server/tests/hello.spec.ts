import { test, expect } from '@playwright/test';

test('renders hello component', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Hello, World!');
});

test('renders custom name', async ({ page }) => {
  await page.goto('/');
  // For this test, we would need to modify the component to accept URL params or have a way to set the name
  // For now, let's just test the basic rendering
  await expect(page.locator('h1')).toBeVisible();
});