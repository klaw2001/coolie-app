import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { JourneyArt } from '@/components/JourneyArt';
import { LangToggle } from '@/components/LangToggle';
import { Logo } from '@/components/Logo';
import { StationPicker } from '@/components/StationPicker';
import { Avatar, Card, Icon, Row, SectionTitle, StatusPill, Txt } from '@/components/ui';
import { SLABS, EXTRA_PER_20KG } from '@/data/fare';
import { ACTIVE, JOURNEYS } from '@/data/journey';
import { station } from '@/data/stations';
import { loc, useLang, useT } from '@/i18n';
import { passengerBookings, useApp } from '@/store/useApp';
import type { JourneyType } from '@/store/types';
import { C, R, shadow } from '@/theme';
import { fmtDateTime } from '@/utils/format';

export default function Home() {
  const t = useT();
  const lang = useLang();
  const insets = useSafeAreaInsets();
  const passenger = useApp((s) => s.passenger);
  const bookings = useApp((s) => s.bookings);
  const startDraft = useApp((s) => s.startDraft);
  const savePassenger = useApp((s) => s.savePassenger);
  const [picker, setPicker] = useState(false);

  if (!passenger) return null;
  const st = station(passenger.stationCode);
  const mine = passengerBookings(bookings);
  const active = mine.find((b) => ACTIVE.includes(b.status));
  const upcoming = mine.filter((b) => b.status === 'scheduled').sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0))[0];

  const book = (j: JourneyType) => {
    startDraft(j);
    router.push('/book/train');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        <LinearGradient colors={[C.red, C.redDark]} style={[s.hero, { paddingTop: insets.top + 10 }]}>
          <View style={s.heroTop}>
            <Row gap={8}>
              <Logo size={34} bg={C.white} fg={C.red} />
              <Txt v="h2" color={C.white}>
                {t('app.name')}
              </Txt>
            </Row>
            <Row gap={10}>
              <LangToggle light />
              <Pressable onPress={() => router.push('/profile')} accessibilityLabel={t('tab.profile')}>
                <Avatar name={passenger.name} size={36} color={C.redDeep} />
              </Pressable>
            </Row>
          </View>
          <Txt v="h1" color={C.white} style={{ marginTop: 18 }}>
            {t('home.greeting', { name: passenger.name.split(' ')[0] })}
          </Txt>
          <Txt v="body" color="rgba(255,255,255,0.85)">
            {t('home.subtitle')}
          </Txt>
          <Pressable onPress={() => setPicker(true)} style={s.stationPill}>
            <Icon name="map-marker" size={18} color={C.white} />
            <Txt v="smallMed" color={C.white} numberOfLines={1} style={{ flexShrink: 1 }}>
              {loc(lang, st.name, st.nameHi)} · {loc(lang, st.city, st.cityHi)}
            </Txt>
            <Icon name="chevron-down" size={18} color={C.white} />
          </Pressable>
        </LinearGradient>

        <View style={s.body}>
          <Card style={s.journeys} pad={14}>
            <Txt v="h3" style={{ paddingHorizontal: 4 }}>
              {t('home.chooseJourney')}
            </Txt>
            {JOURNEYS.map((j) => (
              <Pressable key={j} onPress={() => book(j)} style={({ pressed }) => [s.tile, pressed && { backgroundColor: C.redTint }]} accessibilityRole="button">
                <JourneyArt type={j} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Row gap={6} style={{ flexWrap: 'wrap' }}>
                    <Txt v="bodyMed">{t(`journey.${j}`)}</Txt>
                    {j === 'gate_to_train' ? (
                      <View style={s.tag}>
                        <Txt v="tiny" color={C.brass} size={10}>
                          {t('journey.popular')}
                        </Txt>
                      </View>
                    ) : null}
                  </Row>
                  <Txt v="tiny" color={C.muted}>
                    {t(`journey.${j}.body`)}
                  </Txt>
                </View>
                <Icon name="chevron-right" size={22} color={C.red} />
              </Pressable>
            ))}
          </Card>

          {active ? (
            <Pressable onPress={() => router.push(`/trip/${active.id}`)} style={s.active}>
              <View style={s.liveDot} />
              <View style={{ flex: 1 }}>
                <Txt v="bodyMed" color={C.white}>
                  {t('home.activeTrip')}
                </Txt>
                <Txt v="tiny" color="rgba(255,255,255,0.85)" numberOfLines={1}>
                  {t(`status.${active.status}`)} · {active.train.number} · {t('common.coach', { c: active.train.coach })}
                </Txt>
              </View>
              <View style={s.trackBtn}>
                <Txt v="smallMed" color={C.red}>
                  {t('home.track')}
                </Txt>
              </View>
            </Pressable>
          ) : null}

          {upcoming ? (
            <>
              <SectionTitle title={t('home.upcoming')} />
              <Card onPress={() => router.push(`/trip/${upcoming.id}`)} style={{ gap: 8 }}>
                <Row between>
                  <Txt v="bodyMed">{t(`journey.${upcoming.journeyType}`)}</Txt>
                  <StatusPill status={upcoming.status} />
                </Row>
                <Row gap={6}>
                  <Icon name="calendar-clock" size={16} color={C.blue} />
                  <Txt v="small" color={C.inkSoft}>
                    {fmtDateTime(upcoming.scheduledAt ?? upcoming.createdAt, lang)}
                  </Txt>
                </Row>
                <Txt v="small" color={C.muted} numberOfLines={1}>
                  {upcoming.train.number} {upcoming.train.name} · {t('common.coach', { c: upcoming.train.coach })}
                </Txt>
              </Card>
            </>
          ) : null}

          <SectionTitle title={t('home.rateCard')} />
          <Card style={{ gap: 12 }} onPress={() => router.push('/rate-card')}>
            <Txt v="small" color={C.inkSoft}>
              {t('home.rateCardBody')}
            </Txt>
            <View style={s.slabs}>
              {SLABS.map((sl, i) => (
                <View key={sl.upTo} style={s.slab}>
                  <Txt v="tiny" color={C.muted}>
                    {i === 0 ? t('rate.upTo', { kg: sl.upTo }) : t('rate.range', { from: SLABS[i - 1].upTo + 1, to: sl.upTo })}
                  </Txt>
                  <Txt v="h3" color={C.red}>
                    ₹{sl.price}
                  </Txt>
                </View>
              ))}
              <View style={s.slab}>
                <Txt v="tiny" color={C.muted}>
                  {t('common.kg', { n: '+20' })}
                </Txt>
                <Txt v="h3" color={C.red}>
                  +₹{EXTRA_PER_20KG}
                </Txt>
              </View>
            </View>
            <Row gap={4}>
              <Txt v="smallMed" color={C.red}>
                {t('home.viewRateCard')}
              </Txt>
              <Icon name="arrow-right" size={16} color={C.red} />
            </Row>
          </Card>

          <SectionTitle title={t('home.how')} />
          <Card style={{ gap: 14 }}>
            {(['home.how1', 'home.how2', 'home.how3'] as const).map((k, i) => (
              <Row key={k} gap={12}>
                <View style={s.num}>
                  <Txt v="smallMed" color={C.white}>
                    {i + 1}
                  </Txt>
                </View>
                <Txt v="small" style={{ flex: 1 }}>
                  {t(k)}
                </Txt>
              </Row>
            ))}
          </Card>

          <View style={s.trust}>
            {(
              [
                ['card-account-details-star', 'home.trust1'],
                ['tag-check', 'home.trust2'],
                ['map-marker-radius', 'home.trust3'],
              ] as const
            ).map(([icon, k]) => (
              <View key={k} style={s.trustItem}>
                <Icon name={icon} size={24} color={C.red} />
                <Txt v="tiny" center color={C.inkSoft}>
                  {t(k)}
                </Txt>
              </View>
            ))}
          </View>
          <Txt v="tiny" color={C.muted} center>
            {t('home.demo')}
          </Txt>
        </View>
      </ScrollView>
      <StationPicker visible={picker} value={st.code} onClose={() => setPicker(false)} onPick={(code) => savePassenger({ ...passenger, stationCode: code })} />
    </View>
  );
}

const s = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 64, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: R.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    maxWidth: '100%',
  },
  body: { paddingHorizontal: 16, gap: 14, marginTop: -48 },
  journeys: { gap: 4, ...shadow.md },
  tile: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: R.md },
  tag: { backgroundColor: C.brassSoft, paddingHorizontal: 6, paddingVertical: 1, borderRadius: R.xs },
  active: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.ink, borderRadius: R.lg, padding: 14 },
  liveDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4ADE80', borderWidth: 3, borderColor: 'rgba(74,222,128,0.35)' },
  trackBtn: { backgroundColor: C.white, paddingHorizontal: 14, paddingVertical: 7, borderRadius: R.pill },
  slabs: { flexDirection: 'row', gap: 8 },
  slab: { flex: 1, backgroundColor: C.redTint, borderRadius: R.sm, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: C.redSoft },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  trust: { flexDirection: 'row', gap: 8, marginTop: 4 },
  trustItem: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: C.white, borderRadius: R.md, padding: 10, borderWidth: 1, borderColor: C.line },
});
