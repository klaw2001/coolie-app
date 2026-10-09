import type { LatLng } from '@/store/types';

export interface Area {
  name: string;
  nameHi: string;
  coord: LatLng;
}

/** Dummy residential areas around each station, used for Home → Train pickups. */
export const AREAS: Record<string, Area[]> = {
  CSMT: [
    { name: 'Colaba', nameHi: 'कोलाबा', coord: { latitude: 18.9067, longitude: 72.8147 } },
    { name: 'Bandra West', nameHi: 'बांद्रा वेस्ट', coord: { latitude: 19.0596, longitude: 72.8295 } },
    { name: 'Powai', nameHi: 'पवई', coord: { latitude: 19.1176, longitude: 72.906 } },
  ],
  NDLS: [
    { name: 'Connaught Place', nameHi: 'कनॉट प्लेस', coord: { latitude: 28.6315, longitude: 77.2167 } },
    { name: 'Lajpat Nagar', nameHi: 'लाजपत नगर', coord: { latitude: 28.5677, longitude: 77.2433 } },
    { name: 'Dwarka Sector 10', nameHi: 'द्वारका सेक्टर 10', coord: { latitude: 28.5823, longitude: 77.05 } },
  ],
  HWH: [
    { name: 'Salt Lake', nameHi: 'साल्ट लेक', coord: { latitude: 22.5867, longitude: 88.4171 } },
    { name: 'Park Street', nameHi: 'पार्क स्ट्रीट', coord: { latitude: 22.5535, longitude: 88.351 } },
    { name: 'Ballygunge', nameHi: 'बालीगंज', coord: { latitude: 22.528, longitude: 88.3657 } },
  ],
  MAS: [
    { name: 'T. Nagar', nameHi: 'टी. नगर', coord: { latitude: 13.0418, longitude: 80.2341 } },
    { name: 'Adyar', nameHi: 'अडयार', coord: { latitude: 13.0012, longitude: 80.2565 } },
    { name: 'Anna Nagar', nameHi: 'अन्ना नगर', coord: { latitude: 13.085, longitude: 80.2101 } },
  ],
  SBC: [
    { name: 'Indiranagar', nameHi: 'इंदिरानगर', coord: { latitude: 12.9719, longitude: 77.6412 } },
    { name: 'Koramangala', nameHi: 'कोरमंगला', coord: { latitude: 12.9352, longitude: 77.6245 } },
    { name: 'Malleshwaram', nameHi: 'मल्लेश्वरम', coord: { latitude: 13.0035, longitude: 77.5709 } },
  ],
  PUNE: [
    { name: 'Koregaon Park', nameHi: 'कोरेगांव पार्क', coord: { latitude: 18.5362, longitude: 73.894 } },
    { name: 'Kothrud', nameHi: 'कोथरूड', coord: { latitude: 18.5074, longitude: 73.8077 } },
    { name: 'Viman Nagar', nameHi: 'विमान नगर', coord: { latitude: 18.5679, longitude: 73.9143 } },
  ],
  ADI: [
    { name: 'Navrangpura', nameHi: 'नवरंगपुरा', coord: { latitude: 23.0365, longitude: 72.5611 } },
    { name: 'Satellite', nameHi: 'सैटेलाइट', coord: { latitude: 23.03, longitude: 72.517 } },
    { name: 'Maninagar', nameHi: 'मणिनगर', coord: { latitude: 22.9962, longitude: 72.6031 } },
  ],
  LKO: [
    { name: 'Hazratganj', nameHi: 'हज़रतगंज', coord: { latitude: 26.8506, longitude: 80.9462 } },
    { name: 'Gomti Nagar', nameHi: 'गोमती नगर', coord: { latitude: 26.85, longitude: 81.0 } },
    { name: 'Aliganj', nameHi: 'अलीगंज', coord: { latitude: 26.892, longitude: 80.942 } },
  ],
  JP: [
    { name: 'C-Scheme', nameHi: 'सी-स्कीम', coord: { latitude: 26.905, longitude: 75.8 } },
    { name: 'Malviya Nagar', nameHi: 'मालवीय नगर', coord: { latitude: 26.853, longitude: 75.805 } },
    { name: 'Vaishali Nagar', nameHi: 'वैशाली नगर', coord: { latitude: 26.911, longitude: 75.743 } },
  ],
  HYB: [
    { name: 'Banjara Hills', nameHi: 'बंजारा हिल्स', coord: { latitude: 17.4156, longitude: 78.4347 } },
    { name: 'Begumpet', nameHi: 'बेगमपेट', coord: { latitude: 17.4447, longitude: 78.4664 } },
    { name: 'Ameerpet', nameHi: 'अमीरपेट', coord: { latitude: 17.4375, longitude: 78.4482 } },
  ],
};

/** Name of the closest dummy area, used as a fake "reverse geocode" for map picks. */
export function nearestArea(stationCode: string, p: LatLng): Area {
  const list = AREAS[stationCode] ?? AREAS.CSMT;
  let best = list[0];
  let bestD = Infinity;
  for (const a of list) {
    const d = (a.coord.latitude - p.latitude) ** 2 + (a.coord.longitude - p.longitude) ** 2;
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}
