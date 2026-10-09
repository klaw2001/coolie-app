import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { CallSheet } from '@/components/CallSheet';
import { CancelSheet } from '@/components/CancelSheet';
import { CoolieCard } from '@/components/CoolieCard';
import { JourneyArt } from '@/components/JourneyArt';
import { LiveLayout, SosButton, type LiveView } from '@/components/LiveLayout';
import { TripSteps } from '@/components/PlatformTracker';
import { SearchingPulse } from '@/components/SearchingPulse';
import { SosSheet } from '@/components/SosSheet';
import { TripDetails } from '@/components/TripDetails';
import { Banner, Button, Card, Empty, Icon, Row, Screen, StickyFooter, TopBar, Txt } from '@/components/ui';
import { AUTO_ACCEPT_MS, etaMinutes, prefersMap, STAGES, stageKey, stageVars } from '@/data/journey';
import { station } from '@/data/stations';
import { useBooking } from '@/hooks/useBooking';
import { useNow } from '@/hooks/useNow';
import { loc, useLang, useT, type TKey } from '@/i18n';
import { useApp } from '@/store/useApp';
import { C, R } from '@/theme';
import { fmtDateTime, fmtTime, rupee } from '@/utils/format';
import { backToTab } from '@/utils/nav';

export default function Trip() {
  const t = useT();
  const lang = useLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const b = useBooking(id);
  const now = useNow(500);
  const role = useApp((s) => s.role);
  const roleSince = useApp((s) => s.roleSince);
  const hasCoolie = useApp((s) => !!s.coolie);
  const setRole = useApp((s) => s.setRole);
  const setOnline = useApp((s) => s.setOnline);
  const cancelBooking = useApp((s) => s.cancelBooking);
  const startNow = useApp((s) => s.startNow);
  const createIntent = useApp((s) => s.createIntent);
  const switchToCash = useApp((s) => s.switchToCash);
  const [userView, setUserView] = useState<LiveView | null>(null);
  const [sos, setSos] = useState(false);
  const [call, setCall] = useState(false);
  const [cancel, setCancel] = useState(false);
  const left = useRef(false);
  const lastPhase = useRef('');

  const phase = b ? `${b.status}-${b.stage}` : '';
  useEffect(() => {
    // Let the screen follow the trip (map while the coolie approaches, station once inside) unless the user picks a tab mid-phase.
    if (phase !== lastPhase.current) {
      lastPhase.current = phase;
      setUserView(null);
    }
  }, [phase]);

  useEffect(() => {
    if (b?.status === 'completed' && !left.current) {
      left.current = true;
      router.replace({ pathname: '/trip/complete', params: { id: b.id } });
    }
  }, [b?.status, b?.id]);

  if (!b) {
    return (
      <Screen header={<TopBar />}>
        <Empty icon="alert-circle-outline" title={t('trip.notFound')} />
      </Screen>
    );
  }

  const st = station(b.stationCode);
  const point = loc(lang, b.meet.title, b.meet.titleHi);

  const playCoolie = () => {
    if (!hasCoolie) {
      router.push({ pathname: '/setup', params: { role: 'coolie' } });
      return;
    }
    setRole('coolie');
    setOnline(true);
    router.replace('/');
  };

  if (b.status === 'payment_pending') {
    return (
      <Screen header={<TopBar title={t('status.payment_pending')} />}>
        <Empty icon="credit-card-clock" title={t('status.payment_pending')} body={rupee(b.fare.total)} />
        <Button title={t('book.review.online')} onPress={() => router.push(`/pay/${createIntent(b.fare.total, 'booking', b.id)}`)} />
        <Button title={t('pay.payCash')} variant="secondary" onPress={() => switchToCash(b.id)} />
      </Screen>
    );
  }

  if (b.status === 'searching') {
    const from = Math.max(b.searchFrom ?? b.statusAt, roleSince);
    const secs = Math.max(0, Math.ceil((AUTO_ACCEPT_MS - (now - from)) / 1000));
    return (
      <Screen
        header={<TopBar />}
        footer={
          <StickyFooter>
            <Button title={t('trip.cancelSearch')} variant="secondary" onPress={() => setCancel(true)} />
          </StickyFooter>
        }>
        <View style={s.searchTop}>
          <SearchingPulse />
          <Txt v="h1" center>
            {t('trip.searching')}
          </Txt>
          <Txt v="body" color={C.inkSoft} center>
            {t('trip.searchingSub', { point: b.journeyType === 'train_to_exit' ? loc(lang, st.name, st.nameHi) : point })}
          </Txt>
          <View style={s.countdown}>
            <Icon name="timer-sand" size={16} color={C.amber} />
            <Txt v="smallMed" color={C.amber}>
              {role === 'coolie' ? t('trip.waitingYou') : t('trip.autoIn', { s: secs })}
            </Txt>
          </View>
        </View>
        <Card style={{ gap: 10, borderColor: C.brass, borderWidth: 1.5 }}>
          <Row gap={10}>
            <Icon name="account-switch" size={22} color={C.brass} />
            <Txt v="small" style={{ flex: 1 }}>
              {t('trip.playCoolie')}
            </Txt>
          </Row>
          <Button title={t('trip.switchCoolie')} variant="dark" size="md" icon="human-dolly" onPress={playCoolie} />
        </Card>
        <Card style={{ gap: 8 }}>
          <Row gap={12}>
            <JourneyArt type={b.journeyType} size="sm" />
            <View style={{ flex: 1 }}>
              <Txt v="bodyMed">{t(`journey.${b.journeyType}`)}</Txt>
              <Txt v="tiny" color={C.muted}>
                {b.train.number} · {t('common.coach', { c: b.train.coach })} · {t('common.pf', { n: b.train.platform })}
              </Txt>
            </View>
            <Txt v="h3">{rupee(b.fare.total)}</Txt>
          </Row>
        </Card>
        <CancelSheet
          visible={cancel}
          onClose={() => setCancel(false)}
          onConfirm={(r) => {
            setCancel(false);
            cancelBooking(b.id, r, 'passenger');
          }}
        />
      </Screen>
    );
  }

  if (b.status === 'scheduled') {
    return (
      <Screen
        header={<TopBar title={t('trip.status.scheduled')} />}
        footer={
          <StickyFooter>
            <Button title={t('bd.startNow')} icon="play" onPress={() => startNow(b.id)} />
            <Button title={t('trip.cancel')} variant="ghost" onPress={() => setCancel(true)} />
          </StickyFooter>
        }>
        <View style={s.schedHead}>
          <View style={s.schedIcon}>
            <Icon name="calendar-check" size={40} color={C.blue} />
          </View>
          <Txt v="h1" center>
            {fmtDateTime(b.scheduledAt ?? b.createdAt, lang)}
          </Txt>
          <Txt v="body" color={C.inkSoft} center>
            {t('trip.status.scheduledSub', { time: fmtTime(b.scheduledAt ?? b.createdAt, lang) })}
          </Txt>
        </View>
        <TripDetails b={b} />
        <CancelSheet
          visible={cancel}
          onClose={() => setCancel(false)}
          onConfirm={(r) => {
            setCancel(false);
            cancelBooking(b.id, r, 'passenger');
          }}
        />
      </Screen>
    );
  }

  if (b.status === 'cancelled') {
    return (
      <Screen
        header={<TopBar />}
        footer={
          <StickyFooter>
            <Button title={t('trip.backHome')} onPress={() => backToTab('/home')} />
          </StickyFooter>
        }>
        <Empty
          icon="close-circle-outline"
          title={t('trip.cancelled')}
          body={b.cancel?.refund ? t('trip.cancelledRefund', { amount: rupee(b.cancel.refund) }) : b.cancel ? t(b.cancel.reason as TKey) : undefined}
        />
        <TripDetails b={b} />
      </Screen>
    );
  }

  // accepted / arrived / in_progress (completed redirects above)
  const view: LiveView = userView ?? (prefersMap(b) ? 'map' : 'station');
  const stages = STAGES[b.journeyType];
  const vars = stageVars(b, lang);
  const title =
    b.status === 'accepted' ? t('trip.status.accepted') : b.status === 'arrived' ? t('trip.status.arrived') : t('trip.status.in_progress');
  const sub =
    b.status === 'accepted'
      ? t('trip.status.acceptedSub', { point, min: etaMinutes(b, now) })
      : b.status === 'arrived'
        ? t('trip.status.arrivedSub')
        : t(stageKey(b.journeyType, stages[b.stage]), vars);
  const lastMine = b.messages.map((m) => m.from).lastIndexOf('passenger');
  const unread = b.messages.slice(lastMine + 1).filter((m) => m.from === 'coolie').length;

  return (
    <LiveLayout booking={b} now={now} view={view} onView={setUserView} topRight={<SosButton onPress={() => setSos(true)} />}>
      <View style={s.statusRow}>
        <View style={{ flex: 1 }}>
          <Txt v="h2">{title}</Txt>
          <Txt v="small" color={C.inkSoft}>
            {sub}
          </Txt>
        </View>
        {b.status === 'accepted' ? (
          <View style={s.eta}>
            <Txt v="h2" color={C.white}>
              {etaMinutes(b, now)}
            </Txt>
            <Txt v="tiny" color={C.white}>
              {t('trip.minShort')}
            </Txt>
          </View>
        ) : null}
      </View>

      {b.status === 'accepted' || b.status === 'arrived' ? (
        <View style={[s.otp, b.status === 'arrived' && { borderColor: C.red, backgroundColor: C.redTint }]}>
          <View style={{ flex: 1 }}>
            <Txt v="smallMed">{t('trip.otp')}</Txt>
            <Txt v="tiny" color={C.muted}>
              {t('trip.otpHelp')}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {b.otp.split('').map((d, i) => (
              <View key={i} style={s.otpBox}>
                <Txt v="h2">{d}</Txt>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {b.coolie ? (
        <Card>
          <CoolieCard
            coolie={b.coolie}
            title={t('trip.coolie')}
            onCall={() => setCall(true)}
            onChat={() => router.push(`/chat/${b.id}`)}
            onSos={() => setSos(true)}
            unread={unread}
          />
        </Card>
      ) : null}

      {b.journeyType === 'home_to_train' && b.status === 'in_progress' && b.stage <= 1 ? (
        <Banner tone="green">
          <Icon name="account-multiple" size={18} color={C.green} />
          <Txt v="smallMed" color={C.green} style={{ flex: 1 }}>
            {t('trip.withYou')}
          </Txt>
        </Banner>
      ) : null}

      <Card>
        <TripSteps booking={b} />
      </Card>

      <TripDetails b={b} />

      <Row gap={10}>
        <View style={{ flex: 1 }}>
          <Button
            title={t('trip.share')}
            variant="secondary"
            size="md"
            icon="share-variant"
            onPress={() =>
              Share.share({
                message: t('trip.shareText', {
                  coolie: b.coolie?.name ?? '-',
                  badge: b.coolie?.badge ?? '-',
                  train: `${b.train.number} ${b.train.name}`,
                  coach: b.train.coach,
                  station: st.name,
                  id: b.id,
                }),
              }).catch(() => {})
            }
          />
        </View>
        {b.status !== 'in_progress' ? (
          <View style={{ flex: 1 }}>
            <Button title={t('common.cancel')} variant="danger" size="md" icon="close" onPress={() => setCancel(true)} />
          </View>
        ) : null}
      </Row>
      <Txt v="tiny" color={C.muted} center>
        {t('bd.id')} {b.id}
      </Txt>

      {b.coolie ? <CallSheet visible={call} onClose={() => setCall(false)} name={loc(lang, b.coolie.name, b.coolie.nameHi)} phone={b.coolie.phone} color={b.coolie.color} /> : null}
      <SosSheet visible={sos} onClose={() => setSos(false)} booking={b} />
      <CancelSheet
        visible={cancel}
        onClose={() => setCancel(false)}
        onConfirm={(r) => {
          setCancel(false);
          cancelBooking(b.id, r, 'passenger');
        }}
      />
    </LiveLayout>
  );
}

const s = StyleSheet.create({
  searchTop: { alignItems: 'center', gap: 8, paddingTop: 8 },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.amberSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: R.pill, marginTop: 4 },
  schedHead: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  schedIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eta: { width: 58, height: 58, borderRadius: R.md, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  otp: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.white },
  otpBox: { width: 38, height: 46, borderRadius: R.sm, backgroundColor: C.bg, borderWidth: 1, borderColor: C.lineStrong, alignItems: 'center', justifyContent: 'center' },
});
