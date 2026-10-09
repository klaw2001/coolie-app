import type { LatLng } from '@/store/types';

export type MarkerKind = 'coolie' | 'home' | 'pickup' | 'station' | 'drop' | 'point' | 'point-selected';

export interface MapMarker {
  id: string;
  coord: LatLng;
  kind: MarkerKind;
  label?: string;
  icon?: string;
  onPress?: () => void;
}

export interface TripMapProps {
  markers: MapMarker[];
  route?: LatLng[];
  /** Change this to re-fit the camera (e.g. when the trip phase changes). */
  fitKey?: string;
  height?: number | `${number}%`;
  interactive?: boolean;
  padding?: { top: number; right: number; bottom: number; left: number };
}

export interface PickMapProps {
  initial: LatLng;
  onChange: (c: LatLng) => void;
  reference?: { coord: LatLng; label: string };
}

export function regionFor(points: LatLng[], minDelta = 0.006) {
  if (points.length === 0) return { latitude: 19.07, longitude: 72.87, latitudeDelta: 0.2, longitudeDelta: 0.2 };
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const p of points) {
    minLat = Math.min(minLat, p.latitude);
    maxLat = Math.max(maxLat, p.latitude);
    minLng = Math.min(minLng, p.longitude);
    maxLng = Math.max(maxLng, p.longitude);
  }
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(minDelta, (maxLat - minLat) * 1.6),
    longitudeDelta: Math.max(minDelta, (maxLng - minLng) * 1.6),
  };
}
