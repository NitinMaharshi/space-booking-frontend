import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bookingsApi } from '@/lib/bookings-api';
import { renderWithProviders } from '@/test/render';
import type { Booking } from '@/types';
import { ManageBookingsPage } from './manage-bookings-page';

vi.mock('@/lib/bookings-api', () => ({
  bookingsApi: { list: vi.fn(), approve: vi.fn(), reject: vi.fn() },
}));

const pendingBooking: Booking = {
  id: 'b1',
  spaceId: 's1',
  memberId: 'm1',
  status: 'PENDING',
  bookingDate: '2026-09-01',
  startTime: '2026-09-01T09:00:00.000Z',
  endTime: '2026-09-01T10:00:00.000Z',
  partySize: 1,
  notes: null,
  rejectionReason: null,
  createdAt: '2026-08-01T00:00:00.000Z',
};

describe('ManageBookingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bookingsApi.list).mockResolvedValue({
      items: [pendingBooking],
      meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
    });
  });

  it('approves a pending booking', async () => {
    vi.mocked(bookingsApi.approve).mockResolvedValue({
      ...pendingBooking,
      status: 'APPROVED',
    });
    const user = userEvent.setup();
    renderWithProviders(<ManageBookingsPage />);

    await user.click(await screen.findByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(bookingsApi.approve).toHaveBeenCalledWith('b1'));
  });

  it('rejects a pending booking with a typed reason', async () => {
    vi.mocked(bookingsApi.reject).mockResolvedValue({
      ...pendingBooking,
      status: 'REJECTED',
    });
    const user = userEvent.setup();
    renderWithProviders(<ManageBookingsPage />);

    await user.click(await screen.findByRole('button', { name: 'Reject' }));
    await user.type(screen.getByLabelText('Reason'), 'No availability');
    await user.click(screen.getByRole('button', { name: 'Confirm rejection' }));

    await waitFor(() =>
      expect(bookingsApi.reject).toHaveBeenCalledWith('b1', 'No availability'),
    );
  });

  it('keeps the confirm-rejection button disabled until a reason is typed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ManageBookingsPage />);

    await user.click(await screen.findByRole('button', { name: 'Reject' }));
    expect(
      screen.getByRole('button', { name: 'Confirm rejection' }),
    ).toBeDisabled();
  });

  it('optimistically shows APPROVED before the request resolves', async () => {
    let resolveApprove!: (b: Booking) => void;
    vi.mocked(bookingsApi.approve).mockReturnValue(
      new Promise((resolve) => {
        resolveApprove = resolve;
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ManageBookingsPage />);

    await user.click(await screen.findByRole('button', { name: 'Approve' }));
    expect(await screen.findByText('APPROVED')).toBeInTheDocument();
    resolveApprove({ ...pendingBooking, status: 'APPROVED' });
  });

  it('rolls back to PENDING when approval fails', async () => {
    let rejectApprove!: (err: Error) => void;
    vi.mocked(bookingsApi.approve).mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectApprove = reject;
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ManageBookingsPage />);

    await user.click(await screen.findByRole('button', { name: 'Approve' }));
    expect(await screen.findByText('APPROVED')).toBeInTheDocument();
    rejectApprove(new Error('network error'));
    await waitFor(() =>
      expect(screen.getByText('PENDING')).toBeInTheDocument(),
    );
  });
});
