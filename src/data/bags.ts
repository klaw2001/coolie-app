import type { BagId } from '@/store/types';

export interface BagType {
  id: BagId;
  kg: number;
  icon: string;
  name: string;
  nameHi: string;
}

export const BAGS: BagType[] = [
  { id: 'backpack', kg: 6, icon: 'bag-personal', name: 'Backpack / handbag', nameHi: 'बैकपैक / हैंडबैग' },
  { id: 'cabin', kg: 10, icon: 'bag-suitcase-outline', name: 'Cabin suitcase', nameHi: 'केबिन सूटकेस' },
  { id: 'medium', kg: 16, icon: 'bag-suitcase', name: 'Medium suitcase', nameHi: 'मध्यम सूटकेस' },
  { id: 'large', kg: 24, icon: 'bag-checked', name: 'Large suitcase', nameHi: 'बड़ा सूटकेस' },
  { id: 'carton', kg: 15, icon: 'package-variant-closed', name: 'Carton / box', nameHi: 'कार्टन / डिब्बा' },
  { id: 'trunk', kg: 30, icon: 'treasure-chest', name: 'Trunk / bedding roll', nameHi: 'ट्रंक / बिस्तरबंद' },
];

export function bagCount(bags: Partial<Record<BagId, number>>): number {
  return Object.values(bags).reduce<number>((s, n) => s + (n ?? 0), 0);
}

export function bagWeight(bags: Partial<Record<BagId, number>>): number {
  return BAGS.reduce((s, b) => s + (bags[b.id] ?? 0) * b.kg, 0);
}
