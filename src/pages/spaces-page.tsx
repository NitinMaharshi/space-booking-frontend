import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { spacesApi } from '@/lib/spaces-api';
import type { SpaceType } from '@/types';

const SPACE_TYPES: { value: SpaceType | ''; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'DESK', label: 'Desk' },
  { value: 'MEETING_ROOM', label: 'Meeting Room' },
  { value: 'PRIVATE_OFFICE', label: 'Private Office' },
  { value: 'EVENT_SPACE', label: 'Event Space' },
];

export function SpacesPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<SpaceType | ''>('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['spaces', { search: debouncedSearch, type, page }],
    queryFn: () => spacesApi.list({ search: debouncedSearch || undefined, type: type || undefined, page, limit: 9 }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Browse spaces</h1>
        <p className="text-muted-foreground">Find a desk, room, or hall that fits your needs.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            aria-label="Search spaces"
          />
        </div>
        <Select
          className="sm:w-56"
          value={type}
          onChange={(e) => {
            setType(e.target.value as SpaceType | '');
            setPage(1);
          }}
          aria-label="Filter by space type"
        >
          {SPACE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>

      {isError && <p className="text-destructive">Could not load spaces. Please try again.</p>}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((space) => (
              <Card key={space.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{space.name}</CardTitle>
                    <Badge variant="secondary">{space.type.replace('_', ' ')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 text-sm text-muted-foreground">
                  <p>Capacity: {space.capacity}</p>
                  <p>${space.hourlyRate}/hour</p>
                  {space.amenities.length > 0 && (
                    <p className="mt-2 line-clamp-2">
                      Amenities: {space.amenities.map((a) => a.name).join(', ')}
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link to={`/spaces/${space.id}`}>View details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {data.meta.page} of {Math.max(data.meta.totalPages, 1)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      ) : (
        <p className="py-12 text-center text-muted-foreground">No spaces match your search.</p>
      )}
    </div>
  );
}
