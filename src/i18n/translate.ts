import type { Lang } from '@/store/types';

import { en, type TKey } from './en';
import { hi } from './hi';

export type { TKey };
export type TFn = (key: TKey, vars?: Record<string, string | number>) => string;

const DICTS: Record<Lang, Record<TKey, string>> = { en, hi };

export function translate(lang: Lang, key: TKey, vars?: Record<string, string | number>): string {
  let s = DICTS[lang][key] ?? en[key] ?? key;
  if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
}

/** Pick the Hindi variant of a data field when the app is in Hindi and one exists. */
export function loc(lang: Lang, enText: string, hiText?: string): string {
  return lang === 'hi' && hiText ? hiText : enText;
}
