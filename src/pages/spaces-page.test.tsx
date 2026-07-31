import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { spacesApi } from '@/lib/spaces-api';
import { renderWithProviders } from '@/test/render';
import type { Space } from '@/types';
import { SpacesPage } from './spaces-page';

vi.mock('@/lib/spaces-api', () => ({
  spacesApi: { list: vi.fn() },
}));

const space: Space = {
  id: 's1',
  name: 'Meeting Room Aspen',
  type: 'MEETING_ROOM',
  description: null,
  capacity: 6,
  hourlyRate: '25',
  isActive: true,
  amenities: [],
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('SpacesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(spacesApi.list).mockResolvedValue({
      items: [space],
      meta: { total: 1, page: 1, limit: 9, totalPages: 1 },
    });
  });

  it('lists spaces returned by the API', async () => {
    renderWithProviders(<SpacesPage />);
    expect(await screen.findByText('Meeting Room Aspen')).toBeInTheDocument();
  });

  it('debounces the search box and calls the API with the typed term', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpacesPage />);
    await screen.findByText('Meeting Room Aspen');

    await user.type(screen.getByLabelText('Search spaces'), 'Aspen');

    await waitFor(
      () =>
        expect(spacesApi.list).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Aspen' }),
        ),
      { timeout: 2000 },
    );
  });

  it('sends the date filter to the API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpacesPage />);
    await screen.findByText('Meeting Room Aspen');

    await user.type(
      screen.getByLabelText('Only show spaces free on this date'),
      '2026-09-10',
    );

    await waitFor(() =>
      expect(spacesApi.list).toHaveBeenCalledWith(
        expect.objectContaining({ date: '2026-09-10' }),
      ),
    );
  });

  it('shows an empty state when no spaces match', async () => {
    vi.mocked(spacesApi.list).mockResolvedValue({
      items: [],
      meta: { total: 0, page: 1, limit: 9, totalPages: 0 },
    });
    renderWithProviders(<SpacesPage />);
    expect(
      await screen.findByText('No spaces match your search.'),
    ).toBeInTheDocument();
  });
});
