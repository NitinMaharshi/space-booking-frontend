import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bookingsApi } from '@/lib/bookings-api';
import { spacesApi } from '@/lib/spaces-api';
import { useAuthStore } from '@/stores/auth-store';
import { renderWithProviders } from '@/test/render';
import type { Space } from '@/types';
import { SpaceDetailsPage } from './space-details-page';

vi.mock('@/lib/spaces-api', () => ({
  spacesApi: { get: vi.fn(), availability: vi.fn() },
}));
vi.mock('@/lib/bookings-api', () => ({
  bookingsApi: { create: vi.fn() },
}));

const space: Space = {
  id: 's1',
  name: 'Meeting Room Aspen',
  type: 'MEETING_ROOM',
  description: 'A bright room',
  capacity: 6,
  hourlyRate: '25',
  isActive: true,
  amenities: [{ id: 'a1', name: 'Projector' }],
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('SpaceDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(spacesApi.get).mockResolvedValue(space);
    vi.mocked(spacesApi.availability).mockResolvedValue({
      date: '2026-09-10',
      bookings: [],
      maintenanceWindows: [],
    });
    useAuthStore.setState({
      user: {
        id: 'm1',
        email: 'jane@example.com',
        fullName: 'Jane Doe',
        role: 'MEMBER',
        isEmailVerified: true,
      },
      accessToken: 'token',
      isInitializing: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders space details and amenities', async () => {
    renderWithProviders(<SpaceDetailsPage />, {
      route: '/spaces/s1',
      path: '/spaces/:id',
    });

    expect(
      await screen.findByRole('heading', { name: 'Meeting Room Aspen' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Projector')).toBeInTheDocument();
    expect(screen.getByText('6 people')).toBeInTheDocument();
  });

  it('shows "Fully available" when there are no conflicts', async () => {
    renderWithProviders(<SpaceDetailsPage />, {
      route: '/spaces/s1',
      path: '/spaces/:id',
    });
    expect(
      await screen.findByText('Fully available on this date.'),
    ).toBeInTheDocument();
  });

  it('submits a booking request through the dialog', async () => {
    // Fixed "now" so today's default date and which hourly slots count as
    // upcoming (vs. already passed) are deterministic regardless of when
    // the test actually runs. shouldAdvanceTime keeps real timers ticking
    // for Testing Library's internal async polling (findBy/waitFor).
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-09-10T08:00:00'));

    vi.mocked(bookingsApi.create).mockResolvedValue({
      id: 'b1',
      spaceId: 's1',
      memberId: 'm1',
      status: 'PENDING',
      bookingDate: '2026-09-10',
      startTime: '2026-09-10T14:00:00.000Z',
      endTime: '2026-09-10T15:00:00.000Z',
      partySize: 1,
      notes: null,
      rejectionReason: null,
      createdAt: '2026-08-01T00:00:00.000Z',
    });

    renderWithProviders(<SpaceDetailsPage />, {
      route: '/spaces/s1',
      path: '/spaces/:id',
    });

    fireEvent.click(
      await screen.findByRole('button', { name: 'Request booking' }),
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '2 PM' }));
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Submit request' }),
    );

    await waitFor(() => expect(bookingsApi.create).toHaveBeenCalled());
    expect(vi.mocked(bookingsApi.create).mock.calls[0][0]).toMatchObject({
      spaceId: 's1',
      partySize: 1,
      startTime: new Date('2026-09-10T14:00:00').toISOString(),
      endTime: new Date('2026-09-10T15:00:00').toISOString(),
    });

    vi.useRealTimers();
  });

  it('prompts a visitor to log in instead of showing the booking button', async () => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isInitializing: false,
    });
    renderWithProviders(<SpaceDetailsPage />, {
      route: '/spaces/s1',
      path: '/spaces/:id',
    });

    expect(
      await screen.findByRole('link', { name: 'Log in to book' }),
    ).toHaveAttribute('href', '/login');
  });
});
