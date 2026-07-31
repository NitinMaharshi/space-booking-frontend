import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

interface Options {
  route?: string;
  /** Route pattern (e.g. "/spaces/:id") to match `route` against, for pages that read useParams. */
  path?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', path }: Options = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const content = path ? (
    <Routes>
      <Route path={path} element={ui} />
    </Routes>
  ) : (
    ui
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>
    </QueryClientProvider>,
  );
}
