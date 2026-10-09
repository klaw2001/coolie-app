export const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', short: 'G', color: '#1A73E8' },
  { id: 'phonepe', name: 'PhonePe', short: 'Pe', color: '#5F259F' },
  { id: 'paytm', name: 'Paytm', short: 'P', color: '#00A6E0' },
  { id: 'bhim', name: 'BHIM', short: 'B', color: '#E8711C' },
] as const;

export type UpiAppId = (typeof UPI_APPS)[number]['id'];

export function luhn(num: string): boolean {
  const d = num.replace(/\D/g, '');
  if (d.length < 12 || d.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i]);
    if (dbl) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

export function cardBrand(num: string): string {
  const d = num.replace(/\D/g, '');
  if (/^4/.test(d)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard';
  if (/^3[47]/.test(d)) return 'Amex';
  if (/^(60|65|81|82|508)/.test(d)) return 'RuPay';
  return 'Card';
}

export function formatCard(num: string): string {
  return num
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatExpiry(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function validExpiry(v: string, now = new Date()): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

export function validVpa(v: string): boolean {
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(v.trim());
}

/** The card number that simulates a bank decline in the demo. */
export const DECLINE_CARD = '4000000000000002';
