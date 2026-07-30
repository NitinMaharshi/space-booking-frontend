import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { spacesApi } from '@/lib/spaces-api';
import { bookingsApi } from '@/lib/bookings-api';
import { getApiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

const bookingSchema = z
  .object({
    date: z.string().min(1, 'Choose a date'),
    startTime: z.string().min(1, 'Choose a start time'),
    endTime: z.string().min(1, 'Choose an end time'),
    partySize: z.coerce.number().int().min(1),
    notes: z.string().max(1000).optional(),
  })
  .refine((v) => v.endTime > v.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });
type BookingFormInput = z.input<typeof bookingSchema>;
type BookingFormValues = z.output<typeof bookingSchema>;

export function SpaceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: space, isLoading } = useQuery({
    queryKey: ['space', id],
    queryFn: () => spacesApi.get(id!),
    enabled: !!id,
  });

  const { data: availability } = useQuery({
    queryKey: ['availability', id, date],
    queryFn: () => spacesApi.availability(id!, date),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormInput, unknown, BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { date, partySize: 1 },
  });

  const createBooking = useMutation({
    mutationFn: (values: BookingFormValues) =>
      bookingsApi.create({
        spaceId: id!,
        startTime: new Date(`${values.date}T${values.startTime}:00`).toISOString(),
        endTime: new Date(`${values.date}T${values.endTime}:00`).toISOString(),
        partySize: values.partySize,
        notes: values.notes,
      }),
    onSuccess: () => {
      toast.success('Booking requested — awaiting admin approval');
      setOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['availability', id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not create booking')),
  });

  if (isLoading) return <Skeleton className="h-64" />;
  if (!space) return <p>Space not found.</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{space.name}</h1>
          <Badge variant="secondary">{space.type.replace('_', ' ')}</Badge>
        </div>
        {space.description && <p className="mt-2 text-muted-foreground">{space.description}</p>}
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Capacity</dt>
            <dd className="font-medium">{space.capacity} people</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Rate</dt>
            <dd className="font-medium">${space.hourlyRate}/hour</dd>
          </div>
        </dl>
        {space.amenities.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-medium text-muted-foreground">Amenities</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {space.amenities.map((a) => (
                <Badge key={a.id} variant="outline">
                  {a.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mb-4 w-48"
              aria-label="Check availability for date"
            />
            {availability && availability.bookings.length === 0 && availability.maintenanceWindows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Fully available on this date.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {availability?.bookings.map((b) => (
                  <li key={b.id} className="text-destructive">
                    Booked: {format(new Date(b.startTime), 'p')} – {format(new Date(b.endTime), 'p')}
                  </li>
                ))}
                {availability?.maintenanceWindows.map((m) => (
                  <li key={m.id} className="text-amber-600">
                    Maintenance: {format(new Date(m.startTime), 'p')} – {format(new Date(m.endTime), 'p')} ({m.reason})
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reserve this space</CardTitle>
          </CardHeader>
          <CardContent>
            {!user ? (
              <Button asChild className="w-full">
                <Link to="/login">Log in to book</Link>
              </Button>
            ) : user.role === 'ADMIN' ? (
              <p className="text-sm text-muted-foreground">Admins manage bookings from the admin panel.</p>
            ) : (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">Request booking</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request a booking for {space.name}</DialogTitle>
                  </DialogHeader>
                  <form
                    className="grid gap-4"
                    onSubmit={handleSubmit((v) => createBooking.mutate(v))}
                    noValidate
                  >
                    <div className="grid gap-1.5">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" type="date" {...register('date')} />
                      {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1.5">
                        <Label htmlFor="startTime">Start</Label>
                        <Input id="startTime" type="time" {...register('startTime')} />
                        {errors.startTime && (
                          <p className="text-sm text-destructive">{errors.startTime.message}</p>
                        )}
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="endTime">End</Label>
                        <Input id="endTime" type="time" {...register('endTime')} />
                        {errors.endTime && <p className="text-sm text-destructive">{errors.endTime.message}</p>}
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="partySize">Party size</Label>
                      <Input id="partySize" type="number" min={1} max={space.capacity} {...register('partySize')} />
                      {errors.partySize && (
                        <p className="text-sm text-destructive">{errors.partySize.message}</p>
                      )}
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Textarea id="notes" rows={2} {...register('notes')} />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting || createBooking.isPending}>
                        {createBooking.isPending ? 'Submitting...' : 'Submit request'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
