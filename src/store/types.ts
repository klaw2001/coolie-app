export type Lang = 'en' | 'hi';
export type Role = 'passenger' | 'coolie';
export type JourneyType = 'home_to_train' | 'gate_to_train' | 'train_to_exit';
export type BookingStatus =
  | 'payment_pending'
  | 'scheduled'
  | 'searching'
  | 'accepted'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
export type PayMethod = 'upi' | 'card' | 'wallet' | 'cash';
export type PayStatus = 'pending' | 'paid' | 'cash_due' | 'cash_paid' | 'refunded';
export type BagId = 'backpack' | 'cabin' | 'medium' | 'large' | 'carton' | 'trunk';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Place {
  kind: 'address' | 'point' | 'coach';
  id: string;
  title: string;
  titleHi?: string;
  subtitle?: string;
  subtitleHi?: string;
  coord: LatLng;
}

export interface TrainInfo {
  number: string;
  name: string;
  fromCode: string;
  toCode: string;
  /** Station where the coolie works: boarding station for departures, destination for arrivals. */
  stationCode: string;
  /** Departure from (or arrival at) that station, epoch ms. */
  time: number;
  platform: number;
  coach: string;
  seat: string;
  composition: string[];
  pnr?: string;
  passengers?: number;
}

export interface Fare {
  weightKg: number;
  coolies: number;
  perCoolieKg: number;
  perCoolie: number;
  luggage: number;
  distanceKm: number;
  distance: number;
  trolley: number;
  wheelchair: number;
  total: number;
}

export interface Addons {
  trolley: boolean;
  wheelchair: boolean;
}

export interface AssignedCoolie {
  id: string;
  name: string;
  nameHi?: string;
  badge: string;
  rating: number;
  trips: number;
  years: number;
  phone: string;
  color: string;
  /** Set when a Coolie Partner account on this phone took the job (otherwise a simulated coolie). */
  accountId?: string;
}

export interface ChatMsg {
  id: string;
  from: Role;
  text: string;
  at: number;
}

export interface Booking {
  id: string;
  createdAt: number;
  /** 'passenger' = booked from a passenger account on this phone. 'request' = a dummy request generated for coolie partners. */
  source: 'passenger' | 'request';
  passengerId?: string;
  /** The passenger chose to wait for a Coolie Partner account to accept (no automatic coolie). */
  holdForPartner?: boolean;
  journeyType: JourneyType;
  stationCode: string;
  train: TrainInfo;
  meet: Place;
  drop: Place;
  bags: Partial<Record<BagId, number>>;
  addons: Addons;
  fare: Fare;
  when: 'now' | 'later';
  scheduledAt?: number;
  payMethod: PayMethod;
  payStatus: PayStatus;
  payRef?: string;
  status: BookingStatus;
  statusAt: number;
  stage: number;
  stageAt: number;
  otp: string;
  mode?: 'auto' | 'manual';
  searchFrom?: number;
  coolie?: AssignedCoolie;
  coolieStart?: LatLng;
  arriveMs?: number;
  timeline: { s: string; at: number }[];
  messages: ChatMsg[];
  passengerName: string;
  passengerPhone: string;
  rating?: { stars: number; tags: string[]; comment?: string };
  tip?: { amount: number; method: PayMethod; status: 'paid' | 'cash' };
  cancel?: { reason: string; by: Role; at: number; refund: number };
  expiresAt?: number;
}

export interface PassengerProfile {
  name: string;
  email?: string;
  stationCode: string;
  emergencyName?: string;
  emergencyPhone?: string;
}

export type Shift = 'morning' | 'evening' | 'night' | 'full';

export interface CoolieProfile {
  name: string;
  badge: string;
  stationCode: string;
  years: number;
  online: boolean;
  rating: number;
  languages: string[];
  shift: Shift;
  /** Trips done before joining the app, so long-time porters don't start at zero. */
  baseTrips: number;
}

export interface PassengerAccount {
  id: string;
  phone: string;
  createdAt: number;
  profile: PassengerProfile;
  walletBalance: number;
  addresses: Address[];
  savedCards: SavedCard[];
  savedUpi: string[];
}

export interface Kyc {
  status: 'pending' | 'approved';
  submittedAt: number;
  approvedAt?: number;
  aadhaarLast4: string;
  bankLast4: string;
  ifsc: string;
  docs: string[];
}

export interface CoolieAccount {
  id: string;
  phone: string;
  createdAt: number;
  profile: CoolieProfile;
  kyc: Kyc;
}

export interface Session {
  app: Role;
  accountId: string;
  since: number;
}

export interface Address {
  id: string;
  label: 'home' | 'work' | 'other';
  line: string;
  area: string;
  areaHi?: string;
  coord: LatLng;
}

export type TxnKind = 'booking' | 'tip' | 'topup' | 'refund' | 'withdraw';

export interface Txn {
  id: string;
  at: number;
  amount: number;
  dir: 'debit' | 'credit';
  kind: TxnKind;
  method: PayMethod | 'bank';
  ref: string;
  bookingId?: string;
  /** Account this entry belongs to: a passenger's Coolie Wallet history or a coolie partner's earnings. */
  ownerId: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  purpose: 'booking' | 'tip' | 'topup';
  refId?: string;
  status: 'created' | 'success' | 'failed';
  method?: PayMethod;
  methodLabel?: string;
  outcome?: 'success' | 'failed';
  failReason?: string;
  ref?: string;
  createdAt: number;
}

export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  bank: string;
  expiry: string;
}

export interface Draft {
  journeyType: JourneyType;
  train?: TrainInfo;
  meet?: Place;
  drop?: Place;
  distanceKm: number;
  bags: Partial<Record<BagId, number>>;
  weightAdjust: number;
  coolies: number;
  addons: Addons;
  when: 'now' | 'later';
  scheduledAt?: number;
  payMethod: 'online' | 'cash';
}
