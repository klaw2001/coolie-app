import type { TrainInfo } from '@/store/types';
import { atTime, startOfDay } from '@/utils/format';
import { hashStr, rng } from '@/utils/id';

export type TrainType = 'rajdhani' | 'shatabdi' | 'vande' | 'duronto' | 'express';

export interface TrainStop {
  code: string;
  arr?: string;
  dep?: string;
  /** Day of the journey this stop falls on (0 = start day). */
  day: number;
  pf: number;
}

export interface Train {
  number: string;
  name: string;
  type: TrainType;
  stops: TrainStop[];
}

// Dummy timetable. Train names and numbers look real, but the timings and platforms are made up for the demo.
export const TRAINS: Train[] = [
  { number: '22221', name: 'CSMT Rajdhani Express', type: 'rajdhani', stops: [{ code: 'CSMT', dep: '16:00', day: 0, pf: 18 }, { code: 'NDLS', arr: '09:55', day: 1, pf: 3 }] },
  { number: '22222', name: 'NZM–CSMT Rajdhani', type: 'rajdhani', stops: [{ code: 'NDLS', dep: '16:10', day: 0, pf: 2 }, { code: 'CSMT', arr: '09:45', day: 1, pf: 17 }] },
  { number: '12123', name: 'Deccan Queen', type: 'express', stops: [{ code: 'CSMT', dep: '17:10', day: 0, pf: 12 }, { code: 'PUNE', arr: '20:25', day: 0, pf: 1 }] },
  { number: '12124', name: 'Deccan Queen', type: 'express', stops: [{ code: 'PUNE', dep: '07:15', day: 0, pf: 1 }, { code: 'CSMT', arr: '10:25', day: 0, pf: 11 }] },
  { number: '12261', name: 'CSMT–Howrah Duronto', type: 'duronto', stops: [{ code: 'CSMT', dep: '17:15', day: 0, pf: 13 }, { code: 'HWH', arr: '19:55', day: 1, pf: 9 }] },
  { number: '11301', name: 'Udyan Express', type: 'express', stops: [{ code: 'CSMT', dep: '08:05', day: 0, pf: 14 }, { code: 'PUNE', arr: '11:00', dep: '11:05', day: 0, pf: 2 }, { code: 'SBC', arr: '05:45', day: 1, pf: 4 }] },
  { number: '12301', name: 'Howrah Rajdhani', type: 'rajdhani', stops: [{ code: 'HWH', dep: '16:50', day: 0, pf: 9 }, { code: 'NDLS', arr: '10:00', day: 1, pf: 14 }] },
  { number: '12302', name: 'New Delhi–Howrah Rajdhani', type: 'rajdhani', stops: [{ code: 'NDLS', dep: '16:55', day: 0, pf: 14 }, { code: 'HWH', arr: '09:55', day: 1, pf: 9 }] },
  { number: '12004', name: 'Lucknow Swarna Shatabdi', type: 'shatabdi', stops: [{ code: 'NDLS', dep: '06:10', day: 0, pf: 1 }, { code: 'LKO', arr: '12:40', day: 0, pf: 1 }] },
  { number: '12003', name: 'New Delhi Swarna Shatabdi', type: 'shatabdi', stops: [{ code: 'LKO', dep: '15:35', day: 0, pf: 1 }, { code: 'NDLS', arr: '22:30', day: 0, pf: 1 }] },
  { number: '12015', name: 'Ajmer Shatabdi', type: 'shatabdi', stops: [{ code: 'NDLS', dep: '06:10', day: 0, pf: 1 }, { code: 'JP', arr: '10:35', day: 0, pf: 1 }] },
  { number: '12957', name: 'Swarna Jayanti Rajdhani', type: 'rajdhani', stops: [{ code: 'ADI', dep: '17:40', day: 0, pf: 6 }, { code: 'JP', arr: '02:35', dep: '02:45', day: 1, pf: 2 }, { code: 'NDLS', arr: '07:55', day: 1, pf: 5 }] },
  { number: '12933', name: 'Karnavati Express', type: 'express', stops: [{ code: 'CSMT', dep: '13:40', day: 0, pf: 10 }, { code: 'ADI', arr: '21:05', day: 0, pf: 4 }] },
  { number: '20901', name: 'Vande Bharat Express', type: 'vande', stops: [{ code: 'CSMT', dep: '06:00', day: 0, pf: 16 }, { code: 'ADI', arr: '11:25', day: 0, pf: 8 }] },
  { number: '12007', name: 'Chennai–Mysuru Shatabdi', type: 'shatabdi', stops: [{ code: 'MAS', dep: '06:00', day: 0, pf: 5 }, { code: 'SBC', arr: '10:55', day: 0, pf: 7 }] },
  { number: '12608', name: 'Lalbagh Express', type: 'express', stops: [{ code: 'SBC', dep: '06:30', day: 0, pf: 2 }, { code: 'MAS', arr: '12:20', day: 0, pf: 11 }] },
  { number: '20607', name: 'Chennai–Mysuru Vande Bharat', type: 'vande', stops: [{ code: 'MAS', dep: '05:50', day: 0, pf: 2 }, { code: 'SBC', arr: '10:25', day: 0, pf: 9 }] },
  { number: '12841', name: 'Coromandel Express', type: 'express', stops: [{ code: 'HWH', dep: '14:50', day: 0, pf: 21 }, { code: 'MAS', arr: '16:50', day: 1, pf: 6 }] },
  { number: '12759', name: 'Charminar Express', type: 'express', stops: [{ code: 'MAS', dep: '18:10', day: 0, pf: 7 }, { code: 'HYB', arr: '08:00', day: 1, pf: 3 }] },
  { number: '12701', name: 'Hussainsagar Express', type: 'express', stops: [{ code: 'CSMT', dep: '21:50', day: 0, pf: 11 }, { code: 'PUNE', arr: '01:10', dep: '01:15', day: 1, pf: 3 }, { code: 'HYB', arr: '12:30', day: 1, pf: 2 }] },
  { number: '12627', name: 'Karnataka Express', type: 'express', stops: [{ code: 'SBC', dep: '19:20', day: 0, pf: 5 }, { code: 'NDLS', arr: '09:00', day: 2, pf: 8 }] },
  { number: '12433', name: 'Chennai Rajdhani', type: 'rajdhani', stops: [{ code: 'MAS', dep: '06:05', day: 0, pf: 4 }, { code: 'NDLS', arr: '10:30', day: 1, pf: 12 }] },
  { number: '12229', name: 'Lucknow Mail', type: 'express', stops: [{ code: 'LKO', dep: '22:00', day: 0, pf: 5 }, { code: 'NDLS', arr: '06:55', day: 1, pf: 9 }] },
  { number: '12230', name: 'Lucknow Mail', type: 'express', stops: [{ code: 'NDLS', dep: '22:05', day: 0, pf: 9 }, { code: 'LKO', arr: '07:00', day: 1, pf: 4 }] },
  { number: '12985', name: 'Jaipur Double Decker', type: 'express', stops: [{ code: 'JP', dep: '06:00', day: 0, pf: 1 }, { code: 'NDLS', arr: '10:30', day: 0, pf: 10 }] },
  { number: '12723', name: 'Telangana Express', type: 'express', stops: [{ code: 'HYB', dep: '06:00', day: 0, pf: 1 }, { code: 'NDLS', arr: '07:40', day: 1, pf: 16 }] },
  { number: '13005', name: 'Amritsar Mail', type: 'express', stops: [{ code: 'HWH', dep: '19:10', day: 0, pf: 8 }, { code: 'LKO', arr: '13:05', dep: '13:15', day: 1, pf: 6 }] },
  { number: '12026', name: 'Pune–Secunderabad Shatabdi', type: 'shatabdi', stops: [{ code: 'PUNE', dep: '14:15', day: 0, pf: 1 }, { code: 'HYB', arr: '22:45', day: 0, pf: 4 }] },
  { number: '12915', name: 'Ashram Express', type: 'express', stops: [{ code: 'ADI', dep: '18:40', day: 0, pf: 2 }, { code: 'JP', arr: '04:20', dep: '04:30', day: 1, pf: 3 }, { code: 'NDLS', arr: '09:50', day: 1, pf: 7 }] },
  { number: '12860', name: 'Gitanjali Express', type: 'express', stops: [{ code: 'HWH', dep: '13:50', day: 0, pf: 22 }, { code: 'CSMT', arr: '21:20', day: 1, pf: 15 }] },
  { number: '22691', name: 'Bengaluru Rajdhani', type: 'rajdhani', stops: [{ code: 'SBC', dep: '20:00', day: 0, pf: 8 }, { code: 'HYB', arr: '06:10', dep: '06:20', day: 1, pf: 1 }, { code: 'NDLS', arr: '05:30', day: 2, pf: 4 }] },
];

const COMPOSITION: Record<TrainType, string[]> = {
  rajdhani: ['ENG', 'EOG', 'H1', 'A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'B5', 'PC', 'B6', 'B7', 'B8', 'EOG'],
  duronto: ['ENG', 'EOG', 'H1', 'A1', 'A2', 'B1', 'B2', 'B3', 'B4', 'PC', 'B5', 'B6', 'S1', 'S2', 'EOG'],
  shatabdi: ['ENG', 'EOG', 'E1', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'EOG'],
  vande: ['C1', 'C2', 'C3', 'C4', 'E1', 'C5', 'C6', 'C7', 'C8'],
  express: ['ENG', 'SLR', 'GN', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'B1', 'B2', 'B3', 'B4', 'A1', 'A2', 'H1', 'PC', 'GN', 'SLR'],
};

const NON_BOOKABLE = ['ENG', 'EOG', 'SLR', 'PC', 'GN'];

export function composition(t: Train): string[] {
  return COMPOSITION[t.type];
}

export function bookableCoaches(t: Train): string[] {
  return COMPOSITION[t.type].filter((c) => !NON_BOOKABLE.includes(c));
}

export function seatCount(coach: string): number {
  if (coach.startsWith('H')) return 24;
  if (coach.startsWith('A')) return 54;
  if (coach.startsWith('E')) return 56;
  if (coach.startsWith('C')) return 78;
  return 72;
}

export function coachClass(coach: string): string {
  if (coach.startsWith('H')) return '1A';
  if (coach.startsWith('A')) return '2A';
  if (coach.startsWith('B')) return '3A';
  if (coach.startsWith('E')) return 'EC';
  if (coach.startsWith('C')) return 'CC';
  return 'SL';
}

export function train(number: string): Train | undefined {
  return TRAINS.find((t) => t.number === number);
}

export function stopAt(t: Train, code: string): TrainStop | undefined {
  return t.stops.find((s) => s.code === code);
}

/** Trains the passenger can board at (departure) or get off at (arrival) this station. */
export function trainsAt(code: string, direction: 'departure' | 'arrival'): Train[] {
  return TRAINS.filter((t) => {
    const s = stopAt(t, code);
    return direction === 'departure' ? !!s?.dep : !!s?.arr;
  }).sort((a, b) => {
    const ta = direction === 'departure' ? stopAt(a, code)!.dep! : stopAt(a, code)!.arr!;
    const tb = direction === 'departure' ? stopAt(b, code)!.dep! : stopAt(b, code)!.arr!;
    return ta.localeCompare(tb);
  });
}

/** The next time today or later that this HH:MM falls at least `bufferMin` minutes from now. */
export function nextOccurrence(hm: string, bufferMin: number, now = Date.now()): number {
  let ms = atTime(now, hm);
  while (ms < now + bufferMin * 60000) ms += 86400000;
  return ms;
}

export function buildTrainInfo(
  t: Train,
  stationCode: string,
  direction: 'departure' | 'arrival',
  dayMs: number,
  coach: string,
  seat: string,
  extra?: { pnr?: string; passengers?: number; fromCode?: string; toCode?: string },
): TrainInfo {
  const stop = stopAt(t, stationCode)!;
  const hm = direction === 'departure' ? stop.dep! : stop.arr!;
  return {
    number: t.number,
    name: t.name,
    fromCode: extra?.fromCode ?? (direction === 'departure' ? stationCode : t.stops[0].code),
    toCode: extra?.toCode ?? (direction === 'departure' ? t.stops[t.stops.length - 1].code : stationCode),
    stationCode,
    time: atTime(startOfDay(dayMs), hm),
    platform: stop.pf,
    coach,
    seat,
    composition: composition(t),
    pnr: extra?.pnr,
    passengers: extra?.passengers,
  };
}

// ---------- Dummy PNR lookup ----------

export interface PnrResult {
  pnr: string;
  train: Train;
  fromCode: string;
  toCode: string;
  coach: string;
  seats: string[];
  passengers: number;
  /** Departure from `fromCode` (epoch ms). */
  depart: number;
  /** Arrival at `toCode` (epoch ms). */
  arrive: number;
}

const KNOWN_PNRS: Record<string, { train: string; from: string; to: string; coach: string; seats: string[] }> = {
  '2451873690': { train: '22221', from: 'CSMT', to: 'NDLS', coach: 'B3', seats: ['34', '35'] },
  '6108249375': { train: '12301', from: 'HWH', to: 'NDLS', coach: 'A2', seats: ['17'] },
  '4302917586': { train: '12007', from: 'MAS', to: 'SBC', coach: 'C4', seats: ['45', '46', '47'] },
  '8213650479': { train: '12123', from: 'CSMT', to: 'PUNE', coach: 'C2', seats: ['12'] },
  '1357924680': { train: '12759', from: 'MAS', to: 'HYB', coach: 'S5', seats: ['41', '44'] },
};

export const DEMO_PNRS = Object.keys(KNOWN_PNRS);

/** Returns null for an unknown PNR. Any 10-digit number starting 1–8 resolves to a deterministic dummy ticket. */
export function lookupPnr(pnr: string, direction: 'departure' | 'arrival', now = Date.now()): PnrResult | null {
  if (!/^[1-8]\d{9}$/.test(pnr)) return null;
  let tn: Train;
  let from: string;
  let to: string;
  let coach: string;
  let seats: string[];
  const known = KNOWN_PNRS[pnr];
  if (known) {
    tn = train(known.train)!;
    from = known.from;
    to = known.to;
    coach = known.coach;
    seats = known.seats;
  } else {
    const r = rng(hashStr(pnr));
    tn = TRAINS[Math.floor(r() * TRAINS.length)];
    const i = Math.floor(r() * (tn.stops.length - 1));
    from = tn.stops[i].code;
    to = tn.stops[tn.stops.length - 1].code;
    const coaches = bookableCoaches(tn);
    coach = coaches[Math.floor(r() * coaches.length)];
    const n = 1 + Math.floor(r() * 3);
    const first = 1 + Math.floor(r() * (seatCount(coach) - n));
    seats = Array.from({ length: n }, (_, k) => String(first + k));
  }
  const fromStop = stopAt(tn, from)!;
  const toStop = stopAt(tn, to)!;
  let depart: number;
  let arrive: number;
  if (direction === 'departure') {
    depart = nextOccurrence(fromStop.dep!, 40, now);
    arrive = atTime(depart + (toStop.day - fromStop.day) * 86400000, toStop.arr!);
  } else {
    arrive = nextOccurrence(toStop.arr!, 20, now);
    depart = atTime(arrive - (toStop.day - fromStop.day) * 86400000, fromStop.dep!);
  }
  return { pnr, train: tn, fromCode: from, toCode: to, coach, seats, passengers: seats.length, depart, arrive };
}

export function pnrToTrainInfo(p: PnrResult, direction: 'departure' | 'arrival'): TrainInfo {
  const stationCode = direction === 'departure' ? p.fromCode : p.toCode;
  const stop = stopAt(p.train, stationCode)!;
  return {
    number: p.train.number,
    name: p.train.name,
    fromCode: p.fromCode,
    toCode: p.toCode,
    stationCode,
    time: direction === 'departure' ? p.depart : p.arrive,
    platform: stop.pf,
    coach: p.coach,
    seat: p.seats.join(', '),
    composition: composition(p.train),
    pnr: p.pnr,
    passengers: p.passengers,
  };
}
