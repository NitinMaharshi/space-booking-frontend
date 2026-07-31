import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { BookingsTable } from '@/components/bookings-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export function ManageBookingsPage() {
  const [status, setStatus] = useState<BookingStatus | ''>('PENDING');
  const [rejectTarget, setRejectTarget] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'admin', status],
    queryFn: () => bookingsApi.list({ status: status || undefined, limit: 50 }),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['bookings'] });

  const setBookingStatus = (
    id: string,
    next: BookingStatus,
    extra: Partial<Booking> = {},
  ) => {
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
                b.id === id ? { ...b, status: next, ...extra } : b,
              ),
            }
          : old,
    );
    return previous;
  };

  const approve = useMutation({
    mutationFn: (id: string) => bookingsApi.approve(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['bookings'] });
      return { previous: setBookingStatus(id, 'APPROVED') };
    },
    onSuccess: () => toast.success('Booking approved'),
    onError: (err, _id, context) => {
      context?.previous.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
      toast.error(getApiErrorMessage(err, 'Could not approve booking'));
    },
    onSettled: invalidate,
  });

  const reject = useMutation({
    mutationFn: () => bookingsApi.reject(rejectTarget!.id, rejectionReason),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['bookings'] });
      const previous = setBookingStatus(rejectTarget!.id, 'REJECTED', {
        rejectionReason,
      });
      setRejectTarget(null);
      setRejectionReason('');
      return { previous };
    },
    onSuccess: () => toast.success('Booking rejected'),
    onError: (err, _vars, context) => {
      context?.previous.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
      toast.error(getApiErrorMessage(err, 'Could not reject booking'));
    },
    onSettled: invalidate,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage Bookings</h1>
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
            b.status === 'PENDING' ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={approve.isPending}
                  onClick={() => approve.mutate(b.id)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRejectTarget(b)}
                >
                  Reject
                </Button>
              </div>
            ) : null
          }
        />
      )}

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject booking</DialogTitle>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="rejectionReason">Reason</Label>
            <Input
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Space needed for maintenance"
            />
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={rejectionReason.trim().length < 3 || reject.isPending}
              onClick={() => reject.mutate()}
            >
              Confirm rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
