import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CallSheet } from '@/components/CallSheet';
import { FareBreakdown } from '@/components/FareBreakdown';
import { LiveLayout, SosButton, type LiveView } from '@/components/LiveLayout';
import { TripSteps } from '@/components/PlatformTracker';
import { SosSheet } from '@/components/SosSheet';
import { TripDetails } from '@/components/TripDetails';
import { Avatar, Banner, Button, Card, Empty, Icon, OtpBoxes, Row, Screen, StickyFooter, TopBar, Txt } from '@/components/ui';
import { prefersMap, STAGES, stageKey, stageVars } from '@/data/journey';
import { useBooking } from '@/hooks/useBooking';
import { useNow } from '@/hooks/useNow';
import { loc, useLang, useT } from '@/i18n';
import { jobEarning, useApp, useCoolie } from '@/store/useApp';
import { C, R } from '@/theme';
import { maskPhone, rupee } from '@/utils/format';
import { backToTab } from '@/utils/nav';
import { confirmDialog } from '@/utils/dialog';

export default function Job() {
  const t = useT();
  const lang = useLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const b = useBooking(id);
  const me = useCoolie();
  const now = useNow(500);
  const arrived = useApp((s) => s.coolieArrived);
  const verifyOtp = useApp((s) => s.verifyOtp);
  const advance = useApp((s) => s.advanceStage);
  const collectCash = useApp((s) => s.collectCash);
  const release = useApp((s) => s.releaseJob);
  const [otp, setOtp] = useState('');
  const [otpErr, setOtpErr] = useState(false);
  const [userView, setUserView] = useState<LiveView | null>(null);
  const [call, setCall] = useState(false);
  const [sos, setSos] = useState(false);
  const lastPhase = useRef('');

  const phase = b ? `${b.status}-${b.stage}` : '';
  useEffect(() => {
    if (phase !== lastPhase.current) {
      lastPhase.current = phase;
      setUserView(null);
    }
  }, [phase]);

  if (!b || !me || b.coolie?.accountId !== me.id) {
    return (
      <Screen header={<TopBar />}>
        <Empty icon="briefcase-remove-outline" title={t('trip.notFound')} action={{ title: t('job.backDuty'), onPress: () => backToTab('/duty') }} />
      </Screen>
    );
  }

  const stages = STAGES[b.journeyType];
  const vars = stageVars(b, lang);
  const earning = jobEarning(b);

  if (b.status === 'completed' || b.status === 'cancelled') {
    const cashDue = b.status === 'completed' && b.payStatus === 'cash_due';
    return (
      <Screen
        header={<TopBar title={b.id} />}
        footer={
          <StickyFooter>
            {cashDue ? (
              <Button title={t('job.collectCash', { amount: rupee(b.fare.total) })} variant="success" icon="cash" onPress={() => collectCash(b.id)} />
            ) : (
              <Button title={t('job.backDuty')} onPress={() => backToTab('/duty')} />
            )}
          </StickyFooter>
        }>
        {b.status === 'completed' ? (
          <View style={s.done}>
            <View style={s.doneIcon}>
              <Icon name="check-bold" size={40} color={C.white} />
            </View>
            <Txt v="h1">{t('job.done')}</Txt>
            <Txt v="h2" color={C.green}>
              {t('job.doneSub', { amount: rupee(earning) })}
            </Txt>
            <Txt v="smallMed" color={cashDue ? C.amber : C.green}>
              {cashDue ? t('job.collectCash', { amount: rupee(b.fare.total) }) : b.payMethod === 'cash' ? t('job.cashCollected') : t('job.prepaid')}
            </Txt>
          </View>
        ) : (
          <Empty icon="close-circle-outline" title={t('trip.cancelled')} />
        )}
        <Card>
          <FareBreakdown fare={b.fare} tip={b.tip?.amount} totalLabel={t('duty.earn')} />
        </Card>
        {b.rating ? (
          <Card style={{ gap: 6 }}>
            <Row gap={6}>
              {Array.from({ length: b.rating.stars }).map((_, i) => (
                <Icon key={i} name="star" size={20} color="#E9A912" />
              ))}
            </Row>
            {b.rating.comment ? <Txt v="small">“{b.rating.comment}”</Txt> : null}
          </Card>
        ) : null}
        <TripDetails b={b} />
      </Screen>
    );
  }

  if (b.status !== 'accepted' && b.status !== 'arrived' && b.status !== 'in_progress') {
    return (
      <Screen header={<TopBar />}>
        <Empty icon="briefcase-remove-outline" title={t(`status.${b.status}`)} action={{ title: t('job.backDuty'), onPress: () => backToTab('/duty') }} />
      </Screen>
    );
  }

  const view: LiveView = userView ?? (prefersMap(b) ? 'map' : 'station');
  const last = b.stage >= stages.length - 1;
  const title =
    b.status === 'accepted' ? t('job.toPickup') : b.status === 'arrived' ? t('job.enterOtp') : t(stageKey(b.journeyType, stages[b.stage]), vars);
  const sub = b.status === 'accepted' ? loc(lang, b.meet.title, b.meet.titleHi) : b.status === 'arrived' ? t('job.otpSub') : t('status.in_progress');

  let footer: React.ReactNode;
  if (b.status === 'accepted') {
    footer = <Button title={t('job.arrived')} icon="map-marker-check" onPress={() => arrived(b.id)} />;
  } else if (b.status === 'arrived') {
    footer = (
      <Button
        title={t('job.start')}
        icon="lock-open-check"
        disabled={otp.length < 4}
        onPress={() => {
          if (!verifyOtp(b.id, otp)) setOtpErr(true);
        }}
      />
    );
  } else {
    footer = last ? (
      <Button title={t('job.complete')} variant="success" icon="check-all" onPress={() => advance(b.id)} />
    ) : (
      <Button title={t('job.next', { stage: t(stageKey(b.journeyType, stages[b.stage + 1]), vars) })} icon="arrow-right-circle" onPress={() => advance(b.id)} />
    );
  }

  return (
    <LiveLayout booking={b} now={now} view={view} onView={setUserView} topRight={<SosButton onPress={() => setSos(true)} />} footer={footer}>
      <View>
        <Txt v="h2">{title}</Txt>
        <Txt v="small" color={C.inkSoft}>
          {sub}
        </Txt>
      </View>

      {b.status === 'arrived' ? (
        <Card style={{ gap: 12 }}>
          <OtpBoxes
            value={otp}
            error={otpErr}
            autoFocus={false}
            onChange={(v) => {
              setOtp(v);
              setOtpErr(false);
            }}
          />
          {otpErr ? (
            <Txt v="smallMed" color={C.red} center>
              {t('job.wrongOtp')}
            </Txt>
          ) : null}
          <Banner tone="blue">
            <Icon name="information" size={18} color={C.blue} />
            <Txt v="smallMed" color={C.blue} style={{ flex: 1 }}>
              {t('job.otpHint', { otp: b.otp })}
            </Txt>
          </Banner>
        </Card>
      ) : null}

      <Card style={{ gap: 12 }}>
        <Row gap={12}>
          <Avatar name={b.passengerName} color={C.blue} size={50} />
          <View style={{ flex: 1 }}>
            <Txt v="tiny" color={C.muted}>
              {t('job.passenger')}
            </Txt>
            <Txt v="h3">{b.passengerName}</Txt>
            <Txt v="tiny" color={C.muted}>
              {maskPhone(b.passengerPhone)}
            </Txt>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt v="tiny" color={C.muted}>
              {t('duty.earn')}
            </Txt>
            <Txt v="h2" color={C.green}>
              {rupee(b.fare.total)}
            </Txt>
            <Txt v="tiny" color={b.payMethod === 'cash' ? C.amber : C.green}>
              {b.payMethod === 'cash' ? t('duty.cash') : t('duty.prepaid')}
            </Txt>
          </View>
        </Row>
        <Row gap={10}>
          <Pressable onPress={() => setCall(true)} style={s.action}>
            <Icon name="phone" size={18} color={C.red} />
            <Txt v="smallMed" color={C.red}>
              {t('common.call')}
            </Txt>
          </Pressable>
          <Pressable onPress={() => router.push(`/chat/${b.id}`)} style={s.action}>
            <Icon name="message-text" size={18} color={C.red} />
            <Txt v="smallMed" color={C.red}>
              {t('common.chat')}
            </Txt>
          </Pressable>
        </Row>
      </Card>

      <Card>
        <TripSteps booking={b} />
      </Card>
      <TripDetails b={b} />

      {b.status === 'accepted' ? (
        <Button
          title={t('job.release')}
          variant="ghost"
          size="md"
          onPress={() =>
            confirmDialog(t('job.release'), t('job.releaseConfirm'), {
              ok: t('common.yes'),
              cancel: t('common.no'),
              destructive: true,
              onOk: () => {
                release(b.id);
                backToTab('/duty');
              },
            })
          }
        />
      ) : null}

      <CallSheet visible={call} onClose={() => setCall(false)} name={b.passengerName} phone={b.passengerPhone} color={C.blue} />
      <SosSheet visible={sos} onClose={() => setSos(false)} booking={b} />
    </LiveLayout>
  );
}

const s = StyleSheet.create({
  done: { alignItems: 'center', gap: 6, paddingVertical: 16 },
  doneIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  action: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: R.md, backgroundColor: C.redSoft },
});
