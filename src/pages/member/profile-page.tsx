import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth-store';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">Profile & Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account details</CardTitle>
          <CardDescription>Your CoSpace account information</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Full name</p>
            <p className="font-medium">{user.fullName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Role</p>
            <Badge variant="secondary">{user.role}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
