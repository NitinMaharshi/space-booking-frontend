import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '@/lib/auth-api';
import { renderWithProviders } from '@/test/render';
import { ForgotPasswordPage } from './forgot-password-page';

vi.mock('@/lib/auth-api', () => ({
  authApi: { forgotPassword: vi.fn() },
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a validation error for an invalid email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(
      await screen.findByText('Enter a valid email address'),
    ).toBeInTheDocument();
    expect(authApi.forgotPassword).not.toHaveBeenCalled();
  });

  it('submits the email and shows the confirmation message', async () => {
    vi.mocked(authApi.forgotPassword).mockResolvedValue(undefined as any);
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(
      await screen.findByText(/reset link has been sent/i),
    ).toBeInTheDocument();
    expect(authApi.forgotPassword).toHaveBeenCalledWith('jane@example.com');
  });
});
