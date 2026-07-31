import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bookingsApi } from '@/lib/bookings-api';
import { renderWithProviders } from '@/test/render';
import type { Booking } from '@/types';
import { MyBookingsPage } from './my-bookings-page';

vi.mock('@/lib/bookings-api', () => ({
  bookingsApi: { list: vi.fn(), cancel: vi.fn() },
}));

const futureBooking: Booking = {
  id: 'b1',
  spaceId: 's1',
  memberId: 'm1',
  status: 'PENDING',
  bookingDate: '2099-09-01',
  startTime: '2099-09-01T09:00:00.000Z',
  endTime: '2099-09-01T10:00:00.000Z',
  partySize: 1,
  notes: null,
  rejectionReason: null,
  createdAt: '2026-08-01T00:00:00.000Z',
};

describe('MyBookingsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists bookings and cancels one on click', async () => {
    vi.mocked(bookingsApi.list).mockResolvedValue({
      items: [futureBooking],
      meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
    });
    vi.mocked(bookingsApi.cancel).mockResolvedValue({
      ...futureBooking,
      status: 'CANCELLED',
    });

    const user = userEvent.setup();
    renderWithProviders(<MyBookingsPage />);

    expect(await screen.findByText('PENDING')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(bookingsApi.cancel).toHaveBeenCalledWith('b1'));
  });

  it('shows an empty state when there are no bookings', async () => {
    vi.mocked(bookingsApi.list).mockResolvedValue({
      items: [],
      meta: { total: 0, page: 1, limit: 50, totalPages: 1 },
    });

    renderWithProviders(<MyBookingsPage />);
    expect(await screen.findByText('No bookings found.')).toBeInTheDocument();
  });

  it('optimistically shows CANCELLED before the request resolves', async () => {
    vi.mocked(bookingsApi.list).mockResolvedValue({
      items: [futureBooking],
      meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
    });
    let resolveCancel!: (b: Booking) => void;
    vi.mocked(bookingsApi.cancel).mockReturnValue(
      new Promise((resolve) => {
        resolveCancel = resolve;
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<MyBookingsPage />);

    expect(await screen.findByText('PENDING')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByText('CANCELLED')).toBeInTheDocument();
    resolveCancel({ ...futureBooking, status: 'CANCELLED' });
  });

  it('rolls back to the previous status when cancellation fails', async () => {
    vi.mocked(bookingsApi.list).mockResolvedValue({
      items: [futureBooking],
      meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
    });
    let rejectCancel!: (err: Error) => void;
    vi.mocked(bookingsApi.cancel).mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectCancel = reject;
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<MyBookingsPage />);

    expect(await screen.findByText('PENDING')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByText('CANCELLED')).toBeInTheDocument();
    rejectCancel(new Error('network error'));
    await waitFor(() =>
      expect(screen.getByText('PENDING')).toBeInTheDocument(),
    );
  });
});
