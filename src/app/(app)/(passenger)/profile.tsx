import { router } from 'expo-router';
import { View } from 'react-native';

import { Avatar, Card, Icon, ListRow, Row, Screen, Segmented, TopBar, Txt } from '@/components/ui';
import { station } from '@/data/stations';
import { loc, useLang, useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import { C } from '@/theme';
import { fmtPhone } from '@/utils/format';
import { confirmDialog, notify } from '@/utils/dialog';

export default function Profile() {
  const t = useT();
  const lang = useLang();
  const passenger = useApp((s) => s.passenger);
  const phone = useApp((s) => s.phone);
  const hasCoolie = useApp((s) => !!s.coolie);
  const addresses = useApp((s) => s.addresses.length);
  const setLang = useApp((s) => s.setLang);
  const setRole = useApp((s) => s.setRole);
  const logout = useApp((s) => s.logout);
  const resetAll = useApp((s) => s.resetAll);
  if (!passenger) return null;
  const st = station(passenger.stationCode);

  const toCoolie = () => {
    if (!hasCoolie) {
      router.push({ pathname: '/setup', params: { role: 'coolie' } });
      return;
    }
    setRole('coolie');
    router.replace('/');
  };

  return (
    <Screen header={<TopBar title={t('profile.title')} back={false} />}>
      <Card style={{ gap: 14 }}>
        <Row gap={14}>
          <Avatar name={passenger.name} size={64} />
          <View style={{ flex: 1 }}>
            <Txt v="h2">{passenger.name}</Txt>
            <Txt v="small" color={C.muted}>
              {fmtPhone(phone)}
            </Txt>
            {passenger.email ? (
              <Txt v="small" color={C.muted}>
                {passenger.email}
              </Txt>
            ) : null}
          </View>
          <Icon name="pencil" size={22} color={C.red} onPress={() => router.push({ pathname: '/setup', params: { role: 'passenger', mode: 'edit' } })} />
        </Row>
        <Row gap={6}>
          <Icon name="map-marker" size={16} color={C.red} />
          <Txt v="small" color={C.inkSoft}>
            {loc(lang, st.name, st.nameHi)}
          </Txt>
        </Row>
      </Card>

      <Card style={{ gap: 10, backgroundColor: C.ink, borderColor: C.ink }} onPress={toCoolie}>
        <Row gap={12}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="human-dolly" size={26} color={C.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt v="h3" color={C.white}>
              {t('profile.switchCoolie')}
            </Txt>
            <Txt v="tiny" color="rgba(255,255,255,0.75)">
              {t('profile.switchCoolieBody')}
            </Txt>
          </View>
          <Icon name="swap-horizontal" size={24} color={C.white} />
        </Row>
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
        <ListRow icon="account-edit" title={t('profile.edit')} onPress={() => router.push({ pathname: '/setup', params: { role: 'passenger', mode: 'edit' } })} />
        <ListRow icon="map-marker-multiple" title={t('profile.addresses')} value={addresses ? String(addresses) : undefined} onPress={() => router.push('/addresses')} />
        <ListRow
          icon="account-heart"
          title={t('profile.emergency')}
          subtitle={passenger.emergencyName ? `${passenger.emergencyName} · ${passenger.emergencyPhone ?? ''}` : t('profile.emergencyNone')}
          onPress={() => router.push({ pathname: '/setup', params: { role: 'passenger', mode: 'edit' } })}
        />
        <ListRow icon="scale-balance" title={t('profile.rateCard')} onPress={() => router.push('/rate-card')} />
        <ListRow icon="lifebuoy" title={t('profile.help')} onPress={() => router.push('/help')} />
        <ListRow icon="information-outline" title={t('profile.about')} onPress={() => notify(t('profile.about'), t('profile.aboutBody'))} />
      </Card>

      <Card flat pad={6}>
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
      <Txt v="tiny" color={C.muted} center>
        {t('app.name')} · {t('profile.version', { v: '1.0.0' })} · {t('home.demo')}
      </Txt>
    </Screen>
  );
}
