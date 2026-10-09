import type { TFn, TKey } from '@/i18n/translate';
import type { Txn } from '@/store/types';

export function txnTitle(x: Txn, t: TFn): string {
  const key: TKey = x.owner === 'coolie' && x.kind === 'booking' ? 'txn.earning' : (`txn.${x.kind}` as TKey);
  return t(key, { id: x.bookingId ?? '' });
}
