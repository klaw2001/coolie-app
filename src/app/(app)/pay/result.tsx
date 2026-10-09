import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, BackHandler, StyleSheet, View } from 'react-native';

import { Button, Card, Icon, KV, Screen, StickyFooter, Txt } from '@/components/ui';
import { useT, type TKey } from '@/i18n';
import { useApp } from '@/store/useApp';
import { C } from '@/theme';
import { rupee } from '@/utils/format';
import { backToTab } from '@/utils/nav';

export default function PayResult() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const intent = useApp((s) => s.intents.find((i) => i.id === id));
  const finalizeIntent = useApp((s) => s.finalizeIntent);
  const switchToCash = useApp((s) => s.switchToCash);
  const cancelBooking = useApp((s) => s.cancelBooking);
  const [processing, setProcessing] = useState(intent?.status === 'created');
  const [pop] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!processing) return;
    const block = BackHandler.addEventListener('hardwareBackPress', () => true);
    const timer = setTimeout(() => {
      finalizeIntent(id);
      setProcessing(false);
    }, 2200);
    return () => {
      clearTimeout(timer);
      block.remove();
    };
  }, [processing, id, finalizeIntent]);

  useEffect(() => {
    if (!processing) Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [processing, pop]);

  if (!intent) return null;

  if (processing) {
    return (
      <Screen scroll={false} contentStyle={s.center}>
        <ActivityIndicator size="large" color={C.red} />
        <Txt v="h2" center>
          {t('pay.processing')}
        </Txt>
        <Txt v="h1" color={C.red}>
          {rupee(intent.amount)}
        </Txt>
        <Txt v="small" color={C.muted} center>
          {t('pay.dontClose')}
        </Txt>
      </Screen>
    );
  }

  const ok = intent.status === 'success';
  const next = () => {
    if (intent.purpose === 'booking' && intent.refId) backToTab('/home', `/trip/${intent.refId}`);
    else if (intent.purpose === 'tip' && intent.refId) backToTab('/home', `/booking/${intent.refId}`);
    else backToTab('/wallet');
  };

  return (
    <Screen
      scroll={false}
      edges={['top']}
      contentStyle={s.center}
      footer={
        <StickyFooter>
          {ok ? (
            <Button title={t('pay.continue')} onPress={next} iconRight="arrow-right" />
          ) : (
            <>
              <Button title={t('pay.tryAgain')} onPress={() => router.back()} />
              {intent.purpose === 'booking' && intent.refId ? (
                <>
                  <Button title={t('pay.payCash')} variant="secondary" icon="cash" onPress={() => {
                    switchToCash(intent.refId!);
                    backToTab('/home', `/trip/${intent.refId}`);
                  }} />
                  <Button title={t('pay.cancelBooking')} variant="ghost" onPress={() => {
                    cancelBooking(intent.refId!, 'reason.other', 'passenger');
                    backToTab('/home');
                  }} />
                </>
              ) : null}
            </>
          )}
        </StickyFooter>
      }>
      <Animated.View style={[s.badge, { backgroundColor: ok ? C.green : C.red, transform: [{ scale: pop }] }]}>
        <Icon name={ok ? 'check-bold' : 'close-thick'} size={54} color={C.white} />
      </Animated.View>
      <Txt v="h1" center>
        {ok ? t('pay.success') : t('pay.failed')}
      </Txt>
      <Txt v="display" color={ok ? C.green : C.red}>
        {rupee(intent.amount)}
      </Txt>
      {!ok && intent.failReason ? (
        <Txt v="bodyMed" color={C.inkSoft} center>
          {t(intent.failReason as TKey)}
        </Txt>
      ) : null}
      {ok ? (
        <Card style={{ alignSelf: 'stretch', gap: 4 }}>
          <KV k={t('pay.ref')} v={intent.ref ?? '-'} />
          <KV k={t('pay.method')} v={intent.methodLabel ?? t(`method.${intent.method ?? 'upi'}`)} />
        </Card>
      ) : null}
      <View style={{ height: 8 }} />
    </Screen>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  badge: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
