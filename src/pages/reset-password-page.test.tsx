import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '@/lib/auth-api';
import { renderWithProviders } from '@/test/render';
import { ResetPasswordPage } from './reset-password-page';

vi.mock('@/lib/auth-api', () => ({
  authApi: { resetPassword: vi.fn() },
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a missing-token message when no token is in the URL', () => {
    renderWithProviders(<ResetPasswordPage />, { route: '/reset-password' });
    expect(screen.getByText(/missing reset token/i)).toBeInTheDocument();
  });

  it('shows a validation error for a weak password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />, {
      route: '/reset-password?token=abc123',
    });

    await user.type(screen.getByLabelText('New password'), 'weak');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(
      await screen.findByText('At least 8 characters'),
    ).toBeInTheDocument();
    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });

  it('submits the token and new password', async () => {
    vi.mocked(authApi.resetPassword).mockResolvedValue(undefined as any);
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />, {
      route: '/reset-password?token=abc123',
    });

    await user.type(screen.getByLabelText('New password'), 'NewStrongP@ss1');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    await waitFor(() =>
      expect(authApi.resetPassword).toHaveBeenCalledWith({
        token: 'abc123',
        newPassword: 'NewStrongP@ss1',
      }),
    );
  });
});
