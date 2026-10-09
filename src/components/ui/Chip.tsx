import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { C, R } from '@/theme';

import { Icon } from './Icon';
import { Txt } from './Txt';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  sub?: string;
}

export function Chip({ label, selected, onPress, icon, disabled, style, sub }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.chip,
        selected && s.on,
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.8 },
        style,
      ]}>
      {icon ? <Icon name={icon} size={16} color={selected ? C.white : C.inkSoft} /> : null}
      <Txt v="smallMed" color={selected ? C.white : C.ink}>
        {label}
      </Txt>
      {sub ? (
        <Txt v="tiny" color={selected ? 'rgba(255,255,255,0.85)' : C.muted}>
          {sub}
        </Txt>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: R.pill,
    borderWidth: 1.5,
    borderColor: C.lineStrong,
    backgroundColor: C.white,
  },
  on: { backgroundColor: C.red, borderColor: C.red },
});
