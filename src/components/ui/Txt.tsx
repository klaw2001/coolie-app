import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { C, F } from '@/theme';

const V = StyleSheet.create({
  display: { fontFamily: F.extrabold, fontSize: 28, lineHeight: 38 },
  h1: { fontFamily: F.bold, fontSize: 22, lineHeight: 32 },
  h2: { fontFamily: F.semibold, fontSize: 18, lineHeight: 27 },
  h3: { fontFamily: F.semibold, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: F.regular, fontSize: 15, lineHeight: 23 },
  bodyMed: { fontFamily: F.medium, fontSize: 15, lineHeight: 23 },
  small: { fontFamily: F.regular, fontSize: 13, lineHeight: 20 },
  smallMed: { fontFamily: F.medium, fontSize: 13, lineHeight: 20 },
  tiny: { fontFamily: F.medium, fontSize: 11.5, lineHeight: 17 },
  label: { fontFamily: F.semibold, fontSize: 12, lineHeight: 18, letterSpacing: 0.6, textTransform: 'uppercase' },
  num: { fontFamily: F.bold, fontSize: 15, lineHeight: 22, fontVariant: ['tabular-nums'] },
});

export type TxtVariant = keyof typeof V;

interface Props extends TextProps {
  v?: TxtVariant;
  color?: string;
  center?: boolean;
  weight?: keyof typeof F;
  size?: number;
}

export function Txt({ v = 'body', color = C.ink, center, weight, size, style, ...rest }: Props) {
  const extra: TextStyle = { color };
  if (center) extra.textAlign = 'center';
  if (weight) extra.fontFamily = F[weight];
  if (size) {
    extra.fontSize = size;
    extra.lineHeight = Math.round(size * 1.4);
  }
  return <Text {...rest} style={[V[v], extra, style]} />;
}
