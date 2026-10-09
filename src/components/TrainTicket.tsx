import { StyleSheet, View } from 'react-native';

import { station } from '@/data/stations';
import { coachClass } from '@/data/trains';
import { loc, useLang, useT } from '@/i18n';
import type { TrainInfo } from '@/store/types';
import { C, R } from '@/theme';
import { fmtDate, fmtTime } from '@/utils/format';

import { Icon, Txt } from './ui';

/** Ticket-style summary of the passenger's train. */
export function TrainTicket({ info, arrival }: { info: TrainInfo; arrival: boolean }) {
  const t = useT();
  const lang = useLang();
  const from = station(info.fromCode);
  const to = station(info.toCode);
  return (
    <View style={s.ticket}>
      <View style={s.head}>
        <Icon name="train" size={18} color={C.white} />
        <Txt v="bodyMed" color={C.white} numberOfLines={1} style={{ flex: 1 }}>
          {info.number} · {info.name}
        </Txt>
        {info.pnr ? (
          <View style={s.cnf}>
            <Txt v="tiny" color={C.green}>
              {t('book.train.confirmed')}
            </Txt>
          </View>
        ) : null}
      </View>
      <View style={s.route}>
        <View style={{ flex: 1 }}>
          <Txt v="h2">{from.code}</Txt>
          <Txt v="tiny" color={C.muted} numberOfLines={1}>
            {loc(lang, from.name, from.nameHi)}
          </Txt>
        </View>
        <Icon name="arrow-right" size={20} color={C.red} />
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Txt v="h2">{to.code}</Txt>
          <Txt v="tiny" color={C.muted} numberOfLines={1}>
            {loc(lang, to.name, to.nameHi)}
          </Txt>
        </View>
      </View>
      <View style={s.cut}>
        <View style={[s.notch, { left: -10 }]} />
        <View style={s.dash} />
        <View style={[s.notch, { right: -10 }]} />
      </View>
      <View style={s.grid}>
        <Cell label={arrival ? t('book.train.arrives') : t('book.train.departs')} value={`${fmtTime(info.time, lang)}`} sub={fmtDate(info.time, lang)} />
        <Cell label={t('book.train.coach')} value={`${info.coach} · ${coachClass(info.coach)}`} sub={t('common.seat', { s: info.seat })} />
        <Cell label="PF" value={String(info.platform)} sub={info.passengers ? t(info.passengers === 1 ? 'unit.passenger' : 'unit.passengers', { n: info.passengers }) : undefined} />
      </View>
      {info.pnr ? (
        <Txt v="tiny" color={C.muted} style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
          PNR {info.pnr}
        </Txt>
      ) : null}
    </View>
  );
}

function Cell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={{ flex: 1, gap: 1 }}>
      <Txt v="tiny" color={C.muted}>
        {label}
      </Txt>
      <Txt v="bodyMed">{value}</Txt>
      {sub ? (
        <Txt v="tiny" color={C.inkSoft}>
          {sub}
        </Txt>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  ticket: { backgroundColor: C.white, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, overflow: 'hidden', boxShadow: '0px 6px 18px rgba(122,14,18,0.08)' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.red, paddingHorizontal: 14, paddingVertical: 10 },
  cnf: { backgroundColor: C.white, paddingHorizontal: 8, paddingVertical: 1, borderRadius: R.pill },
  route: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  cut: { height: 20, justifyContent: 'center' },
  dash: { marginHorizontal: 14, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: C.lineStrong },
  notch: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: C.bg },
  grid: { flexDirection: 'row', gap: 10, padding: 14, paddingTop: 6 },
});
