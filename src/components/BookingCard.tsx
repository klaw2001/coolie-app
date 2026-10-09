import { StyleSheet, View } from 'react-native';

import { station } from '@/data/stations';
import { loc, useLang, useT } from '@/i18n';
import type { Booking } from '@/store/types';
import { C } from '@/theme';
import { fmtDateTime, rupee } from '@/utils/format';

import { JourneyArt } from './JourneyArt';
import { Card, Icon, StatusPill, Txt } from './ui';

export function BookingCard({ b, onPress, coolieView }: { b: Booking; onPress: () => void; coolieView?: boolean }) {
  const t = useT();
  const lang = useLang();
  const st = station(b.stationCode);
  const when = b.when === 'later' && b.scheduledAt ? b.scheduledAt : b.createdAt;
  return (
    <Card onPress={onPress} style={{ gap: 12 }}>
      <View style={s.top}>
        <JourneyArt type={b.journeyType} size="sm" />
        <View style={{ flex: 1 }}>
          <Txt v="bodyMed">
            {t(`journey.${b.journeyType}`)}
          </Txt>
          <Txt v="tiny" color={C.muted}>
            {fmtDateTime(when, lang)}
          </Txt>
        </View>
        <StatusPill status={b.status} />
      </View>
      <View style={s.mid}>
        <Icon name="train" size={16} color={C.muted} />
        <Txt v="small" color={C.inkSoft} numberOfLines={1} style={{ flex: 1 }}>
          {b.train.number} · {b.train.name} · {loc(lang, st.name, st.nameHi)}
        </Txt>
      </View>
      <View style={s.bottom}>
        <Txt v="small" color={C.muted} numberOfLines={1} style={{ flex: 1 }}>
          {coolieView ? b.passengerName : b.coolie ? loc(lang, b.coolie.name, b.coolie.nameHi) : '—'} · {t('common.coach', { c: b.train.coach })}
        </Txt>
        <Txt v="num">{rupee(b.fare.total + (b.tip?.amount ?? 0))}</Txt>
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mid: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 },
});
