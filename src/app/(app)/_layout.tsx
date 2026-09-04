import { Redirect, Stack } from 'expo-router';

import { BrandSplash } from '@/components/brand-splash';
import { useAuth } from '@/providers/auth-provider';

export default function AppLayout() {
  const { loading, session, profile } = useAuth();

  if (loading) {
    return <BrandSplash />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!profile?.active) {
    return <Redirect href="/(auth)/activation" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
