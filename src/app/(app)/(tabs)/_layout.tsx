import { Tabs } from 'expo-router';

import { IconifyIcon } from '@/components/ui/iconify-icon';
import { colors, fonts } from '@/constants/theme';
import { useOperationalRealtime } from '@/features/operations/realtime';
import { useAuth } from '@/providers/auth-provider';

export default function TabsLayout() {
  const { profile } = useAuth();
  useOperationalRealtime();

  return (
    <Tabs
      initialRouteName="waiter"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tomato,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontFamily: fonts.bodyBold,
          fontSize: 10,
          marginTop: 2,
        },
        tabBarStyle: {
          height: 76,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopWidth: 0,
          backgroundColor: colors.cream,
          elevation: 14,
          shadowColor: colors.ink,
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.08,
          shadowRadius: 14,
        },
      }}
    >
      <Tabs.Screen
        name="waiter"
        options={{
          title: 'Garçom',
          tabBarIcon: ({ color, size }) => (
            <IconifyIcon icon="solar:armchair-2-bold-duotone" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="kitchen"
        options={{
          title: 'Cozinha',
          tabBarIcon: ({ color, size }) => (
            <IconifyIcon icon="solar:chef-hat-bold" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="cashier"
        options={{
          title: 'Caixa',
          tabBarIcon: ({ color, size }) => (
            <IconifyIcon icon="solar:wallet-money-bold-duotone" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="management"
        options={{
          title: 'Gestão',
          href: profile?.role === 'manager' ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <IconifyIcon icon="solar:settings-bold-duotone" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
