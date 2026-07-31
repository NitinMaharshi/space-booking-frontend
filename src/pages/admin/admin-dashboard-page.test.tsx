import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bookingsApi } from '@/lib/bookings-api';
import { maintenanceApi } from '@/lib/maintenance-api';
import { spacesApi } from '@/lib/spaces-api';
import { renderWithProviders } from '@/test/render';
import { AdminDashboardPage } from './admin-dashboard-page';

vi.mock('@/lib/bookings-api', () => ({ bookingsApi: { list: vi.fn() } }));
vi.mock('@/lib/spaces-api', () => ({ spacesApi: { list: vi.fn() } }));
vi.mock('@/lib/maintenance-api', () => ({ maintenanceApi: { list: vi.fn() } }));

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bookingsApi.list).mockResolvedValue({
      items: [],
      meta: { total: 3, page: 1, limit: 1, totalPages: 3 },
    });
    vi.mocked(spacesApi.list).mockResolvedValue({
      items: [],
      meta: { total: 6, page: 1, limit: 1, totalPages: 6 },
    });
    vi.mocked(maintenanceApi.list).mockResolvedValue({
      items: [],
      meta: { total: 1, page: 1, limit: 1, totalPages: 1 },
    });
  });

  it('shows the pending/spaces/maintenance counts as links to the right pages', async () => {
    renderWithProviders(<AdminDashboardPage />);

    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(screen.getByText('Pending approvals').closest('a')).toHaveAttribute(
      'href',
      '/admin/bookings',
    );
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Active spaces').closest('a')).toHaveAttribute(
      'href',
      '/admin/spaces',
    );
    expect(
      screen.getByText('Maintenance windows').closest('a'),
    ).toHaveAttribute('href', '/admin/maintenance');
  });
});
