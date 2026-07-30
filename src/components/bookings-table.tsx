import { format } from 'date-fns';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { statusBadgeVariant } from '@/lib/booking-status';
import type { Booking } from '@/types';

interface Props {
  bookings: Booking[];
  showSpace?: boolean;
  renderActions?: (booking: Booking) => ReactNode;
}

export function BookingsTable({ bookings, showSpace = true, renderActions }: Props) {
  if (bookings.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No bookings found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-muted-foreground">
          <tr>
            {showSpace && <th className="p-3 font-medium">Space</th>}
            <th className="p-3 font-medium">When</th>
            <th className="p-3 font-medium">Party</th>
            <th className="p-3 font-medium">Status</th>
            {renderActions && <th className="p-3 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-t">
              {showSpace && <td className="p-3">{b.space?.name ?? b.spaceId}</td>}
              <td className="p-3">
                {format(new Date(b.startTime), 'PP p')} – {format(new Date(b.endTime), 'p')}
              </td>
              <td className="p-3">{b.partySize}</td>
              <td className="p-3">
                <Badge variant={statusBadgeVariant[b.status]}>{b.status}</Badge>
                {b.status === 'REJECTED' && b.rejectionReason && (
                  <p className="mt-1 text-xs text-muted-foreground">{b.rejectionReason}</p>
                )}
              </td>
              {renderActions && <td className="p-3">{renderActions(b)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
