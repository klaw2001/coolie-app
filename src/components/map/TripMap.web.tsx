import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { C } from '@/theme';

import { MarkerView } from './MarkerView';
import { type TripMapProps } from './types';

/** Web stand-in for react-native-maps (used only for browser previews; the app targets Expo Go). */
export function TripMap({ markers, route, height = '100%' }: TripMapProps) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const pts = [...markers.map((m) => m.coord), ...(route ?? [])];
  const lats = pts.map((p) => p.latitude);
  const lngs = pts.map((p) => p.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const spanLat = Math.max(maxLat - minLat, 0.002);
  const spanLng = Math.max(maxLng - minLng, 0.002);
  const pad = 70;
  const project = (p: { latitude: number; longitude: number }) => ({
    x: pad + ((p.longitude - minLng) / spanLng) * Math.max(1, box.w - pad * 2),
    y: pad + ((maxLat - p.latitude) / spanLat) * Math.max(1, box.h - pad * 2),
  });
  return (
    <View style={[s.map, { height }]} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {[0.2, 0.45, 0.7].map((f) => (
        <View key={'h' + f} style={[s.road, { top: `${f * 100}%`, left: 0, right: 0, height: 10 }]} />
      ))}
      {[0.3, 0.62].map((f) => (
        <View key={'v' + f} style={[s.road, { left: `${f * 100}%`, top: 0, bottom: 0, width: 10 }]} />
      ))}
      <View style={[s.park, { top: '52%', left: '8%' }]} />
      {box.w > 0 &&
        (route ?? []).map((p, i) => {
          const q = project(p);
          return <View key={i} style={[s.dot, { left: q.x - 3, top: q.y - 3 }]} />;
        })}
      {box.w > 0 &&
        markers.map((m) => {
          const q = project(m.coord);
          return (
            <View key={m.id} style={[s.marker, { left: q.x - 80, top: m.kind === 'coolie' ? q.y - 23 : q.y - 54 }]}>
              <MarkerView kind={m.kind} label={m.label} icon={m.icon} />
            </View>
          );
        })}
    </View>
  );
}

const s = StyleSheet.create({
  map: { width: '100%', backgroundColor: '#EEF0EA', overflow: 'hidden' },
  road: { position: 'absolute', backgroundColor: '#FFFFFF' },
  park: { position: 'absolute', width: 90, height: 60, borderRadius: 14, backgroundColor: '#D7EBCF' },
  dot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: C.red },
  marker: { position: 'absolute', width: 160, alignItems: 'center' },
});
