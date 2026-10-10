import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { CancelSheet } from '@/components/CancelSheet';
import { CoolieCard } from '@/components/CoolieCard';
import { FareBreakdown } from '@/components/FareBreakdown';
import { JourneyArt } from '@/components/JourneyArt';
import { TripDetails } from '@/components/TripDetails';
import { Button, Card, Empty, Icon, Row, Screen, SectionTitle, Stars, StatusPill, TopBar, Txt } from '@/components/ui';
import { ACTIVE } from '@/data/journey';
import { station } from '@/data/stations';
import { useBooking } from '@/hooks/useBooking';
import { loc, useLang, useT, type TKey } from '@/i18n';
import { useApp } from '@/store/useApp';
import { C } from '@/theme';
import { fmtDateTime, fmtTime, rupee } from '@/utils/format';
import { notify } from '@/utils/dialog';

export default function BookingDetail() {
  const t = useT();
  const lang = useLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const b = useBooking(id);
  const startDraft = useApp((s) => s.startDraft);
  const patchDraft = useApp((s) => s.patchDraft);
  const startNow = useApp((s) => s.startNow);
  const cancelBooking = useApp((s) => s.cancelBooking);
  const [cancel, setCancel] = useState(false);

  if (!b) {
    return (
      <Screen header={<TopBar title={t('bd.title')} />}>
        <Empty icon="alert-circle-outline" title={t('trip.notFound')} />
      </Screen>
    );
  }
  const st = station(b.stationCode);
  const active = ACTIVE.includes(b.status);

  const share = () =>
    Share.share({
      message: t('bd.receiptText', {
        id: b.id,
        journey: t(`journey.${b.journeyType}`),
        station: st.name,
        train: `${b.train.number} ${b.train.name}`,
        coach: b.train.coach,
        total: rupee(b.fare.total + (b.tip?.amount ?? 0)),
        method: t(`method.${b.payMethod}`),
      }),
    }).catch(() => {});

  const rebook = () => {
    startDraft(b.journeyType);
    patchDraft({ bags: b.bags, addons: b.addons, coolies: b.fare.coolies });
    router.push('/book/train');
  };

  return (
    <Screen
      header={
        <TopBar
          title={t('bd.title')}
          right={
            <Pressable onPress={share} hitSlop={10} accessibilityLabel={t('bd.shareReceipt')}>
              <Icon name="share-variant" size={22} color={C.ink} />
            </Pressable>
          }
        />
      }>
      <Card style={{ gap: 12 }}>
        <Row gap={12}>
          <JourneyArt type={b.journeyType} />
          <View style={{ flex: 1, gap: 4 }}>
            <Txt v="h3">{t(`journey.${b.journeyType}`)}</Txt>
            <Txt v="tiny" color={C.muted}>
              {loc(lang, st.name, st.nameHi)}
            </Txt>
            <StatusPill status={b.status} />
          </View>
        </Row>
        <Row between>
          <Txt v="small" color={C.muted}>
            {t('bd.id')}
          </Txt>
          <Pressable
            onPress={() => {
              Clipboard.setStringAsync(b.id).catch(() => {});
              notify(b.id);
            }}>
            <Row gap={4}>
              <Txt v="smallMed">{b.id}</Txt>
              <Icon name="content-copy" size={14} color={C.muted} />
            </Row>
          </Pressable>
        </Row>
        <Row between>
          <Txt v="small" color={C.muted}>
            {t('bd.bookedOn')}
          </Txt>
          <Txt v="smallMed">{fmtDateTime(b.createdAt, lang)}</Txt>
        </Row>
      </Card>

      {active ? <Button title={t('bd.track')} icon="map-marker-radius" onPress={() => router.push(`/trip/${b.id}`)} /> : null}
      {b.status === 'scheduled' ? (
        <Row gap={10}>
          <View style={{ flex: 1 }}>
            <Button title={t('bd.startNow')} icon="play" size="md" onPress={() => {
              startNow(b.id);
              router.push(`/trip/${b.id}`);
            }} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title={t('common.cancel')} variant="danger" size="md" onPress={() => setCancel(true)} />
          </View>
        </Row>
      ) : null}
      {b.status === 'completed' && !b.rating && b.source === 'passenger' ? (
        <Button title={t('bd.rate')} icon="star" variant="secondary" onPress={() => router.push({ pathname: '/trip/complete', params: { id: b.id } })} />
      ) : null}

      {b.coolie ? (
        <Card>
          <CoolieCard coolie={b.coolie} title={t('trip.coolie')} />
        </Card>
      ) : null}

      <TripDetails b={b} />

      <SectionTitle title={t('book.review.fare')} />
      <Card>
        <FareBreakdown fare={b.fare} tip={b.tip?.amount} />
      </Card>

      {b.rating ? (
        <Card style={{ gap: 8 }}>
          <Txt v="smallMed" color={C.inkSoft}>
            {t('bd.yourRating')}
          </Txt>
          <Stars value={b.rating.stars} />
          {b.rating.tags.length ? (
            <Txt v="small" color={C.inkSoft}>
              {b.rating.tags.map((x) => t(`tag.${x}` as TKey)).join(' · ')}
            </Txt>
          ) : null}
          {b.rating.comment ? <Txt v="small">“{b.rating.comment}”</Txt> : null}
        </Card>
      ) : null}

      {b.cancel ? (
        <Card style={{ gap: 4, backgroundColor: C.redTint }}>
          <Txt v="smallMed">{t('trip.cancelled')}</Txt>
          <Txt v="small" color={C.inkSoft}>
            {t(b.cancel.reason as TKey)}
          </Txt>
          {b.cancel.refund ? (
            <Txt v="smallMed" color={C.green}>
              {t('trip.cancelledRefund', { amount: rupee(b.cancel.refund) })}
            </Txt>
          ) : null}
        </Card>
      ) : null}

      <SectionTitle title={t('bd.timeline')} />
      <Card style={{ gap: 0 }}>
        {b.timeline.map((e, i) => (
          <View key={i} style={s.tl}>
            <View style={s.tlRail}>
              <View style={[s.tlDot, i === b.timeline.length - 1 && { backgroundColor: C.red }]} />
              {i < b.timeline.length - 1 ? <View style={s.tlLine} /> : null}
            </View>
            <Txt v="small" style={{ flex: 1, paddingBottom: 12 }}>
              {t(`tl.${e.s}` as TKey)}
            </Txt>
            <Txt v="tiny" color={C.muted}>
              {fmtTime(e.at, lang)}
            </Txt>
          </View>
        ))}
      </Card>

      {b.source === 'passenger' && (b.status === 'completed' || b.status === 'cancelled') ? (
        <Button title={t('bd.rebook')} icon="replay" variant="secondary" onPress={rebook} />
      ) : null}
      <Button title={t('bd.help')} variant="ghost" size="md" icon="lifebuoy" onPress={() => router.push('/help')} />

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

const s = StyleSheet.create({
  tl: { flexDirection: 'row', gap: 10 },
  tlRail: { alignItems: 'center', width: 12, paddingTop: 6 },
  tlDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.green },
  tlLine: { width: 2, flex: 1, backgroundColor: C.line, marginTop: 2 },
});
