import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LangToggle } from '@/components/LangToggle';
import { RequestCard } from '@/components/RequestCard';
import { SearchingPulse } from '@/components/SearchingPulse';
import { Billa, Empty, Icon, Row, SectionTitle, Txt } from '@/components/ui';
import { station } from '@/data/stations';
import { useNow } from '@/hooks/useNow';
import { loc, useLang, useT } from '@/i18n';
import { coolieJobs, isLiveForCoolie, jobEarning, passengerBookings, useApp } from '@/store/useApp';
import { C, R } from '@/theme';
import { rupee, startOfDay } from '@/utils/format';
import { notify } from '@/utils/dialog';

export default function Duty() {
  const t = useT();
  const lang = useLang();
  const insets = useSafeAreaInsets();
  const now = useNow(1000);
  const coolie = useApp((s) => s.coolie);
  const bookings = useApp((s) => s.bookings);
  const requests = useApp((s) => s.requests);
  const declined = useApp((s) => s.declined);
  const setOnline = useApp((s) => s.setOnline);
  const accept = useApp((s) => s.acceptRequest);
  const decline = useApp((s) => s.declineRequest);
  if (!coolie) return null;

  const st = station(coolie.stationCode);
  const live = bookings.find(isLiveForCoolie);
  const own = passengerBookings(bookings).filter((b) => b.status === 'searching' && !declined.includes(b.id));
  const today = coolieJobs(bookings).filter((b) => b.status === 'completed' && b.statusAt >= startOfDay(now));
  const earned = today.reduce((x, b) => x + jobEarning(b), 0);

  const onAccept = (id: string) => {
    if (accept(id)) router.push(`/job/${id}`);
    else notify(t('duty.busy'));
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={coolie.online ? [C.red, C.redDark] : ['#4A3B3A', '#2E2322']} style={[s.hero, { paddingTop: insets.top + 10 }]}>
          <Row between>
            <View style={{ flex: 1 }}>
              <Txt v="h2" color={C.white} numberOfLines={1}>
                {coolie.name}
              </Txt>
              <Txt v="tiny" color="rgba(255,255,255,0.8)">
                {loc(lang, st.name, st.nameHi)}
              </Txt>
            </View>
            <LangToggle light />
          </Row>
          <View style={{ marginTop: 10 }}>
            <Billa number={coolie.badge} />
          </View>

          <Pressable onPress={() => setOnline(!coolie.online)} style={s.toggle} accessibilityRole="switch" accessibilityState={{ checked: coolie.online }}>
            <View style={[s.knob, coolie.online ? { left: undefined, right: 6, backgroundColor: C.white } : { left: 6 }]}>
              <Icon name="power" size={26} color={coolie.online ? C.red : C.white} />
            </View>
            <Txt v="h3" color={C.white} style={coolie.online ? { marginRight: 70 } : { marginLeft: 70 }}>
              {coolie.online ? t('duty.online') : t('duty.offline')}
            </Txt>
          </Pressable>
          <Txt v="small" color="rgba(255,255,255,0.85)" center>
            {coolie.online ? t('duty.onlineSub', { station: loc(lang, st.name, st.nameHi) }) : t('duty.offlineSub')}
          </Txt>
        </LinearGradient>

        <View style={s.body}>
          <View style={s.stats}>
            <Stat label={t('duty.earned')} value={rupee(earned)} icon="cash" />
            <Stat label={t('duty.trips')} value={String(today.length)} icon="bag-suitcase" />
            <Stat label={t('duty.rating')} value={coolie.rating.toFixed(1)} icon="star" />
          </View>

          {live ? (
            <Pressable onPress={() => router.push(`/job/${live.id}`)} style={s.live}>
              <View style={s.liveDot} />
              <View style={{ flex: 1 }}>
                <Txt v="bodyMed" color={C.white}>
                  {t('duty.activeJob')}
                </Txt>
                <Txt v="tiny" color="rgba(255,255,255,0.8)" numberOfLines={1}>
                  {live.passengerName} · {t(`status.${live.status}`)} · {rupee(live.fare.total)}
                </Txt>
              </View>
              <View style={s.liveBtn}>
                <Txt v="smallMed" color={C.red}>
                  {t('duty.continue')}
                </Txt>
              </View>
            </Pressable>
          ) : null}

          <SectionTitle title={t('duty.requests')} />
          {!coolie.online ? (
            <Empty icon="power-sleep" title={t('duty.offlineEmpty')} action={{ title: t('duty.online'), onPress: () => setOnline(true) }} />
          ) : own.length + requests.length === 0 ? (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 16 }}>
              <SearchingPulse size={150} />
              <Txt v="h3">{t('duty.waiting')}</Txt>
              <Txt v="small" color={C.muted} center>
                {t('duty.waitingSub')}
              </Txt>
            </View>
          ) : (
            <>
              {own.map((b) => (
                <RequestCard key={b.id} b={b} now={now} own disabled={!!live} onAccept={() => onAccept(b.id)} onDecline={() => decline(b.id)} />
              ))}
              {requests.map((b) => (
                <RequestCard key={b.id} b={b} now={now} disabled={!!live} onAccept={() => onAccept(b.id)} onDecline={() => decline(b.id)} />
              ))}
              {live ? (
                <Txt v="small" color={C.muted} center>
                  {t('duty.busy')}
                </Txt>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={s.stat}>
      <Icon name={icon} size={20} color={C.red} />
      <Txt v="h2">{value}</Txt>
      <Txt v="tiny" color={C.muted}>
        {label}
      </Txt>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 56, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, gap: 10 },
  toggle: {
    marginTop: 14,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  knob: { position: 'absolute', top: 6, width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 16, gap: 14, marginTop: -36 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: C.white, borderRadius: R.lg, padding: 12, gap: 2, borderWidth: 1, borderColor: C.line, boxShadow: '0px 6px 18px rgba(122,14,18,0.08)' },
  live: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.ink, borderRadius: R.lg, padding: 14 },
  liveDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4ADE80', borderWidth: 3, borderColor: 'rgba(74,222,128,0.35)' },
  liveBtn: { backgroundColor: C.white, paddingHorizontal: 14, paddingVertical: 7, borderRadius: R.pill },
});
