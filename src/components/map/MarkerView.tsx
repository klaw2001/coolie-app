import { StyleSheet, View } from 'react-native';

import { C } from '@/theme';

import { Icon, Txt } from '../ui';
import type { MarkerKind } from './types';

const ICON: Record<MarkerKind, string> = {
  coolie: 'human-dolly',
  home: 'home-variant',
  pickup: 'map-marker',
  station: 'train',
  drop: 'flag-checkered',
  point: 'map-marker-outline',
  'point-selected': 'map-marker-check',
};

export function MarkerView({ kind, label, icon }: { kind: MarkerKind; label?: string; icon?: string }) {
  const name = icon ?? ICON[kind];
  if (kind === 'coolie') {
    return (
      <View style={s.coolieHalo}>
        <View style={s.coolie}>
          <Icon name={name} size={20} color={C.white} />
        </View>
      </View>
    );
  }
  const dark = kind === 'station';
  const sel = kind === 'point-selected' || kind === 'home' || kind === 'pickup' || kind === 'drop';
  return (
    <View style={s.col}>
      {label ? (
        <View style={[s.label, dark && { backgroundColor: C.ink }]}>
          <Txt v="tiny" color={dark ? C.white : C.ink} numberOfLines={1}>
            {label}
          </Txt>
        </View>
      ) : null}
      <View style={[s.pin, dark ? s.dark : sel ? s.sel : s.idle]}>
        <Icon name={name} size={16} color={dark || sel ? C.white : C.red} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  coolieHalo: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(211,37,43,0.22)', alignItems: 'center', justifyContent: 'center' },
  coolie: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.red, borderWidth: 2.5, borderColor: C.white, alignItems: 'center', justifyContent: 'center' },
  col: { alignItems: 'center', gap: 3, maxWidth: 160 },
  label: { backgroundColor: C.white, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: C.line },
  pin: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  dark: { backgroundColor: C.ink, borderColor: C.white },
  sel: { backgroundColor: C.red, borderColor: C.white },
  idle: { backgroundColor: C.white, borderColor: C.red },
});
