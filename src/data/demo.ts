import type { Address, Booking, CoolieAccount, PassengerAccount, Place, Txn } from '@/store/types';
import { startOfDay } from '@/utils/format';
import { offsetMeters, roadKm } from '@/utils/geo';
import { hashStr, rng, txnRef, uid } from '@/utils/id';

import { AREAS } from './areas';
import { calcFare } from './fare';
import { accountCoolie, finishedCopy, genBooking, rosterCoolie } from './generate';
import { coachPlace, station } from './stations';
import { buildTrainInfo, train } from './trains';

export const DEMO_PASSENGER_ID = 'p_demo';
export const DEMO_COOLIE_ID = 'k_demo';
export const DEMO_PASSENGER_PHONE = '9876501234';
export const DEMO_COOLIE_PHONE = '9820041177';

const DAY = 86_400_000;
const HOUR = 3_600_000;

function entry(p: Omit<Txn, 'id' | 'ref'>): Txn {
  return { id: uid('t'), ref: txnRef(), ...p };
}

function fromHome(b: Booking, home: Address): Booking {
  const meet: Place = { kind: 'address', id: home.id, title: home.line, subtitle: home.area, subtitleHi: home.areaHi, coord: home.coord };
  const distanceKm = roadKm(home.coord, station(b.stationCode).coord);
  return { ...b, meet, fare: calcFare(b.fare.weightKg, b.fare.coolies, distanceKm, b.addons) };
}

/** Two ready-made accounts with history, so both apps look lived-in from the first tap. */
export function buildDemo(now = Date.now()) {
  const r = rng(hashStr('coolie-demo'));
  const home: Address = {
    id: 'addr_demo_home',
    label: 'home',
    line: 'B-1204, Sea Breeze Apts',
    area: 'Bandra West',
    areaHi: 'बांद्रा वेस्ट',
    coord: offsetMeters(AREAS.CSMT[1].coord, 120, -80),
  };
  const work: Address = {
    id: 'addr_demo_work',
    label: 'work',
    line: 'Tower 3, Hiranandani Business Park',
    area: 'Powai',
    areaHi: 'पवई',
    coord: AREAS.CSMT[2].coord,
  };

  const ramesh: CoolieAccount = {
    id: DEMO_COOLIE_ID,
    phone: DEMO_COOLIE_PHONE,
    createdAt: now - 420 * DAY,
    profile: {
      name: 'Ramesh Yadav',
      badge: 'CSMT-472',
      stationCode: 'CSMT',
      years: 14,
      online: false,
      rating: 4.9,
      languages: ['Hindi', 'Marathi', 'English'],
      shift: 'full',
      baseTrips: 3240,
    },
    kyc: {
      status: 'approved',
      submittedAt: now - 421 * DAY,
      approvedAt: now - 420 * DAY,
      aadhaarLast4: '4821',
      bankLast4: '0921',
      ifsc: 'SBIN0000300',
      docs: ['photo', 'licence', 'aadhaar', 'bank'],
    },
  };
  const rameshOnTrip = accountCoolie(ramesh, 0);
  const me = { name: 'Ananya Sharma', phone: DEMO_PASSENGER_PHONE };
  const mine = (b: Booking): Booking => ({ ...b, source: 'passenger', passengerId: DEMO_PASSENGER_ID });

  const bookings: Booking[] = [];
  const txns: Txn[] = [];
  const pay = (b: Booking, at: number, kind: 'booking' | 'tip' = 'booking', amount = b.fare.total) =>
    txns.push(entry({ amount, dir: 'debit', kind, method: kind === 'tip' ? (b.tip?.method ?? 'upi') : b.payMethod, bookingId: b.id, ownerId: DEMO_PASSENGER_ID, at }));

  // 1. Two days ago at CSMT, carried by Ramesh (the demo partner): 5 stars and a tip.
  const g1 = genBooking({ stationCode: 'CSMT', seed: 101, at: now - 2 * DAY - 5 * HOUR, journeyType: 'gate_to_train', passenger: me });
  const b1: Booking = {
    ...mine(finishedCopy({ ...g1, payMethod: 'upi' }, rameshOnTrip, g1.createdAt, r, { rated: true, tipped: false })),
    rating: { stars: 5, tags: ['polite', 'careful', 'ontime'], comment: "Took great care of my parents' bags. Thank you!" },
    tip: { amount: 50, method: 'upi', status: 'paid' },
  };
  pay(b1, b1.createdAt + 20_000);
  pay(b1, b1.statusAt + 60_000, 'tip', 50);

  // 2. Six days ago, Home → Train from Bandra, paid cash, not rated yet (shows "Rate & tip").
  const g2 = fromHome(genBooking({ stationCode: 'CSMT', seed: 202, at: now - 6 * DAY - 2 * HOUR, journeyType: 'home_to_train', passenger: me }), home);
  const b2 = mine(finishedCopy({ ...g2, payMethod: 'cash' }, rosterCoolie(g2.id, 'CSMT'), g2.createdAt, r, { rated: false, tipped: false }));

  // 3. Eleven days ago, arriving at New Delhi on a work trip, paid by card.
  const g3 = genBooking({ stationCode: 'NDLS', seed: 303, at: now - 11 * DAY - 7 * HOUR, journeyType: 'train_to_exit', passenger: me });
  const b3: Booking = {
    ...mine(finishedCopy({ ...g3, payMethod: 'card' }, rosterCoolie(g3.id, 'NDLS'), g3.createdAt, r, { rated: true, tipped: true })),
    rating: { stars: 4, tags: ['ontime', 'fast'] },
  };
  pay(b3, b3.createdAt + 20_000);

  // 4. Four days ago, cancelled after paying from the wallet, refunded instantly.
  const g4 = genBooking({ stationCode: 'CSMT', seed: 404, at: now - 4 * DAY - 3 * HOUR, journeyType: 'gate_to_train', passenger: me });
  const cancelAt = g4.createdAt + 4 * 60_000;
  const b4: Booking = {
    ...mine(g4),
    payMethod: 'wallet',
    payStatus: 'refunded',
    status: 'cancelled',
    statusAt: cancelAt,
    cancel: { reason: 'reason.plans', by: 'passenger', at: cancelAt, refund: g4.fare.total },
    timeline: [{ s: 'created', at: g4.createdAt }, { s: 'paid', at: g4.createdAt + 20_000 }, { s: 'searching', at: g4.createdAt + 20_000 }, { s: 'cancelled', at: cancelAt }],
  };
  pay(b4, b4.createdAt + 20_000);
  txns.push(entry({ amount: b4.fare.total, dir: 'credit', kind: 'refund', method: 'wallet', bookingId: b4.id, ownerId: DEMO_PASSENGER_ID, at: cancelAt }));

  // 5. Seventeen days ago at Pune, paid from the wallet.
  const g5 = genBooking({ stationCode: 'PUNE', seed: 505, at: now - 17 * DAY - 4 * HOUR, journeyType: 'gate_to_train', passenger: me });
  const b5: Booking = {
    ...mine(finishedCopy({ ...g5, payMethod: 'wallet' }, rosterCoolie(g5.id, 'PUNE'), g5.createdAt, r, { rated: true, tipped: false })),
    rating: { stars: 5, tags: ['helpful', 'careful'] },
  };
  pay(b5, b5.createdAt + 20_000);

  // 6. Upcoming: tomorrow's Udyan Express from home, scheduled pickup at 6:30 AM, cash.
  const tomorrow = startOfDay(now) + DAY;
  const g6 = fromHome(genBooking({ stationCode: 'CSMT', seed: 606, at: now - 3 * HOUR, journeyType: 'home_to_train', passenger: me }), home);
  const udyan = buildTrainInfo(train('11301')!, 'CSMT', 'departure', tomorrow, 'B2', '33', { passengers: 2 });
  const scheduledAt = tomorrow + 6.5 * HOUR;
  const b6: Booking = {
    ...mine(g6),
    train: udyan,
    drop: coachPlace(station('CSMT'), 'B2', udyan.platform),
    when: 'later',
    scheduledAt,
    payMethod: 'cash',
    payStatus: 'cash_due',
    status: 'scheduled',
    statusAt: g6.createdAt,
    timeline: [{ s: 'created', at: g6.createdAt }, { s: 'scheduled', at: g6.createdAt }],
  };

  bookings.push(b6, b1, b4, b2, b3, b5);

  const topups = [
    entry({ amount: 1000, dir: 'credit', kind: 'topup', method: 'upi', ownerId: DEMO_PASSENGER_ID, at: now - 25 * DAY }),
    entry({ amount: 500, dir: 'credit', kind: 'topup', method: 'card', ownerId: DEMO_PASSENGER_ID, at: now - 8 * DAY }),
  ];
  txns.push(...topups);
  const walletBalance = 1500 - b5.fare.total;

  const ananya: PassengerAccount = {
    id: DEMO_PASSENGER_ID,
    phone: DEMO_PASSENGER_PHONE,
    createdAt: now - 30 * DAY,
    profile: { name: 'Ananya Sharma', email: 'ananya.sharma@example.com', stationCode: 'CSMT', emergencyName: 'Rohan Sharma', emergencyPhone: '9819098190' },
    walletBalance,
    addresses: [home, work],
    savedCards: [{ id: 'card_demo', brand: 'Visa', last4: '1111', bank: 'HDFC Bank', expiry: '08/29' }],
    savedUpi: ['ananya@okhdfc'],
  };

  // Ramesh's last week at CSMT (plus Ananya's trip above).
  const jobs: Booking[] = [];
  for (let d = 6; d >= 0; d--) {
    const n = d === 0 ? 2 : 3 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const at = now - d * DAY - (i + 1) * 80 * 60_000 - Math.floor(r() * 25) * 60_000;
      const g = genBooking({ stationCode: 'CSMT', seed: hashStr(`ramesh-${d}-${i}`), at });
      jobs.push(finishedCopy(g, rameshOnTrip, at, r, { rated: r() < 0.8, tipped: r() < 0.35 }));
    }
  }
  const earned = [...jobs, b1]
    .filter((j) => j.payMethod !== 'cash')
    .map((j) => entry({ amount: j.fare.total, dir: 'credit', kind: 'booking', method: j.payMethod, bookingId: j.id, ownerId: DEMO_COOLIE_ID, at: j.statusAt }));
  earned.push(entry({ amount: 50, dir: 'credit', kind: 'tip', method: 'upi', bookingId: b1.id, ownerId: DEMO_COOLIE_ID, at: b1.statusAt + 60_000 }));
  const older = earned.filter((x) => x.at < now - 3 * DAY).reduce((x, e) => x + e.amount, 0);
  if (older > 0) earned.push(entry({ amount: older, dir: 'debit', kind: 'withdraw', method: 'bank', ownerId: DEMO_COOLIE_ID, at: now - 3 * DAY + HOUR }));

  return {
    passengers: [ananya],
    coolies: [ramesh],
    bookings: [...bookings, ...jobs],
    txns: [...txns, ...earned].sort((a, b) => b.at - a.at),
  };
}
