import { useReactQueryDevTools } from '@dev-plugins/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';

export const queryClient = new QueryClient();

// Keep hook order stable; no-op when not running the Expo Dev Client.
const useReactQueryDevToolsSafe =
  __DEV__ && process.env.EXPO_DEV_CLIENT ? useReactQueryDevTools : () => {};

export function APIProvider({ children }: { children: React.ReactNode }) {
  useReactQueryDevToolsSafe(queryClient);
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
