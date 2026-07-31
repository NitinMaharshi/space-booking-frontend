import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { getApiErrorMessage } from '@/lib/api';
import { authApi } from '@/lib/auth-api';

type Status = 'verifying' | 'success' | 'error';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<Status>('verifying');
  const [error, setError] = useState('');
  // The backend clears the token on first successful verify, so a second
  // call with the same token would 401 — guard against React 19 StrictMode's
  // dev-only double-invoke of this effect (see App.tsx's bootstrap for the
  // same pattern).
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    authApi
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        setError(
          getApiErrorMessage(
            err,
            'This verification link is invalid or expired',
          ),
        );
        setStatus('error');
      });
  }, [token]);

  return (
    <div className="mx-auto flex max-w-sm flex-1 items-center py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>Confirming your email address</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 text-center">
          {!token ? (
            <p className="text-sm text-destructive">
              Missing verification token. Use the link from your email.
            </p>
          ) : status === 'verifying' ? (
            <>
              <Spinner className="h-6 w-6" />
              <p className="text-sm text-muted-foreground">Verifying...</p>
            </>
          ) : status === 'success' ? (
            <p className="text-sm text-muted-foreground">
              Your email has been verified. You're all set.
            </p>
          ) : (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Link to="/login" className="text-sm text-primary underline">
            Back to login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
