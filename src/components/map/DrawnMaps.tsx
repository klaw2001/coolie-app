import { StyleSheet } from 'react-native';

import { CityMap } from './CityMap';
import type { PickMapProps, TripMapProps } from './types';

const TRIP_PAD = { top: 90, right: 60, bottom: 90, left: 60 };

/** Trip and booking maps drawn by CityMap: no map SDK, no API key. */
export function DrawnTripMap({ markers, route, fitKey, height = '100%', interactive = true, padding }: TripMapProps) {
  return (
    <CityMap
      style={{ width: '100%', height }}
      camera={{ key: fitKey ?? 'fit', points: [...markers.map((m) => m.coord), ...(route ?? [])], padding: padding ?? TRIP_PAD }}
      markers={markers}
      route={route}
      interactive={interactive}
    />
  );
}

/** Drag the city under the fixed centre pin (the pin itself is drawn by the screen). */
export function DrawnPickMap({ initial, onChange, reference }: PickMapProps) {
  return (
    <CityMap
      style={StyleSheet.absoluteFill}
      camera={{ key: 'pick', points: [initial], zoom: 0.45 }}
      markers={reference ? [{ id: 'reference', coord: reference.coord, kind: 'station', label: reference.label }] : []}
      onMoveEnd={onChange}
    />
  );
}
