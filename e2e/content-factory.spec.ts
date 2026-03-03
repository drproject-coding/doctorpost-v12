import { test, expect } from '@playwright/test';

test.describe('Content Factory Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('user can create and schedule a post', async ({ page }) => {
    // Navigate to content factory
    await page.click('[data-testid="content-factory-link"]');
    await expect(page).toHaveURL('/factory');
    
    // Start new content creation
    await page.click('[data-testid="new-content-button"]');
    
    // Fill in topic proposal
    await page.fill('[data-testid="topic-input"]', 'AI in Healthcare');
    await page.click('[data-testid="submit-topic-button"]');
    
    // Wait for research brief
    await expect(page.locator('[data-testid="research-brief"]')).toBeVisible();
    
    // Review evidence pack
    await expect(page.locator('[data-testid="evidence-pack"]')).toBeVisible();
    
    // Generate content
    await page.click('[data-testid="generate-content-button"]');
    
    // Wait for formatted output
    await expect(page.locator('[data-testid="formatted-output"]')).toBeVisible();
    
    // Review and edit content
    await page.fill('[data-testid="title-input"]', 'The Future of AI in Healthcare');
    await page.fill('[data-testid="content-input"]', 'AI is revolutionizing healthcare...');
    
    // Schedule post
    await page.click('[data-testid="schedule-button"]');
    await page.fill('[data-testid="schedule-date-input"]', '2024-02-15');
    await page.click('[data-testid="confirm-schedule-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('user can review and edit scheduled posts', async ({ page }) => {
    // Navigate to calendar
    await page.click('[data-testid="calendar-link"]');
    await expect(page).toHaveURL('/calendar');
    
    // Find a scheduled post
    await expect(page.locator('[data-testid="scheduled-post"]')).toBeVisible();
    
    // Click on post to edit
    await page.click('[data-testid="edit-post-button"]');
    
    // Verify modal opens
    await expect(page.locator('[data-testid="post-editor-modal"]')).toBeVisible();
    
    // Make edits
    await page.fill('[data-testid="title-input"]', 'Updated Post Title');
    await page.click('[data-testid="save-changes-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('user can manage knowledge base', async ({ page }) => {
    // Navigate to knowledge
    await page.click('[data-testid="knowledge-link"]');
    await expect(page).toHaveURL('/knowledge');
    
    // Add new document
    await page.click('[data-testid="add-document-button"]');
    await page.fill('[data-testid="document-name-input"]', 'Brand Guidelines');
    await page.fill('[data-testid="document-content-input"]', 'Our brand voice...');
    await page.click('[data-testid="save-document-button"]');
    
    // Verify document was added
    await expect(page.locator('[data-testid="document-list"]')).toContainText('Brand Guidelines');
    
    // Edit document
    await page.click('[data-testid="edit-document-button"]');
    await page.fill('[data-testid="document-content-input"]', 'Updated brand voice...');
    await page.click('[data-testid="update-document-button"]');
    
    // Verify update
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});