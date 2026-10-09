import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BookShell } from '@/components/BookShell';
import { StationPicker } from '@/components/StationPicker';
import { TrainTicket } from '@/components/TrainTicket';
import { Banner, Button, Card, Chip, Field, Icon, ListRow, Row, Segmented, Txt } from '@/components/ui';
import { direction } from '@/data/journey';
import { station } from '@/data/stations';
import {
  bookableCoaches,
  buildTrainInfo,
  coachClass,
  DEMO_PNRS,
  lookupPnr,
  pnrToTrainInfo,
  seatCount,
  stopAt,
  train as findTrain,
  trainsAt,
  type PnrResult,
} from '@/data/trains';
import { loc, useLang, useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import type { TrainInfo } from '@/store/types';
import { C, R } from '@/theme';
import { atTime, dayLabel, startOfDay } from '@/utils/format';

export default function TrainStep() {
  const t = useT();
  const lang = useLang();
  const draft = useApp((s) => s.draft);
  const home = useApp((s) => s.passenger?.stationCode ?? 'CSMT');
  const patchDraft = useApp((s) => s.patchDraft);
  const [now] = useState(() => Date.now());
  const dir = direction(draft.journeyType);
  const arrival = dir === 'arrival';

  const prev = draft.train;
  const [mode, setMode] = useState<'pnr' | 'manual'>(prev && !prev.pnr ? 'manual' : 'pnr');

  // PNR
  const [pnr, setPnr] = useState(prev?.pnr ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PnrResult | null>(() => (prev?.pnr ? lookupPnr(prev.pnr, dir) : null));

  // Manual
  const [stationCode, setStationCode] = useState(prev?.stationCode ?? home);
  const [day, setDay] = useState(() => (prev && !prev.pnr ? Math.max(0, Math.round((startOfDay(prev.time) - startOfDay(Date.now())) / 86400000)) : 0));
  const [trainNo, setTrainNo] = useState(prev && !prev.pnr ? prev.number : '');
  const [coach, setCoach] = useState(prev && !prev.pnr ? prev.coach : '');
  const [seat, setSeat] = useState(prev && !prev.pnr ? prev.seat : '');
  const [picker, setPicker] = useState(false);

  const fetchPnr = (value = pnr) => {
    setError('');
    setResult(null);
    if (!/^\d{10}$/.test(value)) {
      setError(t('book.train.notFound'));
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const r = lookupPnr(value, dir);
      if (r) setResult(r);
      else setError(t('book.train.notFound'));
    }, 1100);
  };

  const dayMs = startOfDay(now) + day * 86400000;
  const list = trainsAt(stationCode, dir);
  const selected = trainNo ? findTrain(trainNo) : undefined;
  const seatNum = Number(seat);
  const seatOk = !!coach && Number.isInteger(seatNum) && seatNum >= 1 && seatNum <= seatCount(coach);

  let info: TrainInfo | undefined;
  if (mode === 'pnr' && result) info = pnrToTrainInfo(result, dir);
  if (mode === 'manual' && selected && seatOk) info = buildTrainInfo(selected, stationCode, dir, dayMs, coach, String(seatNum));

  const next = () => {
    if (!info) return;
    const sameStation = prev?.stationCode === info.stationCode;
    patchDraft({
      train: info,
      ...(sameStation ? {} : { meet: undefined, drop: undefined, distanceKm: 0 }),
    });
    router.push('/book/point');
  };

  const st = station(stationCode);

  return (
    <BookShell step={1} title={t('book.train.title')} footer={<Button title={t('common.continue')} disabled={!info} onPress={next} iconRight="arrow-right" />}>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'pnr', label: t('book.train.pnr'), icon: 'ticket-confirmation' },
          { value: 'manual', label: t('book.train.manual'), icon: 'format-list-bulleted' },
        ]}
      />

      {mode === 'pnr' ? (
        <>
          <Field
            label={t('book.train.pnrLabel')}
            placeholder="2451873690"
            keyboardType="number-pad"
            maxLength={10}
            value={pnr}
            onChangeText={(v) => {
              setPnr(v.replace(/\D/g, ''));
              setError('');
            }}
            onSubmitEditing={() => fetchPnr()}
            icon="ticket-confirmation-outline"
            error={error}
            help={t('book.train.anyPnr')}
          />
          <Button title={loading ? t('book.train.fetching') : t('book.train.fetch')} loading={loading} disabled={pnr.length !== 10} variant="secondary" size="md" onPress={() => fetchPnr()} />
          {!result && !loading ? (
            <View style={{ gap: 8 }}>
              <Txt v="smallMed" color={C.inkSoft}>
                {t('book.train.demoPnrs')}
              </Txt>
              <View style={s.wrap}>
                {DEMO_PNRS.map((p) => {
                  const r = lookupPnr(p, dir)!;
                  return (
                    <Chip
                      key={p}
                      label={p}
                      sub={`${r.train.name.split(' ')[0]} · ${arrival ? r.toCode : r.fromCode}`}
                      onPress={() => {
                        setPnr(p);
                        fetchPnr(p);
                      }}
                    />
                  );
                })}
              </View>
            </View>
          ) : null}
          {result && info ? (
            <>
              <TrainTicket info={info} arrival={arrival} />
              <Banner tone="green">
                <Icon name="map-marker-check" size={18} color={C.green} />
                <Txt v="smallMed" color={C.green} style={{ flex: 1 }}>
                  {t('book.train.serviceAt', { station: loc(lang, station(info.stationCode).name, station(info.stationCode).nameHi) })}
                </Txt>
              </Banner>
            </>
          ) : null}
        </>
      ) : (
        <>
          <Card flat pad={6}>
            <ListRow icon="train" title={`${loc(lang, st.name, st.nameHi)} (${st.code})`} subtitle={t('book.train.station')} onPress={() => setPicker(true)} />
          </Card>

          <Txt v="smallMed" color={C.inkSoft}>
            {arrival ? t('book.train.dateArrival') : t('book.train.date')}
          </Txt>
          <View style={s.wrap}>
            {[0, 1, 2, 3].map((d) => (
              <Chip key={d} label={dayLabel(startOfDay(now) + d * 86400000, lang)} selected={d === day} onPress={() => setDay(d)} />
            ))}
          </View>

          <Txt v="smallMed" color={C.inkSoft}>
            {t('book.train.pickTrain')}
          </Txt>
          {list.length === 0 ? (
            <Txt v="small" color={C.muted}>
              {t('book.train.noTrains')}
            </Txt>
          ) : (
            <View style={{ gap: 8 }}>
              {list.map((tr) => {
                const stop = stopAt(tr, stationCode)!;
                const hm = arrival ? stop.arr! : stop.dep!;
                const gone = atTime(dayMs, hm) < now + 30 * 60000;
                const on = tr.number === trainNo;
                const ends = arrival ? tr.stops[0].code : tr.stops[tr.stops.length - 1].code;
                return (
                  <Pressable
                    key={tr.number}
                    disabled={gone}
                    onPress={() => {
                      setTrainNo(tr.number);
                      setCoach('');
                      setSeat('');
                    }}
                    style={[s.train, on && s.trainOn, gone && { opacity: 0.45 }]}>
                    <View style={[s.time, on && { backgroundColor: C.red }]}>
                      <Txt v="h3" color={on ? C.white : C.ink}>
                        {hm}
                      </Txt>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt v="bodyMed" numberOfLines={1}>
                        {tr.number} · {tr.name}
                      </Txt>
                      <Txt v="tiny" color={C.muted}>
                        {arrival ? `${ends} → ${stationCode}` : `${stationCode} → ${ends}`} · {t('common.pf', { n: stop.pf })}
                        {gone ? ` · ${arrival ? t('book.train.arrived') : t('book.train.departed')}` : ''}
                      </Txt>
                    </View>
                    {on ? <Icon name="check-circle" size={22} color={C.red} /> : null}
                  </Pressable>
                );
              })}
            </View>
          )}

          {selected ? (
            <Card style={{ gap: 12 }}>
              <Txt v="smallMed" color={C.inkSoft}>
                {t('book.train.coach')}
              </Txt>
              <View style={s.wrap}>
                {bookableCoaches(selected).map((c) => (
                  <Chip key={c} label={c} sub={coachClass(c)} selected={c === coach} onPress={() => setCoach(c)} />
                ))}
              </View>
              {coach ? (
                <Field
                  label={t('book.train.seat')}
                  placeholder={t('book.train.seatPh')}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={seat}
                  onChangeText={(v) => setSeat(v.replace(/\D/g, ''))}
                  help={`1–${seatCount(coach)}`}
                  error={seat && !seatOk ? `1–${seatCount(coach)}` : undefined}
                />
              ) : null}
            </Card>
          ) : null}

          {info ? (
            <>
              <Row gap={6}>
                <Icon name="check-decagram" size={18} color={C.green} />
                <Txt v="smallMed" color={C.green}>
                  {t('book.train.selected')}
                </Txt>
              </Row>
              <TrainTicket info={info} arrival={arrival} />
            </>
          ) : null}
          <StationPicker
            visible={picker}
            value={stationCode}
            onClose={() => setPicker(false)}
            onPick={(code) => {
              setStationCode(code);
              setTrainNo('');
              setCoach('');
              setSeat('');
            }}
          />
        </>
      )}
    </BookShell>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  train: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: R.md, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.line },
  trainOn: { borderColor: C.red, backgroundColor: C.redTint },
  time: { width: 64, height: 48, borderRadius: R.sm, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
});
