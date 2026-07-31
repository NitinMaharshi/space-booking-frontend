import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/stores/auth-store';
import { LoginPage } from './login-page';

vi.mock('@/lib/auth-api', () => ({
  authApi: { login: vi.fn() },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isInitializing: false,
    });
  });

  it('shows validation errors for an invalid email and empty password', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(
      await screen.findByText('Enter a valid email address'),
    ).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('logs in and stores the returned user on success', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
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
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() =>
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'jane@example.com',
        password: 'StrongP@ss1',
      }),
    );
    await waitFor(() =>
      expect(useAuthStore.getState().user?.email).toBe('jane@example.com'),
    );
  });
});
