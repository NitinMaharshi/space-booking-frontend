import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimeSlotPicker } from './time-slot-picker';

// A fixed "now" in the past relative to the test date, so every slot on
// that date counts as upcoming, not "past".
const FUTURE_DATE = '2099-06-15';

describe('TimeSlotPicker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2099-06-01T00:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders 48 half-hour slots, all available with no bookings', () => {
    render(
      <TimeSlotPicker
        date={FUTURE_DATE}
        bookings={[]}
        maintenanceWindows={[]}
        value={null}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '12:00 AM' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '11:30 PM' })).toBeEnabled();
  });

  it('disables a slot that overlaps an existing booking', () => {
    render(
      <TimeSlotPicker
        date={FUTURE_DATE}
        bookings={[
          {
            startTime: `${FUTURE_DATE}T09:00:00`,
            endTime: `${FUTURE_DATE}T09:30:00`,
          },
        ]}
        maintenanceWindows={[]}
        value={null}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: '9:00 AM, already booked' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: '9:30 AM' })).toBeEnabled();
  });

  it('disables a slot under maintenance', () => {
    render(
      <TimeSlotPicker
        date={FUTURE_DATE}
        bookings={[]}
        maintenanceWindows={[
          {
            startTime: `${FUTURE_DATE}T14:00:00`,
            endTime: `${FUTURE_DATE}T14:30:00`,
          },
        ]}
        value={null}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: '2:00 PM, under maintenance' }),
    ).toBeDisabled();
  });

  it('selects a single half-hour slot on click', () => {
    const onChange = vi.fn();
    render(
      <TimeSlotPicker
        date={FUTURE_DATE}
        bookings={[]}
        maintenanceWindows={[]}
        value={null}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '9:00 AM' }));

    expect(onChange).toHaveBeenCalledWith({
      startTime: new Date(`${FUTURE_DATE}T09:00:00`).toISOString(),
      endTime: new Date(`${FUTURE_DATE}T09:30:00`).toISOString(),
    });
  });

  it('extends the selection when clicking the slot right after the current end', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TimeSlotPicker
        date={FUTURE_DATE}
        bookings={[]}
        maintenanceWindows={[]}
        value={{
          startTime: new Date(`${FUTURE_DATE}T09:00:00`).toISOString(),
          endTime: new Date(`${FUTURE_DATE}T09:30:00`).toISOString(),
        }}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '9:30 AM' }));

    expect(onChange).toHaveBeenCalledWith({
      startTime: new Date(`${FUTURE_DATE}T09:00:00`).toISOString(),
      endTime: new Date(`${FUTURE_DATE}T10:00:00`).toISOString(),
    });

    rerender(
      <TimeSlotPicker
        date={FUTURE_DATE}
        bookings={[]}
        maintenanceWindows={[]}
        value={{
          startTime: new Date(`${FUTURE_DATE}T09:00:00`).toISOString(),
          endTime: new Date(`${FUTURE_DATE}T10:00:00`).toISOString(),
        }}
        onChange={onChange}
      />,
    );
    expect(
      screen.getByText('Selected: 9:00 AM – 10:00 AM'),
    ).toBeInTheDocument();
  });

  it('disables slots that have already passed', () => {
    vi.setSystemTime(new Date(`${FUTURE_DATE}T10:30:00`));
    render(
      <TimeSlotPicker
        date={FUTURE_DATE}
        bookings={[]}
        maintenanceWindows={[]}
        value={null}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: '10:00 AM, time has passed' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: '10:30 AM' })).toBeEnabled();
  });
});
