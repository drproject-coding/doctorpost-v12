import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can login and access protected pages', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Check that login form is visible
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
    
    // Fill in login form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('user cannot access protected pages without authentication', async ({ page }) => {
    // Try to access protected page directly
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
  });

  test('user can logout successfully', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Click logout
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
  });
});