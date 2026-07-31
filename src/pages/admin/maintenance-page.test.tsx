import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { maintenanceApi } from '@/lib/maintenance-api';
import { spacesApi } from '@/lib/spaces-api';
import { renderWithProviders } from '@/test/render';
import type { MaintenanceWindow, Space } from '@/types';
import { MaintenancePage } from './maintenance-page';

vi.mock('@/lib/maintenance-api', () => ({
  maintenanceApi: { list: vi.fn(), create: vi.fn(), remove: vi.fn() },
}));
vi.mock('@/lib/spaces-api', () => ({
  spacesApi: { list: vi.fn() },
}));

const space: Space = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Meeting Room Aspen',
  type: 'MEETING_ROOM',
  description: null,
  capacity: 6,
  hourlyRate: '25',
  isActive: true,
  amenities: [],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const maintenanceWindow: MaintenanceWindow = {
  id: 'mw1',
  spaceId: '11111111-1111-4111-8111-111111111111',
  space,
  startTime: '2026-09-05T00:00:00.000Z',
  endTime: '2026-09-05T06:00:00.000Z',
  reason: 'Quarterly AV servicing',
};

describe('MaintenancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(maintenanceApi.list).mockResolvedValue({
      items: [maintenanceWindow],
      meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
    vi.mocked(spacesApi.list).mockResolvedValue({
      items: [space],
      meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
  });

  it('lists maintenance windows with the space name and reason', async () => {
    renderWithProviders(<MaintenancePage />);

    expect(await screen.findByText('Meeting Room Aspen')).toBeInTheDocument();
    expect(screen.getByText('Quarterly AV servicing')).toBeInTheDocument();
  });

  it('removes a maintenance window on click', async () => {
    vi.mocked(maintenanceApi.remove).mockResolvedValue(undefined as any);
    const user = userEvent.setup();
    renderWithProviders(<MaintenancePage />);

    await screen.findByText('Meeting Room Aspen');
    await user.click(
      screen.getByRole('button', { name: 'Remove maintenance window' }),
    );

    await waitFor(() =>
      expect(maintenanceApi.remove).toHaveBeenCalledWith('mw1'),
    );
  });

  it('schedules a new maintenance window through the dialog', async () => {
    vi.mocked(maintenanceApi.create).mockResolvedValue(maintenanceWindow);
    const user = userEvent.setup();
    renderWithProviders(<MaintenancePage />);

    await screen.findByText('Meeting Room Aspen');
    await user.click(
      screen.getByRole('button', { name: 'Schedule maintenance' }),
    );

    const dialog = screen.getByRole('dialog');
    await user.selectOptions(
      within(dialog).getByLabelText('Space'),
      'Meeting Room Aspen',
    );
    // datetime-local inputs: fireEvent.change, not userEvent.type (see space-details-page.test.tsx).
    fireEvent.change(within(dialog).getByLabelText('Start'), {
      target: { value: '2026-09-10T00:00' },
    });
    fireEvent.change(within(dialog).getByLabelText('End'), {
      target: { value: '2026-09-10T06:00' },
    });
    await user.type(within(dialog).getByLabelText('Reason'), 'HVAC servicing');
    await user.click(within(dialog).getByRole('button', { name: 'Schedule' }));

    await waitFor(() =>
      expect(maintenanceApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          spaceId: '11111111-1111-4111-8111-111111111111',
          reason: 'HVAC servicing',
        }),
      ),
    );
  });
});
