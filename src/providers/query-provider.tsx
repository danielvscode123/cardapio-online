import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
  }),
);

export function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20_000,
            retry: 2,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (Platform.OS !== 'web') {
        focusManager.setFocused(state === 'active');
      }
    });

    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
