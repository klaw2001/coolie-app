import { router } from 'expo-router';
import { View } from 'react-native';

import { BookShell } from '@/components/BookShell';
import { TripMap } from '@/components/map/TripMap';
import { Banner, Button, Card, Icon, ListRow, SectionTitle, Txt } from '@/components/ui';
import { AREAS } from '@/data/areas';
import { MAX_HOME_KM, PER_KM } from '@/data/fare';
import { coachPlace, EXIT_POINTS, MEET_POINTS, POINT_ICON, pointPlace, station, type StationPoint } from '@/data/stations';
import { loc, useLang, useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import type { Place } from '@/store/types';
import { C } from '@/theme';
import { km, rupee } from '@/utils/format';
import { roadKm } from '@/utils/geo';

export default function PointStep() {
  const t = useT();
  const lang = useLang();
  const draft = useApp((s) => s.draft);
  const addresses = useApp((s) => s.addresses);
  const patchDraft = useApp((s) => s.patchDraft);
  const train = draft.train;
  if (!train) return null;
  const st = station(train.stationCode);
  const coach = coachPlace(st, train.coach, train.platform);
  const jt = draft.journeyType;

  const chosen = jt === 'train_to_exit' ? draft.drop : draft.meet;
  const distance = jt === 'home_to_train' && draft.meet ? roadKm(draft.meet.coord, st.coord) : 0;
  const tooFar = distance > MAX_HOME_KM;

  const chooseHome = (p: Place) => patchDraft({ meet: p, drop: coach, distanceKm: roadKm(p.coord, st.coord) });
  const choosePoint = (p: StationPoint) =>
    jt === 'train_to_exit'
      ? patchDraft({ meet: coach, drop: pointPlace(st, p), distanceKm: 0 })
      : patchDraft({ meet: pointPlace(st, p), drop: coach, distanceKm: 0 });

  const title = jt === 'home_to_train' ? t('book.point.titleHome') : jt === 'gate_to_train' ? t('book.point.titleGate') : t('book.point.titleExit');
  const stName = loc(lang, st.name, st.nameHi);
  const sub =
    jt === 'home_to_train'
      ? t('book.point.subHome', { station: stName })
      : jt === 'gate_to_train'
        ? t('book.point.subGate', { station: stName })
        : t('book.point.subExit', { coach: train.coach, pf: train.platform });

  const points = jt === 'train_to_exit' ? EXIT_POINTS : MEET_POINTS;
  const valid = !!draft.meet && !!draft.drop && !tooFar;

  return (
    <BookShell step={2} title={title} footer={<Button title={t('common.continue')} disabled={!valid} onPress={() => router.push('/book/luggage')} iconRight="arrow-right" />}>
      <Txt v="small" color={C.inkSoft}>
        {sub}
      </Txt>

      {jt === 'home_to_train' ? (
        <>
          <Button title={t('book.point.pickMap')} icon="map-search" variant="secondary" size="md" onPress={() => router.push('/book/map-pick')} />
          {draft.meet?.kind === 'address' ? (
            <Card style={{ gap: 6, borderColor: C.red, borderWidth: 1.5 }}>
              <ListRow icon="home-variant" title={loc(lang, draft.meet.title, draft.meet.titleHi)} subtitle={t('book.point.away', { km: km(distance, lang) })} chevron={false} />
              {tooFar ? (
                <Txt v="smallMed" color={C.red}>
                  {t('book.point.tooFar', { km: MAX_HOME_KM })}
                </Txt>
              ) : (
                <Txt v="smallMed" color={C.green}>
                  {t('book.point.charge', { amount: rupee(Math.round(distance * PER_KM)) })}
                </Txt>
              )}
            </Card>
          ) : null}
          {addresses.length ? (
            <>
              <SectionTitle title={t('book.point.saved')} />
              <Card flat pad={6}>
                {addresses.map((a) => {
                  const d = roadKm(a.coord, st.coord);
                  const place: Place = { kind: 'address', id: a.id, title: a.line, subtitle: loc(lang, a.area, a.areaHi), coord: a.coord };
                  return (
                    <ListRow
                      key={a.id}
                      icon={a.label === 'home' ? 'home-variant' : a.label === 'work' ? 'briefcase' : 'map-marker'}
                      title={a.line}
                      subtitle={`${loc(lang, a.area, a.areaHi)} · ${t('book.point.away', { km: km(d, lang) })}`}
                      selected={draft.meet?.id === a.id}
                      chevron={false}
                      onPress={() => chooseHome(place)}
                    />
                  );
                })}
              </Card>
            </>
          ) : null}
          <SectionTitle title={t('book.point.nearby', { city: loc(lang, st.city, st.cityHi) })} />
          <Card flat pad={6}>
            {(AREAS[st.code] ?? []).map((a) => {
              const id = `area_${a.name}`;
              const d = roadKm(a.coord, st.coord);
              return (
                <ListRow
                  key={id}
                  icon="map-marker-radius"
                  iconColor={C.inkSoft}
                  iconBg={C.bg}
                  title={loc(lang, a.name, a.nameHi)}
                  subtitle={`${t('book.point.away', { km: km(d, lang) })} · +${rupee(Math.round(d * PER_KM))}`}
                  selected={draft.meet?.id === id}
                  chevron={false}
                  onPress={() => chooseHome({ kind: 'address', id, title: a.name, titleHi: a.nameHi, subtitle: st.city, subtitleHi: st.cityHi, coord: a.coord })}
                />
              );
            })}
          </Card>
        </>
      ) : (
        <>
          {jt === 'train_to_exit' ? (
            <Banner tone="blue">
              <Icon name="train-car" size={18} color={C.blue} />
              <Txt v="smallMed" color={C.blue} style={{ flex: 1 }}>
                {t('book.point.coachMeet', { coach: train.coach, pf: train.platform })}
              </Txt>
            </Banner>
          ) : null}
          <View style={{ height: 210, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.line }}>
            <TripMap
              interactive={false}
              fitKey={st.code}
              padding={{ top: 60, right: 40, bottom: 30, left: 40 }}
              markers={[
                { id: 'station', coord: st.coord, kind: 'station', label: st.code },
                ...points.map((p) => {
                  const place = pointPlace(st, p);
                  const on = chosen?.id === p.id;
                  return { id: p.id, coord: place.coord, kind: on ? ('point-selected' as const) : ('point' as const), icon: POINT_ICON[p.kind], label: on ? loc(lang, p.name, p.nameHi) : undefined, onPress: () => choosePoint(p) };
                }),
              ]}
            />
          </View>
          <Card flat pad={6}>
            {points.map((p) => (
              <ListRow
                key={p.id}
                icon={POINT_ICON[p.kind]}
                title={loc(lang, p.name, p.nameHi)}
                subtitle={stName}
                selected={chosen?.id === p.id}
                right={chosen?.id === p.id ? <Icon name="check-circle" size={22} color={C.red} /> : undefined}
                chevron={false}
                onPress={() => choosePoint(p)}
              />
            ))}
          </Card>
        </>
      )}
    </BookShell>
  );
}
