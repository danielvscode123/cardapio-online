import { Redirect, Stack } from 'expo-router';

import { BrandSplash } from '@/components/brand-splash';
import { useAuth } from '@/providers/auth-provider';

export default function AuthLayout() {
  const { loading, session, profile } = useAuth();

  if (loading) {
    return <BrandSplash />;
  }

  if (session && profile?.active) {
    return <Redirect href="/(app)/(tabs)/waiter" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
