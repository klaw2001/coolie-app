import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PartnerLogo } from '@/components/Logo';
import { Avatar, Billa, Button, Icon, Txt } from '@/components/ui';
import { useT, type TKey } from '@/i18n';
import { useApp } from '@/store/useApp';
import { C, PC, R } from '@/theme';

const CHECKS: TKey[] = ['pr.c1', 'pr.c2', 'pr.c3', 'pr.c4'];
const STEP_MS = 1400;

/** "Under verification" screen. In the demo the checks tick through in a few seconds and the partner is approved. */
export default function PartnerReview() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const acct = useApp((s) => s.coolies.find((c) => c.id === id));
  const approve = useApp((s) => s.approveCoolie);
  const loginAs = useApp((s) => s.loginAs);
  const alreadyApproved = acct?.kyc.status === 'approved';
  const [done, setDone] = useState(alreadyApproved ? CHECKS.length : 0);

  useEffect(() => {
    if (alreadyApproved || !id) return;
    const timers = CHECKS.map((_, i) => setTimeout(() => setDone(i + 1), STEP_MS * (i + 1)));
    const finish = setTimeout(() => approve(id), STEP_MS * CHECKS.length + 300);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finish);
    };
  }, [alreadyApproved, id, approve]);

  if (!acct) {
    return null;
  }
  const approved = acct.kyc.status === 'approved';

  return (
    <LinearGradient colors={[PC.night2, PC.night, '#0E0809']} style={{ flex: 1 }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content}>
          <PartnerLogo size={48} />
          <View style={s.badge}>
            {approved ? (
              <View style={[s.ring, { backgroundColor: PC.online }]}>
                <Icon name="check-decagram" size={54} color={C.white} />
              </View>
            ) : (
              <View style={[s.ring, { backgroundColor: 'rgba(232,196,104,0.18)' }]}>
                <Icon name="file-search" size={50} color={PC.brassLight} />
              </View>
            )}
          </View>
          <Txt v="display" color={C.white} center>
            {approved ? t('pr.approved') : t('pr.title')}
          </Txt>
          <Txt v="body" color={PC.nightText} center>
            {approved ? t('pr.approvedSub', { name: acct.profile.name.split(' ')[0] }) : t('pr.sub')}
          </Txt>

          <View style={s.card}>
            <View style={s.who}>
              <Avatar name={acct.profile.name} size={46} coolie />
              <View style={{ flex: 1, gap: 4 }}>
                <Txt v="h3" color={C.white}>
                  {acct.profile.name}
                </Txt>
                <Billa number={acct.profile.badge} size="sm" />
              </View>
            </View>
            {CHECKS.map((k, i) => {
              const ok = i < done;
              const running = i === done && !approved;
              return (
                <View key={k} style={s.check}>
                  <View style={[s.dot, ok && { backgroundColor: PC.online, borderColor: PC.online }]}>
                    {ok ? <Icon name="check" size={14} color={C.white} /> : running ? <ActivityIndicator size="small" color={PC.brassLight} /> : null}
                  </View>
                  <Txt v="smallMed" color={ok ? C.white : PC.nightText}>
                    {t(k)}
                  </Txt>
                </View>
              );
            })}
            <Txt v="tiny" color={PC.nightText}>
              {t('pr.appId')}: CPA-{acct.id.slice(-6).toUpperCase()}
            </Txt>
          </View>
        </ScrollView>
        <View style={s.footer}>
          <Button title={t('pr.start')} variant="light" icon="power" disabled={!approved} onPress={() => loginAs('coolie', acct.id)} />
          {!approved ? (
            <Txt v="bodyMed" color={C.white} center onPress={() => router.replace('/gateway')} style={{ paddingVertical: 10 }}>
              {t('common.back')}
            </Txt>
          ) : null}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  content: { padding: 24, gap: 12, alignItems: 'center' },
  badge: { marginVertical: 12 },
  ring: { width: 108, height: 108, borderRadius: 54, alignItems: 'center', justifyContent: 'center' },
  card: { alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: R.xl, padding: 18, gap: 14, borderWidth: 1, borderColor: PC.nightLine, marginTop: 10 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: PC.nightLine },
  check: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: PC.nightLine, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: 16, gap: 6 },
});
