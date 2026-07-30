import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import type { Role } from '@/types';
import { Spinner } from '@/components/ui/spinner';

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, isInitializing } = useAuthStore();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
