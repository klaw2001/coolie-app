import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { bagWeight } from '@/data/bags';
import { buildDemo } from '@/data/demo';
import { calcFare } from '@/data/fare';
import { accountCoolie, genBooking, rosterCoolie } from '@/data/generate';
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
  CoolieAccount,
  CoolieProfile,
  Draft,
  JourneyType,
  Kyc,
  Lang,
  PassengerAccount,
  PassengerProfile,
  PaymentIntent,
  PayMethod,
  Role,
  SavedCard,
  Session,
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
  onboarded: Record<Role, boolean>;
  passengers: PassengerAccount[];
  coolies: CoolieAccount[];
  session: Session | null;
  bookings: Booking[];
  txns: Txn[];
  intents: PaymentIntent[];
  draft: Draft;
  demoSeeded: boolean;
}

interface Ephemeral {
  hydrated: boolean;
  requests: Booking[];
  nextRequestAt: number;
  declined: string[];
  /** After logging out to hand a booking to the partner app, open that app's login next. */
  authIntent: Role | null;
}

interface Actions {
  setLang: (l: Lang) => void;
  markOnboarded: (app: Role) => void;
  setAuthIntent: (app: Role | null) => void;
  ensureDemo: () => void;
  loginAs: (app: Role, accountId: string) => void;
  logout: () => void;
  resetAll: () => void;

  registerPassenger: (phone: string, profile: PassengerProfile) => string;
  updatePassenger: (profile: PassengerProfile) => void;
  registerCoolie: (phone: string, profile: Omit<CoolieProfile, 'online' | 'rating'>, kyc: Omit<Kyc, 'status' | 'submittedAt'>) => string;
  approveCoolie: (id: string) => void;
  updateCoolie: (patch: Partial<CoolieProfile>) => void;

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
  holdForPartner: (id: string, hold: boolean) => void;
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
  onboarded: { passenger: false, coolie: false },
  passengers: [],
  coolies: [],
  session: null,
  bookings: [],
  txns: [],
  intents: [],
  draft: newDraft(),
  demoSeeded: false,
};

function tl(b: Booking, s: string, at: number): Booking['timeline'] {
  return [...b.timeline, { s, at }];
}

function txn(p: Omit<Txn, 'id' | 'at' | 'ref'> & { ref?: string; at?: number }): Txn {
  return { id: uid('t'), at: p.at ?? Date.now(), ref: p.ref ?? txnRef(), ...p };
}

// ---------- Selectors ----------

export function selectPassenger(s: Pick<AppState, 'session' | 'passengers'>): PassengerAccount | null {
  return s.session?.app === 'passenger' ? (s.passengers.find((p) => p.id === s.session!.accountId) ?? null) : null;
}

export function selectCoolie(s: Pick<AppState, 'session' | 'coolies'>): CoolieAccount | null {
  return s.session?.app === 'coolie' ? (s.coolies.find((c) => c.id === s.session!.accountId) ?? null) : null;
}

/** Jobs this coolie account still has to finish (including collecting cash). */
export function isLiveFor(accountId: string | undefined) {
  return (b: Booking) =>
    !!accountId && b.coolie?.accountId === accountId && (ACTIVE.includes(b.status) || (b.status === 'completed' && b.payStatus === 'cash_due'));
}

export function passengerBookings(bookings: Booking[], accountId: string | undefined): Booking[] {
  return bookings.filter((b) => b.source === 'passenger' && b.passengerId === accountId && b.status !== 'payment_pending');
}

export function coolieJobs(bookings: Booking[], accountId: string | undefined): Booking[] {
  return bookings.filter((b) => !!accountId && b.coolie?.accountId === accountId);
}

export function balanceOf(txns: Txn[], ownerId: string | undefined): number {
  return txns.filter((t) => t.ownerId === ownerId).reduce((x, t) => x + (t.dir === 'credit' ? t.amount : -t.amount), 0);
}

export function jobEarning(b: Booking): number {
  return b.fare.total + (b.tip?.amount ?? 0);
}

export function findAccount(s: Pick<AppState, 'passengers' | 'coolies'>, app: Role, phone: string) {
  const list = app === 'passenger' ? s.passengers : s.coolies;
  return list.find((a) => a.phone === phone);
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => {
      const update = (id: string, fn: (b: Booking) => Booking) =>
        set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? fn(b) : b)) }));

      const patchMe = (fn: (p: PassengerAccount) => PassengerAccount) =>
        set((s) => ({ passengers: s.passengers.map((p) => (s.session?.app === 'passenger' && p.id === s.session.accountId ? fn(p) : p)) }));

      const patchCoolie = (fn: (c: CoolieAccount) => CoolieAccount) =>
        set((s) => ({ coolies: s.coolies.map((c) => (s.session?.app === 'coolie' && c.id === s.session.accountId ? fn(c) : c)) }));

      const completedFor = (accountId: string) => get().bookings.filter((b) => b.coolie?.accountId === accountId && b.status === 'completed').length;

      const assign = (b: Booking, now: number, by: CoolieAccount | null): Booking => {
        const st = station(b.stationCode);
        const r = rng(hashStr(b.id));
        const start =
          b.journeyType === 'home_to_train'
            ? offsetMeters(b.meet.coord, (r() - 0.5) * 3000, (r() - 0.5) * 3000)
            : offsetMeters(st.coord, -260 + r() * 80, 180 - r() * 60);
        return {
          ...b,
          status: 'accepted',
          statusAt: now,
          mode: by ? 'manual' : 'auto',
          holdForPartner: false,
          coolie: by ? accountCoolie(by, completedFor(by.id)) : rosterCoolie(b.id, b.stationCode),
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

      const creditCoolie = (b: Booking): Txn[] => {
        if (!b.coolie?.accountId || b.payMethod === 'cash') return [];
        return [txn({ amount: b.fare.total, dir: 'credit', kind: 'booking', method: b.payMethod, bookingId: b.id, ownerId: b.coolie.accountId })];
      };

      return {
        ...initial,
        hydrated: false,
        requests: [],
        nextRequestAt: 0,
        declined: [],
        authIntent: null,

        setLang: (lang) => set({ lang }),
        markOnboarded: (app) => set((s) => ({ onboarded: { ...s.onboarded, [app]: true } })),
        setAuthIntent: (authIntent) => set({ authIntent }),

        ensureDemo: () => {
          if (get().demoSeeded) return;
          const demo = buildDemo();
          set((s) => ({
            passengers: [...demo.passengers, ...s.passengers.filter((p) => !demo.passengers.some((d) => d.id === p.id))],
            coolies: [...demo.coolies, ...s.coolies.filter((c) => !demo.coolies.some((d) => d.id === c.id))],
            bookings: [...s.bookings, ...demo.bookings],
            txns: [...demo.txns, ...s.txns],
            demoSeeded: true,
          }));
        },

        loginAs: (app, accountId) =>
          set({
            session: { app, accountId, since: Date.now() },
            draft: newDraft(),
            requests: [],
            declined: [],
            nextRequestAt: Date.now() + 3500,
            authIntent: null,
          }),

        logout: () => set({ session: null, requests: [] }),

        resetAll: () => {
          set({ ...initial, lang: get().lang, onboarded: get().onboarded, requests: [], declined: [], authIntent: null });
          get().ensureDemo();
        },

        registerPassenger: (phone, profile) => {
          const id = uid('p_');
          const acct: PassengerAccount = { id, phone, createdAt: Date.now(), profile, walletBalance: 0, addresses: [], savedCards: [], savedUpi: [] };
          set((s) => ({ passengers: [...s.passengers, acct] }));
          return id;
        },
        updatePassenger: (profile) => patchMe((p) => ({ ...p, profile })),

        registerCoolie: (phone, profile, kyc) => {
          const id = uid('k_');
          const acct: CoolieAccount = {
            id,
            phone,
            createdAt: Date.now(),
            profile: { ...profile, online: false, rating: 5 },
            kyc: { ...kyc, status: 'pending', submittedAt: Date.now() },
          };
          set((s) => ({ coolies: [...s.coolies, acct] }));
          return id;
        },
        approveCoolie: (id) =>
          set((s) => ({ coolies: s.coolies.map((c) => (c.id === id ? { ...c, kyc: { ...c.kyc, status: 'approved', approvedAt: Date.now() } } : c)) })),
        updateCoolie: (patch) => patchCoolie((c) => ({ ...c, profile: { ...c.profile, ...patch } })),

        startDraft: (j) => set({ draft: newDraft(j) }),
        patchDraft: (p) => set((s) => ({ draft: { ...s.draft, ...p } })),
        addAddress: (a) => {
          const addr = { ...a, id: uid('a') };
          patchMe((p) => ({ ...p, addresses: [addr, ...p.addresses] }));
          return addr;
        },
        removeAddress: (id) => patchMe((p) => ({ ...p, addresses: p.addresses.filter((a) => a.id !== id) })),

        placeBooking: () => {
          const s = get();
          const me = selectPassenger(s);
          const d = s.draft;
          if (!me || !d.train || !d.meet || !d.drop) return null;
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
            passengerId: me.id,
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
            passengerName: me.profile.name,
            passengerPhone: me.phone,
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
          const me = selectPassenger(s);
          const it = s.intents.find((i) => i.id === id);
          if (!me || !it || it.status !== 'created' || !it.method) return it;
          let ok = it.outcome === 'success';
          let failReason = it.failReason;
          if (ok && it.method === 'wallet' && me.walletBalance < it.amount) {
            ok = false;
            failReason = 'fail.balance';
          }
          const now = Date.now();
          const ref = txnRef();
          const done: PaymentIntent = { ...it, status: ok ? 'success' : 'failed', failReason, ref: ok ? ref : undefined };
          const patch: Partial<AppState> = { intents: s.intents.map((i) => (i.id === id ? done : i)) };
          if (ok) {
            const method = it.method as PayMethod;
            let balance = me.walletBalance;
            if (method === 'wallet') balance -= it.amount;
            const newTxns: Txn[] = [];
            if (it.purpose === 'topup') {
              balance += it.amount;
              newTxns.push(txn({ amount: it.amount, dir: 'credit', kind: 'topup', method, ownerId: me.id, ref }));
            } else {
              newTxns.push(txn({ amount: it.amount, dir: 'debit', kind: it.purpose, method, bookingId: it.refId, ownerId: me.id, ref }));
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
              if (b?.coolie?.accountId) {
                newTxns.push(txn({ amount: it.amount, dir: 'credit', kind: 'tip', method, bookingId: b.id, ownerId: b.coolie.accountId, ref }));
              }
              bookings = bookings.map((x) => (x.id === it.refId ? { ...x, tip: { amount: it.amount, method, status: 'paid' } } : x));
            }
            Object.assign(patch, {
              passengers: s.passengers.map((p) => (p.id === me.id ? { ...p, walletBalance: balance } : p)),
              txns: [...newTxns, ...s.txns],
              bookings,
            });
          }
          set(patch);
          return done;
        },

        saveCard: (c) =>
          patchMe((p) => (p.savedCards.some((x) => x.last4 === c.last4 && x.brand === c.brand) ? p : { ...p, savedCards: [...p.savedCards, { ...c, id: uid('card') }] })),
        removeCard: (id) => patchMe((p) => ({ ...p, savedCards: p.savedCards.filter((c) => c.id !== id) })),
        saveUpi: (vpa) => patchMe((p) => (p.savedUpi.includes(vpa) ? p : { ...p, savedUpi: [...p.savedUpi, vpa] })),
        removeUpi: (vpa) => patchMe((p) => ({ ...p, savedUpi: p.savedUpi.filter((v) => v !== vpa) })),

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
            passengers: refund ? s.passengers.map((p) => (p.id === b.passengerId ? { ...p, walletBalance: p.walletBalance + refund } : p)) : s.passengers,
            txns:
              refund && b.passengerId
                ? [txn({ amount: refund, dir: 'credit', kind: 'refund', method: 'wallet', bookingId: id, ownerId: b.passengerId }), ...s.txns]
                : s.txns,
          });
        },

        startNow: (id) => {
          const now = Date.now();
          update(id, (b) =>
            b.status === 'scheduled' ? { ...b, status: 'searching', statusAt: now, searchFrom: now, timeline: tl(b, 'searching', now) } : b,
          );
        },

        holdForPartner: (id, hold) => {
          const now = Date.now();
          update(id, (b) => ({ ...b, holdForPartner: hold, searchFrom: hold ? b.searchFrom : now - AUTO_ACCEPT_MS }));
        },

        sendMessage: (id, from, text) => {
          const msg: ChatMsg = { id: uid('m'), from, text, at: Date.now() };
          update(id, (b) => ({ ...b, messages: [...b.messages, msg] }));
        },

        markCashPaid: (id) => {
          const now = Date.now();
          update(id, (b) => (b.payStatus === 'cash_due' ? { ...b, payStatus: 'cash_paid', timeline: tl(b, 'cash', now) } : b));
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

        // ---------- Coolie Partner ----------

        setOnline: (on) => {
          patchCoolie((c) => ({ ...c, profile: { ...c.profile, online: on } }));
          set((s) => ({ nextRequestAt: on ? Date.now() + 3500 : s.nextRequestAt, requests: on ? s.requests : [] }));
        },

        acceptRequest: (id) => {
          const s = get();
          const me = selectCoolie(s);
          const now = Date.now();
          if (!me || s.bookings.some(isLiveFor(me.id))) return false;
          const req = s.requests.find((r) => r.id === id);
          if (req) {
            const b = assign({ ...req, expiresAt: undefined }, now, me);
            set({ bookings: [b, ...s.bookings], requests: s.requests.filter((r) => r.id !== id) });
            return true;
          }
          const booked = s.bookings.find((b) => b.id === id && b.status === 'searching');
          if (booked) {
            update(id, (b) => assign(b, now, me));
            return true;
          }
          return false;
        },

        declineRequest: (id) => set((s) => ({ requests: s.requests.filter((r) => r.id !== id), declined: [...s.declined, id] })),

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
          update(id, (b) => (b.payStatus === 'cash_due' ? { ...b, payStatus: 'cash_paid', timeline: tl(b, 'cash', now) } : b));
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
          const me = selectCoolie(s);
          if (!me) return 0;
          const bal = balanceOf(s.txns, me.id);
          if (bal <= 0) return 0;
          set({ txns: [txn({ amount: bal, dir: 'debit', kind: 'withdraw', method: 'bank', ownerId: me.id }), ...s.txns] });
          return bal;
        },

        // ---------- Simulation clock ----------

        tick: (now) => {
          const s = get();
          const me = selectCoolie(s);
          let changed = false;
          const newTxns: Txn[] = [];
          const bookings = s.bookings.map((b0) => {
            let b = b0;
            if (b.status === 'scheduled' && b.scheduledAt && now >= b.scheduledAt - SCHEDULE_LEAD_MS) {
              b = { ...b, status: 'searching', statusAt: now, searchFrom: now, timeline: tl(b, 'searching', now) };
            } else if (b.status === 'searching' && b.source === 'passenger') {
              // A simulated coolie only steps in while the passenger who booked is watching and hasn't chosen to wait for a partner.
              const watching = s.session?.app === 'passenger' && s.session.accountId === b.passengerId;
              const from = Math.max(b.searchFrom ?? b.statusAt, s.session?.since ?? 0);
              if (watching && !b.holdForPartner && now - from >= AUTO_ACCEPT_MS) b = assign(b, now, null);
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
            if (b.source === 'request' && b.coolie?.accountId && ACTIVE.includes(b.status)) {
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
              if (b.status === 'completed' && b0.status !== 'completed') newTxns.push(...creditCoolie(b));
            }
            return b;
          });

          let requests = s.requests;
          let nextRequestAt = s.nextRequestAt;
          if (me?.profile.online) {
            const alive = requests.filter((r) => (r.expiresAt ?? 0) > now);
            if (alive.length !== requests.length) {
              requests = alive;
              changed = true;
            }
            const busy = bookings.some(isLiveFor(me.id));
            if (!busy && now >= nextRequestAt && requests.length < 2) {
              const g = genBooking({ stationCode: me.profile.stationCode, seed: Math.floor(Math.random() * 1e9), at: now });
              requests = [...requests, { ...g, expiresAt: now + REQUEST_TTL_MS }];
              nextRequestAt = now + REQUEST_GAP_MS + Math.floor(Math.random() * 8000);
              changed = true;
            }
          } else if (requests.length) {
            requests = [];
            changed = true;
          }

          if (changed) set({ bookings, requests, nextRequestAt, txns: newTxns.length ? [...newTxns, ...s.txns] : s.txns });
        },
      };
    },
    {
      name: 'coolie-app-v2',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): Persisted => ({
        lang: s.lang,
        onboarded: s.onboarded,
        passengers: s.passengers,
        coolies: s.coolies,
        session: s.session,
        bookings: s.bookings,
        txns: s.txns,
        intents: s.intents.slice(0, 30),
        draft: s.draft,
        demoSeeded: s.demoSeeded,
      }),
      onRehydrateStorage: () => () => {
        useApp.getState().ensureDemo();
        useApp.setState({ hydrated: true });
      },
    },
  ),
);

export function usePassenger() {
  return useApp(selectPassenger);
}

export function useCoolie() {
  return useApp(selectCoolie);
}
