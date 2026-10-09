import { Pressable, StyleSheet, View } from 'react-native';

import { C, R } from '@/theme';

import { Icon } from './Icon';
import { Txt } from './Txt';

interface Props<T extends string> {
  value: T;
  options: { value: T; label: string; icon?: string }[];
  onChange: (v: T) => void;
  dense?: boolean;
}

export function Segmented<T extends string>({ value, options, onChange, dense }: Props<T>) {
  return (
    <View style={s.wrap}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[s.item, dense && { paddingVertical: 7 }, on && s.on]}>
            {o.icon ? <Icon name={o.icon} size={16} color={on ? C.red : C.muted} /> : null}
            <Txt v="smallMed" color={on ? C.red : C.inkSoft}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: C.redSoft, borderRadius: R.md, padding: 4, gap: 4 },
  item: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: R.sm },
  on: { backgroundColor: C.white, boxShadow: '0px 2px 6px rgba(122,14,18,0.12)' },
});
