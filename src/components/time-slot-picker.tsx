import { format } from 'date-fns';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SlotSource {
  startTime: string;
  endTime: string;
}

interface SelectedRange {
  startTime: string;
  endTime: string;
}

interface Props {
  date: string;
  bookings: SlotSource[];
  maintenanceWindows: SlotSource[];
  value: SelectedRange | null;
  onChange: (value: SelectedRange | null) => void;
}

const SLOT_MINUTES = 30;

interface Slot {
  index: number;
  start: Date;
  end: Date;
  status: 'available' | 'booked' | 'maintenance' | 'past';
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

// One button per 30-minute slot of the selected local day, disabled once
// it's booked/under maintenance/in the past. Clicking a free slot right
// after the current selection's end extends it by 30 minutes; any other
// click starts a fresh single-slot selection — a deliberately simple range
// model (no drag-select) that still lets you build a multi-slot booking
// one click at a time.
export function TimeSlotPicker({
  date,
  bookings,
  maintenanceWindows,
  value,
  onChange,
}: Props) {
  const slots = useMemo<Slot[]>(() => {
    const now = new Date();
    const bookingRanges = bookings.map((b) => ({
      start: new Date(b.startTime),
      end: new Date(b.endTime),
    }));
    const maintenanceRanges = maintenanceWindows.map((m) => ({
      start: new Date(m.startTime),
      end: new Date(m.endTime),
    }));

    const slotsPerDay = (24 * 60) / SLOT_MINUTES;
    return Array.from({ length: slotsPerDay }, (_, index) => {
      const totalMinutes = index * SLOT_MINUTES;
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      const start = new Date(
        `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
      );
      const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);

      let status: Slot['status'] = 'available';
      if (end <= now) {
        status = 'past';
      } else if (
        maintenanceRanges.some((m) => overlaps(start, end, m.start, m.end))
      ) {
        status = 'maintenance';
      } else if (
        bookingRanges.some((b) => overlaps(start, end, b.start, b.end))
      ) {
        status = 'booked';
      }
      return { index, start, end, status };
    });
  }, [date, bookings, maintenanceWindows]);

  const selectedStart = value ? new Date(value.startTime) : null;
  const selectedEnd = value ? new Date(value.endTime) : null;

  const handleClick = (slot: Slot) => {
    if (slot.status !== 'available') return;

    if (
      selectedStart &&
      selectedEnd &&
      slot.start.getTime() === selectedEnd.getTime()
    ) {
      onChange({
        startTime: selectedStart.toISOString(),
        endTime: slot.end.toISOString(),
      });
      return;
    }
    onChange({
      startTime: slot.start.toISOString(),
      endTime: slot.end.toISOString(),
    });
  };

  const isSelected = (slot: Slot) =>
    selectedStart !== null &&
    selectedEnd !== null &&
    slot.start >= selectedStart &&
    slot.end <= selectedEnd;

  const statusLabel: Record<Slot['status'], string | undefined> = {
    available: undefined,
    booked: 'already booked',
    maintenance: 'under maintenance',
    past: 'time has passed',
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8">
        {slots.map((slot) => {
          const label = statusLabel[slot.status];
          return (
            <Button
              key={slot.index}
              type="button"
              variant={isSelected(slot) ? 'default' : 'outline'}
              size="sm"
              disabled={slot.status !== 'available'}
              onClick={() => handleClick(slot)}
              aria-label={`${format(slot.start, 'h:mm a')}${label ? `, ${label}` : ''}`}
              className={cn(
                'text-xs',
                slot.status === 'booked' &&
                  'border-destructive/40 text-destructive/70 line-through',
                slot.status === 'maintenance' &&
                  'border-amber-500/40 text-amber-600/70 line-through',
              )}
            >
              {format(slot.start, 'h:mm a')}
            </Button>
          );
        })}
      </div>
      {selectedStart && selectedEnd && (
        <p className="mt-2 text-xs text-muted-foreground">
          Selected: {format(selectedStart, 'h:mm a')} –{' '}
          {format(selectedEnd, 'h:mm a')}
        </p>
      )}
    </div>
  );
}
