import { StyleSheet, View } from 'react-native';

import { bagCount } from '@/data/bags';
import { REQUEST_TTL_MS } from '@/data/journey';
import { loc, useLang, useT } from '@/i18n';
import type { Booking } from '@/store/types';
import { C, R } from '@/theme';
import { fmtTime, km, rupee } from '@/utils/format';

import { JourneyArt } from './JourneyArt';
import { Button, Card, Icon, Row, Txt } from './ui';

interface Props {
  b: Booking;
  now: number;
  own?: boolean;
  onAccept: () => void;
  onDecline: () => void;
  disabled?: boolean;
}

export function RequestCard({ b, now, own, onAccept, onDecline, disabled }: Props) {
  const t = useT();
  const lang = useLang();
  const left = b.expiresAt ? Math.max(0, (b.expiresAt - now) / 1000) : null;
  const n = bagCount(b.bags);
  return (
    <Card style={[{ gap: 12 }, own && { borderColor: C.brass, borderWidth: 2 }]}>
      {own ? (
        <View style={s.own}>
          <Icon name="account-star" size={14} color={C.brass} />
          <Txt v="tiny" color={C.brass}>
            {t('duty.fromYou')}
          </Txt>
        </View>
      ) : null}
      <Row gap={12}>
        <JourneyArt type={b.journeyType} size="sm" />
        <View style={{ flex: 1 }}>
          <Txt v="bodyMed">{t(`journey.${b.journeyType}`)}</Txt>
          <Txt v="tiny" color={C.muted} numberOfLines={1}>
            {b.passengerName} · {b.train.number} · {fmtTime(b.train.time, lang)}
          </Txt>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Txt v="tiny" color={C.muted}>
            {t('duty.earn')}
          </Txt>
          <Txt v="h2" color={C.green}>
            {rupee(b.fare.total)}
          </Txt>
        </View>
      </Row>
      <View style={s.route}>
        <Row gap={8}>
          <Icon name="circle-slice-8" size={14} color={C.red} />
          <Txt v="small" numberOfLines={1} style={{ flex: 1 }}>
            {loc(lang, b.meet.title, b.meet.titleHi)}
          </Txt>
        </Row>
        <Row gap={8}>
          <Icon name="map-marker" size={14} color={C.ink} />
          <Txt v="small" numberOfLines={1} style={{ flex: 1 }}>
            {loc(lang, b.drop.title, b.drop.titleHi)}
          </Txt>
        </Row>
      </View>
      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        <Tag icon="bag-suitcase" text={`${t(n === 1 ? 'unit.bag' : 'unit.bags', { n })} · ${t('common.kg', { n: b.fare.weightKg })}`} />
        {b.fare.coolies > 1 ? <Tag icon="account-multiple" text={t('unit.coolies', { n: b.fare.coolies })} /> : null}
        {b.fare.distanceKm ? <Tag icon="map-marker-distance" text={km(b.fare.distanceKm, lang)} /> : null}
        <Tag icon={b.payMethod === 'cash' ? 'cash' : 'check-decagram'} text={b.payMethod === 'cash' ? t('duty.cash') : t('duty.prepaid')} />
        {b.addons.wheelchair ? <Tag icon="wheelchair-accessibility" text={t('addon.wheelchair')} /> : null}
        {b.addons.trolley ? <Tag icon="dolly" text={t('addon.trolley')} /> : null}
      </Row>
      {left !== null ? (
        <View style={s.bar}>
          <View style={[s.fill, { width: `${(left / (REQUEST_TTL_MS / 1000)) * 100}%` }]} />
        </View>
      ) : null}
      <Row gap={10}>
        <View style={{ flex: 1 }}>
          <Button title={t('duty.decline')} variant="secondary" size="md" onPress={onDecline} />
        </View>
        <View style={{ flex: 1.4 }}>
          <Button title={left !== null ? `${t('duty.accept')} · ${Math.ceil(left)}s` : t('duty.accept')} size="md" icon="check" onPress={onAccept} disabled={disabled} />
        </View>
      </Row>
    </Card>
  );
}

function Tag({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={s.tag}>
      <Icon name={icon} size={13} color={C.inkSoft} />
      <Txt v="tiny" color={C.inkSoft}>
        {text}
      </Txt>
    </View>
  );
}

const s = StyleSheet.create({
  own: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: C.brassSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: R.pill },
  route: { gap: 6, backgroundColor: C.bg, borderRadius: R.sm, padding: 10 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.pill },
  bar: { height: 4, backgroundColor: C.line, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: C.amber },
});
