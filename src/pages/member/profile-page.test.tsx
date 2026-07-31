import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@/stores/auth-store';
import { renderWithProviders } from '@/test/render';
import { ProfilePage } from './profile-page';

describe('ProfilePage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isInitializing: false,
    });
  });

  it('renders nothing when there is no logged-in user', () => {
    const { container } = renderWithProviders(<ProfilePage />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the logged-in user's account details", () => {
    useAuthStore.setState({
      user: {
        id: '1',
        email: 'jane@example.com',
        fullName: 'Jane Doe',
        role: 'MEMBER',
        isEmailVerified: true,
      },
      accessToken: 'token',
      isInitializing: false,
    });

    renderWithProviders(<ProfilePage />);

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('MEMBER')).toBeInTheDocument();
  });
});
