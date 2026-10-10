import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui';
import { useT } from '@/i18n';
import { selectCoolie, useApp } from '@/store/useApp';
import { C, F, PC } from '@/theme';

/** Coolie Partner tabs: dark bar with brass highlights, so it reads as a separate app. */
export default function CoolieTabs() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const incoming = useApp((s) => {
    const me = selectCoolie(s);
    if (!me?.profile.online) return 0;
    const booked = s.bookings.filter((b) => b.source === 'passenger' && b.status === 'searching' && b.stationCode === me.profile.stationCode && !s.declined.includes(b.id)).length;
    return s.requests.length + booked;
  });
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PC.brassLight,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
        tabBarLabelStyle: { fontFamily: F.medium, fontSize: 11, lineHeight: 18 },
        tabBarStyle: { backgroundColor: PC.night, borderTopColor: PC.night, height: 72 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 8 },
      }}>
      <Tabs.Screen
        name="duty"
        options={{
          title: t('tab.duty'),
          tabBarBadge: incoming || undefined,
          tabBarBadgeStyle: { backgroundColor: C.red, fontFamily: F.semibold, fontSize: 10 },
          tabBarIcon: ({ color, size }) => <Icon name="power" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="jobs" options={{ title: t('tab.jobs'), tabBarIcon: ({ color, size }) => <Icon name="briefcase-variant" color={color} size={size} /> }} />
      <Tabs.Screen name="earnings" options={{ title: t('tab.earnings'), tabBarIcon: ({ color, size }) => <Icon name="cash-multiple" color={color} size={size} /> }} />
      <Tabs.Screen name="coolie-profile" options={{ title: t('tab.profile'), tabBarIcon: ({ color, size }) => <Icon name="account-hard-hat" color={color} size={size} /> }} />
    </Tabs>
  );
}
