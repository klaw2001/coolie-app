import { Pressable, StyleSheet, View } from 'react-native';

import { C, R } from '@/theme';

import { Icon } from './Icon';
import { Txt } from './Txt';

interface Props {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (n: number) => string;
}

export function Stepper({ value, onChange, min = 0, max = 99, step = 1, format }: Props) {
  const dec = value - step >= min;
  const inc = value + step <= max;
  return (
    <View style={s.row}>
      <Pressable accessibilityLabel="Decrease" disabled={!dec} onPress={() => onChange(value - step)} hitSlop={6} style={[s.btn, !dec && s.off]}>
        <Icon name="minus" size={18} color={dec ? C.red : C.muted} />
      </Pressable>
      <Txt v="num" style={s.val}>
        {format ? format(value) : value}
      </Txt>
      <Pressable accessibilityLabel="Increase" disabled={!inc} onPress={() => onChange(value + step)} hitSlop={6} style={[s.btn, s.plus, !inc && s.off]}>
        <Icon name="plus" size={18} color={C.white} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  btn: { width: 34, height: 34, borderRadius: R.sm, borderWidth: 1.5, borderColor: C.red, alignItems: 'center', justifyContent: 'center' },
  plus: { backgroundColor: C.red },
  off: { borderColor: C.line, backgroundColor: C.bg },
  val: { minWidth: 34, textAlign: 'center' },
});
