import { Pressable, StyleSheet, View } from 'react-native';

import { C } from '@/theme';

import { Icon } from './Icon';

interface Props {
  value: number;
  onChange?: (n: number) => void;
  size?: number;
}

export function Stars({ value, onChange, size = 20 }: Props) {
  return (
    <View style={s.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} disabled={!onChange} onPress={() => onChange?.(n)} hitSlop={4} accessibilityLabel={`${n} stars`}>
          <Icon name={n <= value ? 'star' : 'star-outline'} size={size} color={n <= value ? '#E9A912' : C.lineStrong} />
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({ row: { flexDirection: 'row', gap: 4 } });
