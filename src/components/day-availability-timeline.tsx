import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Props {
  bookings: { id: string; startTime: string; endTime: string }[];
  maintenanceWindows: {
    id: string;
    startTime: string;
    endTime: string;
    reason: string;
  }[];
}

const PX_PER_HOUR = 32;
const TICK_MINUTES = 30;
const TICK_HEIGHT = (PX_PER_HOUR * TICK_MINUTES) / 60;
const TICKS = Array.from(
  { length: (24 * 60) / TICK_MINUTES },
  (_, i) => i * TICK_MINUTES,
);

// Position blocks using the viewer's local time, matching the labels
// (formatted with date-fns, also local) and the TimeSlotPicker's
// half-hour slots — a block's position and its displayed time now
// always agree.
// Note: the server buckets a "day" by UTC boundaries, so for viewers far
// from UTC a booking within a few hours of midnight can visually land on
// the adjacent local day; correcting that fully would mean making the
// availability endpoint timezone-aware, which is out of scope here.
function hourOfDay(iso: string) {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

export function DayAvailabilityTimeline({
  bookings,
  maintenanceWindows,
}: Props) {
  const blocks = [
    ...bookings.map((b) => ({
      ...b,
      label: 'Booked',
      variant: 'booked' as const,
    })),
    ...maintenanceWindows.map((m) => ({
      ...m,
      label: m.reason,
      variant: 'maintenance' as const,
    })),
  ];

  if (blocks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Fully available on this date.
      </p>
    );
  }

  return (
    <div className="flex max-h-96 overflow-y-auto text-xs">
      <div className="w-14 shrink-0">
        {TICKS.map((minutes) => (
          <div
            key={minutes}
            style={{ height: TICK_HEIGHT }}
            className="border-t pr-2 text-right text-muted-foreground"
          >
            {String(Math.floor(minutes / 60)).padStart(2, '0')}:
            {String(minutes % 60).padStart(2, '0')}
          </div>
        ))}
      </div>
      <div className="relative flex-1 border-l">
        {TICKS.map((minutes) => (
          <div
            key={minutes}
            style={{ height: TICK_HEIGHT }}
            className="border-t"
          />
        ))}
        {blocks.map((b) => {
          const start = Math.max(0, hourOfDay(b.startTime));
          const end = Math.max(
            start + 0.25,
            Math.min(24, hourOfDay(b.endTime) || 24),
          );
          return (
            <div
              key={b.id}
              style={{
                top: start * PX_PER_HOUR,
                height: (end - start) * PX_PER_HOUR,
              }}
              className={cn(
                'absolute left-1 right-1 overflow-hidden rounded px-1.5 py-0.5 text-white',
                b.variant === 'booked' ? 'bg-destructive' : 'bg-amber-500',
              )}
              title={`${b.label}: ${format(new Date(b.startTime), 'p')} – ${format(new Date(b.endTime), 'p')}`}
            >
              {b.label} {format(new Date(b.startTime), 'p')}–
              {format(new Date(b.endTime), 'p')}
            </div>
          );
        })}
      </div>
    </div>
  );
}
