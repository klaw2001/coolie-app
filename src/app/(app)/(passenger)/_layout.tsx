import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui';
import { useT } from '@/i18n';
import { ACTIVE } from '@/data/journey';
import { useApp } from '@/store/useApp';
import { C, F } from '@/theme';

export default function PassengerTabs() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const live = useApp((s) => s.bookings.filter((b) => b.source === 'passenger' && ACTIVE.includes(b.status)).length);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.red,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontFamily: F.medium, fontSize: 11, lineHeight: 18 },
        tabBarStyle: { backgroundColor: C.white, borderTopColor: C.line, height: 72 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 8 },
      }}>
      <Tabs.Screen name="home" options={{ title: t('tab.home'), tabBarIcon: ({ color, size }) => <Icon name="home-variant" color={color} size={size} /> }} />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t('tab.bookings'),
          tabBarBadge: live || undefined,
          tabBarBadgeStyle: { backgroundColor: C.red, fontFamily: F.semibold, fontSize: 10 },
          tabBarIcon: ({ color, size }) => <Icon name="clipboard-text-clock" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="wallet" options={{ title: t('tab.wallet'), tabBarIcon: ({ color, size }) => <Icon name="wallet" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: t('tab.profile'), tabBarIcon: ({ color, size }) => <Icon name="account-circle" color={color} size={size} /> }} />
    </Tabs>
  );
}
