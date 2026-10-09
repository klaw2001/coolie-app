import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, Keypad, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import { C, R } from '@/theme';
import { rupee } from '@/utils/format';
import { UPI_APPS } from '@/utils/payment';

/** A pretend UPI app PIN screen. Any 6 digits pay; 000000 fails. */
export default function UpiApp() {
  const t = useT();
  const { id, app } = useLocalSearchParams<{ id: string; app: string }>();
  const intent = useApp((s) => s.intents.find((i) => i.id === id));
  const setOutcome = useApp((s) => s.setIntentOutcome);
  const meta = UPI_APPS.find((a) => a.id === app) ?? UPI_APPS[0];
  const [pin, setPin] = useState('');

  const submit = () => {
    if (pin.length !== 6) return;
    const fail = pin === '000000';
    setOutcome(id, { outcome: fail ? 'failed' : 'success', method: 'upi', methodLabel: meta.name, failReason: fail ? 'fail.pin' : undefined });
    router.replace({ pathname: '/pay/result', params: { id } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0F1630' }}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: meta.color }}>
        <View style={s.bar}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel={t('common.close')}>
            <Icon name="close" size={24} color={C.white} />
          </Pressable>
          <View style={[s.logo]}>
            <Txt weight="extrabold" color={meta.color} size={13}>
              {meta.short}
            </Txt>
          </View>
          <Txt v="h3" color={C.white}>
            {meta.name}
          </Txt>
        </View>
      </SafeAreaView>
      <View style={s.merchant}>
        <Txt v="small" color="rgba(255,255,255,0.7)">
          {t('upi.paying')}
        </Txt>
        <Txt v="h2" color={C.white}>
          {t('upi.merchant')}
        </Txt>
        <Txt v="tiny" color="rgba(255,255,255,0.6)">
          coolie.services@okaxis
        </Txt>
        <Txt v="display" color={C.white} size={40} style={{ marginTop: 8 }}>
          {rupee(intent?.amount ?? 0)}
        </Txt>
        <View style={s.acct}>
          <Icon name="bank" size={16} color="rgba(255,255,255,0.8)" />
          <Txt v="smallMed" color="rgba(255,255,255,0.85)">
            {t('upi.account')}
          </Txt>
        </View>
      </View>
      <View style={s.pinPanel}>
        <Txt v="label" color="rgba(255,255,255,0.8)" center>
          {t('upi.enterPin')}
        </Txt>
        <View style={s.dots}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={[s.dot, i < pin.length && s.dotOn]} />
          ))}
        </View>
        <Txt v="tiny" color="rgba(255,255,255,0.55)" center>
          {t('upi.pinHint')}
        </Txt>
        <SafeAreaView edges={['bottom']}>
          <Keypad dark color={C.white} onKey={(k) => setPin((p) => (p.length < 6 ? p + k : p))} onDelete={() => setPin((p) => p.slice(0, -1))} onSubmit={submit} />
        </SafeAreaView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  logo: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  merchant: { alignItems: 'center', paddingVertical: 24, gap: 2 },
  acct: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: R.pill },
  pinPanel: { flex: 1, backgroundColor: '#161E3D', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 22, paddingHorizontal: 16, gap: 14, justifyContent: 'flex-end' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginVertical: 6 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  dotOn: { backgroundColor: C.white, borderColor: C.white },
});
