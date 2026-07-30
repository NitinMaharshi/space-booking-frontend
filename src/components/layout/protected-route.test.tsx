import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach } from 'vitest';
import { ProtectedRoute } from './protected-route';
import { useAuthStore } from '@/stores/auth-store';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/" element={<div>Home page</div>} />
        <Route element={<ProtectedRoute roles={['ADMIN']} />}>
          <Route path="/admin" element={<div>Admin page</div>} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, isInitializing: false });
  });

  it('redirects to /login when there is no authenticated user', () => {
    renderAt('/dashboard');
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renders the route once a user is present', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'a@b.com', fullName: 'A B', role: 'MEMBER' },
      accessToken: 'token',
      isInitializing: false,
    });
    renderAt('/dashboard');
    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
  });

  it('redirects a non-admin away from an admin-only route', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'a@b.com', fullName: 'A B', role: 'MEMBER' },
      accessToken: 'token',
      isInitializing: false,
    });
    renderAt('/admin');
    expect(screen.getByText('Home page')).toBeInTheDocument();
  });

  it('shows a spinner while auth is still initializing', () => {
    useAuthStore.setState({ user: null, accessToken: null, isInitializing: true });
    renderAt('/dashboard');
    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });
});
