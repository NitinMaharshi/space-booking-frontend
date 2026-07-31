import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { authApi } from '@/lib/auth-api';
import { ForgotPasswordPage } from '@/pages/forgot-password-page';
import { HomePage } from '@/pages/home-page';
import { LoginPage } from '@/pages/login-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { RegisterPage } from '@/pages/register-page';
import { ResetPasswordPage } from '@/pages/reset-password-page';
import { SpacesPage } from '@/pages/spaces-page';
import { VerifyEmailPage } from '@/pages/verify-email-page';
import { useAuthStore } from '@/stores/auth-store';

// Route-level code splitting: booking details, member area, and the entire
// admin section are only fetched when a user actually navigates there.
const SpaceDetailsPage = lazy(() =>
  import('@/pages/space-details-page').then((m) => ({
    default: m.SpaceDetailsPage,
  })),
);
const DashboardPage = lazy(() =>
  import('@/pages/member/dashboard-page').then((m) => ({
    default: m.DashboardPage,
  })),
);
const MyBookingsPage = lazy(() =>
  import('@/pages/member/my-bookings-page').then((m) => ({
    default: m.MyBookingsPage,
  })),
);
const ProfilePage = lazy(() =>
  import('@/pages/member/profile-page').then((m) => ({
    default: m.ProfilePage,
  })),
);
const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/admin-dashboard-page').then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const ManageSpacesPage = lazy(() =>
  import('@/pages/admin/manage-spaces-page').then((m) => ({
    default: m.ManageSpacesPage,
  })),
);
const ManageBookingsPage = lazy(() =>
  import('@/pages/admin/manage-bookings-page').then((m) => ({
    default: m.ManageBookingsPage,
  })),
);
const MaintenancePage = lazy(() =>
  import('@/pages/admin/maintenance-page').then((m) => ({
    default: m.MaintenancePage,
  })),
);

// Module-scoped (not component-scoped) so React 19 StrictMode's dev-only
// double-invoke of mount effects reuses the same in-flight request instead
// of firing /auth/refresh twice — a second concurrent call would look like
// refresh-token reuse and trip the theft-detection logic in AuthService,
// revoking the session it just issued.
let bootstrapPromise: Promise<{ accessToken: string } | null> | null = null;

function bootstrapSession() {
  bootstrapPromise ??= (async () => {
    try {
      const res = await api.post('/auth/refresh');
      return { accessToken: res.data.data.accessToken as string };
    } catch {
      return null;
    }
  })();
  return bootstrapPromise;
}

function PageFallback() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

function App() {
  const { setAuth, setInitializing } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await bootstrapSession();
        if (!result) return;
        useAuthStore.getState().setAccessToken(result.accessToken);
        const user = await authApi.me();
        if (!cancelled) setAuth(user, result.accessToken);
      } catch {
        // No valid session; user starts logged out.
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setAuth, setInitializing]);

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="spaces" element={<SpacesPage />} />
          <Route path="spaces/:id" element={<SpaceDetailsPage />} />

          <Route element={<ProtectedRoute roles={['MEMBER', 'ADMIN']} />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="bookings" element={<MyBookingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/spaces" element={<ManageSpacesPage />} />
            <Route path="admin/bookings" element={<ManageBookingsPage />} />
            <Route path="admin/maintenance" element={<MaintenancePage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
