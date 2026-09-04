import { DMSans_500Medium, DMSans_600SemiBold, useFonts } from '@expo-google-fonts/dm-sans';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { colors } from '@/constants/theme';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_500Medium,
    DMSans_600SemiBold,
    Fraunces_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryProvider>
      <AuthProvider>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.canvas },
            headerShown: false,
          }}
        />
      </AuthProvider>
    </QueryProvider>
  );
}
