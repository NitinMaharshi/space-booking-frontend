import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingsTable } from '@/components/bookings-table';
import { bookingsApi } from '@/lib/bookings-api';
import { useAuthStore } from '@/stores/auth-store';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: pending, isLoading: loadingPending } = useQuery({
    queryKey: ['bookings', 'mine', 'PENDING'],
    queryFn: () => bookingsApi.list({ status: 'PENDING', limit: 5 }),
  });
  const { data: approved, isLoading: loadingApproved } = useQuery({
    queryKey: ['bookings', 'mine', 'APPROVED'],
    queryFn: () => bookingsApi.list({ status: 'APPROVED', limit: 5 }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {user?.fullName}</h1>
        <p className="text-muted-foreground">Here's what's happening with your bookings.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{approved?.meta.total ?? 0} approved</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{pending?.meta.total ?? 0} pending review</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming approved bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingApproved ? <Skeleton className="h-32" /> : <BookingsTable bookings={approved?.items ?? []} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Awaiting approval</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPending ? <Skeleton className="h-32" /> : <BookingsTable bookings={pending?.items ?? []} />}
        </CardContent>
      </Card>

      <Button asChild className="w-fit">
        <Link to="/spaces">Book another space</Link>
      </Button>
    </div>
  );
}
