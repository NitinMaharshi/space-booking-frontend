import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Booking } from '@/types';
import { BookingsTable } from './bookings-table';

const baseBooking: Booking = {
  id: 'b1',
  spaceId: 's1',
  memberId: 'm1',
  status: 'PENDING',
  bookingDate: '2026-08-20',
  startTime: '2026-08-20T09:00:00.000Z',
  endTime: '2026-08-20T10:00:00.000Z',
  partySize: 2,
  notes: null,
  rejectionReason: null,
  createdAt: '2026-08-01T00:00:00.000Z',
};

describe('BookingsTable', () => {
  it('shows an empty state when there are no bookings', () => {
    render(<BookingsTable bookings={[]} />);
    expect(screen.getByText('No bookings found.')).toBeInTheDocument();
  });

  it('renders a row per booking with its status badge', () => {
    render(<BookingsTable bookings={[baseBooking]} />);
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('surfaces the rejection reason for rejected bookings', () => {
    render(
      <BookingsTable
        bookings={[
          {
            ...baseBooking,
            status: 'REJECTED',
            rejectionReason: 'No availability',
          },
        ]}
      />,
    );
    expect(screen.getByText('No availability')).toBeInTheDocument();
  });

  it('renders custom actions per row when provided', () => {
    render(
      <BookingsTable
        bookings={[baseBooking]}
        renderActions={(b) => <button>Cancel {b.id}</button>}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Cancel b1' }),
    ).toBeInTheDocument();
  });
});
