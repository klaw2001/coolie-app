import type { TKey } from '@/i18n/translate';
import type { Booking, JourneyType, LatLng } from '@/store/types';
import { alongPath, bentPath } from '@/utils/geo';

import { MEET_POINTS, pointPlace, station } from './stations';

export type StageId =
  | 'loaded'
  | 'to_station'
  | 'at_gate'
  | 'security'
  | 'fob'
  | 'at_platform'
  | 'at_coach'
  | 'on_platform'
  | 'at_exit';

export const STAGES: Record<JourneyType, StageId[]> = {
  home_to_train: ['loaded', 'to_station', 'at_gate', 'at_platform', 'at_coach'],
  gate_to_train: ['loaded', 'security', 'fob', 'at_platform', 'at_coach'],
  train_to_exit: ['loaded', 'on_platform', 'fob', 'at_exit'],
};

export const STAGE_ICON: Record<StageId, string> = {
  loaded: 'bag-suitcase',
  to_station: 'map-marker-path',
  at_gate: 'door-open',
  security: 'shield-check',
  fob: 'stairs',
  at_platform: 'sign-real-estate',
  at_coach: 'seat-recline-normal',
  on_platform: 'walk',
  at_exit: 'exit-run',
};

export const JOURNEY_ICONS: Record<JourneyType, [string, string]> = {
  home_to_train: ['home-variant', 'train'],
  gate_to_train: ['door-open', 'train'],
  train_to_exit: ['train', 'taxi'],
};

export const JOURNEYS: JourneyType[] = ['home_to_train', 'gate_to_train', 'train_to_exit'];

export function direction(j: JourneyType): 'departure' | 'arrival' {
  return j === 'train_to_exit' ? 'arrival' : 'departure';
}

// Demo timings (ms). Fast enough to watch a whole trip in about a minute and a half.
export const AUTO_ACCEPT_MS = 10_000;
export const OTP_AUTO_MS = 7_000;
export const SCHEDULE_LEAD_MS = 15 * 60_000;
export const REQUEST_TTL_MS = 30_000;
export const REQUEST_GAP_MS = 16_000;

export function arriveMs(j: JourneyType): number {
  return j === 'home_to_train' ? 22_000 : 14_000;
}

export function stageMs(id: StageId): number {
  return id === 'to_station' ? 18_000 : 7_000;
}

export function stageKey(j: JourneyType, id: StageId): TKey {
  return `stage.${j}.${id}` as TKey;
}

export function stageVars(b: Booking, lang: 'en' | 'hi') {
  const st = station(b.stationCode);
  const point = b.journeyType === 'train_to_exit' ? b.drop : b.meet;
  return {
    station: lang === 'hi' ? st.nameHi : st.name,
    pf: b.train.platform,
    coach: b.train.coach,
    seat: b.train.seat,
    point: lang === 'hi' && point.titleHi ? point.titleHi : point.title,
    meet: lang === 'hi' && b.meet.titleHi ? b.meet.titleHi : b.meet.title,
  };
}

/** Rough real-world minutes for the ETA label, scaled from the demo progress. */
export function etaMinutes(b: Booking, now: number): number {
  if (b.status !== 'accepted') return 0;
  const total = b.journeyType === 'home_to_train' ? 12 : 4;
  const t = Math.min(1, (now - b.statusAt) / (b.arriveMs ?? 15000));
  return Math.max(1, Math.ceil(total * (1 - t)));
}

export function stationGate(stationCode: string): LatLng {
  return pointPlace(station(stationCode), MEET_POINTS[0]).coord;
}

/** Where the coolie is on the map right now. */
export function cooliePosition(b: Booking, now: number): LatLng | null {
  if (!b.coolie) return null;
  if (b.status === 'accepted' && b.coolieStart) {
    const path = bentPath(b.coolieStart, b.meet.coord);
    const t = (now - b.statusAt) / (b.arriveMs ?? 15000);
    return alongPath(path, b.mode === 'manual' ? Math.min(t, 0.96) : t);
  }
  if (b.status === 'arrived') return b.meet.coord;
  if (b.status === 'in_progress') {
    const stages = STAGES[b.journeyType];
    const id = stages[b.stage];
    if (b.journeyType === 'home_to_train') {
      if (id === 'loaded') return b.meet.coord;
      if (id === 'to_station') {
        const path = bentPath(b.meet.coord, stationGate(b.stationCode), 0.12);
        const t = (now - b.stageAt) / stageMs('to_station');
        return alongPath(path, b.mode === 'manual' ? Math.min(t, 0.96) : t);
      }
      const gate = stationGate(b.stationCode);
      const f = (b.stage - 2) / (stages.length - 3);
      return alongPath([gate, b.drop.coord], f);
    }
    return alongPath([b.meet.coord, b.drop.coord], b.stage / (stages.length - 1));
  }
  if (b.status === 'completed') return b.drop.coord;
  return null;
}

/** Route line to draw on the map for the current phase. */
export function activeRoute(b: Booking): LatLng[] {
  if (b.status === 'accepted' && b.coolieStart) return bentPath(b.coolieStart, b.meet.coord);
  if (b.journeyType === 'home_to_train' && b.status !== 'completed') {
    return bentPath(b.meet.coord, stationGate(b.stationCode), 0.12);
  }
  return [b.meet.coord, b.drop.coord];
}

/** Should the trip screen default to the map (vs the station tracker)? */
export function prefersMap(b: Booking): boolean {
  if (b.status === 'accepted' || b.status === 'arrived') return b.journeyType !== 'train_to_exit';
  if (b.status === 'in_progress' && b.journeyType === 'home_to_train') return b.stage <= 1;
  return false;
}

export const ACTIVE: Booking['status'][] = ['searching', 'accepted', 'arrived', 'in_progress'];
