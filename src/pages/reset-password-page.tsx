import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/auth-api';
import { getApiErrorMessage } from '@/lib/api';

const schema = z.object({
  newPassword: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Include an uppercase letter, a lowercase letter, and a number'),
});
type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await authApi.resetPassword({ token, newPassword: values.newPassword });
      toast.success('Password reset. Please log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Reset link is invalid or expired'));
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-1 items-center py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>Choose a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <p className="text-sm text-destructive">Missing reset token. Use the link from your email.</p>
          ) : (
            <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="grid gap-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <Input id="newPassword" type="password" autoComplete="new-password" {...register('newPassword')} />
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Resetting...' : 'Reset password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
