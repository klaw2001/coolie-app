import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LangToggle } from '@/components/LangToggle';
import { Logo, PartnerLogo } from '@/components/Logo';
import { Icon, Row, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import type { Role } from '@/store/types';
import { C, PC, R } from '@/theme';

/** The front door: passengers and coolies each go into their own app. */
export default function Gateway() {
  const t = useT();
  const onboarded = useApp((s) => s.onboarded);

  const open = (app: Role) =>
    router.push(onboarded[app] ? { pathname: '/login', params: { app } } : { pathname: '/welcome', params: { app } });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Row between>
          <Row gap={10}>
            <Logo size={40} />
            <Txt v="h1">{t('app.name')}</Txt>
          </Row>
          <LangToggle />
        </Row>

        <View style={{ gap: 6, marginTop: 18 }}>
          <Txt v="display">{t('gate.title')}</Txt>
          <Txt v="body" color={C.inkSoft}>
            {t('gate.sub')}
          </Txt>
        </View>

        <Pressable onPress={() => open('passenger')} accessibilityRole="button" style={({ pressed }) => pressed && { transform: [{ scale: 0.985 }] }}>
          <LinearGradient colors={[C.red, C.redDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
            <Icon name="train" size={150} color="rgba(255,255,255,0.08)" style={s.watermark} />
            <View style={[s.badge, { backgroundColor: C.white }]}>
              <Icon name="bag-suitcase" size={30} color={C.red} />
            </View>
            <Txt v="h1" color={C.white}>
              {t('gate.passenger')}
            </Txt>
            <Txt v="small" color="rgba(255,255,255,0.88)">
              {t('gate.passengerBody')}
            </Txt>
            <View style={[s.cta, { backgroundColor: C.white }]}>
              <Txt v="smallMed" color={C.redDark}>
                {t('gate.passengerCta')}
              </Txt>
              <Icon name="arrow-right" size={18} color={C.redDark} />
            </View>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => open('coolie')} accessibilityRole="button" style={({ pressed }) => pressed && { transform: [{ scale: 0.985 }] }}>
          <LinearGradient colors={[PC.night2, PC.night]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.card, s.partnerCard]}>
            <Icon name="human-dolly" size={150} color="rgba(255,255,255,0.06)" style={s.watermark} />
            <View style={{ marginBottom: 6 }}>
              <PartnerLogo size={56} />
            </View>
            <Txt v="h1" color={C.white}>
              {t('gate.partner')}
            </Txt>
            <Txt v="small" color={PC.nightText}>
              {t('gate.partnerBody')}
            </Txt>
            <View style={[s.cta, { backgroundColor: PC.brassLight }]}>
              <Txt v="smallMed" color={PC.night}>
                {t('gate.partnerCta')}
              </Txt>
              <Icon name="arrow-right" size={18} color={PC.night} />
            </View>
          </LinearGradient>
        </Pressable>

        <Txt v="tiny" color={C.muted} center>
          {t('gate.footer')}
        </Txt>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  card: { borderRadius: R.xl, padding: 20, gap: 8, overflow: 'hidden', boxShadow: '0px 12px 28px rgba(122,14,18,0.22)' },
  partnerCard: { borderWidth: 1.5, borderColor: 'rgba(232,196,104,0.45)' },
  watermark: { position: 'absolute', right: -24, bottom: -28 },
  badge: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 9, borderRadius: R.pill, marginTop: 8 },
});
