import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { C, R, shadow } from '@/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  flat?: boolean;
  pad?: number;
}

export function Card({ children, style, onPress, flat, pad = 16 }: Props) {
  const base = [s.card, { padding: pad }, !flat && shadow.sm, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [...base, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1, borderColor: C.line },
});
