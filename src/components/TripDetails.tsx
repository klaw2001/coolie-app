import { StyleSheet, View } from 'react-native';

import { BAGS, bagCount } from '@/data/bags';
import { loc, useLang, useT } from '@/i18n';
import type { Booking } from '@/store/types';
import { C, R } from '@/theme';
import { fmtDateTime, rupee } from '@/utils/format';

import { Card, Icon, Txt } from './ui';

export function TripDetails({ b, showPay = true }: { b: Booking; showPay?: boolean }) {
  const t = useT();
  const lang = useLang();
  const n = bagCount(b.bags);
  const bags = BAGS.filter((x) => (b.bags[x.id] ?? 0) > 0)
    .map((x) => `${b.bags[x.id]} × ${loc(lang, x.name, x.nameHi)}`)
    .join(', ');
  const extras = [b.addons.trolley ? t('addon.trolley') : '', b.addons.wheelchair ? t('addon.wheelchair') : ''].filter(Boolean).join(' · ');
  const pay =
    b.payStatus === 'paid' || b.payStatus === 'refunded'
      ? t('trip.prepaid', { amount: rupee(b.fare.total) })
      : b.payStatus === 'cash_paid'
        ? `${t('method.cash')} · ${t('tl.cash')}`
        : t('trip.cashDue', { amount: rupee(b.fare.total) });
  return (
    <Card style={{ gap: 14 }}>
      <Txt v="h3">{t('trip.details')}</Txt>
      <Item icon="train" title={`${b.train.number} · ${b.train.name}`} sub={`${t('common.coach', { c: b.train.coach })} · ${t('common.seat', { s: b.train.seat })} · ${t('common.pf', { n: b.train.platform })} · ${fmtDateTime(b.train.time, lang)}`} />
      <View style={s.route}>
        <Item icon="circle-slice-8" title={loc(lang, b.meet.title, b.meet.titleHi)} sub={b.meet.subtitle ? loc(lang, b.meet.subtitle, b.meet.subtitleHi) : undefined} />
        <View style={s.dots} />
        <Item icon="map-marker" title={loc(lang, b.drop.title, b.drop.titleHi)} sub={b.drop.subtitle ? loc(lang, b.drop.subtitle, b.drop.subtitleHi) : undefined} />
      </View>
      <Item
        icon="bag-suitcase"
        title={`${t(n === 1 ? 'unit.bag' : 'unit.bags', { n })} · ${t('common.kg', { n: b.fare.weightKg })} · ${t(b.fare.coolies === 1 ? 'unit.coolie' : 'unit.coolies', { n: b.fare.coolies })}`}
        sub={[bags, extras].filter(Boolean).join(' · ')}
      />
      {showPay ? <Item icon={b.payMethod === 'cash' ? 'cash' : 'credit-card-check'} title={pay} sub={b.payRef ? `${t('pay.ref')}: ${b.payRef}` : undefined} /> : null}
    </Card>
  );
}

function Item({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <View style={s.item}>
      <View style={s.icon}>
        <Icon name={icon} size={17} color={C.red} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt v="smallMed">{title}</Txt>
        {sub ? (
          <Txt v="tiny" color={C.muted}>
            {sub}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  item: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icon: { width: 32, height: 32, borderRadius: R.sm, backgroundColor: C.redSoft, alignItems: 'center', justifyContent: 'center' },
  route: { gap: 0 },
  dots: { width: 2, height: 14, backgroundColor: C.lineStrong, marginLeft: 15, marginVertical: 2 },
});
