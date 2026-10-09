import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LangToggle } from '@/components/LangToggle';
import { Logo } from '@/components/Logo';
import { Button, Field, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { C, R } from '@/theme';

export default function Login() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const valid = /^[6-9]\d{9}$/.test(phone);

  const submit = () => {
    if (!valid) {
      setError(t('login.invalid'));
      return;
    }
    router.push({ pathname: '/otp', params: { phone } });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient colors={[C.red, C.redDark]} style={[s.hero, { paddingTop: insets.top + 12 }]}>
          <View style={s.heroTop}>
            <View />
            <LangToggle light />
          </View>
          <Logo size={84} bg={C.white} fg={C.red} />
          <Txt v="display" color={C.white}>
            {t('app.name')}
          </Txt>
          <Txt v="bodyMed" color="rgba(255,255,255,0.85)">
            {t('app.tagline')}
          </Txt>
        </LinearGradient>
        <View style={s.card}>
          <Txt v="h1">{t('login.title')}</Txt>
          <Txt v="small" color={C.muted}>
            {t('login.subtitle')}
          </Txt>
          <View style={{ height: 8 }} />
          <Field
            prefix="🇮🇳 +91"
            placeholder={t('login.placeholder')}
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            autoFocus
            onChangeText={(v) => {
              setPhone(v.replace(/\D/g, ''));
              setError('');
            }}
            onSubmitEditing={submit}
            error={error}
            textContentType="telephoneNumber"
            autoComplete="tel"
          />
          <Button title={t('login.sendOtp')} onPress={submit} disabled={phone.length < 10} iconRight="arrow-right" />
          <Txt v="tiny" color={C.muted} center>
            {t('login.terms')}
          </Txt>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: 'center', paddingBottom: 56, gap: 6, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', paddingHorizontal: 20, marginBottom: 12 },
  card: {
    marginTop: -32,
    marginHorizontal: 16,
    backgroundColor: C.white,
    borderRadius: R.xl,
    padding: 20,
    gap: 12,
    boxShadow: '0px 12px 32px rgba(122,14,18,0.12)',
    marginBottom: 24,
  },
});
