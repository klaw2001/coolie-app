import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PartnerTopBar } from '@/components/PartnerTopBar';
import { Avatar, Billa, Card, Icon, ListRow, Row, Screen, Segmented, Txt } from '@/components/ui';
import { languageLabel } from '@/data/people';
import { station } from '@/data/stations';
import { loc, useLang, useT } from '@/i18n';
import { coolieJobs, useApp, useCoolie } from '@/store/useApp';
import { C, PC, R } from '@/theme';
import { confirmDialog, notify } from '@/utils/dialog';
import { fmtMonthYear, fmtPhone } from '@/utils/format';

export default function CoolieProfile() {
  const t = useT();
  const lang = useLang();
  const me = useCoolie();
  const bookings = useApp((s) => s.bookings);
  const setLang = useApp((s) => s.setLang);
  const logout = useApp((s) => s.logout);
  const resetAll = useApp((s) => s.resetAll);
  if (!me) return null;
  const coolie = me.profile;
  const st = station(coolie.stationCode);
  const trips = coolie.baseTrips + coolieJobs(bookings, me.id).filter((b) => b.status === 'completed').length;

  return (
    <Screen edges={[]} header={<PartnerTopBar title={t('cp.title')} back={false} />}>
      <LinearGradient colors={[PC.night3, PC.night]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
        <Row gap={14}>
          <Avatar name={coolie.name} size={68} color={C.red} coolie />
          <View style={{ flex: 1 }}>
            <Txt v="h2" color={C.white}>
              {coolie.name}
            </Txt>
            <Txt v="small" color={PC.nightText}>
              {fmtPhone(me.phone)}
            </Txt>
            <Row gap={4}>
              <Icon name="check-decagram" size={16} color={PC.brassLight} />
              <Txt v="tiny" color={PC.brassLight}>
                {t('cp.licensed')}
              </Txt>
            </Row>
          </View>
          <Icon name="pencil" size={22} color={C.white} onPress={() => router.push('/edit-profile')} />
        </Row>
        <Billa number={coolie.badge} size="lg" />
        <View style={s.stats}>
          <Stat label={t('duty.rating')} value={`★ ${coolie.rating.toFixed(1)}`} />
          <Stat label={t('cp.totalTrips')} value={trips.toLocaleString('en-IN')} />
          <Stat label={t('cp.experience')} value={t('cp.yrs', { n: coolie.years })} />
        </View>
        <Txt v="tiny" color={PC.nightText} center>
          {t('cp.partnerSince', { date: fmtMonthYear(me.kyc.approvedAt ?? me.createdAt, lang) })}
        </Txt>
      </LinearGradient>

      <Card flat pad={6}>
        <ListRow icon="train" title={loc(lang, st.name, st.nameHi)} subtitle={t('cp.station')} chevron={false} />
        <ListRow icon="translate" title={coolie.languages.map((l) => languageLabel(l, lang)).join(', ') || '—'} subtitle={t('cp.languages')} chevron={false} />
        <ListRow icon="clock-outline" title={t(`shift.${coolie.shift}`)} subtitle={t('cp.shift')} chevron={false} />
      </Card>

      <Card flat style={{ gap: 8 }}>
        <Txt v="h3">{t('cp.docs')}</Txt>
        {(
          [
            ['cp.doc1', ''],
            ['cp.doc2', `XXXX ${me.kyc.aadhaarLast4}`],
            ['cp.doc3', `•••• ${me.kyc.bankLast4} · ${me.kyc.ifsc}`],
          ] as const
        ).map(([k, detail]) => (
          <Row key={k} between>
            <View style={{ flex: 1 }}>
              <Txt v="small">{t(k)}</Txt>
              {detail ? (
                <Txt v="tiny" color={C.muted}>
                  {detail}
                </Txt>
              ) : null}
            </View>
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
        <ListRow icon="account-edit" title={t('profile.edit')} onPress={() => router.push('/edit-profile')} />
        <ListRow icon="scale-balance" title={t('profile.rateCard')} onPress={() => router.push('/rate-card')} />
        <ListRow icon="lifebuoy" title={t('profile.help')} onPress={() => router.push('/help')} />
        <ListRow icon="information-outline" title={t('profile.about')} onPress={() => notify(t('profile.about'), t('profile.aboutBody'))} />
        <ListRow
          icon="restore"
          title={t('profile.reset')}
          danger
          onPress={() => confirmDialog(t('profile.reset'), t('profile.resetConfirm'), { ok: t('common.yes'), cancel: t('common.cancel'), destructive: true, onOk: resetAll })}
        />
        <ListRow
          icon="logout"
          title={t('profile.logout')}
          danger
          onPress={() => confirmDialog(t('profile.logout'), t('profile.logoutConfirm'), { ok: t('profile.logout'), cancel: t('common.cancel'), destructive: true, onOk: logout })}
        />
      </Card>
      <Txt v="tiny" color={C.muted} center>
        {t('partner.name')} · {t('profile.version', { v: '1.0.0' })} · {t('home.demo')}
      </Txt>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Txt v="h3" color={C.white}>
        {value}
      </Txt>
      <Txt v="tiny" color={PC.nightText}>
        {label}
      </Txt>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: R.xl, padding: 18, gap: 16 },
  stats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: R.md, paddingVertical: 10 },
});
