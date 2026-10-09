import { Pressable, StyleSheet, View } from 'react-native';

import { C } from '@/theme';

import { Icon } from './Icon';
import { Txt } from './Txt';

interface Props {
  onKey: (k: string) => void;
  onDelete: () => void;
  onSubmit?: () => void;
  color?: string;
  dark?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];

export function Keypad({ onKey, onDelete, onSubmit, color = C.ink, dark }: Props) {
  return (
    <View style={s.grid}>
      {KEYS.map((k) => (
        <Pressable
          key={k}
          onPress={() => (k === 'del' ? onDelete() : k === 'ok' ? onSubmit?.() : onKey(k))}
          style={({ pressed }) => [s.key, pressed && { backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
          accessibilityLabel={k === 'del' ? 'Delete' : k === 'ok' ? 'Submit' : k}>
          {k === 'del' ? (
            <Icon name="backspace-outline" size={26} color={color} />
          ) : k === 'ok' ? (
            <View style={[s.ok, { backgroundColor: color }]}>
              <Icon name="check" size={24} color={dark ? C.ink : C.white} />
            </View>
          ) : (
            <Txt v="h1" color={color}>
              {k}
            </Txt>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  key: { width: '33.333%', height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  ok: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
