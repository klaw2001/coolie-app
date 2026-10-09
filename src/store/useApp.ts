import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { bagWeight } from '@/data/bags';
import { calcFare } from '@/data/fare';
import { finishedCopy, genBooking, rosterCoolie, youAsCoolie } from '@/data/generate';
import {
  ACTIVE,
  arriveMs,
  AUTO_ACCEPT_MS,
  OTP_AUTO_MS,
  REQUEST_GAP_MS,
  REQUEST_TTL_MS,
  SCHEDULE_LEAD_MS,
  STAGES,
  stageMs,
} from '@/data/journey';
import { station } from '@/data/stations';
import { translate } from '@/i18n/translate';
import { offsetMeters } from '@/utils/geo';
import { bookingCode, hashStr, otp4, rng, txnRef, uid } from '@/utils/id';

import type {
  Address,
  Booking,
  ChatMsg,
  CoolieProfile,
  Draft,
  JourneyType,
  Lang,
  PassengerProfile,
  PaymentIntent,
  PayMethod,
  Role,
  SavedCard,
  Txn,
} from './types';

export function newDraft(journeyType: JourneyType = 'gate_to_train'): Draft {
  return {
    journeyType,
    distanceKm: 0,
    bags: {},
    weightAdjust: 0,
    coolies: 1,
    addons: { trolley: false, wheelchair: false },
    when: 'now',
    payMethod: 'online',
  };
}

interface Persisted {
  lang: Lang;
  onboarded: boolean;
  phone: string;
  loggedIn: boolean;
  role: Role | null;
  roleSince: number;
  passenger: PassengerProfile | null;
  coolie: CoolieProfile | null;
  addresses: Address[];
  bookings: Booking[];
  walletBalance: number;
  txns: Txn[];
  intents: PaymentIntent[];
  savedCards: SavedCard[];
  savedUpi: string[];
  draft: Draft;
  seededPassenger: boolean;
  seededCoolie: boolean;
}

interface Ephemeral {
  hydrated: boolean;
  requests: Booking[];
  nextRequestAt: number;
  declined: string[];
}

interface Actions {
  setLang: (l: Lang) => void;
  finishOnboarding: () => void;
  login: (phone: string) => void;
  logout: () => void;
  resetAll: () => void;
  setRole: (r: Role) => void;
  savePassenger: (p: PassengerProfile) => void;
  saveCoolie: (c: Omit<CoolieProfile, 'online' | 'rating'> & Partial<Pick<CoolieProfile, 'online' | 'rating'>>) => void;

  startDraft: (j: JourneyType) => void;
  patchDraft: (p: Partial<Draft>) => void;
  addAddress: (a: Omit<Address, 'id'>) => Address;
  removeAddress: (id: string) => void;

  placeBooking: () => Booking | null;
  createIntent: (amount: number, purpose: PaymentIntent['purpose'], refId?: string) => string;
  setIntentOutcome: (id: string, p: Pick<PaymentIntent, 'outcome' | 'method' | 'methodLabel' | 'failReason'>) => void;
  finalizeIntent: (id: string) => PaymentIntent | undefined;
  saveCard: (c: Omit<SavedCard, 'id'>) => void;
  removeCard: (id: string) => void;
  saveUpi: (vpa: string) => void;
  removeUpi: (vpa: string) => void;
  switchToCash: (bookingId: string) => void;
  cancelBooking: (id: string, reason: string, by: Role) => void;
  startNow: (id: string) => void;
  sendMessage: (id: string, from: Role, text: string) => void;
  markCashPaid: (id: string) => void;
  submitRating: (id: string, rating: NonNullable<Booking['rating']>, cashTip?: number) => void;

  setOnline: (on: boolean) => void;
  acceptRequest: (id: string) => boolean;
  declineRequest: (id: string) => void;
  coolieArrived: (id: string) => void;
  verifyOtp: (id: string, otp: string) => boolean;
  advanceStage: (id: string) => void;
  collectCash: (id: string) => void;
  releaseJob: (id: string) => void;
  withdraw: () => number;

  tick: (now: number) => void;
}

export type AppState = Persisted & Ephemeral & Actions;

const initial: Persisted = {
  lang: 'en',
  onboarded: false,
  phone: '',
  loggedIn: false,
  role: null,
  roleSince: 0,
  passenger: null,
  coolie: null,
  addresses: [],
  bookings: [],
  walletBalance: 500,
  txns: [],
  intents: [],
  savedCards: [{ id: 'card_seed', brand: 'Visa', last4: '1111', bank: 'HDFC Bank', expiry: '08/29' }],
  savedUpi: [],
  draft: newDraft(),
  seededPassenger: false,
  seededCoolie: false,
};

function tl(b: Booking, s: string, at: number): Booking['timeline'] {
  return [...b.timeline, { s, at }];
}

function txn(p: Omit<Txn, 'id' | 'at' | 'ref'> & { ref?: string; at?: number }): Txn {
  return { id: uid('t'), at: p.at ?? Date.now(), ref: p.ref ?? txnRef(), ...p };
}

export function isLiveForCoolie(b: Booking): boolean {
  return !!b.coolie?.isYou && (ACTIVE.includes(b.status) || (b.status === 'completed' && b.payStatus === 'cash_due'));
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => {
      const update = (id: string, fn: (b: Booking) => Booking) =>
        set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? fn(b) : b)) }));

      const myCoolieTrips = () => get().bookings.filter((b) => b.coolie?.isYou && b.status === 'completed').length;

      const seedPassenger = () => {
        const s = get();
        if (s.seededPassenger || !s.passenger) return;
        const now = Date.now();
        const code = s.passenger.stationCode;
        const me = { name: s.passenger.name, phone: s.phone };
        const r = rng(hashStr(s.phone + 'p'));
        const day = 86_400_000;
        const a = genBooking({ stationCode: code, seed: hashStr(s.phone + 'a'), at: now - 2 * day - 3_600_000, journeyType: 'gate_to_train', passenger: me });
        const b = genBooking({ stationCode: code, seed: hashStr(s.phone + 'b'), at: now - 9 * day, journeyType: 'home_to_train', passenger: me });
        const c = genBooking({ stationCode: code, seed: hashStr(s.phone + 'c'), at: now - 5 * day, journeyType: 'train_to_exit', passenger: me });
        const done1 = { ...finishedCopy(a, rosterCoolie(a.id, code), a.createdAt, r, { rated: true, tipped: true }), source: 'passenger' as const };
        const done2 = { ...finishedCopy(b, rosterCoolie(b.id, code), b.createdAt, r, { rated: false, tipped: false }), source: 'passenger' as const };
        const cancelled: Booking = {
          ...c,
          source: 'passenger',
          status: 'cancelled',
          statusAt: c.createdAt + 90_000,
          payMethod: 'cash',
          payStatus: 'cash_due',
          cancel: { reason: 'reason.plans', by: 'passenger', at: c.createdAt + 90_000, refund: 0 },
          timeline: [...c.timeline, { s: 'cancelled', at: c.createdAt + 90_000 }],
        };
        const seedTxns: Txn[] = [
          txn({ amount: 500, dir: 'credit', kind: 'topup', method: 'upi', owner: 'passenger', at: now - 15 * day }),
          ...[done1, done2]
            .filter((x) => x.payMethod !== 'cash')
            .map((x) => txn({ amount: x.fare.total, dir: 'debit', kind: 'booking', method: x.payMethod, bookingId: x.id, owner: 'passenger', at: x.createdAt + 20_000 })),
        ];
        set((st) => ({
          bookings: [...st.bookings, done1, done2, cancelled],
          txns: [...st.txns, ...seedTxns],
          seededPassenger: true,
        }));
      };

      const seedCoolie = () => {
        const s = get();
        if (s.seededCoolie || !s.coolie) return;
        const now = Date.now();
        const code = s.coolie.stationCode;
        const me = youAsCoolie(s.coolie, s.phone, 0);
        const r = rng(hashStr(s.phone + 'k'));
        const jobs: Booking[] = [];
        for (let d = 6; d >= 0; d--) {
          const n = d === 0 ? 2 : 3 + Math.floor(r() * 4);
          for (let i = 0; i < n; i++) {
            const at = now - d * 86_400_000 - (i + 1) * 75 * 60_000 - Math.floor(r() * 20) * 60_000;
            const g = genBooking({ stationCode: code, seed: hashStr(`${s.phone}-${d}-${i}`), at });
            jobs.push(finishedCopy(g, me, at, r, { rated: r() < 0.8, tipped: r() < 0.35 }));
          }
        }
        const earn = jobs
          .filter((j) => j.payMethod !== 'cash')
          .map((j) => txn({ amount: j.fare.total, dir: 'credit', kind: 'booking', method: j.payMethod, bookingId: j.id, owner: 'coolie', at: j.statusAt }));
        const payout = txn({ amount: Math.round(earn.slice(0, Math.floor(earn.length / 2)).reduce((x, t) => x + t.amount, 0)), dir: 'debit', kind: 'withdraw', method: 'bank', owner: 'coolie', at: now - 3 * 86_400_000 });
        set((st) => ({
          bookings: [...st.bookings, ...jobs],
          txns: [...st.txns, ...earn, ...(payout.amount > 0 ? [payout] : [])],
          seededCoolie: true,
        }));
      };

      const assign = (b: Booking, now: number, coolieMode: 'auto' | 'manual'): Booking => {
        const s = get();
        const st = station(b.stationCode);
        const r = rng(hashStr(b.id));
        const start =
          b.journeyType === 'home_to_train'
            ? offsetMeters(b.meet.coord, (r() - 0.5) * 3000, (r() - 0.5) * 3000)
            : offsetMeters(st.coord, -260 + r() * 80, 180 - r() * 60);
        const coolie =
          coolieMode === 'manual' && s.coolie
            ? youAsCoolie(s.coolie, s.phone, myCoolieTrips())
            : rosterCoolie(b.id, b.stationCode);
        return {
          ...b,
          status: 'accepted',
          statusAt: now,
          mode: coolieMode,
          coolie,
          coolieStart: start,
          arriveMs: arriveMs(b.journeyType),
          timeline: tl(b, 'accepted', now),
        };
      };

      const begin = (b: Booking, now: number): Booking => ({
        ...b,
        status: 'in_progress',
        statusAt: now,
        stage: 0,
        stageAt: now,
        timeline: tl(b, 'started', now),
      });

      const step = (b: Booking, now: number): Booking => {
        const stages = STAGES[b.journeyType];
        if (b.stage >= stages.length - 1) {
          return { ...b, status: 'completed', statusAt: now, timeline: tl(b, 'completed', now) };
        }
        return { ...b, stage: b.stage + 1, stageAt: now };
      };

      const creditCoolie = (b: Booking) => {
        if (!b.coolie?.isYou || b.payMethod === 'cash') return [] as Txn[];
        return [txn({ amount: b.fare.total, dir: 'credit', kind: 'booking', method: b.payMethod, bookingId: b.id, owner: 'coolie' })];
      };

      return {
        ...initial,
        hydrated: false,
        requests: [],
        nextRequestAt: 0,
        declined: [],

        setLang: (lang) => set({ lang }),
        finishOnboarding: () => set({ onboarded: true }),
        login: (phone) => set({ phone, loggedIn: true }),
        logout: () => set({ loggedIn: false, requests: [] }),
        resetAll: () => set({ ...initial, lang: get().lang, onboarded: true, requests: [], declined: [], draft: newDraft() }),
        setRole: (role) => set({ role, roleSince: Date.now(), requests: [] }),

        savePassenger: (p) => {
          set({ passenger: p });
          seedPassenger();
        },
        saveCoolie: (c) => {
          const prev = get().coolie;
          set({ coolie: { online: prev?.online ?? false, rating: prev?.rating ?? 4.8, ...c } });
          seedCoolie();
        },

        startDraft: (j) => set({ draft: newDraft(j) }),
        patchDraft: (p) => set((s) => ({ draft: { ...s.draft, ...p } })),
        addAddress: (a) => {
          const addr = { ...a, id: uid('a') };
          set((s) => ({ addresses: [addr, ...s.addresses] }));
          return addr;
        },
        removeAddress: (id) => set((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) })),

        placeBooking: () => {
          const s = get();
          const d = s.draft;
          if (!d.train || !d.meet || !d.drop) return null;
          const now = Date.now();
          const weight = Math.max(1, bagWeight(d.bags) + d.weightAdjust);
          const fare = calcFare(weight, d.coolies, d.distanceKm, d.addons);
          const cash = d.payMethod === 'cash';
          const later = d.when === 'later' && !!d.scheduledAt;
          const status: Booking['status'] = !cash ? 'payment_pending' : later ? 'scheduled' : 'searching';
          const b: Booking = {
            id: bookingCode(),
            createdAt: now,
            source: 'passenger',
            journeyType: d.journeyType,
            stationCode: d.train.stationCode,
            train: d.train,
            meet: d.meet,
            drop: d.drop,
            bags: d.bags,
            addons: d.addons,
            fare,
            when: later ? 'later' : 'now',
            scheduledAt: later ? d.scheduledAt : undefined,
            payMethod: cash ? 'cash' : 'upi',
            payStatus: cash ? 'cash_due' : 'pending',
            status,
            statusAt: now,
            stage: 0,
            stageAt: now,
            otp: otp4(),
            searchFrom: now,
            timeline: [{ s: 'created', at: now }, ...(cash ? [{ s: later ? 'scheduled' : 'searching', at: now }] : [])],
            messages: [],
            passengerName: s.passenger?.name ?? 'Passenger',
            passengerPhone: s.phone,
          };
          set((st) => ({ bookings: [b, ...st.bookings] }));
          return b;
        },

        createIntent: (amount, purpose, refId) => {
          const id = uid('pi_');
          set((s) => ({ intents: [{ id, amount, purpose, refId, status: 'created', createdAt: Date.now() }, ...s.intents] }));
          return id;
        },
        setIntentOutcome: (id, p) =>
          set((s) => ({ intents: s.intents.map((i) => (i.id === id ? { ...i, ...p, status: 'created' } : i)) })),

        finalizeIntent: (id) => {
          const s = get();
          const it = s.intents.find((i) => i.id === id);
          if (!it || it.status !== 'created' || !it.method) return it;
          let ok = it.outcome === 'success';
          let failReason = it.failReason;
          if (ok && it.method === 'wallet' && s.walletBalance < it.amount) {
            ok = false;
            failReason = 'fail.balance';
          }
          const now = Date.now();
          const ref = txnRef();
          const done: PaymentIntent = { ...it, status: ok ? 'success' : 'failed', failReason, ref: ok ? ref : undefined };
          const patch: Partial<AppState> = { intents: s.intents.map((i) => (i.id === id ? done : i)) };
          if (ok) {
            const method = it.method as PayMethod;
            let balance = s.walletBalance;
            if (method === 'wallet') balance -= it.amount;
            const newTxns: Txn[] = [];
            if (it.purpose === 'topup') {
              balance += it.amount;
              newTxns.push(txn({ amount: it.amount, dir: 'credit', kind: 'topup', method, owner: 'passenger', ref }));
            } else {
              newTxns.push(txn({ amount: it.amount, dir: 'debit', kind: it.purpose, method, bookingId: it.refId, owner: 'passenger', ref }));
            }
            let bookings = s.bookings;
            if (it.purpose === 'booking' && it.refId) {
              bookings = bookings.map((b) => {
                if (b.id !== it.refId) return b;
                const later = b.when === 'later';
                return {
                  ...b,
                  payMethod: method,
                  payStatus: 'paid',
                  payRef: ref,
                  status: later ? 'scheduled' : 'searching',
                  statusAt: now,
                  searchFrom: now,
                  timeline: [...b.timeline, { s: 'paid', at: now }, { s: later ? 'scheduled' : 'searching', at: now }],
                };
              });
            }
            if (it.purpose === 'tip' && it.refId) {
              const b = bookings.find((x) => x.id === it.refId);
              if (b?.coolie?.isYou) {
                newTxns.push(txn({ amount: it.amount, dir: 'credit', kind: 'tip', method, bookingId: b.id, owner: 'coolie', ref }));
              }
              bookings = bookings.map((x) => (x.id === it.refId ? { ...x, tip: { amount: it.amount, method, status: 'paid' } } : x));
            }
            Object.assign(patch, { walletBalance: balance, txns: [...newTxns, ...s.txns], bookings });
          }
          set(patch);
          return done;
        },

        saveCard: (c) =>
          set((s) =>
            s.savedCards.some((x) => x.last4 === c.last4 && x.brand === c.brand)
              ? s
              : { savedCards: [...s.savedCards, { ...c, id: uid('card') }] },
          ),
        removeCard: (id) => set((s) => ({ savedCards: s.savedCards.filter((c) => c.id !== id) })),
        saveUpi: (vpa) => set((s) => (s.savedUpi.includes(vpa) ? s : { savedUpi: [...s.savedUpi, vpa] })),
        removeUpi: (vpa) => set((s) => ({ savedUpi: s.savedUpi.filter((v) => v !== vpa) })),

        switchToCash: (id) => {
          const now = Date.now();
          update(id, (b) => {
            const later = b.when === 'later';
            return {
              ...b,
              payMethod: 'cash',
              payStatus: 'cash_due',
              status: later ? 'scheduled' : 'searching',
              statusAt: now,
              searchFrom: now,
              timeline: tl(b, later ? 'scheduled' : 'searching', now),
            };
          });
        },

        cancelBooking: (id, reason, by) => {
          const s = get();
          const b = s.bookings.find((x) => x.id === id);
          if (!b) return;
          const now = Date.now();
          const refund = b.payStatus === 'paid' ? b.fare.total : 0;
          set({
            bookings: s.bookings.map((x) =>
              x.id === id
                ? {
                    ...x,
                    status: 'cancelled',
                    statusAt: now,
                    payStatus: refund ? 'refunded' : x.payStatus,
                    cancel: { reason, by, at: now, refund },
                    timeline: tl(x, 'cancelled', now),
                  }
                : x,
            ),
            walletBalance: s.walletBalance + refund,
            txns: refund
              ? [txn({ amount: refund, dir: 'credit', kind: 'refund', method: 'wallet', bookingId: id, owner: 'passenger' }), ...s.txns]
              : s.txns,
          });
        },

        startNow: (id) => {
          const now = Date.now();
          update(id, (b) =>
            b.status === 'scheduled'
              ? { ...b, status: 'searching', statusAt: now, searchFrom: now, timeline: tl(b, 'searching', now) }
              : b,
          );
        },

        sendMessage: (id, from, text) => {
          const msg: ChatMsg = { id: uid('m'), from, text, at: Date.now() };
          update(id, (b) => ({ ...b, messages: [...b.messages, msg] }));
        },

        markCashPaid: (id) => {
          const now = Date.now();
          update(id, (b) => ({ ...b, payStatus: 'cash_paid', timeline: tl(b, 'cash', now) }));
        },

        submitRating: (id, rating, cashTip) => {
          const now = Date.now();
          update(id, (b) => ({
            ...b,
            rating,
            tip: cashTip ? { amount: cashTip, method: 'cash', status: 'cash' } : b.tip,
            timeline: tl(b, 'rated', now),
          }));
        },

        // ---------- Coolie mode ----------

        setOnline: (on) =>
          set((s) => ({
            coolie: s.coolie ? { ...s.coolie, online: on } : s.coolie,
            nextRequestAt: on ? Date.now() + 3500 : s.nextRequestAt,
            requests: on ? s.requests : [],
          })),

        acceptRequest: (id) => {
          const s = get();
          const now = Date.now();
          if (s.bookings.some(isLiveForCoolie)) return false;
          const req = s.requests.find((r) => r.id === id);
          if (req) {
            const b = assign({ ...req, expiresAt: undefined }, now, 'manual');
            set({ bookings: [b, ...s.bookings], requests: s.requests.filter((r) => r.id !== id) });
            return true;
          }
          const own = s.bookings.find((b) => b.id === id && b.status === 'searching');
          if (own) {
            update(id, (b) => assign(b, now, 'manual'));
            return true;
          }
          return false;
        },

        declineRequest: (id) =>
          set((s) => ({ requests: s.requests.filter((r) => r.id !== id), declined: [...s.declined, id] })),

        coolieArrived: (id) => {
          const now = Date.now();
          update(id, (b) => (b.status === 'accepted' ? { ...b, status: 'arrived', statusAt: now, timeline: tl(b, 'arrived', now) } : b));
        },

        verifyOtp: (id, otp) => {
          const b = get().bookings.find((x) => x.id === id);
          if (!b || b.status !== 'arrived' || b.otp !== otp.trim()) return false;
          const now = Date.now();
          update(id, (x) => begin(x, now));
          return true;
        },

        advanceStage: (id) => {
          const now = Date.now();
          const before = get().bookings.find((x) => x.id === id);
          if (!before || before.status !== 'in_progress') return;
          const after = step(before, now);
          const credit = after.status === 'completed' ? creditCoolie(after) : [];
          set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? after : b)), txns: [...credit, ...s.txns] }));
        },

        collectCash: (id) => {
          const now = Date.now();
          update(id, (b) => ({ ...b, payStatus: 'cash_paid', timeline: tl(b, 'cash', now) }));
        },

        releaseJob: (id) => {
          const s = get();
          const b = s.bookings.find((x) => x.id === id);
          if (!b) return;
          const now = Date.now();
          if (b.source === 'passenger') {
            update(id, (x) => ({
              ...x,
              status: 'searching',
              statusAt: now,
              searchFrom: now,
              mode: undefined,
              coolie: undefined,
              coolieStart: undefined,
              timeline: tl(x, 'searching', now),
            }));
          } else {
            set({ bookings: s.bookings.filter((x) => x.id !== id), declined: [...s.declined, id] });
          }
        },

        withdraw: () => {
          const s = get();
          const bal = s.txns.filter((t) => t.owner === 'coolie').reduce((x, t) => x + (t.dir === 'credit' ? t.amount : -t.amount), 0);
          if (bal <= 0) return 0;
          set({ txns: [txn({ amount: bal, dir: 'debit', kind: 'withdraw', method: 'bank', owner: 'coolie' }), ...s.txns] });
          return bal;
        },

        // ---------- Simulation clock ----------

        tick: (now) => {
          const s = get();
          let changed = false;
          const newCoolieTxns: Txn[] = [];
          const bookings = s.bookings.map((b0) => {
            let b = b0;
            if (b.status === 'scheduled' && b.scheduledAt && now >= b.scheduledAt - SCHEDULE_LEAD_MS) {
              b = { ...b, status: 'searching', statusAt: now, searchFrom: now, timeline: tl(b, 'searching', now) };
            } else if (b.status === 'searching' && b.source === 'passenger' && s.role !== 'coolie') {
              const from = Math.max(b.searchFrom ?? b.statusAt, s.roleSince);
              if (now - from >= AUTO_ACCEPT_MS) b = assign(b, now, 'auto');
            } else if (b.mode === 'auto') {
              if (b.status === 'accepted' && now - b.statusAt >= (b.arriveMs ?? 15_000)) {
                b = { ...b, status: 'arrived', statusAt: now, timeline: tl(b, 'arrived', now) };
              } else if (b.status === 'arrived' && now - b.statusAt >= OTP_AUTO_MS) {
                b = begin(b, now);
              } else if (b.status === 'in_progress') {
                const id = STAGES[b.journeyType][b.stage];
                if (now - b.stageAt >= stageMs(id)) b = step(b, now);
              }
            }
            if (b.mode === 'auto' && b.coolie && ACTIVE.includes(b.status)) {
              const last = b.messages[b.messages.length - 1];
              if (last && last.from === 'passenger' && now - last.at >= 2500) {
                const n = b.messages.filter((m) => m.from === 'coolie').length;
                const key = (['auto.c1', 'auto.c2', 'auto.c3', 'auto.c4'] as const)[n % 4];
                const text = translate(s.lang, key, { badge: b.coolie.badge });
                b = { ...b, messages: [...b.messages, { id: uid('m'), from: 'coolie', text, at: now }] };
              }
            }
            if (b.source === 'request' && b.coolie?.isYou && ACTIVE.includes(b.status)) {
              const last = b.messages[b.messages.length - 1];
              if (last && last.from === 'coolie' && now - last.at >= 2500) {
                const n = b.messages.filter((m) => m.from === 'passenger').length;
                const key = (['auto.p1', 'auto.p2', 'auto.p3'] as const)[n % 3];
                const text = translate(s.lang, key, { coach: b.train.coach });
                b = { ...b, messages: [...b.messages, { id: uid('m'), from: 'passenger', text, at: now }] };
              }
            }
            if (b !== b0) {
              changed = true;
              if (b.status === 'completed' && b0.status !== 'completed') newCoolieTxns.push(...creditCoolie(b));
            }
            return b;
          });

          let requests = s.requests;
          let nextRequestAt = s.nextRequestAt;
          if (s.role === 'coolie' && s.coolie?.online) {
            const alive = requests.filter((r) => (r.expiresAt ?? 0) > now);
            if (alive.length !== requests.length) {
              requests = alive;
              changed = true;
            }
            const busy = bookings.some(isLiveForCoolie);
            if (!busy && now >= nextRequestAt && requests.length < 2) {
              const g = genBooking({ stationCode: s.coolie.stationCode, seed: Math.floor(Math.random() * 1e9), at: now });
              requests = [...requests, { ...g, expiresAt: now + REQUEST_TTL_MS }];
              nextRequestAt = now + REQUEST_GAP_MS + Math.floor(Math.random() * 8000);
              changed = true;
            }
          } else if (requests.length) {
            requests = [];
            changed = true;
          }

          if (changed) set({ bookings, requests, nextRequestAt, txns: newCoolieTxns.length ? [...newCoolieTxns, ...s.txns] : s.txns });
        },
      };
    },
    {
      name: 'coolie-app-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): Persisted => ({
        lang: s.lang,
        onboarded: s.onboarded,
        phone: s.phone,
        loggedIn: s.loggedIn,
        role: s.role,
        roleSince: s.roleSince,
        passenger: s.passenger,
        coolie: s.coolie,
        addresses: s.addresses,
        bookings: s.bookings,
        walletBalance: s.walletBalance,
        txns: s.txns,
        intents: s.intents.slice(0, 30),
        savedCards: s.savedCards,
        savedUpi: s.savedUpi,
        draft: s.draft,
        seededPassenger: s.seededPassenger,
        seededCoolie: s.seededCoolie,
      }),
      onRehydrateStorage: () => () => {
        useApp.setState({ hydrated: true });
      },
    },
  ),
);

// ---------- Selectors ----------

export function passengerBookings(bookings: Booking[]): Booking[] {
  return bookings.filter((b) => b.source === 'passenger' && b.status !== 'payment_pending');
}

export function coolieJobs(bookings: Booking[]): Booking[] {
  return bookings.filter((b) => b.coolie?.isYou);
}

export function coolieBalance(txns: Txn[]): number {
  return txns.filter((t) => t.owner === 'coolie').reduce((x, t) => x + (t.dir === 'credit' ? t.amount : -t.amount), 0);
}

export function jobEarning(b: Booking): number {
  return b.fare.total + (b.tip?.amount ?? 0);
}
