import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { maintenanceApi } from '@/lib/maintenance-api';
import { spacesApi } from '@/lib/spaces-api';
import { getApiErrorMessage } from '@/lib/api';

const schema = z
  .object({
    spaceId: z.string().uuid('Choose a space'),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    reason: z.string().min(3).max(500),
  })
  .refine((v) => v.endTime > v.startTime, { message: 'End must be after start', path: ['endTime'] });
type FormValues = z.infer<typeof schema>;

export function MaintenancePage() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: windows, isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => maintenanceApi.list({ limit: 100 }),
  });
  const { data: spaces } = useQuery({
    queryKey: ['spaces', 'select'],
    queryFn: () => spacesApi.list({ limit: 100 }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const createWindow = useMutation({
    mutationFn: (values: FormValues) =>
      maintenanceApi.create({
        ...values,
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
      }),
    onSuccess: () => {
      toast.success('Maintenance window scheduled');
      setOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not schedule maintenance')),
  });

  const removeWindow = useMutation({
    mutationFn: (id: string) => maintenanceApi.remove(id),
    onSuccess: () => {
      toast.success('Maintenance window removed');
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not remove maintenance window')),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Maintenance Windows</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Schedule maintenance</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule a maintenance window</DialogTitle>
            </DialogHeader>
            <form className="grid gap-4" onSubmit={handleSubmit((v) => createWindow.mutate(v))} noValidate>
              <div className="grid gap-1.5">
                <Label htmlFor="spaceId">Space</Label>
                <Select id="spaceId" {...register('spaceId')} defaultValue="">
                  <option value="" disabled>
                    Select a space
                  </option>
                  {spaces?.items.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
                {errors.spaceId && <p className="text-sm text-destructive">{errors.spaceId.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="startTime">Start</Label>
                  <Input id="startTime" type="datetime-local" {...register('startTime')} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="endTime">End</Label>
                  <Input id="endTime" type="datetime-local" {...register('endTime')} />
                  {errors.endTime && <p className="text-sm text-destructive">{errors.endTime.message}</p>}
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="reason">Reason</Label>
                <Input id="reason" placeholder="HVAC servicing" {...register('reason')} />
                {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting || createWindow.isPending}>
                  {createWindow.isPending ? 'Scheduling...' : 'Schedule'}
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
                <th className="p-3 font-medium">Space</th>
                <th className="p-3 font-medium">Window</th>
                <th className="p-3 font-medium">Reason</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {windows?.items.map((w) => (
                <tr key={w.id} className="border-t">
                  <td className="p-3">{w.space?.name ?? w.spaceId}</td>
                  <td className="p-3">
                    {format(new Date(w.startTime), 'PP p')} – {format(new Date(w.endTime), 'p')}
                  </td>
                  <td className="p-3">{w.reason}</td>
                  <td className="p-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Remove maintenance window"
                      disabled={removeWindow.isPending}
                      onClick={() => removeWindow.mutate(w.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
