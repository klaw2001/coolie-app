import { useEffect, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

import type { PickMapProps } from './types';

/** Web stand-in: drag the grid to move the pin. */
export function PickMap({ initial, onChange }: PickMapProps) {
  const [pos, setPos] = useState(initial);
  useEffect(() => onChange(pos), [pos]); // eslint-disable-line react-hooks/exhaustive-deps
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, g) =>
        setPos((p) => ({ latitude: p.latitude + g.dy * 0.00005, longitude: p.longitude - g.dx * 0.00005 })),
    }),
  );
  return (
    <View style={[StyleSheet.absoluteFill, s.map]} {...pan.panHandlers}>
      {[0.15, 0.4, 0.68, 0.88].map((f) => (
        <View key={'h' + f} style={[s.road, { top: `${f * 100}%`, left: 0, right: 0, height: 12 }]} />
      ))}
      {[0.22, 0.58, 0.8].map((f) => (
        <View key={'v' + f} style={[s.road, { left: `${f * 100}%`, top: 0, bottom: 0, width: 12 }]} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  map: { backgroundColor: '#EEF0EA' },
  road: { position: 'absolute', backgroundColor: '#FFFFFF' },
});
