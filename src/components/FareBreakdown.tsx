import { View } from 'react-native';

import { PER_KM } from '@/data/fare';
import { useLang, useT } from '@/i18n';
import type { Fare } from '@/store/types';
import { C } from '@/theme';
import { km, rupee } from '@/utils/format';

import { Divider, KV, Txt } from './ui';

export function FareBreakdown({ fare, tip, totalLabel }: { fare: Fare; tip?: number; totalLabel?: string }) {
  const t = useT();
  const lang = useLang();
  const slabKg = fare.perCoolieKg <= 20 ? 20 : fare.perCoolieKg <= 40 ? 40 : fare.perCoolieKg <= 60 ? 60 : Math.ceil(fare.perCoolieKg / 20) * 20;
  return (
    <View style={{ gap: 4 }}>
      <KV k={t('fare.luggage', { n: fare.coolies, kg: slabKg })} v={rupee(fare.luggage)} />
      <Txt v="tiny" color={C.muted} style={{ marginTop: -4, marginBottom: 2 }}>
        {t('common.kg', { n: fare.weightKg })} · {rupee(fare.perCoolie)} × {fare.coolies}
      </Txt>
      {fare.distance > 0 ? <KV k={t('fare.distance', { km: km(fare.distanceKm, lang), rate: PER_KM })} v={rupee(fare.distance)} /> : null}
      {fare.trolley > 0 ? <KV k={t('fare.trolley')} v={rupee(fare.trolley)} /> : null}
      {fare.wheelchair > 0 ? <KV k={t('fare.wheelchair')} v={rupee(fare.wheelchair)} /> : null}
      {tip ? <KV k={t('fare.tip')} v={rupee(tip)} /> : null}
      <Divider style={{ marginVertical: 6 }} />
      <KV k={totalLabel ?? t('fare.total')} v={rupee(fare.total + (tip ?? 0))} strong />
    </View>
  );
}
