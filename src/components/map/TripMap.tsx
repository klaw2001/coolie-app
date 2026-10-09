import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { C } from '@/theme';

import { MarkerView } from './MarkerView';
import { regionFor, type TripMapProps } from './types';

export function TripMap({ markers, route, fitKey, height = '100%', interactive = true, padding }: TripMapProps) {
  const ref = useRef<MapView>(null);
  const pts = [...markers.map((m) => m.coord), ...(route ?? [])];
  const pad = padding ?? { top: 90, right: 60, bottom: 90, left: 60 };

  useEffect(() => {
    const id = setTimeout(() => {
      if (pts.length > 1) ref.current?.fitToCoordinates(pts, { edgePadding: pad, animated: true });
    }, 350);
    return () => clearTimeout(id);
    // Re-fit only when the phase changes, not on every coolie position update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  return (
    <MapView
      ref={ref}
      style={[s.map, { height }]}
      initialRegion={regionFor(pts)}
      showsPointsOfInterests={false}
      showsBuildings={false}
      toolbarEnabled={false}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      rotateEnabled={false}
      pitchEnabled={false}>
      {route && route.length > 1 ? <Polyline coordinates={route} strokeColor={C.red} strokeWidth={4} /> : null}
      {markers.map((m) => (
        <Marker
          key={m.id}
          coordinate={m.coord}
          anchor={{ x: 0.5, y: m.kind === 'coolie' ? 0.5 : 1 }}
          onPress={m.onPress}
          zIndex={m.kind === 'coolie' ? 10 : 1}>
          <MarkerView kind={m.kind} label={m.label} icon={m.icon} />
        </Marker>
      ))}
    </MapView>
  );
}

const s = StyleSheet.create({ map: { width: '100%' } });
