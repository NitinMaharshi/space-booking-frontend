import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { spacesApi } from '@/lib/spaces-api';
import { renderWithProviders } from '@/test/render';
import type { Space } from '@/types';
import { ManageSpacesPage } from './manage-spaces-page';

vi.mock('@/lib/spaces-api', () => ({
  spacesApi: { list: vi.fn(), create: vi.fn(), remove: vi.fn() },
}));

const space: Space = {
  id: 's1',
  name: 'Hot Desk 1',
  type: 'DESK',
  description: null,
  capacity: 1,
  hourlyRate: '5',
  isActive: true,
  amenities: [],
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('ManageSpacesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(spacesApi.list).mockResolvedValue({
      items: [space],
      meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
  });

  it('lists spaces with an active badge and a deactivate button', async () => {
    renderWithProviders(<ManageSpacesPage />);

    expect(await screen.findByText('Hot Desk 1')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Deactivate' }),
    ).toBeInTheDocument();
  });

  it('deactivates a space on click', async () => {
    vi.mocked(spacesApi.remove).mockResolvedValue(undefined as any);
    const user = userEvent.setup();
    renderWithProviders(<ManageSpacesPage />);

    await screen.findByText('Hot Desk 1');
    await user.click(screen.getByRole('button', { name: 'Deactivate' }));

    await waitFor(() => expect(spacesApi.remove).toHaveBeenCalledWith('s1'));
  });

  it('creates a new space through the dialog', async () => {
    vi.mocked(spacesApi.create).mockResolvedValue({
      ...space,
      id: 's2',
      name: 'New Room',
    });
    const user = userEvent.setup();
    renderWithProviders(<ManageSpacesPage />);

    await screen.findByText('Hot Desk 1');
    await user.click(screen.getByRole('button', { name: 'Add space' }));
    await user.type(screen.getByLabelText('Name'), 'New Room');
    await user.clear(screen.getByLabelText('Capacity'));
    await user.type(screen.getByLabelText('Capacity'), '4');
    await user.click(screen.getByRole('button', { name: 'Create space' }));

    await waitFor(() =>
      expect(spacesApi.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Room', capacity: 4 }),
      ),
    );
  });
});
