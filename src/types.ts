export type Role = 'VISITOR' | 'MEMBER' | 'ADMIN';
export type SpaceType =
  'DESK' | 'MEETING_ROOM' | 'PRIVATE_OFFICE' | 'EVENT_SPACE';
export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isEmailVerified: boolean;
}

export interface SpaceAmenity {
  id: string;
  name: string;
}

export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  description: string | null;
  capacity: number;
  hourlyRate: string;
  isActive: boolean;
  amenities: SpaceAmenity[];
  createdAt: string;
}

export interface Booking {
  id: string;
  spaceId: string;
  space?: Space;
  memberId: string;
  status: BookingStatus;
  bookingDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export type NotificationType =
  'BOOKING_CREATED' | 'BOOKING_APPROVED' | 'BOOKING_REJECTED';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  bookingId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface MaintenanceWindow {
  id: string;
  spaceId: string;
  space?: Space;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
