import { Link } from 'react-router-dom';
import { CalendarCheck, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HomePage() {
  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col items-center gap-6 py-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Book the perfect workspace, in seconds
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Desks, meeting rooms, private offices, and event spaces — browse availability and reserve
          instantly.
        </p>
        <div className="flex gap-3">
          <Button size="lg" asChild>
            <Link to="/spaces">Browse spaces</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/register">Create an account</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <Users className="mb-2 h-6 w-6 text-primary" />
            <CardTitle className="text-base">Every kind of space</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Hot desks, meeting rooms, private offices, and event halls in one place.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CalendarCheck className="mb-2 h-6 w-6 text-primary" />
            <CardTitle className="text-base">Real-time availability</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            See exactly what's booked and what's free before you request a slot.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <ShieldCheck className="mb-2 h-6 w-6 text-primary" />
            <CardTitle className="text-base">Conflict-free booking</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Our approval workflow guarantees two people can never double-book the same slot.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
