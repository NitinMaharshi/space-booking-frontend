import { Outlet } from 'react-router-dom';
import { Navbar } from './navbar';

export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Co-working Space Booking System
      </footer>
    </div>
  );
}
