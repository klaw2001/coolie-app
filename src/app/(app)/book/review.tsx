import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BookShell } from '@/components/BookShell';
import { FareBreakdown } from '@/components/FareBreakdown';
import { JourneyArt } from '@/components/JourneyArt';
import { Banner, Button, Card, Icon, SectionTitle, Txt } from '@/components/ui';
import { BAGS, bagWeight } from '@/data/bags';
import { calcFare } from '@/data/fare';
import { station } from '@/data/stations';
import { loc, useLang, useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import { C, R } from '@/theme';
import { fmtDateTime, rupee } from '@/utils/format';
import { backToTab } from '@/utils/nav';

export default function ReviewStep() {
  const t = useT();
  const lang = useLang();
  const draft = useApp((s) => s.draft);
  const patchDraft = useApp((s) => s.patchDraft);
  const placeBooking = useApp((s) => s.placeBooking);
  const createIntent = useApp((s) => s.createIntent);
  const [busy, setBusy] = useState(false);
  const { train, meet, drop } = draft;
  if (!train || !meet || !drop) return null;

  const st = station(train.stationCode);
  const weight = Math.max(1, bagWeight(draft.bags) + draft.weightAdjust);
  const fare = calcFare(weight, draft.coolies, draft.distanceKm, draft.addons);
  const bagText = BAGS.filter((b) => (draft.bags[b.id] ?? 0) > 0)
    .map((b) => `${draft.bags[b.id]} × ${loc(lang, b.name, b.nameHi)}`)
    .join(', ');
  const online = draft.payMethod === 'online';

  const confirm = () => {
    setBusy(true);
    setTimeout(() => {
      const b = placeBooking();
      setBusy(false);
      if (!b) return;
      if (online) router.push(`/pay/${createIntent(b.fare.total, 'booking', b.id)}`);
      else backToTab('/home', `/trip/${b.id}`);
    }, 500);
  };

  return (
    <BookShell
      step={5}
      title={t('book.review.title')}
      footer={
        <Button
          title={online ? t('book.review.confirmPay', { amount: rupee(fare.total) }) : t('book.review.confirmCash', { amount: rupee(fare.total) })}
          icon={online ? 'shield-lock' : 'check'}
          loading={busy}
          onPress={confirm}
        />
      }>
      <Card style={{ gap: 14 }}>
        <View style={s.head}>
          <JourneyArt type={draft.journeyType} />
          <View style={{ flex: 1 }}>
            <Txt v="h3">{t(`journey.${draft.journeyType}`)}</Txt>
            <Txt v="tiny" color={C.muted}>
              {loc(lang, st.name, st.nameHi)}
            </Txt>
          </View>
        </View>
        <Line icon="train" label={t('book.review.train')} value={`${train.number} · ${train.name}`} sub={`${t('common.coach', { c: train.coach })} · ${t('common.seat', { s: train.seat })} · ${t('common.pf', { n: train.platform })} · ${fmtDateTime(train.time, lang)}`} onEdit={() => router.dismissTo('/book/train')} />
        <Line icon="map-marker" label={t('book.review.pickup')} value={loc(lang, meet.title, meet.titleHi)} sub={meet.subtitle ? loc(lang, meet.subtitle, meet.subtitleHi) : undefined} onEdit={() => router.dismissTo('/book/point')} />
        <Line icon="flag-checkered" label={t('book.review.drop')} value={loc(lang, drop.title, drop.titleHi)} sub={drop.subtitle ? loc(lang, drop.subtitle, drop.subtitleHi) : undefined} />
        <Line
          icon="bag-suitcase"
          label={t('book.review.luggage')}
          value={`${t('common.kg', { n: weight })} · ${t(draft.coolies === 1 ? 'unit.coolie' : 'unit.coolies', { n: draft.coolies })}`}
          sub={[bagText, draft.addons.trolley ? t('addon.trolley') : '', draft.addons.wheelchair ? t('addon.wheelchair') : ''].filter(Boolean).join(' · ')}
          onEdit={() => router.dismissTo('/book/luggage')}
        />
        <Line
          icon="clock-outline"
          label={t('book.review.when')}
          value={draft.when === 'later' && draft.scheduledAt ? fmtDateTime(draft.scheduledAt, lang) : t('book.review.now')}
          onEdit={() => router.back()}
        />
      </Card>

      <SectionTitle title={t('book.review.fare')} />
      <Card>
        <FareBreakdown fare={fare} />
      </Card>

      <SectionTitle title={t('book.review.payment')} />
      <View style={{ gap: 10 }}>
        <PayOption icon="cellphone-check" title={t('book.review.online')} body={t('book.review.onlineBody')} on={online} onPress={() => patchDraft({ payMethod: 'online' })} />
        <PayOption icon="cash" title={t('book.review.cash')} body={t('book.review.cashBody')} on={!online} onPress={() => patchDraft({ payMethod: 'cash' })} />
      </View>

      <Banner tone="green">
        <Icon name="shield-check" size={18} color={C.green} />
        <Txt v="tiny" color={C.green} style={{ flex: 1 }}>
          {t('book.review.policy')}
        </Txt>
      </Banner>
    </BookShell>
  );
}

function Line({ icon, label, value, sub, onEdit }: { icon: string; label: string; value: string; sub?: string; onEdit?: () => void }) {
  const t = useT();
  return (
    <View style={s.line}>
      <View style={s.lineIcon}>
        <Icon name={icon} size={18} color={C.red} />
      </View>
      <View style={{ flex: 1 }}>
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
      {onEdit ? (
        <Txt v="smallMed" color={C.red} onPress={onEdit}>
          {t('common.edit')}
        </Txt>
      ) : null}
    </View>
  );
}

function PayOption({ icon, title, body, on, onPress }: { icon: string; title: string; body: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.pay, on && s.payOn]} accessibilityRole="radio" accessibilityState={{ checked: on }}>
      <View style={[s.lineIcon, { width: 42, height: 42 }]}>
        <Icon name={icon} size={22} color={C.red} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt v="bodyMed">{title}</Txt>
        <Txt v="tiny" color={C.muted}>
          {body}
        </Txt>
      </View>
      <Icon name={on ? 'radiobox-marked' : 'radiobox-blank'} size={24} color={on ? C.red : C.lineStrong} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  line: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  lineIcon: { width: 34, height: 34, borderRadius: R.sm, backgroundColor: C.redSoft, alignItems: 'center', justifyContent: 'center' },
  pay: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.white },
  payOn: { borderColor: C.red, backgroundColor: C.redTint },
});
