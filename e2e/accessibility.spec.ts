import * as path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Browser, type Page } from '@playwright/test';

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([]);
}

// Logging in once per role and reusing the saved storage state (rather than
// a fresh UI login in every test) keeps this file well under the auth
// endpoints' rate limit and avoids the login-race pitfalls hit elsewhere in
// the e2e suite.
async function loginAndSaveState(
  browser: Browser,
  email: string,
  password: string,
  landingUrl: string,
  statePath: string,
) {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL(landingUrl);
  await context.storageState({ path: statePath });
  await context.close();
}

test.describe('Accessibility (public pages)', () => {
  test('home page has no violations', async ({ page }) => {
    await page.goto('/');
    await expectNoViolations(page);
  });

  test('login page has no violations', async ({ page }) => {
    await page.goto('/login');
    await expectNoViolations(page);
  });

  test('register page has no violations', async ({ page }) => {
    await page.goto('/register');
    await expectNoViolations(page);
  });

  test('forgot password page has no violations', async ({ page }) => {
    await page.goto('/forgot-password');
    await expectNoViolations(page);
  });

  test('spaces list page has no violations', async ({ page }) => {
    await page.goto('/spaces');
    await expect(
      page.getByRole('link', { name: 'View details' }).first(),
    ).toBeVisible();
    await expectNoViolations(page);
  });

  test('space details page has no violations', async ({ page }) => {
    await page.goto('/spaces');
    await page.getByRole('link', { name: 'View details' }).first().click();
    await expect(
      page.getByRole('link', { name: 'Log in to book' }),
    ).toBeVisible();
    await expectNoViolations(page);
  });
});

test.describe('Accessibility (member pages)', () => {
  const statePath = path.join(
    process.cwd(),
    'test-results',
    'member-auth-state.json',
  );

  test.beforeAll(async ({ browser }) => {
    await loginAndSaveState(
      browser,
      'bob@cospace.dev',
      'Password@123',
      '/dashboard',
      statePath,
    );
  });

  test.use({ storageState: statePath });

  test('member dashboard has no violations', async ({ page }) => {
    await page.goto('/dashboard');
    await expectNoViolations(page);
  });

  test('my bookings page has no violations', async ({ page }) => {
    await page.goto('/bookings');
    await expectNoViolations(page);
  });

  test('profile page has no violations', async ({ page }) => {
    await page.goto('/profile');
    await expectNoViolations(page);
  });
});

test.describe('Accessibility (admin pages)', () => {
  const statePath = path.join(
    process.cwd(),
    'test-results',
    'admin-auth-state.json',
  );

  test.beforeAll(async ({ browser }) => {
    await loginAndSaveState(
      browser,
      'admin@cospace.dev',
      'Password@123',
      '/admin',
      statePath,
    );
  });

  test.use({ storageState: statePath });

  test('admin dashboard has no violations', async ({ page }) => {
    await page.goto('/admin');
    await expectNoViolations(page);
  });

  test('manage spaces page has no violations', async ({ page }) => {
    await page.goto('/admin/spaces');
    await expectNoViolations(page);
  });

  test('manage bookings page has no violations', async ({ page }) => {
    await page.goto('/admin/bookings');
    await expectNoViolations(page);
  });

  test('maintenance page has no violations', async ({ page }) => {
    await page.goto('/admin/maintenance');
    await expectNoViolations(page);
  });
});
