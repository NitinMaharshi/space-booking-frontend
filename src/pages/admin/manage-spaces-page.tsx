import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/lib/api';
import { spacesApi } from '@/lib/spaces-api';
import type { SpaceType } from '@/types';

const spaceSchema = z.object({
  name: z.string().min(2).max(150),
  type: z.enum(['DESK', 'MEETING_ROOM', 'PRIVATE_OFFICE', 'EVENT_SPACE']),
  description: z.string().max(2000).optional(),
  capacity: z.coerce.number().int().min(1).max(1000),
  hourlyRate: z.coerce.number().min(0).max(100000),
  amenities: z.string().optional(),
});
type SpaceFormInput = z.input<typeof spaceSchema>;
type SpaceFormValues = z.output<typeof spaceSchema>;

const SPACE_TYPES: { value: SpaceType; label: string }[] = [
  { value: 'DESK', label: 'Desk' },
  { value: 'MEETING_ROOM', label: 'Meeting Room' },
  { value: 'PRIVATE_OFFICE', label: 'Private Office' },
  { value: 'EVENT_SPACE', label: 'Event Space' },
];

export function ManageSpacesPage() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['spaces', 'admin'],
    queryFn: () => spacesApi.list({ limit: 100 }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SpaceFormInput, unknown, SpaceFormValues>({
    resolver: zodResolver(spaceSchema),
    defaultValues: { type: 'DESK', capacity: 1, hourlyRate: 0 },
  });

  const createSpace = useMutation({
    mutationFn: (values: SpaceFormValues) =>
      spacesApi.create({
        ...values,
        amenities: values.amenities
          ? values.amenities
              .split(',')
              .map((a) => a.trim())
              .filter(Boolean)
          : [],
      }),
    onSuccess: () => {
      toast.success('Space created');
      setOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, 'Could not create space')),
  });

  const deactivateSpace = useMutation({
    mutationFn: (id: string) => spacesApi.remove(id),
    onSuccess: () => {
      toast.success('Space deactivated');
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, 'Could not deactivate space')),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage Spaces</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add space</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new space</DialogTitle>
            </DialogHeader>
            <form
              className="grid gap-4"
              onSubmit={handleSubmit((v) => createSpace.mutate(v))}
              noValidate
            >
              <div className="grid gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="type">Type</Label>
                  <Select id="type" {...register('type')}>
                    {SPACE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min={1}
                    {...register('capacity')}
                  />
                  {errors.capacity && (
                    <p className="text-sm text-destructive">
                      {errors.capacity.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="hourlyRate">Hourly rate ($)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min={0}
                  step="0.01"
                  {...register('hourlyRate')}
                />
                {errors.hourlyRate && (
                  <p className="text-sm text-destructive">
                    {errors.hourlyRate.message}
                  </p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Input
                  id="amenities"
                  placeholder="Projector, Whiteboard"
                  {...register('amenities')}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  {...register('description')}
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isSubmitting || createSpace.isPending}
                >
                  {createSpace.isPending ? 'Creating...' : 'Create space'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Capacity</th>
                <th className="p-3 font-medium">Rate</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((space) => (
                <tr key={space.id} className="border-t">
                  <td className="p-3">{space.name}</td>
                  <td className="p-3">{space.type.replace('_', ' ')}</td>
                  <td className="p-3">{space.capacity}</td>
                  <td className="p-3">${space.hourlyRate}</td>
                  <td className="p-3">
                    <Badge variant={space.isActive ? 'success' : 'secondary'}>
                      {space.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {space.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deactivateSpace.isPending}
                        onClick={() => deactivateSpace.mutate(space.id)}
                      >
                        Deactivate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
