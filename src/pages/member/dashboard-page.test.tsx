import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bookingsApi } from '@/lib/bookings-api';
import { useAuthStore } from '@/stores/auth-store';
import { renderWithProviders } from '@/test/render';
import type { Booking } from '@/types';
import { DashboardPage } from './dashboard-page';

vi.mock('@/lib/bookings-api', () => ({
  bookingsApi: { list: vi.fn() },
}));

const booking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 'b1',
  spaceId: 's1',
  memberId: 'm1',
  status: 'APPROVED',
  bookingDate: '2026-09-01',
  startTime: '2026-09-01T09:00:00.000Z',
  endTime: '2026-09-01T10:00:00.000Z',
  partySize: 1,
  notes: null,
  rejectionReason: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  ...overrides,
});

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it('greets the user and shows approved/pending counts and lists', async () => {
    vi.mocked(bookingsApi.list).mockImplementation(({ status }) =>
      Promise.resolve({
        items: status === 'APPROVED' ? [booking()] : [],
        meta: {
          total: status === 'APPROVED' ? 1 : 0,
          page: 1,
          limit: 5,
          totalPages: 1,
        },
      }),
    );

    renderWithProviders(<DashboardPage />);

    expect(
      screen.getByRole('heading', { name: /welcome back, jane doe/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText('1 approved')).toBeInTheDocument();
    expect(await screen.findByText('0 pending review')).toBeInTheDocument();
  });
});
