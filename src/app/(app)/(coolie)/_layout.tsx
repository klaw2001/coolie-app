import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui';
import { useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import { C, F } from '@/theme';

export default function CoolieTabs() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const incoming = useApp((s) => (s.coolie?.online ? s.requests.length : 0));
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.red,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontFamily: F.medium, fontSize: 11, lineHeight: 18 },
        tabBarStyle: { backgroundColor: C.white, borderTopColor: C.line, height: 72 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 8 },
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
