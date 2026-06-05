'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { ApiError } from '@/lib/api';
import { OfflineBootstrap } from '@/components/offline-bootstrap';

export function Providers({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            networkMode: 'offlineFirst',
            retry: (failureCount, error) => {
              if (error instanceof ApiError && [400, 401, 403, 404, 422].includes(error.status)) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <OfflineBootstrap />
        {children}
        <Toaster richColors position="top-center" closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
