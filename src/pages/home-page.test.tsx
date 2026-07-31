import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { HomePage } from './home-page';

describe('HomePage', () => {
  it('shows the hero heading and primary CTAs', () => {
    renderWithProviders(<HomePage />);

    expect(
      screen.getByRole('heading', { name: /book the perfect workspace/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse spaces' })).toHaveAttribute(
      'href',
      '/spaces',
    );
    expect(
      screen.getByRole('link', { name: 'Create an account' }),
    ).toHaveAttribute('href', '/register');
  });

  it('lists the three feature highlights', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText('Every kind of space')).toBeInTheDocument();
    expect(screen.getByText('Real-time availability')).toBeInTheDocument();
    expect(screen.getByText('Conflict-free booking')).toBeInTheDocument();
  });
});
