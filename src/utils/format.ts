import type { Lang } from '@/store/types';

/** ₹ with Indian digit grouping (1,23,456). */
export function rupee(n: number): string {
  const sign = n < 0 ? '-' : '';
  const s = String(Math.round(Math.abs(n)));
  if (s.length <= 3) return `${sign}₹${s}`;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${sign}₹${rest},${last3}`;
}

const DAYS = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  hi: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
};
const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  hi: ['जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुला', 'अग', 'सित', 'अक्टू', 'नव', 'दिस'],
};

export function fmtTime(ms: number, lang: Lang = 'en'): string {
  const d = new Date(ms);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const h12 = h % 12 === 0 ? 12 : h % 12;
  if (lang === 'hi') {
    const part = h < 12 ? 'सुबह' : h < 17 ? 'दोपहर' : h < 20 ? 'शाम' : 'रात';
    return `${part} ${h12}:${m}`;
  }
  return `${h12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

export function fmtDate(ms: number, lang: Lang = 'en'): string {
  const d = new Date(ms);
  return `${DAYS[lang][d.getDay()]}, ${d.getDate()} ${MONTHS[lang][d.getMonth()]}`;
}

export function fmtDateTime(ms: number, lang: Lang = 'en'): string {
  return `${fmtDate(ms, lang)} · ${fmtTime(ms, lang)}`;
}

export function dayLabel(ms: number, lang: Lang = 'en'): string {
  const d = new Date(ms);
  const today = startOfDay(Date.now());
  const diff = Math.round((startOfDay(ms) - today) / 86400000);
  if (diff === 0) return lang === 'hi' ? 'आज' : 'Today';
  if (diff === 1) return lang === 'hi' ? 'कल' : 'Tomorrow';
  if (diff === -1) return lang === 'hi' ? 'बीता कल' : 'Yesterday';
  return `${DAYS[lang][d.getDay()]} ${d.getDate()}`;
}

export function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** "HH:MM" on the given day → epoch ms. */
export function atTime(dayMs: number, hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(startOfDay(dayMs));
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export function hhmm(hm: string, lang: Lang = 'en'): string {
  return fmtTime(atTime(Date.now(), hm), lang);
}

export function mmss(totalSec: number): string {
  const s = Math.max(0, Math.ceil(totalSec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function maskPhone(phone: string): string {
  const p = phone.replace(/\D/g, '').slice(-10);
  return `+91 ${p.slice(0, 2)}XXX XX${p.slice(7)}`;
}

export function fmtPhone(phone: string): string {
  const p = phone.replace(/\D/g, '').slice(-10);
  return `+91 ${p.slice(0, 5)} ${p.slice(5)}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return ((parts[0][0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function km(n: number, lang: Lang = 'en'): string {
  return `${n < 10 ? n.toFixed(1) : Math.round(n)} ${lang === 'hi' ? 'किमी' : 'km'}`;
}
