import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LangToggle } from '@/components/LangToggle';
import { Logo, PartnerLogo } from '@/components/Logo';
import { Avatar, Billa, Button, Field, Icon, Txt } from '@/components/ui';
import { DEMO_COOLIE_ID, DEMO_PASSENGER_ID } from '@/data/demo';
import { station } from '@/data/stations';
import { loc, useLang, useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import type { Role } from '@/store/types';
import { C, PC, R } from '@/theme';
import { fmtPhone } from '@/utils/format';

export default function Login() {
  const t = useT();
  const lang = useLang();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ app?: string; mode?: string }>();
  const app: Role = params.app === 'coolie' ? 'coolie' : 'passenger';
  const partner = app === 'coolie';
  const onboarded = useApp((s) => s.onboarded);
  const setAuthIntent = useApp((s) => s.setAuthIntent);
  const demoPassenger = useApp((s) => s.passengers.find((p) => p.id === DEMO_PASSENGER_ID));
  const demoCoolie = useApp((s) => s.coolies.find((c) => c.id === DEMO_COOLIE_ID));
  const [register, setRegister] = useState(params.mode === 'register');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const valid = /^[6-9]\d{9}$/.test(phone);

  useEffect(() => {
    // We got here from a hand-off; the next visit to "/" should show the gateway again.
    setAuthIntent(null);
  }, [setAuthIntent]);

  const sendOtp = (number = phone, demo = false) => {
    if (!/^[6-9]\d{9}$/.test(number)) {
      setError(t('login.invalid'));
      return;
    }
    router.push({ pathname: '/otp', params: { app, phone: number, demo: demo ? '1' : '0' } });
  };

  const otherApp: Role = partner ? 'passenger' : 'coolie';
  const goOther = () =>
    router.replace(onboarded[otherApp] ? { pathname: '/login', params: { app: otherApp } } : { pathname: '/welcome', params: { app: otherApp } });

  const demo = partner ? demoCoolie : demoPassenger;
  const demoName = partner ? demoCoolie?.profile.name : demoPassenger?.profile.name;
  const demoStation = station((partner ? demoCoolie?.profile.stationCode : demoPassenger?.profile.stationCode) ?? 'CSMT');

  const title = partner ? (register ? t('login.titleRegister') : t('login.titlePartner')) : t('login.title');
  const sub = partner ? (register ? t('login.subRegister') : t('login.subPartner')) : t('login.subtitle');

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: partner ? '#F4EFEE' : C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient colors={partner ? [PC.night2, PC.night] : [C.red, C.redDark]} style={[s.hero, { paddingTop: insets.top + 10 }]}>
          <View style={s.heroTop}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/gateway'))}
              style={s.back}
              hitSlop={10}
              accessibilityLabel={t('common.back')}>
              <Icon name="arrow-left" size={22} color={C.white} />
            </Pressable>
            <LangToggle light />
          </View>
          {partner ? <PartnerLogo size={76} /> : <Logo size={84} bg={C.white} fg={C.red} />}
          <Txt v="display" color={C.white} style={{ marginTop: partner ? 8 : 0 }}>
            {partner ? t('partner.name') : t('app.name')}
          </Txt>
          <Txt v="bodyMed" color="rgba(255,255,255,0.85)">
            {partner ? t('partner.tagline') : t('app.tagline')}
          </Txt>
        </LinearGradient>

        <View style={s.card}>
          <Txt v="h1">{title}</Txt>
          <Txt v="small" color={C.muted}>
            {sub}
          </Txt>

          {demo && !register ? (
            <>
              <Pressable
                onPress={() => sendOtp(demo.phone, true)}
                accessibilityRole="button"
                style={({ pressed }) => [s.demo, partner && s.demoPartner, pressed && { opacity: 0.85 }]}>
                <Avatar name={demoName ?? ''} size={50} color={partner ? C.red : C.blue} coolie={partner} />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={s.demoTag}>
                    <Icon name="star-four-points" size={11} color={C.brass} />
                    <Txt v="tiny" color={C.brass} size={10}>
                      {t('login.demo').toUpperCase()}
                    </Txt>
                  </View>
                  <Txt v="h3" numberOfLines={1}>
                    {demoName}
                  </Txt>
                  <Txt v="tiny" color={C.muted} numberOfLines={1}>
                    {fmtPhone(demo.phone)} · {loc(lang, demoStation.name, demoStation.nameHi)}
                  </Txt>
                  {partner && demoCoolie ? <Billa number={demoCoolie.profile.badge} size="sm" /> : null}
                </View>
                <View style={[s.go, partner && { backgroundColor: PC.night }]}>
                  <Icon name="arrow-right" size={20} color={C.white} />
                </View>
              </Pressable>
              <Txt v="tiny" color={C.muted} center>
                {t('login.demoBody')}
              </Txt>
              <View style={s.orRow}>
                <View style={s.line} />
                <Txt v="tiny" color={C.muted}>
                  {t('login.or')}
                </Txt>
                <View style={s.line} />
              </View>
            </>
          ) : (
            <View style={{ height: 6 }} />
          )}

          <Field
            prefix="🇮🇳 +91"
            placeholder={t('login.placeholder')}
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={(v) => {
              setPhone(v.replace(/\D/g, ''));
              setError('');
            }}
            onSubmitEditing={() => sendOtp()}
            error={error}
            textContentType="telephoneNumber"
            autoComplete="tel"
          />
          <Button
            title={t('login.sendOtp')}
            variant={partner ? 'dark' : 'primary'}
            onPress={() => sendOtp()}
            disabled={!valid}
            iconRight="arrow-right"
          />

          {partner ? (
            register ? (
              <Txt v="smallMed" color={C.red} center onPress={() => setRegister(false)}>
                {t('login.haveAccount')}
              </Txt>
            ) : (
              <View style={s.register}>
                <Txt v="small" color={C.inkSoft}>
                  {t('login.newPartner')}
                </Txt>
                <Button title={t('login.register')} variant="secondary" size="md" icon="account-plus" onPress={() => setRegister(true)} />
              </View>
            )
          ) : (
            <Txt v="tiny" color={C.muted} center>
              {t('login.newPassenger')}
            </Txt>
          )}
          <Txt v="tiny" color={C.muted} center>
            {t('login.terms')}
          </Txt>
        </View>

        <Pressable onPress={goOther} style={s.switch} accessibilityRole="link">
          <Icon name={partner ? 'bag-suitcase' : 'human-dolly'} size={18} color={partner ? C.red : PC.night} />
          <Txt v="smallMed" color={partner ? C.red : PC.night}>
            {partner ? t('login.toPassenger') : t('login.toPartner')}
          </Txt>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: 'center', paddingBottom: 56, gap: 6, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'stretch', paddingHorizontal: 16, marginBottom: 10 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  card: {
    marginTop: -32,
    marginHorizontal: 16,
    backgroundColor: C.white,
    borderRadius: R.xl,
    padding: 20,
    gap: 12,
    boxShadow: '0px 12px 32px rgba(122,14,18,0.12)',
  },
  demo: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: R.lg, backgroundColor: C.blueSoft, borderWidth: 1.5, borderColor: '#C9D7FB' },
  demoPartner: { backgroundColor: C.brassSoft, borderColor: '#EAD49A' },
  demoTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  go: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  line: { flex: 1, height: 1, backgroundColor: C.line },
  register: { gap: 8, alignItems: 'stretch', paddingTop: 6, borderTopWidth: 1, borderTopColor: C.line },
  switch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20, marginBottom: 12 },
});
