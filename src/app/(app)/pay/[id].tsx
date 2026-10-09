import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Empty, Icon, ListRow, Row, Screen, SectionTitle, TopBar, Txt } from '@/components/ui';
import { loc, useLang, useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import { C, R } from '@/theme';
import { rupee } from '@/utils/format';
import { UPI_APPS } from '@/utils/payment';

export default function PayMethods() {
  const t = useT();
  const lang = useLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const intent = useApp((s) => s.intents.find((i) => i.id === id));
  const booking = useApp((s) => s.bookings.find((b) => b.id === intent?.refId));
  const balance = useApp((s) => s.walletBalance);
  const cards = useApp((s) => s.savedCards);
  const vpas = useApp((s) => s.savedUpi);
  const setOutcome = useApp((s) => s.setIntentOutcome);

  if (!intent) {
    return (
      <Screen header={<TopBar title={t('pay.title')} />}>
        <Empty icon="alert-circle-outline" title={t('trip.notFound')} />
      </Screen>
    );
  }

  const purpose =
    intent.purpose === 'booking'
      ? t('pay.for.booking', { id: intent.refId ?? '' })
      : intent.purpose === 'tip'
        ? t('pay.for.tip', { name: booking?.coolie ? loc(lang, booking.coolie.name, booking.coolie.nameHi) : '' })
        : t('pay.for.topup');
  const canWallet = intent.purpose !== 'topup';
  const enough = balance >= intent.amount;

  return (
    <Screen header={<TopBar title={t('pay.title')} />}>
      <View style={s.amount}>
        <Txt v="small" color="rgba(255,255,255,0.85)">
          {t('pay.amount')}
        </Txt>
        <Txt v="display" color={C.white} size={36}>
          {rupee(intent.amount)}
        </Txt>
        <Txt v="smallMed" color="rgba(255,255,255,0.9)">
          {purpose}
        </Txt>
      </View>

      <SectionTitle title={t('pay.upiApps')} />
      <View style={s.apps}>
        {UPI_APPS.map((a) => (
          <Pressable key={a.id} onPress={() => router.push({ pathname: '/pay/upi-app', params: { id, app: a.id } })} style={({ pressed }) => [s.app, pressed && { opacity: 0.8 }]}>
            <View style={[s.appLogo, { backgroundColor: a.color }]}>
              <Txt weight="extrabold" color={C.white} size={18}>
                {a.short}
              </Txt>
            </View>
            <Txt v="tiny" center numberOfLines={1}>
              {a.name}
            </Txt>
          </Pressable>
        ))}
      </View>
      <Card flat pad={6}>
        <ListRow icon="at" title={t('pay.upiId')} subtitle={t('pay.upiIdBody')} onPress={() => router.push({ pathname: '/pay/upi-id', params: { id } })} />
        {vpas.map((v) => (
          <ListRow key={v} icon="check-decagram" iconColor={C.green} iconBg={C.greenSoft} title={v} subtitle="UPI" onPress={() => router.push({ pathname: '/pay/upi-id', params: { id, vpa: v } })} />
        ))}
      </Card>

      <SectionTitle title={t('pay.cards')} />
      <Card flat pad={6}>
        {cards.map((c) => (
          <ListRow
            key={c.id}
            icon="credit-card"
            iconColor={C.blue}
            iconBg={C.blueSoft}
            title={`${c.brand} •• ${c.last4}`}
            subtitle={`${c.bank} · ${c.expiry}`}
            onPress={() => router.push({ pathname: '/pay/card', params: { id, saved: c.id } })}
          />
        ))}
        <ListRow icon="credit-card-plus" title={t('pay.addCard')} onPress={() => router.push({ pathname: '/pay/card', params: { id } })} />
      </Card>

      {canWallet ? (
        <>
          <SectionTitle title={t('pay.wallet')} />
          <Card flat pad={6}>
            <ListRow
              icon="wallet"
              title={enough ? t('pay.payWallet', { amount: rupee(intent.amount) }) : t('pay.walletLow')}
              subtitle={t('pay.walletBal', { amount: rupee(balance) })}
              onPress={
                enough
                  ? () => {
                      setOutcome(id, { outcome: 'success', method: 'wallet', methodLabel: t('method.wallet'), failReason: undefined });
                      router.push({ pathname: '/pay/result', params: { id } });
                    }
                  : undefined
              }
            />
          </Card>
        </>
      ) : null}

      <Row gap={6} style={{ justifyContent: 'center', marginTop: 4 }}>
        <Icon name="shield-lock" size={16} color={C.green} />
        <Txt v="tiny" color={C.muted}>
          {t('pay.secure')}
        </Txt>
      </Row>
    </Screen>
  );
}

const s = StyleSheet.create({
  amount: { backgroundColor: C.red, borderRadius: R.lg, padding: 18, gap: 2, boxShadow: '0px 10px 24px rgba(211,37,43,0.3)' },
  apps: { flexDirection: 'row', gap: 10 },
  app: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: C.white, borderRadius: R.md, borderWidth: 1, borderColor: C.line, paddingVertical: 12, paddingHorizontal: 4 },
  appLogo: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
