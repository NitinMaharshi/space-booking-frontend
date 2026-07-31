import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '@/lib/auth-api';
import { renderWithProviders } from '@/test/render';
import { VerifyEmailPage } from './verify-email-page';

vi.mock('@/lib/auth-api', () => ({
  authApi: { verifyEmail: vi.fn() },
}));

describe('VerifyEmailPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a missing-token message when no token is in the URL', () => {
    renderWithProviders(<VerifyEmailPage />, { route: '/verify-email' });
    expect(screen.getByText(/missing verification token/i)).toBeInTheDocument();
    expect(authApi.verifyEmail).not.toHaveBeenCalled();
  });

  it('verifies the token on mount and shows a success message', async () => {
    vi.mocked(authApi.verifyEmail).mockResolvedValue(undefined as any);
    renderWithProviders(<VerifyEmailPage />, {
      route: '/verify-email?token=abc123',
    });

    expect(
      await screen.findByText(/your email has been verified/i),
    ).toBeInTheDocument();
    expect(authApi.verifyEmail).toHaveBeenCalledWith('abc123');
    expect(authApi.verifyEmail).toHaveBeenCalledTimes(1);
  });

  it('shows an error message when the token is invalid or expired', async () => {
    vi.mocked(authApi.verifyEmail).mockRejectedValue(new Error('fail'));
    renderWithProviders(<VerifyEmailPage />, {
      route: '/verify-email?token=bad',
    });

    expect(await screen.findByText(/invalid or expired/i)).toBeInTheDocument();
  });
});
