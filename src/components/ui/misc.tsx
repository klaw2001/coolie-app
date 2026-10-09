import { StyleSheet, Switch, View, type StyleProp, type ViewStyle } from 'react-native';

import { C, R } from '@/theme';

import { Txt } from './Txt';

export function SectionTitle({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Txt v="h3">{title}</Txt>
      {right}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[s.divider, style]} />;
}

export function Row({ children, gap = 10, style, between }: { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle>; between?: boolean }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, between && { justifyContent: 'space-between' }, style]}>{children}</View>;
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: C.lineStrong, true: C.red }}
      thumbColor={C.white}
      ios_backgroundColor={C.lineStrong}
    />
  );
}

export function StepBar({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <View style={s.stepWrap}>
      <Txt v="tiny" color={C.muted}>
        {label}
      </Txt>
      <View style={s.track}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[s.seg, i < step && { backgroundColor: C.red }]} />
        ))}
      </View>
    </View>
  );
}

export function KV({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <View style={s.kv}>
      <Txt v={strong ? 'h3' : 'small'} color={strong ? C.ink : C.inkSoft} style={{ flex: 1 }}>
        {k}
      </Txt>
      <Txt v={strong ? 'h3' : 'smallMed'}>{v}</Txt>
    </View>
  );
}

export function Banner({ children, tone = 'amber', style }: { children: React.ReactNode; tone?: 'amber' | 'blue' | 'green' | 'red'; style?: StyleProp<ViewStyle> }) {
  const bg = { amber: C.amberSoft, blue: C.blueSoft, green: C.greenSoft, red: C.redSoft }[tone];
  return <View style={[s.banner, { backgroundColor: bg }, style]}>{children}</View>;
}

const s = StyleSheet.create({
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  divider: { height: 1, backgroundColor: C.line },
  stepWrap: { paddingHorizontal: 16, gap: 6, paddingBottom: 6 },
  track: { flexDirection: 'row', gap: 4 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.line },
  kv: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 3 },
  banner: { borderRadius: R.md, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
});
