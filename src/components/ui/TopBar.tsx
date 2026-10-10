import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { C, PC, R } from '@/theme';

import { Icon } from './Icon';
import { Txt } from './Txt';

export interface TopBarProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  back?: boolean;
  right?: React.ReactNode;
  tone?: 'plain' | 'red' | 'dark';
  icon?: string;
}

export function TopBar({ title, subtitle, onBack, back = true, right, tone = 'plain', icon = 'arrow-left' }: TopBarProps) {
  const red = tone === 'red' || tone === 'dark';
  return (
    <View style={[s.bar, tone === 'red' && { backgroundColor: C.red }, tone === 'dark' && { backgroundColor: PC.night }]}>
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
          onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
          style={[s.back, red && { backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'transparent' }]}>
          <Icon name={icon} size={22} color={red ? C.white : C.ink} />
        </Pressable>
      ) : null}
      <View style={s.mid}>
        {title ? (
          <Txt v="h2" color={red ? C.white : C.ink} numberOfLines={1}>
            {title}
          </Txt>
        ) : null}
        {subtitle ? (
          <Txt v="small" color={red ? 'rgba(255,255,255,0.85)' : C.muted} numberOfLines={1}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  back: {
    width: 40,
    height: 40,
    borderRadius: R.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
  },
  mid: { flex: 1 },
});
