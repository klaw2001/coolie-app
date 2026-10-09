import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar, Billa, Card, Icon, ListRow, Row, Screen, Segmented, TopBar, Txt } from '@/components/ui';
import { station } from '@/data/stations';
import { loc, useLang, useT } from '@/i18n';
import { coolieJobs, useApp } from '@/store/useApp';
import { C, R } from '@/theme';
import { fmtPhone } from '@/utils/format';
import { confirmDialog, notify } from '@/utils/dialog';

export default function CoolieProfile() {
  const t = useT();
  const lang = useLang();
  const coolie = useApp((s) => s.coolie);
  const phone = useApp((s) => s.phone);
  const bookings = useApp((s) => s.bookings);
  const hasPassenger = useApp((s) => !!s.passenger);
  const setLang = useApp((s) => s.setLang);
  const setRole = useApp((s) => s.setRole);
  const logout = useApp((s) => s.logout);
  const resetAll = useApp((s) => s.resetAll);
  if (!coolie) return null;
  const st = station(coolie.stationCode);
  const trips = coolieJobs(bookings).filter((b) => b.status === 'completed').length;

  const toPassenger = () => {
    if (!hasPassenger) {
      router.push({ pathname: '/setup', params: { role: 'passenger' } });
      return;
    }
    setRole('passenger');
    router.replace('/');
  };

  return (
    <Screen header={<TopBar title={t('cp.title')} back={false} />}>
      <LinearGradient colors={[C.red, C.redDark]} style={s.card}>
        <Row gap={14}>
          <Avatar name={coolie.name} size={68} color={C.redDeep} coolie />
          <View style={{ flex: 1 }}>
            <Txt v="h2" color={C.white}>
              {coolie.name}
            </Txt>
            <Txt v="small" color="rgba(255,255,255,0.85)">
              {fmtPhone(phone)}
            </Txt>
            <Row gap={4}>
              <Icon name="check-decagram" size={16} color="#FFD25E" />
              <Txt v="tiny" color="#FFD25E">
                {t('cp.licensed')}
              </Txt>
            </Row>
          </View>
          <Icon name="pencil" size={22} color={C.white} onPress={() => router.push({ pathname: '/setup', params: { role: 'coolie', mode: 'edit' } })} />
        </Row>
        <Billa number={coolie.badge} size="lg" />
        <View style={s.stats}>
          <Stat label={t('duty.rating')} value={`★ ${coolie.rating.toFixed(1)}`} />
          <Stat label={t('cp.totalTrips')} value={String(trips)} />
          <Stat label={t('cp.experience')} value={t('cp.yrs', { n: coolie.years })} />
        </View>
      </LinearGradient>

      <Card flat pad={6}>
        <ListRow icon="train" title={loc(lang, st.name, st.nameHi)} subtitle={t('cp.station')} chevron={false} />
      </Card>

      <Card style={{ gap: 10, backgroundColor: C.ink, borderColor: C.ink }} onPress={toPassenger}>
        <Row gap={12}>
          <View style={s.swapIcon}>
            <Icon name="bag-suitcase" size={24} color={C.red} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt v="h3" color={C.white}>
              {t('profile.switchPassenger')}
            </Txt>
            <Txt v="tiny" color="rgba(255,255,255,0.75)">
              {t('profile.switchPassengerBody')}
            </Txt>
          </View>
          <Icon name="swap-horizontal" size={24} color={C.white} />
        </Row>
      </Card>

      <Card flat style={{ gap: 8 }}>
        <Txt v="h3">{t('cp.docs')}</Txt>
        {(['cp.doc1', 'cp.doc2', 'cp.doc3'] as const).map((k) => (
          <Row key={k} between>
            <Txt v="small">{t(k)}</Txt>
            <Row gap={4}>
              <Icon name="check-circle" size={16} color={C.green} />
              <Txt v="tiny" color={C.green}>
                {t('cp.verified')}
              </Txt>
            </Row>
          </Row>
        ))}
      </Card>

      <Card flat style={{ gap: 10 }}>
        <Row between>
          <Row gap={10}>
            <Icon name="translate" size={22} color={C.red} />
            <Txt v="bodyMed">{t('profile.language')}</Txt>
          </Row>
          <View style={{ width: 170 }}>
            <Segmented
              dense
              value={lang}
              onChange={setLang}
              options={[
                { value: 'en', label: t('lang.en') },
                { value: 'hi', label: t('lang.hi') },
              ]}
            />
          </View>
        </Row>
      </Card>

      <Card flat pad={6}>
        <ListRow icon="account-edit" title={t('profile.edit')} onPress={() => router.push({ pathname: '/setup', params: { role: 'coolie', mode: 'edit' } })} />
        <ListRow icon="scale-balance" title={t('profile.rateCard')} onPress={() => router.push('/rate-card')} />
        <ListRow icon="lifebuoy" title={t('profile.help')} onPress={() => router.push('/help')} />
        <ListRow icon="information-outline" title={t('profile.about')} onPress={() => notify(t('profile.about'), t('profile.aboutBody'))} />
        <ListRow
          icon="restore"
          title={t('profile.reset')}
          danger
          onPress={() =>
            confirmDialog(t('profile.reset'), t('profile.resetConfirm'), { ok: t('common.yes'), cancel: t('common.cancel'), destructive: true, onOk: resetAll })
          }
        />
        <ListRow
          icon="logout"
          title={t('profile.logout')}
          danger
          onPress={() =>
            confirmDialog(t('profile.logout'), t('profile.logoutConfirm'), { ok: t('profile.logout'), cancel: t('common.cancel'), destructive: true, onOk: logout })
          }
        />
      </Card>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Txt v="h3" color={C.white}>
        {value}
      </Txt>
      <Txt v="tiny" color="rgba(255,255,255,0.8)">
        {label}
      </Txt>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: R.xl, padding: 18, gap: 16 },
  stats: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: R.md, paddingVertical: 10 },
  swapIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
});
