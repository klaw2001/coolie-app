import type { LatLng, Place } from '@/store/types';
import { offsetMeters } from '@/utils/geo';

export interface Station {
  code: string;
  name: string;
  nameHi: string;
  city: string;
  cityHi: string;
  coord: LatLng;
  platforms: number;
}

export type PointKind = 'gate' | 'parking' | 'dropoff' | 'auto' | 'exit' | 'cab' | 'metro';

export interface StationPoint {
  id: string;
  kind: PointKind;
  name: string;
  nameHi: string;
  /** Offset from the station centre in metres. */
  north: number;
  east: number;
}

export const STATIONS: Station[] = [
  { code: 'CSMT', name: 'Mumbai CSMT', nameHi: 'मुंबई सीएसएमटी', city: 'Mumbai', cityHi: 'मुंबई', coord: { latitude: 18.9402, longitude: 72.8356 }, platforms: 18 },
  { code: 'NDLS', name: 'New Delhi', nameHi: 'नई दिल्ली', city: 'Delhi', cityHi: 'दिल्ली', coord: { latitude: 28.643, longitude: 77.2194 }, platforms: 16 },
  { code: 'HWH', name: 'Howrah Jn', nameHi: 'हावड़ा जंक्शन', city: 'Kolkata', cityHi: 'कोलकाता', coord: { latitude: 22.5839, longitude: 88.3426 }, platforms: 23 },
  { code: 'MAS', name: 'Chennai Central', nameHi: 'चेन्नई सेंट्रल', city: 'Chennai', cityHi: 'चेन्नई', coord: { latitude: 13.0827, longitude: 80.2752 }, platforms: 17 },
  { code: 'SBC', name: 'KSR Bengaluru', nameHi: 'केएसआर बेंगलुरु', city: 'Bengaluru', cityHi: 'बेंगलुरु', coord: { latitude: 12.9781, longitude: 77.5697 }, platforms: 10 },
  { code: 'PUNE', name: 'Pune Jn', nameHi: 'पुणे जंक्शन', city: 'Pune', cityHi: 'पुणे', coord: { latitude: 18.5289, longitude: 73.8744 }, platforms: 6 },
  { code: 'ADI', name: 'Ahmedabad Jn', nameHi: 'अहमदाबाद जंक्शन', city: 'Ahmedabad', cityHi: 'अहमदाबाद', coord: { latitude: 23.0266, longitude: 72.6011 }, platforms: 12 },
  { code: 'LKO', name: 'Lucknow Charbagh', nameHi: 'लखनऊ चारबाग', city: 'Lucknow', cityHi: 'लखनऊ', coord: { latitude: 26.8317, longitude: 80.9196 }, platforms: 9 },
  { code: 'JP', name: 'Jaipur Jn', nameHi: 'जयपुर जंक्शन', city: 'Jaipur', cityHi: 'जयपुर', coord: { latitude: 26.9196, longitude: 75.7878 }, platforms: 8 },
  { code: 'HYB', name: 'Hyderabad Deccan', nameHi: 'हैदराबाद डेक्कन', city: 'Hyderabad', cityHi: 'हैदराबाद', coord: { latitude: 17.392, longitude: 78.4676 }, platforms: 6 },
];

export const MEET_POINTS: StationPoint[] = [
  { id: 'gate_1', kind: 'gate', name: 'Main Entrance (Gate 1)', nameHi: 'मुख्य प्रवेश द्वार (गेट 1)', north: 140, east: -90 },
  { id: 'gate_2', kind: 'gate', name: 'Gate 2 (East side)', nameHi: 'गेट 2 (पूर्वी ओर)', north: -60, east: 170 },
  { id: 'dropoff', kind: 'dropoff', name: 'Car drop-off zone', nameHi: 'कार ड्रॉप-ऑफ़ ज़ोन', north: 190, east: 40 },
  { id: 'parking', kind: 'parking', name: 'Main parking', nameHi: 'मुख्य पार्किंग', north: 230, east: -190 },
  { id: 'auto', kind: 'auto', name: 'Auto / taxi stand', nameHi: 'ऑटो / टैक्सी स्टैंड', north: -150, east: -140 },
];

export const EXIT_POINTS: StationPoint[] = [
  { id: 'exit_main', kind: 'exit', name: 'Main exit', nameHi: 'मुख्य निकास', north: 140, east: -90 },
  { id: 'exit_cab', kind: 'cab', name: 'Prepaid taxi & cab pickup', nameHi: 'प्रीपेड टैक्सी और कैब पिकअप', north: 200, east: 60 },
  { id: 'exit_parking', kind: 'parking', name: 'Parking area', nameHi: 'पार्किंग क्षेत्र', north: 230, east: -190 },
  { id: 'exit_auto', kind: 'auto', name: 'Auto-rickshaw stand', nameHi: 'ऑटो-रिक्शा स्टैंड', north: -150, east: -140 },
  { id: 'exit_metro', kind: 'metro', name: 'Metro / local train link', nameHi: 'मेट्रो / लोकल ट्रेन लिंक', north: -90, east: 220 },
];

export function station(code: string): Station {
  return STATIONS.find((s) => s.code === code) ?? STATIONS[0];
}

export function pointPlace(st: Station, p: StationPoint): Place {
  return {
    kind: 'point',
    id: p.id,
    title: p.name,
    titleHi: p.nameHi,
    subtitle: st.name,
    subtitleHi: st.nameHi,
    coord: offsetMeters(st.coord, p.north, p.east),
  };
}

/** The passenger's coach is somewhere along the platform, close to the station centre. */
export function coachPlace(st: Station, coach: string, platform: number): Place {
  return {
    kind: 'coach',
    id: `coach_${coach}`,
    title: `Coach ${coach} · PF ${platform}`,
    titleHi: `कोच ${coach} · प्लेटफ़ॉर्म ${platform}`,
    subtitle: st.name,
    subtitleHi: st.nameHi,
    coord: offsetMeters(st.coord, -20 + platform * 6, 30),
  };
}

export const POINT_ICON: Record<PointKind, string> = {
  gate: 'door-open',
  parking: 'parking',
  dropoff: 'car-arrow-right',
  auto: 'rickshaw',
  exit: 'exit-run',
  cab: 'taxi',
  metro: 'subway-variant',
};
