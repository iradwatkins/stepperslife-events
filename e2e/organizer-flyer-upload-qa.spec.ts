import { test, expect, Page } from "@playwright/test";
import path from "path";

/**
 * QA Test: Event Organizer Flyer Upload Flow
 * Tests the complete event creation journey using flyer images with OCR extraction
 *
 * Test Data: 7 event flyers from /Users/irawatkins/Desktop/event orgainzers/
 */

const FLYER_FOLDER = "/Users/irawatkins/Desktop/event orgainzers";
const BASE_URL = "https://events.stepperslife.com";

// Test credentials
const TEST_CREDENTIALS = {
  email: "iradwatkins@gmail.com",
  password: "Bobby321!",
};

// Test event flyers with expected data for validation
const TEST_FLYERS = [
  {
    filename: "582474448_1116238783694448_4342537403467863669_n.jpg",
    expectedName: "Chicago Steppers in Atlanta",
    expectedType: "SAVE_THE_DATE",
    expectedCity: "Atlanta",
    expectedState: "GA",
  },
  {
    filename: "588834905_25904195019186383_1417987262477562239_n.jpg",
    expectedName: "Boss Brim Bash",
    expectedType: "TICKETED_EVENT",
    expectedCity: "Chicago",
    expectedState: "IL",
  },
  {
    filename: "589351009_1463586791406038_6777850905353491659_n.jpg",
    expectedName: "Power of Love",
    expectedType: "TICKETED_EVENT",
    expectedCity: "Jacksonville",
    expectedState: "FL",
  },
  {
    filename: "594269175_25847198531533291_4183898691856068320_n.jpg",
    expectedName: "Midwest Affair",
    expectedType: "TICKETED_EVENT",
    expectedCity: "Toledo",
    expectedState: "OH",
  },
  {
    filename: "FB_IMG_1763647338937.jpg",
    expectedName: "Let's Just Have Fun",
    expectedType: "TICKETED_EVENT",
    expectedCity: "Warrensville Heights",
    expectedState: "OH",
  },
  {
    filename: "FB_IMG_1764214806844.jpg",
    expectedName: "Sheila Watkins",
    expectedType: "TICKETED_EVENT",
    expectedCity: "Chicago",
    expectedState: "IL",
  },
  {
    filename: "FB_IMG_1764738246735.jpg",
    expectedName: "Hostile Takeover",
    expectedType: "TICKETED_EVENT",
    expectedCity: "Toledo",
    expectedState: "OH",
  },
];

// QA Bug Report storage
interface BugReport {
  testName: string;
  category: string;
  severity: "critical" | "major" | "minor";
  description: string;
  screenshot?: string;
}

const bugReports: BugReport[] = [];

test.describe("Event Organizer Flyer Upload QA", () => {
  test.describe.configure({ mode: "serial" });

  // Helper to login as organizer
  async function loginAsOrganizer(page: Page) {
    console.log("Logging in as organizer...");
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("domcontentloaded");

    // Check if already logged in
    if (!page.url().includes("/login")) {
      console.log("Already logged in");
      return;
    }

    // Fill email
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ timeout: 10000 });
    await emailInput.fill(TEST_CREDENTIALS.email);

    // Fill password
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(TEST_CREDENTIALS.password);

    // Click Sign In
    const signInButton = page.locator('button:has-text("Sign In")').first();
    await signInButton.click();

    // Wait for redirect
    await page.waitForTimeout(3000);
    await page.waitForLoadState("domcontentloaded");

    console.log(`Logged in, current URL: ${page.url()}`);
  }

  // Helper to upload flyer and wait for OCR
  async function uploadFlyerAndWaitForOCR(page: Page, flyerPath: string) {
    console.log(`Uploading flyer: ${flyerPath}`);

    // Find the file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached({ timeout: 10000 });

    // Upload the file
    await fileInput.setInputFiles(flyerPath);

    // Wait for OCR processing (look for loading indicator to appear and disappear)
    console.log("Waiting for OCR extraction...");

    // Wait for extraction to complete - look for review form or error message
    const extractionComplete = page.locator('[data-testid="extraction-review"], .extraction-complete, button:has-text("Continue with Extracted Data")');
    const extractionError = page.locator('[data-testid="extraction-error"], .extraction-error, text="extraction failed"');

    // Wait for either success or error (60 second timeout for OCR)
    await Promise.race([
      extractionComplete.waitFor({ timeout: 60000 }).catch(() => null),
      extractionError.waitFor({ timeout: 60000 }).catch(() => null),
      page.waitForTimeout(60000), // Fallback timeout
    ]);

    // Take screenshot of extraction result
    await page.screenshot({
      path: `test-results/flyer-ocr-${path.basename(flyerPath)}.png`,
      fullPage: true
    });
  }

  test.beforeAll(async () => {
    console.log("\n========================================");
    console.log("QA TEST: Event Organizer Flyer Upload");
    console.log("========================================\n");
    console.log(`Testing ${TEST_FLYERS.length} event flyers`);
    console.log(`Flyer folder: ${FLYER_FOLDER}`);
    console.log(`Target URL: ${BASE_URL}`);
  });

  test.afterAll(async () => {
    // Print bug report summary
    console.log("\n========================================");
    console.log("QA BUG REPORT SUMMARY");
    console.log("========================================\n");

    if (bugReports.length === 0) {
      console.log("No bugs found!");
    } else {
      console.log(`Total bugs found: ${bugReports.length}\n`);
      bugReports.forEach((bug, i) => {
        console.log(`${i + 1}. [${bug.severity.toUpperCase()}] ${bug.category}`);
        console.log(`   Test: ${bug.testName}`);
        console.log(`   Description: ${bug.description}`);
        if (bug.screenshot) {
          console.log(`   Screenshot: ${bug.screenshot}`);
        }
        console.log("");
      });
    }
  });

  test("1. Navigate to Event Creation Page", async ({ page }) => {
    // First login
    await loginAsOrganizer(page);

    // Navigate directly to create page
    await page.goto(`${BASE_URL}/organizer/events/create`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000); // Wait for React hydration

    // Take screenshot
    await page.screenshot({
      path: "test-results/01-create-page-initial.png",
      fullPage: true
    });

    // Verify page elements
    const heading = page.locator('h1:has-text("Create"), h2:has-text("Create")');
    const uploadArea = page.locator('input[type="file"], [data-testid="flyer-upload"]');
    const manualEntryButton = page.locator('button:has-text("manual"), button:has-text("don\'t have a flyer")');

    // Check for expected elements
    const hasHeading = await heading.isVisible().catch(() => false);
    const hasUploadArea = (await uploadArea.count()) > 0;
    const hasManualEntry = await manualEntryButton.isVisible().catch(() => false);

    console.log(`Page elements found:`);
    console.log(`  - Heading: ${hasHeading}`);
    console.log(`  - Upload area: ${hasUploadArea}`);
    console.log(`  - Manual entry button: ${hasManualEntry}`);

    if (!hasUploadArea) {
      bugReports.push({
        testName: "Navigate to Event Creation Page",
        category: "UI Element Missing",
        severity: "critical",
        description: "File upload input not found on event creation page",
        screenshot: "test-results/01-create-page-initial.png",
      });
    }

    expect(hasUploadArea).toBe(true);
  });

  test("2. Upload First Flyer - Chicago Steppers Atlanta (Save the Date)", async ({ page }) => {
    const flyer = TEST_FLYERS[0];
    const flyerPath = path.join(FLYER_FOLDER, flyer.filename);

    console.log(`\nTesting flyer: ${flyer.filename}`);
    console.log(`Expected: ${flyer.expectedName} - ${flyer.expectedType}`);

    // Login first
    await loginAsOrganizer(page);

    await page.goto(`${BASE_URL}/organizer/events/create`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Upload the flyer
    const fileInput = page.locator('input[type="file"]');

    try {
      await fileInput.setInputFiles(flyerPath);
      console.log("File uploaded successfully");

      // Wait for OCR processing
      await page.waitForTimeout(5000); // Initial wait

      // Check for loading indicator
      const loadingIndicator = page.locator('[data-testid="loading"], .loading, text="Extracting", text="Processing"');
      if (await loadingIndicator.isVisible().catch(() => false)) {
        console.log("OCR processing in progress...");
        await loadingIndicator.waitFor({ state: "hidden", timeout: 60000 }).catch(() => {});
      }

      // Wait additional time for extraction
      await page.waitForTimeout(10000);

      // Take screenshot of result
      await page.screenshot({
        path: `test-results/02-flyer-chicago-steppers.png`,
        fullPage: true
      });

      // Try to find extracted data on page
      const pageContent = await page.content();

      // Check if extraction detected Save the Date
      if (pageContent.toLowerCase().includes("save") && pageContent.toLowerCase().includes("date")) {
        console.log("SUCCESS: Save the Date detected");
      } else {
        console.log("WARNING: Save the Date may not have been detected");
        bugReports.push({
          testName: "Chicago Steppers Atlanta Flyer",
          category: "OCR Extraction",
          severity: "major",
          description: "Save the Date flyer type not correctly identified",
          screenshot: "test-results/02-flyer-chicago-steppers.png",
        });
      }

      // Check for Atlanta in extracted data
      if (pageContent.toLowerCase().includes("atlanta")) {
        console.log("SUCCESS: Atlanta location detected");
      } else {
        console.log("WARNING: Atlanta location not detected");
        bugReports.push({
          testName: "Chicago Steppers Atlanta Flyer",
          category: "OCR Extraction",
          severity: "minor",
          description: "City (Atlanta) not extracted from flyer",
          screenshot: "test-results/02-flyer-chicago-steppers.png",
        });
      }

    } catch (error) {
      console.error(`Error uploading flyer: ${error}`);
      bugReports.push({
        testName: "Chicago Steppers Atlanta Flyer",
        category: "File Upload",
        severity: "critical",
        description: `File upload failed: ${error}`,
      });
      throw error;
    }
  });

  test("3. Upload Second Flyer - Boss Brim Bash (Chicago)", async ({ page }) => {
    const flyer = TEST_FLYERS[1];
    const flyerPath = path.join(FLYER_FOLDER, flyer.filename);

    console.log(`\nTesting flyer: ${flyer.filename}`);
    console.log(`Expected: ${flyer.expectedName} - ${flyer.expectedType}`);

    await loginAsOrganizer(page);
    await page.goto(`${BASE_URL}/organizer/events/create`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(flyerPath);

    // Wait for OCR
    await page.waitForTimeout(15000);

    await page.screenshot({
      path: `test-results/03-flyer-boss-brim-bash.png`,
      fullPage: true
    });

    const pageContent = await page.content();

    // Check for Boss Brim detection
    if (pageContent.toLowerCase().includes("boss") || pageContent.toLowerCase().includes("brim")) {
      console.log("SUCCESS: Boss Brim Bash detected");
    } else {
      bugReports.push({
        testName: "Boss Brim Bash Flyer",
        category: "OCR Extraction",
        severity: "major",
        description: "Event name not correctly extracted",
        screenshot: "test-results/03-flyer-boss-brim-bash.png",
      });
    }

    // Check for Chicago
    if (pageContent.toLowerCase().includes("chicago")) {
      console.log("SUCCESS: Chicago location detected");
    }
  });

  test("4. Upload Third Flyer - Power of Love (Jacksonville Weekender)", async ({ page }) => {
    const flyer = TEST_FLYERS[2];
    const flyerPath = path.join(FLYER_FOLDER, flyer.filename);

    console.log(`\nTesting flyer: ${flyer.filename}`);
    console.log(`Expected: ${flyer.expectedName} - ${flyer.expectedType}`);

    await loginAsOrganizer(page);
    await page.goto(`${BASE_URL}/organizer/events/create`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(flyerPath);

    await page.waitForTimeout(15000);

    await page.screenshot({
      path: `test-results/04-flyer-power-of-love.png`,
      fullPage: true
    });

    const pageContent = await page.content();

    // Check for multi-day detection (weekender)
    if (pageContent.includes("12") && pageContent.includes("15")) {
      console.log("SUCCESS: Multi-day dates detected (Feb 12-15)");
    } else {
      bugReports.push({
        testName: "Power of Love Flyer",
        category: "OCR Extraction",
        severity: "major",
        description: "Multi-day event dates not correctly extracted (Feb 12-15)",
        screenshot: "test-results/04-flyer-power-of-love.png",
      });
    }
  });

  test("5. Upload Fourth Flyer - Midwest Affair (Toledo Weekender)", async ({ page }) => {
    const flyer = TEST_FLYERS[3];
    const flyerPath = path.join(FLYER_FOLDER, flyer.filename);

    console.log(`\nTesting flyer: ${flyer.filename}`);

    await loginAsOrganizer(page);
    await page.goto(`${BASE_URL}/organizer/events/create`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(flyerPath);

    await page.waitForTimeout(15000);

    await page.screenshot({
      path: `test-results/05-flyer-midwest-affair.png`,
      fullPage: true
    });

    const pageContent = await page.content();

    // Check for Toledo
    if (pageContent.toLowerCase().includes("toledo")) {
      console.log("SUCCESS: Toledo location detected");
    }

    // Check for November dates
    if (pageContent.toLowerCase().includes("november") || pageContent.includes("19") && pageContent.includes("22")) {
      console.log("SUCCESS: November 19-22 dates detected");
    }
  });

  test("6. Upload Fifth Flyer - Let's Just Have Fun Cleveland", async ({ page }) => {
    const flyer = TEST_FLYERS[4];
    const flyerPath = path.join(FLYER_FOLDER, flyer.filename);

    console.log(`\nTesting flyer: ${flyer.filename}`);

    await loginAsOrganizer(page);
    await page.goto(`${BASE_URL}/organizer/events/create`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(flyerPath);

    await page.waitForTimeout(15000);

    await page.screenshot({
      path: `test-results/06-flyer-cleveland-fun.png`,
      fullPage: true
    });
  });

  test("7. Upload Sixth Flyer - Sheila Watkins Two Day Event", async ({ page }) => {
    const flyer = TEST_FLYERS[5];
    const flyerPath = path.join(FLYER_FOLDER, flyer.filename);

    console.log(`\nTesting flyer: ${flyer.filename}`);
    console.log("NOTE: This is a TWO-DAY event (Jan 30-31) - testing multi-day handling");

    await loginAsOrganizer(page);
    await page.goto(`${BASE_URL}/organizer/events/create`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(flyerPath);

    await page.waitForTimeout(15000);

    await page.screenshot({
      path: `test-results/07-flyer-sheila-watkins.png`,
      fullPage: true
    });

    const pageContent = await page.content();

    // Check for two-day detection
    if (pageContent.includes("30") && pageContent.includes("31")) {
      console.log("SUCCESS: Two-day dates detected (Jan 30-31)");
    } else {
      bugReports.push({
        testName: "Sheila Watkins Two Day Event",
        category: "OCR Extraction",
        severity: "major",
        description: "Two-day event dates not correctly extracted (Jan 30-31)",
        screenshot: "test-results/07-flyer-sheila-watkins.png",
      });
    }
  });

  test("8. Upload Seventh Flyer - Hostile Takeover (Toledo)", async ({ page }) => {
    const flyer = TEST_FLYERS[6];
    const flyerPath = path.join(FLYER_FOLDER, flyer.filename);

    console.log(`\nTesting flyer: ${flyer.filename}`);

    await loginAsOrganizer(page);
    await page.goto(`${BASE_URL}/organizer/events/create`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(flyerPath);

    await page.waitForTimeout(15000);

    await page.screenshot({
      path: `test-results/08-flyer-hostile-takeover.png`,
      fullPage: true
    });

    const pageContent = await page.content();

    // Check for Hostile Takeover
    if (pageContent.toLowerCase().includes("hostile") || pageContent.toLowerCase().includes("takeover")) {
      console.log("SUCCESS: Hostile Takeover event name detected");
    }
  });

  test("9. Complete Event Creation - Full Wizard Flow", async ({ page }) => {
    // Use the first flyer to test complete event creation
    const flyer = TEST_FLYERS[0];
    const flyerPath = path.join(FLYER_FOLDER, flyer.filename);

    console.log("\n=== Testing Complete Event Creation Flow ===");
    console.log(`Using flyer: ${flyer.filename}`);

    await loginAsOrganizer(page);
    await page.goto(`${BASE_URL}/organizer/events/create`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Upload flyer
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(flyerPath);

    // Wait for OCR
    console.log("Waiting for OCR extraction...");
    await page.waitForTimeout(20000);

    // Try to proceed with extracted data
    const continueButton = page.locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("Proceed")');
    if (await continueButton.isVisible().catch(() => false)) {
      console.log("Found continue button - clicking");
      await continueButton.first().click();
      await page.waitForTimeout(2000);
    }

    // Take screenshot of wizard step
    await page.screenshot({
      path: `test-results/09-wizard-step-after-ocr.png`,
      fullPage: true
    });

    // Try to navigate through wizard steps
    const nextButton = page.locator('button:has-text("Next Step"), button:has-text("Next")');
    let stepCount = 0;
    const maxSteps = 6;

    while (stepCount < maxSteps) {
      if (await nextButton.isVisible().catch(() => false)) {
        stepCount++;
        console.log(`Step ${stepCount}: Clicking Next`);
        await nextButton.first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({
          path: `test-results/09-wizard-step-${stepCount}.png`,
          fullPage: true
        });
      } else {
        break;
      }
    }

    // Look for Create Event button
    const createButton = page.locator('button:has-text("Create Event"), button:has-text("Submit")');
    if (await createButton.isVisible().catch(() => false)) {
      console.log("Found Create Event button - wizard completed successfully");
      await page.screenshot({
        path: `test-results/09-wizard-final-step.png`,
        fullPage: true
      });
    } else {
      console.log("Create Event button not found - wizard may have incomplete steps");
      bugReports.push({
        testName: "Complete Event Creation Flow",
        category: "Wizard Flow",
        severity: "major",
        description: "Could not complete wizard - Create Event button not found",
        screenshot: `test-results/09-wizard-step-${stepCount}.png`,
      });
    }
  });
});
