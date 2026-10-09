import { StyleSheet, View } from 'react-native';

import { JOURNEY_ICONS } from '@/data/journey';
import type { JourneyType } from '@/store/types';
import { C, R } from '@/theme';

import { Icon } from './ui';

export function JourneyArt({ type, size = 'md', light }: { type: JourneyType; size?: 'sm' | 'md'; light?: boolean }) {
  const [a, b] = JOURNEY_ICONS[type];
  const box = size === 'sm' ? 30 : 40;
  const ic = size === 'sm' ? 17 : 22;
  return (
    <View style={s.row}>
      <View style={[s.box, { width: box, height: box }, light && s.light]}>
        <Icon name={a} size={ic} color={light ? C.white : C.red} />
      </View>
      <Icon name="arrow-right-thin" size={ic} color={light ? 'rgba(255,255,255,0.8)' : C.muted} />
      <View style={[s.box, { width: box, height: box, backgroundColor: light ? C.white : C.red }]}>
        <Icon name={b} size={ic} color={light ? C.red : C.white} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  box: { borderRadius: R.sm, backgroundColor: C.redSoft, alignItems: 'center', justifyContent: 'center' },
  light: { backgroundColor: 'rgba(255,255,255,0.18)' },
});
