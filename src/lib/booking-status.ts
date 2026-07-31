import type { BadgeProps } from '@/components/ui/badge';
import type { BookingStatus } from '@/types';

export const statusBadgeVariant: Record<BookingStatus, BadgeProps['variant']> =
  {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'destructive',
    CANCELLED: 'secondary',
  };
