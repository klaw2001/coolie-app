import type { AssignedCoolie, BagId, Booking, CoolieAccount, JourneyType, PayMethod, Place } from '@/store/types';
import { C } from '@/theme';
import { offsetMeters, roadKm } from '@/utils/geo';
import { bookingCode, hashStr, otp4, pick, rng } from '@/utils/id';

import { AREAS } from './areas';
import { bagWeight } from './bags';
import { calcFare, minCoolies } from './fare';
import { direction, STAGES } from './journey';
import { AVATAR_COLORS, badgeNo, COOLIES, PASSENGERS } from './people';
import { coachPlace, EXIT_POINTS, MEET_POINTS, pointPlace, station } from './stations';
import { bookableCoaches, buildTrainInfo, nextOccurrence, seatCount, stopAt, trainsAt } from './trains';

export function rosterCoolie(seedKey: string, stationCode: string): AssignedCoolie {
  const h = hashStr(seedKey);
  const c = COOLIES[h % COOLIES.length];
  return {
    id: c.id,
    name: c.name,
    nameHi: c.nameHi,
    badge: badgeNo(stationCode, c.id),
    rating: c.rating,
    trips: c.trips,
    years: c.years,
    phone: c.phone,
    color: AVATAR_COLORS[h % AVATAR_COLORS.length],
  };
}

/** A Coolie Partner account on this phone, as it appears on a booking. */
export function accountCoolie(a: CoolieAccount, completedTrips: number): AssignedCoolie {
  const p = a.profile;
  return {
    id: a.id,
    accountId: a.id,
    name: p.name,
    badge: p.badge,
    rating: p.rating,
    trips: p.baseTrips + completedTrips,
    years: p.years,
    phone: a.phone,
    color: C.red,
  };
}

export function homePlace(stationCode: string, r: () => number): Place {
  const area = pick(AREAS[stationCode] ?? AREAS.CSMT, r);
  const flat = `${pick(['Flat', 'House', 'B-wing', 'Tower'], r)} ${Math.floor(r() * 900 + 101)}`;
  return {
    kind: 'address',
    id: 'addr_' + Math.floor(r() * 1e6),
    title: `${flat}, ${area.name}`,
    titleHi: `${flat}, ${area.nameHi}`,
    subtitle: area.name,
    subtitleHi: area.nameHi,
    coord: offsetMeters(area.coord, (r() - 0.5) * 800, (r() - 0.5) * 800),
  };
}

interface GenOpts {
  stationCode: string;
  seed: number;
  at: number;
  journeyType?: JourneyType;
  passenger?: { name: string; phone: string };
}

/** A complete, realistic dummy booking. Used for coolie-mode requests and seeded history. */
export function genBooking({ stationCode, seed, at, journeyType, passenger }: GenOpts): Booking {
  const r = rng(seed);
  const jt: JourneyType = journeyType ?? pick(['gate_to_train', 'gate_to_train', 'home_to_train', 'train_to_exit'] as const, r);
  const dir = direction(jt);
  const st = station(stationCode);
  const tn = pick(trainsAt(stationCode, dir), r);
  const coach = pick(bookableCoaches(tn), r);
  const seat = String(1 + Math.floor(r() * seatCount(coach)));
  const stop = stopAt(tn, stationCode)!;
  const time = nextOccurrence(dir === 'departure' ? stop.dep! : stop.arr!, 30, at);
  const train = { ...buildTrainInfo(tn, stationCode, dir, time, coach, seat), passengers: 1 + Math.floor(r() * 3) };

  let meet: Place;
  let drop: Place;
  if (jt === 'home_to_train') {
    meet = homePlace(stationCode, r);
    drop = coachPlace(st, coach, train.platform);
  } else if (jt === 'gate_to_train') {
    meet = pointPlace(st, pick(MEET_POINTS, r));
    drop = coachPlace(st, coach, train.platform);
  } else {
    meet = coachPlace(st, coach, train.platform);
    drop = pointPlace(st, pick(EXIT_POINTS, r));
  }
  const distanceKm = jt === 'home_to_train' ? roadKm(meet.coord, st.coord) : 0;

  const bags: Partial<Record<BagId, number>> = {};
  const nBags = 1 + Math.floor(r() * 4);
  for (let i = 0; i < nBags; i++) {
    const id = pick(['backpack', 'cabin', 'medium', 'medium', 'large', 'large', 'carton', 'trunk'] as const, r);
    bags[id] = (bags[id] ?? 0) + 1;
  }
  const weight = bagWeight(bags);
  const coolies = minCoolies(weight) + (r() < 0.15 ? 1 : 0);
  const addons = { trolley: r() < 0.2, wheelchair: r() < 0.08 };
  const fare = calcFare(weight, coolies, distanceKm, addons);
  const payMethod: PayMethod = pick(['cash', 'cash', 'upi', 'upi', 'card'] as const, r);
  const who = passenger ?? pick(PASSENGERS, r);

  return {
    id: bookingCode(),
    createdAt: at,
    source: 'request',
    journeyType: jt,
    stationCode,
    train,
    meet,
    drop,
    bags,
    addons,
    fare,
    when: 'now',
    payMethod,
    payStatus: payMethod === 'cash' ? 'cash_due' : 'paid',
    status: 'searching',
    statusAt: at,
    stage: 0,
    stageAt: at,
    otp: otp4(),
    searchFrom: at,
    timeline: [{ s: 'created', at }, { s: 'searching', at }],
    messages: [],
    passengerName: who.name,
    passengerPhone: who.phone,
  };
}

/** Turn a generated booking into a finished trip in the past. */
export function finishedCopy(b: Booking, coolie: AssignedCoolie, at: number, r: () => number, opts: { rated: boolean; tipped: boolean }): Booking {
  const stages = STAGES[b.journeyType];
  const accepted = at + 40_000;
  const arrived = accepted + 6 * 60_000;
  const started = arrived + 60_000;
  const done = started + stages.length * 4 * 60_000;
  const tip = opts.tipped ? pick([20, 30, 50], r) : 0;
  return {
    ...b,
    status: 'completed',
    statusAt: done,
    stage: stages.length - 1,
    stageAt: done,
    mode: coolie.accountId ? 'manual' : 'auto',
    coolie,
    payStatus: b.payMethod === 'cash' ? 'cash_paid' : 'paid',
    timeline: [
      { s: 'created', at },
      ...(b.payMethod !== 'cash' ? [{ s: 'paid', at: at + 20_000 }] : []),
      { s: 'accepted', at: accepted },
      { s: 'arrived', at: arrived },
      { s: 'started', at: started },
      { s: 'completed', at: done },
      ...(b.payMethod === 'cash' ? [{ s: 'cash', at: done + 30_000 }] : []),
    ],
    rating: opts.rated ? { stars: r() < 0.7 ? 5 : 4, tags: ['polite', 'careful'] } : undefined,
    tip: tip ? { amount: tip, method: 'cash', status: 'cash' } : undefined,
  };
}
