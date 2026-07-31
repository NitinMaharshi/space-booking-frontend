import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { bookingsApi } from '@/lib/bookings-api';
import { maintenanceApi } from '@/lib/maintenance-api';
import { spacesApi } from '@/lib/spaces-api';

export function AdminDashboardPage() {
  const { data: pending } = useQuery({
    queryKey: ['bookings', 'admin', 'PENDING', 'count'],
    queryFn: () => bookingsApi.list({ status: 'PENDING', limit: 1 }),
  });
  const { data: spaces } = useQuery({
    queryKey: ['spaces', 'admin', 'count'],
    queryFn: () => spacesApi.list({ limit: 1 }),
  });
  const { data: maintenance } = useQuery({
    queryKey: ['maintenance', 'count'],
    queryFn: () => maintenanceApi.list({ limit: 1 }),
  });

  const stats = [
    {
      label: 'Pending approvals',
      value: pending?.meta.total ?? 0,
      to: '/admin/bookings',
    },
    {
      label: 'Active spaces',
      value: spaces?.meta.total ?? 0,
      to: '/admin/spaces',
    },
    {
      label: 'Maintenance windows',
      value: maintenance?.meta.total ?? 0,
      to: '/admin/maintenance',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} to={s.to}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-3xl">{s.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {s.label}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
