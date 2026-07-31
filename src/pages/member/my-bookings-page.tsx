import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { BookingsTable } from '@/components/bookings-table';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getApiErrorMessage } from '@/lib/api';
import { bookingsApi } from '@/lib/bookings-api';
import type { Booking, BookingStatus, PaginatedResult } from '@/types';

const STATUSES: { value: BookingStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function MyBookingsPage() {
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'mine', status],
    queryFn: () => bookingsApi.list({ status: status || undefined, limit: 50 }),
  });

  const cancelBooking = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['bookings'] });
      const previous = queryClient.getQueriesData<PaginatedResult<Booking>>({
        queryKey: ['bookings'],
      });
      queryClient.setQueriesData<PaginatedResult<Booking>>(
        { queryKey: ['bookings'] },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((b) =>
                  b.id === id ? { ...b, status: 'CANCELLED' } : b,
                ),
              }
            : old,
      );
      return { previous };
    },
    onSuccess: () => toast.success('Booking cancelled'),
    onError: (err, _id, context) => {
      context?.previous.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
      toast.error(getApiErrorMessage(err, 'Could not cancel booking'));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Bookings</h1>
        <Select
          className="w-48"
          value={status}
          onChange={(e) => setStatus(e.target.value as BookingStatus | '')}
          aria-label="Filter by status"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <BookingsTable
          bookings={data?.items ?? []}
          renderActions={(b) =>
            (b.status === 'PENDING' || b.status === 'APPROVED') &&
            new Date(b.startTime) > new Date() ? (
              <Button
                variant="outline"
                size="sm"
                disabled={cancelBooking.isPending}
                onClick={() => cancelBooking.mutate(b.id)}
              >
                Cancel
              </Button>
            ) : null
          }
        />
      )}
    </div>
  );
}
