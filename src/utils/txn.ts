import type { TFn, TKey } from '@/i18n/translate';
import type { Txn } from '@/store/types';

export function txnTitle(x: Txn, t: TFn): string {
  // A credited booking is a coolie's trip earning; a debited one is a passenger's payment.
  const key: TKey = x.kind === 'booking' && x.dir === 'credit' ? 'txn.earning' : (`txn.${x.kind}` as TKey);
  return t(key, { id: x.bookingId ?? '' });
}
