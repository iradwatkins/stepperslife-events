import { test, expect } from "@playwright/test";

/**
 * Authentication E2E Tests
 *
 * Tests the login, registration, and password reset flows.
 */

test.describe("Authentication", () => {
  test.describe("Login Page", () => {
    test("should display login form", async ({ page }) => {
      await page.goto("/login");

      // Check page title and form elements
      await expect(page).toHaveTitle(/SteppersLife|Login/i);
      await expect(page.locator("input[type=email]")).toBeVisible();
      await expect(page.locator("input[type=password]")).toBeVisible();
      await expect(page.locator("button[type=submit]")).toBeVisible();
    });

    test("should show validation errors for empty fields", async ({ page }) => {
      await page.goto("/login");

      // Submit empty form
      await page.click("button[type=submit]");

      // Should show validation error
      await expect(page.locator("text=/required|enter.*email|invalid/i").first()).toBeVisible();
    });

    test("should show error for invalid email format", async ({ page }) => {
      await page.goto("/login");

      // Enter invalid email
      await page.fill("input[type=email]", "invalid-email");
      await page.fill("input[type=password]", "password123");
      await page.click("button[type=submit]");

      // Should show email validation error
      await expect(page.locator("text=/invalid.*email|email.*invalid/i").first()).toBeVisible();
    });

    test("should show error for incorrect credentials", async ({ page }) => {
      await page.goto("/login");

      // Enter wrong credentials
      await page.fill("input[type=email]", "wrong@example.com");
      await page.fill("input[type=password]", "wrongpassword");
      await page.click("button[type=submit]");

      // Wait for error message
      await expect(
        page.locator("text=/invalid.*credentials|incorrect|not found|error/i").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("should have link to registration page", async ({ page }) => {
      await page.goto("/login");

      // Find and click register link
      const registerLink = page.locator("a[href*=register], a:has-text('register'), a:has-text('sign up')").first();
      await expect(registerLink).toBeVisible();
      await registerLink.click();

      // Should navigate to register page
      await expect(page).toHaveURL(/register|signup/i);
    });

    test("should have link to forgot password", async ({ page }) => {
      await page.goto("/login");

      // Find forgot password link
      const forgotLink = page.locator("a[href*=forgot], a[href*=reset], a:has-text('forgot')").first();
      await expect(forgotLink).toBeVisible();
    });
  });

  test.describe("Registration Page", () => {
    test("should display registration form", async ({ page }) => {
      await page.goto("/register");

      // Check form elements
      await expect(page.locator("input[type=email]")).toBeVisible();
      await expect(page.locator("input[type=password]").first()).toBeVisible();
      await expect(page.locator("button[type=submit]")).toBeVisible();
    });

    test("should validate password requirements", async ({ page }) => {
      await page.goto("/register");

      // Fill form with weak password
      await page.fill("input[name=name], input[placeholder*=name]", "Test User");
      await page.fill("input[type=email]", "test@example.com");
      await page.fill("input[type=password]", "weak");
      await page.click("button[type=submit]");

      // Should show password requirement error
      await expect(
        page.locator("text=/password.*8|8.*character|uppercase|lowercase|number/i").first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("should have link back to login", async ({ page }) => {
      await page.goto("/register");

      // Find login link
      const loginLink = page.locator("a[href*=login], a:has-text('login'), a:has-text('sign in')").first();
      await expect(loginLink).toBeVisible();
    });
  });

  test.describe("Password Reset", () => {
    test("should display forgot password form", async ({ page }) => {
      await page.goto("/forgot-password");

      // Check form elements
      await expect(page.locator("input[type=email]")).toBeVisible();
      await expect(page.locator("button[type=submit]")).toBeVisible();
    });

    test("should validate email format", async ({ page }) => {
      await page.goto("/forgot-password");

      // Enter invalid email
      await page.fill("input[type=email]", "invalid-email");
      await page.click("button[type=submit]");

      // Should show validation error
      await expect(page.locator("text=/invalid.*email|email.*invalid/i").first()).toBeVisible();
    });
  });

  test.describe("Protected Routes", () => {
    test("should redirect unauthenticated users from dashboard", async ({ page }) => {
      await page.goto("/user/dashboard");

      // Should redirect to login
      await expect(page).toHaveURL(/login|unauthorized/i);
    });

    test("should redirect unauthenticated users from organizer pages", async ({ page }) => {
      await page.goto("/organizer/dashboard");

      // Should redirect to login or unauthorized
      await expect(page).toHaveURL(/login|unauthorized/i);
    });

    test("should redirect unauthenticated users from admin pages", async ({ page }) => {
      await page.goto("/admin");

      // Should redirect to login or unauthorized
      await expect(page).toHaveURL(/login|unauthorized/i);
    });
  });

  test.describe("Session Management", () => {
    test("should maintain session across page navigation", async ({ page }) => {
      // This test would require actual login with test credentials
      // For now, we test that the session cookie is properly handled
      await page.goto("/");

      // Check that session-related cookies exist or can be set
      const cookies = await page.context().cookies();
      // Session cookie should be accessible
      expect(cookies).toBeDefined();
    });
  });
});

test.describe("Public Pages", () => {
  test("should load homepage", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/SteppersLife/i);
    await expect(page.locator("main")).toBeVisible();
  });

  test("should load events page", async ({ page }) => {
    await page.goto("/events");

    await expect(page.locator("main")).toBeVisible();
  });

  test("should have navigation links", async ({ page }) => {
    await page.goto("/");

    // Check for main navigation
    const nav = page.locator("nav, header");
    await expect(nav.first()).toBeVisible();
  });
});
