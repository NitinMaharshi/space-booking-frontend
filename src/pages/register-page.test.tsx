import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/stores/auth-store';
import { renderWithProviders } from '@/test/render';
import { RegisterPage } from './register-page';

vi.mock('@/lib/auth-api', () => ({
  authApi: { register: vi.fn() },
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isInitializing: false,
    });
  });

  it('shows validation errors for a short name, invalid email, and weak password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText('Full name'), 'A');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'weak');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByText('Enter your full name')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('registers and stores the returned user on success', async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      accessToken: 'token-123',
      user: {
        id: '1',
        email: 'jane@example.com',
        fullName: 'Jane Doe',
        role: 'MEMBER',
        isEmailVerified: true,
      },
    });

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText('Full name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() =>
      expect(authApi.register).toHaveBeenCalledWith({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'StrongP@ss1',
      }),
    );
    await waitFor(() =>
      expect(useAuthStore.getState().user?.email).toBe('jane@example.com'),
    );
  });
});
