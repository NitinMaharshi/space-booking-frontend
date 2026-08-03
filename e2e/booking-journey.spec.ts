import { expect, test } from '@playwright/test';

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

    await expect(
      page.getByRole('heading', { name: /Welcome back/i }),
    ).toBeVisible({ timeout: 10_000 });

    await page.goto('/spaces');
    await page.getByRole('link', { name: 'View details' }).first().click();

    // Pick a random far-future date so every half-hour slot that day is free —
    // both from seeded bookings and from this same test's own bookings on
    // a previous run (a fixed offset would land on the same day every time
    // the suite runs on a given day, colliding with its own leftover data).
    const farFuture = new Date();
    farFuture.setDate(
      farFuture.getDate() + 60 + Math.floor(Math.random() * 300),
    );
    const farFutureIso = farFuture.toISOString().slice(0, 10);
    await page.getByLabel('Check availability for date').fill(farFutureIso);

    await page.getByRole('button', { name: 'Request booking' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: '9:00 AM' }).click();
    await dialog.getByRole('button', { name: 'Submit request' }).click();

    await expect(page.getByText('Booking requested')).toBeVisible();

    await page.goto('/bookings');
    await expect(
      page.locator('table').getByText('PENDING').first(),
    ).toBeVisible();

    // Log out and approve as the seeded admin. Wait for the logout request
    // to actually finish (navbar swaps to the logged-out links) before
    // hard-navigating — otherwise goto() can abort the in-flight
    // POST /auth/logout mid-request, leaving the refresh cookie unrevoked
    // so the next page load's session-restore silently logs the member
    // back in.
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@cospace.dev');
    await page.getByLabel('Password').fill('Password@123');
    await page.getByRole('button', { name: 'Log in' }).click();

    // Wait for the login request to actually resolve and the client-side
    // redirect to land before hard-navigating — goto() right after the
    // click can abort the in-flight POST /auth/login before it responds.
    await page.waitForURL('/admin');
    await page.goto('/admin/bookings');
    await page.getByRole('button', { name: 'Approve' }).first().click();
    await expect(page.getByText('Booking approved')).toBeVisible();
  });

  test('an unauthenticated visitor is redirected to login when opening the dashboard', async ({
    page,
  }) => {
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
    await expect(
      page.getByRole('heading', { name: /Welcome back/i }),
    ).toBeVisible({ timeout: 10_000 });

    await page.goto('/admin');
    await expect(page).toHaveURL('/');
  });
});
