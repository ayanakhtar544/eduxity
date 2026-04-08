// File: core/network/queryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Senior Dev Config: Stale Time aur Global Error Handling
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export function TanStackProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}