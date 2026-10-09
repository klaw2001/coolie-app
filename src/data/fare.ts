import type { Addons, Fare } from '@/store/types';

/** Weight slabs per coolie (agreed rate card). */
export const SLABS = [
  { upTo: 20, price: 80 },
  { upTo: 40, price: 150 },
  { upTo: 60, price: 220 },
];
export const EXTRA_PER_20KG = 70;
export const PER_KM = 12;
export const TROLLEY = 50;
export const WHEELCHAIR = 200;
/** Most a single coolie carries; more weight needs another coolie. */
export const MAX_KG_PER_COOLIE = 60;
export const MAX_COOLIES = 4;
/** Home → Train pickups are limited to this road distance from the station. */
export const MAX_HOME_KM = 40;

export function slabPrice(kg: number): number {
  if (kg <= 0) return 0;
  for (const s of SLABS) if (kg <= s.upTo) return s.price;
  const last = SLABS[SLABS.length - 1];
  return last.price + Math.ceil((kg - last.upTo) / 20) * EXTRA_PER_20KG;
}

export function minCoolies(kg: number): number {
  return Math.max(1, Math.ceil(kg / MAX_KG_PER_COOLIE));
}

/** Each coolie is charged the slab for the share of weight they carry. */
export function calcFare(weightKg: number, coolies: number, distanceKm: number, addons: Addons): Fare {
  const n = Math.max(1, coolies);
  const perCoolieKg = Math.round((weightKg / n) * 10) / 10;
  const perCoolie = slabPrice(perCoolieKg);
  const luggage = perCoolie * n;
  const distance = Math.round(distanceKm * PER_KM);
  const trolley = addons.trolley ? TROLLEY : 0;
  const wheelchair = addons.wheelchair ? WHEELCHAIR : 0;
  return {
    weightKg,
    coolies: n,
    perCoolieKg,
    perCoolie,
    luggage,
    distanceKm,
    distance,
    trolley,
    wheelchair,
    total: luggage + distance + trolley + wheelchair,
  };
}
