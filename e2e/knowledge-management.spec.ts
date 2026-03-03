import { test, expect, Page, Route } from "@playwright/test";
import path from "path";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Authenticate and land on /dashboard before each test. */
async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "testpassword");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/dashboard");
}

/** Navigate to the knowledge base section. */
async function goToKnowledge(page: Page): Promise<void> {
  await page.click('[data-testid="knowledge-link"]');
  await expect(page).toHaveURL("/knowledge");
  await expect(page.locator('[data-testid="knowledge-page"]')).toBeVisible();
}

/**
 * Mock the knowledge classification API so tests do not depend on an external
 * AI service.  The mock returns a fixed classification payload.
 */
function mockClassificationAPI(page: Page): void {
  page.route("**/api/knowledge/classify**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        category: "Brand Guidelines",
        confidence: 0.97,
        tags: ["brand", "voice", "guidelines"],
        documentType: "policy",
        summary: "Brand voice and tone guidelines document.",
      }),
    });
  });
}

/**
 * Mock the template extraction API to return a fixed set of templates.
 */
function mockExtractionAPI(page: Page): void {
  page.route("**/api/knowledge/extract-templates**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        templates: [
          {
            id: "tpl-001",
            name: "Introduction Template",
            content: "Welcome to {{brand}}. We are committed to {{value}}.",
            variables: ["brand", "value"],
          },
          {
            id: "tpl-002",
            name: "Closing Template",
            content: "Thank you for choosing {{brand}}.",
            variables: ["brand"],
          },
        ],
      }),
    });
  });
}

// ---------------------------------------------------------------------------
// Page Object — KnowledgeBasePage
// ---------------------------------------------------------------------------

class KnowledgeBasePage {
  constructor(private page: Page) {}

  // Locators ---------------------------------------------------------------

  get documentList() {
    return this.page.locator('[data-testid="document-list"]');
  }

  get addDocumentButton() {
    return this.page.locator('[data-testid="add-document-button"]');
  }

  get uploadFileInput() {
    return this.page.locator('[data-testid="file-upload-input"]');
  }

  get documentNameInput() {
    return this.page.locator('[data-testid="document-name-input"]');
  }

  get documentContentInput() {
    return this.page.locator('[data-testid="document-content-input"]');
  }

  get documentCategorySelect() {
    return this.page.locator('[data-testid="document-category-select"]');
  }

  get saveDocumentButton() {
    return this.page.locator('[data-testid="save-document-button"]');
  }

  get updateDocumentButton() {
    return this.page.locator('[data-testid="update-document-button"]');
  }

  get successMessage() {
    return this.page.locator('[data-testid="success-message"]');
  }

  get errorMessage() {
    return this.page.locator('[data-testid="error-message"]');
  }

  get classificationBadge() {
    return this.page.locator('[data-testid="classification-badge"]');
  }

  get versionHistoryButton() {
    return this.page.locator('[data-testid="version-history-button"]');
  }

  get versionHistoryPanel() {
    return this.page.locator('[data-testid="version-history-panel"]');
  }

  get versionItems() {
    return this.page.locator('[data-testid="version-item"]');
  }

  get extractTemplatesButton() {
    return this.page.locator('[data-testid="extract-templates-button"]');
  }

  get templatesPanel() {
    return this.page.locator('[data-testid="templates-panel"]');
  }

  get templateItems() {
    return this.page.locator('[data-testid="template-item"]');
  }

  get searchInput() {
    return this.page.locator('[data-testid="search-input"]');
  }

  get categoryFilter() {
    return this.page.locator('[data-testid="category-filter"]');
  }

  get dateFromFilter() {
    return this.page.locator('[data-testid="date-from-filter"]');
  }

  get dateToFilter() {
    return this.page.locator('[data-testid="date-to-filter"]');
  }

  get typeFilter() {
    return this.page.locator('[data-testid="type-filter"]');
  }

  get filterResultsCount() {
    return this.page.locator('[data-testid="filter-results-count"]');
  }

  get deleteDocumentButton() {
    return this.page.locator('[data-testid="delete-document-button"]');
  }

  get confirmDeleteButton() {
    return this.page.locator('[data-testid="confirm-delete-button"]');
  }

  get restoreDocumentButton() {
    return this.page.locator('[data-testid="restore-document-button"]');
  }

  get trashSection() {
    return this.page.locator('[data-testid="trash-section"]');
  }

  get bulkSelectCheckbox() {
    return this.page.locator('[data-testid="bulk-select-checkbox"]');
  }

  get bulkUploadButton() {
    return this.page.locator('[data-testid="bulk-upload-button"]');
  }

  get bulkDeleteButton() {
    return this.page.locator('[data-testid="bulk-delete-button"]');
  }

  get documentItems() {
    return this.page.locator('[data-testid="document-item"]');
  }

  get useTemplateButton() {
    return this.page.locator('[data-testid="use-template-button"]');
  }

  get templateVariableInput() {
    return this.page.locator('[data-testid="template-variable-input"]');
  }

  get templatePreview() {
    return this.page.locator('[data-testid="template-preview"]');
  }

  // Actions ----------------------------------------------------------------

  async openNewDocumentForm(): Promise<void> {
    await this.addDocumentButton.click();
    await expect(this.documentNameInput).toBeVisible();
  }

  async fillDocumentForm(
    name: string,
    content: string,
    category?: string,
  ): Promise<void> {
    await this.documentNameInput.fill(name);
    await this.documentContentInput.fill(content);
    if (category) {
      await this.documentCategorySelect.selectOption(category);
    }
  }

  async saveDocument(): Promise<void> {
    await this.saveDocumentButton.click();
    await expect(this.successMessage).toBeVisible();
  }

  async clickDocument(nameSubstring: string): Promise<void> {
    await this.documentList.locator(`text=${nameSubstring}`).click();
  }

  async deleteDocument(): Promise<void> {
    await this.deleteDocumentButton.click();
    await expect(this.confirmDeleteButton).toBeVisible();
    await this.confirmDeleteButton.click();
  }
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe("Knowledge Base Document Management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToKnowledge(page);
  });

  // -------------------------------------------------------------------------
  // Scenario 1: Upload document — ingest content, verify classification
  // -------------------------------------------------------------------------

  test.describe("Scenario 1: Upload document and verify classification", () => {
    test("happy path — upload doc, classify, extract, search", async ({
      page,
    }) => {
      const kb = new KnowledgeBasePage(page);
      mockClassificationAPI(page);
      mockExtractionAPI(page);

      // Step 1: Open new document form
      await kb.openNewDocumentForm();

      // Step 2: Fill in document details
      await kb.fillDocumentForm(
        "Brand Voice Guidelines",
        "Our brand voice is friendly, professional, and authoritative. We speak directly to our audience with clarity and empathy.",
        "Brand Guidelines",
      );

      // Step 3: Upload a supporting file
      await kb.uploadFileInput.setInputFiles({
        name: "brand-guidelines.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4 mock pdf content for testing purposes"),
      });

      // Step 4: Save and wait for classification
      const classifyResponse = page.waitForResponse(
        "**/api/knowledge/classify**",
      );
      await kb.saveDocumentButton.click();
      await classifyResponse;

      // Step 5: Verify classification badge appears with correct category
      await expect(kb.classificationBadge).toBeVisible();
      await expect(kb.classificationBadge).toContainText("Brand Guidelines");

      // Step 6: Verify document appears in the list
      await expect(kb.documentList).toContainText("Brand Voice Guidelines");

      // Step 7: Extract templates from the document
      await kb.clickDocument("Brand Voice Guidelines");
      const extractResponse = page.waitForResponse(
        "**/api/knowledge/extract-templates**",
      );
      await kb.extractTemplatesButton.click();
      await extractResponse;

      await expect(kb.templatesPanel).toBeVisible();
      await expect(kb.templateItems).toHaveCount(2);
      await expect(kb.templateItems.first()).toContainText(
        "Introduction Template",
      );

      // Step 8: Search for the uploaded document
      await kb.searchInput.fill("Brand Voice");
      await expect(kb.documentList).toContainText("Brand Voice Guidelines");
      await expect(kb.filterResultsCount).toBeVisible();

      await page.screenshot({
        path: "playwright-report/upload-classify-extract-search.png",
      });
    });

    test("file upload — accepts PDF, DOCX, TXT formats", async ({ page }) => {
      const kb = new KnowledgeBasePage(page);
      mockClassificationAPI(page);

      const formats = [
        { name: "policy.pdf", mimeType: "application/pdf" as const },
        {
          name: "guide.docx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" as const,
        },
        { name: "notes.txt", mimeType: "text/plain" as const },
      ];

      for (const fmt of formats) {
        await kb.openNewDocumentForm();
        await kb.documentNameInput.fill(`Test Document ${fmt.name}`);
        await kb.uploadFileInput.setInputFiles({
          name: fmt.name,
          mimeType: fmt.mimeType,
          buffer: Buffer.from(`Mock content for ${fmt.name}`),
        });
        await kb.saveDocumentButton.click();
        await expect(kb.successMessage).toBeVisible();
      }
    });

    test("classification failure shows error state", async ({ page }) => {
      const kb = new KnowledgeBasePage(page);

      // Override to return an error
      await page.route("**/api/knowledge/classify**", async (route) => {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: "Classification service unavailable" }),
        });
      });

      await kb.openNewDocumentForm();
      await kb.fillDocumentForm(
        "Unclassified Doc",
        "Some content that cannot be classified.",
      );
      await kb.saveDocumentButton.click();

      // Document should still save but show classification-failed state
      await expect(kb.documentList).toContainText("Unclassified Doc");
      await expect(
        page.locator('[data-testid="classification-failed-badge"]'),
      ).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Scenario 2: Version history — track document updates
  // -------------------------------------------------------------------------

  test.describe("Scenario 2: Version history", () => {
    test("multiple versions — edit document and verify version history", async ({
      page,
    }) => {
      const kb = new KnowledgeBasePage(page);
      mockClassificationAPI(page);

      // Create initial document
      await kb.openNewDocumentForm();
      await kb.fillDocumentForm(
        "Evolving Policy Doc",
        "Version 1: Initial policy content.",
        "Policy",
      );
      await kb.saveDocumentButton.click();
      await expect(kb.successMessage).toBeVisible();

      // Open document to edit — version 2
      await kb.clickDocument("Evolving Policy Doc");
      await kb.documentContentInput.fill(
        "Version 2: Updated policy with new compliance requirements.",
      );
      await kb.updateDocumentButton.click();
      await expect(kb.successMessage).toBeVisible();

      // Edit again — version 3
      await kb.documentContentInput.fill(
        "Version 3: Final approved policy with all amendments.",
      );
      await kb.updateDocumentButton.click();
      await expect(kb.successMessage).toBeVisible();

      // Open version history panel
      await kb.versionHistoryButton.click();
      await expect(kb.versionHistoryPanel).toBeVisible();

      // Verify three versions are tracked
      await expect(kb.versionItems).toHaveCount(3);

      // Verify version labels — most recent first
      await expect(kb.versionItems.nth(0)).toContainText("Version 3");
      await expect(kb.versionItems.nth(1)).toContainText("Version 2");
      await expect(kb.versionItems.nth(2)).toContainText("Version 1");

      // Restore version 1
      await kb.versionItems
        .nth(2)
        .locator('[data-testid="restore-version-button"]')
        .click();
      await expect(
        page.locator('[data-testid="restore-version-confirm"]'),
      ).toBeVisible();
      await page.locator('[data-testid="restore-version-confirm"]').click();
      await expect(kb.successMessage).toBeVisible();

      // Content should reflect version 1
      await expect(kb.documentContentInput).toHaveValue(
        "Version 1: Initial policy content.",
      );

      await page.screenshot({ path: "playwright-report/version-history.png" });
    });

    test("version diff view shows changes between versions", async ({
      page,
    }) => {
      const kb = new KnowledgeBasePage(page);
      mockClassificationAPI(page);

      await kb.openNewDocumentForm();
      await kb.fillDocumentForm(
        "Diff Test Doc",
        "Original line one. Original line two.",
      );
      await kb.saveDocumentButton.click();

      await kb.clickDocument("Diff Test Doc");
      await kb.documentContentInput.fill(
        "Modified line one. Original line two. Added line three.",
      );
      await kb.updateDocumentButton.click();

      await kb.versionHistoryButton.click();
      await kb.versionItems
        .nth(0)
        .locator('[data-testid="view-diff-button"]')
        .click();

      await expect(
        page.locator('[data-testid="version-diff-panel"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="diff-added"]')).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Scenario 3: Bulk operations — upload multiple docs at once
  // -------------------------------------------------------------------------

  test.describe("Scenario 3: Bulk operations", () => {
    test("bulk upload — upload multiple documents simultaneously", async ({
      page,
    }) => {
      const kb = new KnowledgeBasePage(page);
      mockClassificationAPI(page);

      await kb.bulkUploadButton.click();
      await expect(
        page.locator('[data-testid="bulk-upload-dropzone"]'),
      ).toBeVisible();

      // Upload three files at once
      await kb.uploadFileInput.setInputFiles([
        {
          name: "doc-alpha.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("Alpha content"),
        },
        {
          name: "doc-beta.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("Beta content"),
        },
        {
          name: "doc-gamma.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("Gamma content"),
        },
      ]);

      await expect(
        page.locator('[data-testid="bulk-upload-preview"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="bulk-upload-file-row"]'),
      ).toHaveCount(3);

      await page.locator('[data-testid="confirm-bulk-upload-button"]').click();

      // All three should appear in the document list
      await expect(kb.documentList).toContainText("doc-alpha");
      await expect(kb.documentList).toContainText("doc-beta");
      await expect(kb.documentList).toContainText("doc-gamma");

      // Verify count increased by 3
      await expect(kb.documentItems).toHaveCount(3);

      await page.screenshot({ path: "playwright-report/bulk-upload.png" });
    });

    test("bulk delete — select multiple documents and delete", async ({
      page,
    }) => {
      const kb = new KnowledgeBasePage(page);
      mockClassificationAPI(page);

      // Pre-create two documents
      for (const name of ["Bulk Doc A", "Bulk Doc B"]) {
        await kb.openNewDocumentForm();
        await kb.fillDocumentForm(name, `Content for ${name}`);
        await kb.saveDocumentButton.click();
        await expect(kb.successMessage).toBeVisible();
      }

      // Select first two documents via checkboxes
      const checkboxes = page.locator('[data-testid="document-checkbox"]');
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();

      await expect(kb.bulkDeleteButton).toBeVisible();
      await kb.bulkDeleteButton.click();
      await expect(kb.confirmDeleteButton).toBeVisible();
      await kb.confirmDeleteButton.click();

      await expect(kb.successMessage).toBeVisible();
      await expect(kb.documentList).not.toContainText("Bulk Doc A");
      await expect(kb.documentList).not.toContainText("Bulk Doc B");
    });
  });

  // -------------------------------------------------------------------------
  // Scenario 4: Template extraction — extract and use templates
  // -------------------------------------------------------------------------

  test.describe("Scenario 4: Template extraction", () => {
    test("extract templates from document and use one in content creation", async ({
      page,
    }) => {
      const kb = new KnowledgeBasePage(page);
      mockClassificationAPI(page);
      mockExtractionAPI(page);

      // Create document
      await kb.openNewDocumentForm();
      await kb.fillDocumentForm(
        "Template Source Doc",
        "Welcome to {{brand}}. We are committed to {{value}}. Thank you for choosing {{brand}}.",
        "Brand Guidelines",
      );
      await kb.saveDocumentButton.click();
      await expect(kb.successMessage).toBeVisible();

      // Open document and extract templates
      await kb.clickDocument("Template Source Doc");
      const extractResponse = page.waitForResponse(
        "**/api/knowledge/extract-templates**",
      );
      await kb.extractTemplatesButton.click();
      await extractResponse;

      // Verify templates panel shows extracted templates
      await expect(kb.templatesPanel).toBeVisible();
      await expect(kb.templateItems).toHaveCount(2);

      const firstTemplate = kb.templateItems.first();
      await expect(firstTemplate).toContainText("Introduction Template");
      await expect(firstTemplate).toContainText("{{brand}}");
      await expect(firstTemplate).toContainText("{{value}}");

      // Use the first template
      await firstTemplate
        .locator('[data-testid="use-template-button"]')
        .click();
      await expect(
        page.locator('[data-testid="template-builder"]'),
      ).toBeVisible();

      // Fill in template variables
      await page
        .locator('[data-testid="template-variable-brand"]')
        .fill("DoctorPost");
      await page
        .locator('[data-testid="template-variable-value"]')
        .fill("innovation");

      // Verify live preview updates
      await expect(kb.templatePreview).toContainText("Welcome to DoctorPost");
      await expect(kb.templatePreview).toContainText(
        "We are committed to innovation",
      );

      // Save the generated content
      await page.locator('[data-testid="save-template-output-button"]').click();
      await expect(kb.successMessage).toBeVisible();

      await page.screenshot({
        path: "playwright-report/template-extraction.png",
      });
    });

    test("extraction pipeline handles document with no recognizable templates", async ({
      page,
    }) => {
      const kb = new KnowledgeBasePage(page);
      mockClassificationAPI(page);

      // Override extraction to return empty list
      await page.route(
        "**/api/knowledge/extract-templates**",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ templates: [] }),
          });
        },
      );

      await kb.openNewDocumentForm();
      await kb.fillDocumentForm(
        "No Templates Doc",
        "This document has free-form content without any template variables.",
      );
      await kb.saveDocumentButton.click();

      await kb.clickDocument("No Templates Doc");
      const extractResponse = page.waitForResponse(
        "**/api/knowledge/extract-templates**",
      );
      await kb.extractTemplatesButton.click();
      await extractResponse;

      await expect(kb.templatesPanel).toBeVisible();
      await expect(
        page.locator('[data-testid="no-templates-message"]'),
      ).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Scenario 5: Search & filter — find documents by category, date, type
  // -------------------------------------------------------------------------

  test.describe("Scenario 5: Search and filter", () => {
    test("filter by category — shows only matching documents", async ({
      page,
    }) => {
      const kb = new KnowledgeBasePage(page);
      mockClassificationAPI(page);

      // Create documents in different categories
      const documents = [
        { name: "HR Policy 2024", content: "HR content", category: "Policy" },
        {
          name: "Brand Voice Doc",
          content: "Brand content",
          category: "Brand Guidelines",
        },
        {
          name: "Q1 Playbook",
          content: "Playbook content",
          category: "Playbook",
        },
      ];

      for (const doc of documents) {
        await kb.openNewDocumentForm();
        await kb.fillDocumentForm(doc.name, doc.content, doc.category);
        await kb.saveDocumentButton.click();
        await expect(kb.successMessage).toBeVisible();
      }

      // Filter by Policy
      await kb.categoryFilter.selectOption("Policy");
      await expect(kb.documentList).toContainText("HR Policy 2024");
      await expect(kb.documentList).not.toContainText("Brand Voice Doc");
      await expect(kb.documentList).not.toContainText("Q1 Playbook");

      // Filter by Brand Guidelines
      await kb.categoryFilter.selectOption("Brand Guidelines");
      await expect(kb.documentList).toContainText("Brand Voice Doc");
      await expect(kb.documentList).not.toContainText("HR Policy 2024");

      await page.screenshot({
        path: "playwright-report/filter-by-category.png",
      });
    });

    test("filter by date range — shows only documents within range", async ({
      page,
    }) => {
      const kb = new KnowledgeBasePage(page);

      await kb.dateFromFilter.fill("2025-01-01");
      await kb.dateToFilter.fill("2025-12-31");
      await page.locator('[data-testid="apply-filters-button"]').click();

      await expect(kb.filterResultsCount).toBeVisible();
      // All visible documents should fall within the date range
      const items = kb.documentItems;
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        await expect(
          items.nth(i).locator('[data-testid="document-date"]'),
        ).toBeVisible();
      }
    });

    test("filter by document type — shows only matching type", async ({
      page,
    }) => {
      const kb = new KnowledgeBasePage(page);
      mockClassificationAPI(page);

      await kb.typeFilter.selectOption("policy");
      await page.locator('[data-testid="apply-filters-button"]').click();

      const items = kb.documentItems;
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        await expect(
          items.nth(i).locator('[data-testid="document-type-badge"]'),
        ).toContainText("policy");
      }
    });

    test("keyword search — returns matching documents", async ({ page }) => {
      const kb = new KnowledgeBasePage(page);
      mockClassificationAPI(page);

      // Create two searchable documents
      await kb.openNewDocumentForm();
      await kb.fillDocumentForm(
        "Compliance Handbook",
        "This document outlines regulatory compliance procedures.",
      );
      await kb.saveDocumentButton.click();

      await kb.openNewDocumentForm();
      await kb.fillDocumentForm(
        "Marketing Playbook",
        "This document outlines campaign strategy.",
      );
      await kb.saveDocumentButton.click();

      // Search for "compliance"
      await kb.searchInput.fill("compliance");
      await expect(kb.documentList).toContainText("Compliance Handbook");
      await expect(kb.documentList).not.toContainText("Marketing Playbook");

      // Clear search — both should be visible again
      await kb.searchInput.clear();
      await expect(kb.documentList).toContainText("Compliance Handbook");
      await expect(kb.documentList).toContainText("Marketing Playbook");
    });

    test("combined filters — category + keyword + date", async ({ page }) => {
      const kb = new KnowledgeBasePage(page);
      mockClassificationAPI(page);

      await kb.searchInput.fill("policy");
      await kb.categoryFilter.selectOption("Policy");
      await kb.dateFromFilter.fill("2025-01-01");
      await kb.dateToFilter.fill("2026-12-31");
      await page.locator('[data-testid="apply-filters-button"]').click();

      await expect(kb.filterResultsCount).toBeVisible();
      // All results should match the Policy category
      const items = kb.documentItems;
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        await expect(
          items.nth(i).locator('[data-testid="document-category-badge"]'),
        ).toContainText("Policy");
      }

      await page.screenshot({ path: "playwright-report/combined-filters.png" });
    });
  });

  // -------------------------------------------------------------------------
  // Scenario 5 (cont.): Delete & restore — remove and recover documents
  // -------------------------------------------------------------------------

  test.describe("Scenario 5: Delete and restore", () => {
    test("delete document — moves to trash, removes from active list", async ({
      page,
    }) => {
      const kb = new KnowledgeBasePage(page);
      mockClassificationAPI(page);

      // Create a document to delete
      await kb.openNewDocumentForm();
      await kb.fillDocumentForm(
        "Document To Delete",
        "This document will be deleted.",
      );
      await kb.saveDocumentButton.click();
      await expect(kb.successMessage).toBeVisible();
      await expect(kb.documentList).toContainText("Document To Delete");

      // Delete it
      await kb.clickDocument("Document To Delete");
      await kb.deleteDocument();

      await expect(kb.successMessage).toBeVisible();
      await expect(kb.documentList).not.toContainText("Document To Delete");

      await page.screenshot({ path: "playwright-report/delete-document.png" });
    });

    test("restore document — recovers from trash to active list", async ({
      page,
    }) => {
      const kb = new KnowledgeBasePage(page);
      mockClassificationAPI(page);

      // Create and then delete a document
      await kb.openNewDocumentForm();
      await kb.fillDocumentForm(
        "Document To Restore",
        "This document will be deleted then restored.",
      );
      await kb.saveDocumentButton.click();
      await kb.clickDocument("Document To Restore");
      await kb.deleteDocument();
      await expect(kb.documentList).not.toContainText("Document To Restore");

      // Navigate to trash
      await page.locator('[data-testid="trash-link"]').click();
      await expect(kb.trashSection).toBeVisible();
      await expect(kb.trashSection).toContainText("Document To Restore");

      // Restore the document
      await kb.trashSection.locator("text=Document To Restore").click();
      await kb.restoreDocumentButton.click();
      await expect(kb.successMessage).toBeVisible();

      // Navigate back to main knowledge list
      await page.locator('[data-testid="knowledge-link"]').click();
      await expect(kb.documentList).toContainText("Document To Restore");

      await page.screenshot({ path: "playwright-report/restore-document.png" });
    });

    test("permanently delete — document cannot be restored after permanent deletion", async ({
      page,
    }) => {
      const kb = new KnowledgeBasePage(page);
      mockClassificationAPI(page);

      // Create, delete, then permanently delete
      await kb.openNewDocumentForm();
      await kb.fillDocumentForm(
        "Permanent Delete Doc",
        "This document will be permanently deleted.",
      );
      await kb.saveDocumentButton.click();
      await kb.clickDocument("Permanent Delete Doc");
      await kb.deleteDocument();

      // Go to trash and permanently delete
      await page.locator('[data-testid="trash-link"]').click();
      await kb.trashSection.locator("text=Permanent Delete Doc").click();
      await page.locator('[data-testid="permanent-delete-button"]').click();
      await expect(
        page.locator('[data-testid="permanent-delete-confirm"]'),
      ).toBeVisible();
      await page.locator('[data-testid="permanent-delete-confirm"]').click();

      await expect(kb.successMessage).toBeVisible();
      await expect(kb.trashSection).not.toContainText("Permanent Delete Doc");
    });

    test("bulk delete and restore — select many, delete, restore all", async ({
      page,
    }) => {
      const kb = new KnowledgeBasePage(page);
      mockClassificationAPI(page);

      // Create three documents
      for (const name of [
        "Bulk Restore A",
        "Bulk Restore B",
        "Bulk Restore C",
      ]) {
        await kb.openNewDocumentForm();
        await kb.fillDocumentForm(name, `Content of ${name}`);
        await kb.saveDocumentButton.click();
        await expect(kb.successMessage).toBeVisible();
      }

      // Select all and bulk delete
      await kb.bulkSelectCheckbox.check();
      await kb.bulkDeleteButton.click();
      await kb.confirmDeleteButton.click();
      await expect(kb.successMessage).toBeVisible();

      // Navigate to trash and restore all
      await page.locator('[data-testid="trash-link"]').click();
      await page.locator('[data-testid="restore-all-button"]').click();
      await expect(kb.successMessage).toBeVisible();

      // Navigate back and verify all are restored
      await page.locator('[data-testid="knowledge-link"]').click();
      for (const name of [
        "Bulk Restore A",
        "Bulk Restore B",
        "Bulk Restore C",
      ]) {
        await expect(kb.documentList).toContainText(name);
      }
    });
  });
});
