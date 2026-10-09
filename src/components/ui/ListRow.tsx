import { Pressable, StyleSheet, View } from 'react-native';

import { C, R } from '@/theme';

import { Icon } from './Icon';
import { Txt } from './Txt';

interface Props {
  icon?: string;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  danger?: boolean;
  selected?: boolean;
}

export function ListRow({ icon, iconColor = C.red, iconBg = C.redSoft, title, subtitle, right, value, onPress, chevron = !!onPress, danger, selected }: Props) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [s.row, selected && s.sel, pressed && { backgroundColor: C.redTint }]}>
      {icon ? (
        <View style={[s.icon, { backgroundColor: danger ? C.redSoft : iconBg }]}>
          <Icon name={icon} size={20} color={danger ? C.red : iconColor} />
        </View>
      ) : null}
      <View style={s.mid}>
        <Txt v="bodyMed" color={danger ? C.red : C.ink} numberOfLines={2}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt v="small" color={C.muted} numberOfLines={2}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {value ? (
        <Txt v="smallMed" color={C.inkSoft}>
          {value}
        </Txt>
      ) : null}
      {right}
      {chevron ? <Icon name="chevron-right" size={22} color={C.muted} /> : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4, borderRadius: R.md },
  sel: { backgroundColor: C.redTint },
  icon: { width: 40, height: 40, borderRadius: R.sm, alignItems: 'center', justifyContent: 'center' },
  mid: { flex: 1, gap: 1 },
});
