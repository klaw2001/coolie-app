import type { LatLng } from '@/store/types';

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const la1 = (a.latitude * Math.PI) / 180;
  const la2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Road distance estimate from straight-line distance. */
export function roadKm(a: LatLng, b: LatLng): number {
  return Math.round(haversineKm(a, b) * 1.35 * 10) / 10;
}

export function offsetMeters(p: LatLng, north: number, east: number): LatLng {
  const dLat = north / 111320;
  const dLng = east / (111320 * Math.cos((p.latitude * Math.PI) / 180));
  return { latitude: p.latitude + dLat, longitude: p.longitude + dLng };
}

/** A gently bent path between two points so routes look like roads, not rulers. */
export function bentPath(a: LatLng, b: LatLng, bend = 0.18, steps = 24): LatLng[] {
  const mid = {
    latitude: (a.latitude + b.latitude) / 2 - (b.longitude - a.longitude) * bend,
    longitude: (a.longitude + b.longitude) / 2 + (b.latitude - a.latitude) * bend,
  };
  const pts: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push({
      latitude: u * u * a.latitude + 2 * u * t * mid.latitude + t * t * b.latitude,
      longitude: u * u * a.longitude + 2 * u * t * mid.longitude + t * t * b.longitude,
    });
  }
  return pts;
}

export function alongPath(path: LatLng[], t: number): LatLng {
  if (path.length === 0) return { latitude: 0, longitude: 0 };
  const c = Math.min(1, Math.max(0, t)) * (path.length - 1);
  const i = Math.floor(c);
  const f = c - i;
  const a = path[i];
  const b = path[Math.min(path.length - 1, i + 1)];
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * f,
    longitude: a.longitude + (b.longitude - a.longitude) * f,
  };
}
