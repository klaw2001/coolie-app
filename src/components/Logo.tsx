import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { C, F, PC } from '@/theme';

/** A porter balancing a suitcase on his head: red uniform, white load, brass arm badge. */
export function Logo({ size = 56, bg = C.red, fg = C.white }: { size?: number; bg?: string | null; fg?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {bg ? <Rect x="0" y="0" width="64" height="64" rx="16" fill={bg} /> : null}
      <Rect x="26.5" y="6" width="11" height="6" rx="2.5" stroke={fg} strokeWidth="2.5" fill="none" />
      <Rect x="16" y="10.5" width="32" height="17" rx="3.5" fill={fg} />
      <Rect x="30.5" y="10.5" width="3" height="17" fill={C.brass} />
      <Path d="M21 47 L18.5 28.5" stroke={fg} strokeWidth="4.5" strokeLinecap="round" />
      <Path d="M43 47 L45.5 28.5" stroke={fg} strokeWidth="4.5" strokeLinecap="round" />
      <Circle cx="32" cy="35.5" r="6.5" fill={fg} />
      <Path d="M15 60 C15 49 22 44.5 32 44.5 C42 44.5 49 49 49 60 Z" fill={fg} />
      <Circle cx="43.5" cy="51" r="3.2" fill={C.brass} />
    </Svg>
  );
}

/** Coolie Partner mark: the porter on a dark badge with a brass "PARTNER" ribbon. */
export function PartnerLogo({ size = 56 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <Logo size={size} bg={PC.night} fg={C.white} />
      <View style={[ps.ribbon, { bottom: -size * 0.12, paddingHorizontal: size * 0.08 }]}>
        <Text style={[ps.ribbonText, { fontSize: Math.max(7, size * 0.14) }]}>PARTNER</Text>
      </View>
    </View>
  );
}

const ps = StyleSheet.create({
  ribbon: { position: 'absolute', alignSelf: 'center', backgroundColor: PC.brassLight, borderRadius: 4, paddingVertical: 1 },
  ribbonText: { fontFamily: F.extrabold, color: PC.night, letterSpacing: 0.8 },
});
