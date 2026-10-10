import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PC } from '@/theme';

import { TopBar, type TopBarProps } from './ui';

/** Coolie Partner header: dark bar that also covers the status-bar area. Pair with Screen edges={['bottom']}. */
export function PartnerTopBar(props: TopBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: PC.night, paddingTop: insets.top }}>
      <StatusBar style="light" />
      <TopBar tone="dark" {...props} />
    </View>
  );
}
