import { test, expect } from '@playwright/test';

test.describe('Booking journey', () => {
  test('a member can register, request a booking, and see it pending; an admin can approve it', async ({
    page,
  }) => {
    const email = `e2e-${Date.now()}@example.com`;

    await page.goto('/register');
    await page.getByLabel('Full name').fill('E2E Tester');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('StrongP@ss1');
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 10_000 });

    await page.goto('/spaces');
    await page.getByRole('link', { name: 'View details' }).first().click();
    await page.getByRole('button', { name: 'Request booking' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Date').fill('2026-09-01');
    await dialog.getByLabel('Start').fill('11:00');
    await dialog.getByLabel('End').fill('12:00');
    await dialog.getByRole('button', { name: 'Submit request' }).click();

    await expect(page.getByText('Booking requested')).toBeVisible();

    await page.goto('/bookings');
    await expect(page.locator('table').getByText('PENDING').first()).toBeVisible();

    // Log out and approve as the seeded admin.
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@cospace.dev');
    await page.getByLabel('Password').fill('Password@123');
    await page.getByRole('button', { name: 'Log in' }).click();

    await page.goto('/admin/bookings');
    await page.getByRole('button', { name: 'Approve' }).first().click();
    await expect(page.getByText('Booking approved')).toBeVisible();
  });

  test('an unauthenticated visitor is redirected to login when opening the dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('a member cannot reach admin-only routes', async ({ page }) => {
    const email = `e2e-member-${Date.now()}@example.com`;
    await page.goto('/register');
    await page.getByLabel('Full name').fill('Member Only');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('StrongP@ss1');
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 10_000 });

    await page.goto('/admin');
    await expect(page).toHaveURL('/');
  });
});
