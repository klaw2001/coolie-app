import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { C, isWeb, R } from '@/theme';

import { Icon } from './Icon';
import { Txt } from './Txt';

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'light' | 'success' | 'danger';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'lg' | 'md' | 'sm';
  icon?: string;
  iconRight?: string;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
}

const PALETTE: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: C.red, fg: C.white, border: C.red },
  secondary: { bg: C.white, fg: C.red, border: C.red },
  ghost: { bg: 'transparent', fg: C.red, border: 'transparent' },
  dark: { bg: C.ink, fg: C.white, border: C.ink },
  light: { bg: C.white, fg: C.redDark, border: C.white },
  success: { bg: C.green, fg: C.white, border: C.green },
  danger: { bg: C.redSoft, fg: C.redDark, border: C.redSoft },
};

const HEIGHT = { lg: 56, md: 46, sm: 36 };

export function Button({ title, onPress, variant = 'primary', size = 'lg', icon, iconRight, loading, disabled, full = true, style, haptic = true }: Props) {
  const p = PALETTE[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      disabled={off}
      onPress={() => {
        if (haptic && !isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        s.base,
        {
          height: HEIGHT[size],
          backgroundColor: p.bg,
          borderColor: p.border,
          paddingHorizontal: size === 'sm' ? 14 : 20,
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: off ? 0.45 : 1,
          transform: [{ scale: pressed && !off ? 0.98 : 1 }],
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={s.row}>
          {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 20} color={p.fg} /> : null}
          <Txt v={size === 'sm' ? 'smallMed' : 'h3'} color={p.fg} numberOfLines={1}>
            {title}
          </Txt>
          {iconRight ? <Icon name={iconRight} size={size === 'sm' ? 16 : 20} color={p.fg} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: { borderRadius: R.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
