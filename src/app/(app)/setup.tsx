import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { StationPicker } from '@/components/StationPicker';
import { Billa, Button, Card, Field, ListRow, Screen, Stepper, StickyFooter, TopBar, Txt } from '@/components/ui';
import { station } from '@/data/stations';
import { loc, useLang, useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import type { Role } from '@/store/types';
import { C } from '@/theme';
import { notify } from '@/utils/dialog';

export default function Setup() {
  const t = useT();
  const lang = useLang();
  const { role = 'passenger', mode } = useLocalSearchParams<{ role: Role; mode?: string }>();
  const editing = mode === 'edit';
  const isCoolie = role === 'coolie';
  const phone = useApp((s) => s.phone);
  const passenger = useApp((s) => s.passenger);
  const coolie = useApp((s) => s.coolie);
  const savePassenger = useApp((s) => s.savePassenger);
  const saveCoolie = useApp((s) => s.saveCoolie);
  const setRole = useApp((s) => s.setRole);
  const setOnline = useApp((s) => s.setOnline);

  const [name, setName] = useState((isCoolie ? coolie?.name ?? passenger?.name : passenger?.name ?? coolie?.name) ?? '');
  const [email, setEmail] = useState(passenger?.email ?? '');
  const [stationCode, setStationCode] = useState((isCoolie ? coolie?.stationCode ?? passenger?.stationCode : passenger?.stationCode ?? coolie?.stationCode) ?? 'CSMT');
  const [eName, setEName] = useState(passenger?.emergencyName ?? '');
  const [ePhone, setEPhone] = useState(passenger?.emergencyPhone ?? '');
  const [badge, setBadge] = useState(coolie?.badge ?? `${stationCode}-${(phone || '000').slice(-3)}`);
  const [years, setYears] = useState(coolie?.years ?? 5);
  const [picker, setPicker] = useState(false);
  const [err, setErr] = useState('');
  const st = station(stationCode);

  const submit = () => {
    if (!name.trim()) return setErr(t('setup.nameRequired'));
    if (isCoolie && !badge.trim()) return setErr(t('setup.badgeRequired'));
    if (isCoolie) {
      saveCoolie({ name: name.trim(), badge: badge.trim().toUpperCase(), stationCode, years });
    } else {
      savePassenger({
        name: name.trim(),
        email: email.trim() || undefined,
        stationCode,
        emergencyName: eName.trim() || undefined,
        emergencyPhone: ePhone.trim() || undefined,
      });
    }
    if (editing) {
      notify(t('profile.saved'));
      router.back();
      return;
    }
    setRole(role);
    if (isCoolie) setOnline(true);
    router.replace('/');
  };

  return (
    <Screen
      keyboard
      header={<TopBar title={editing ? t('profile.edit') : isCoolie ? t('setup.titleCoolie') : t('setup.titlePassenger')} />}
      footer={
        <StickyFooter>
          <Button title={editing ? t('common.save') : t('setup.finish')} onPress={submit} />
        </StickyFooter>
      }>
      <Field
        label={t('setup.name')}
        placeholder={t('setup.namePh')}
        value={name}
        onChangeText={(v) => {
          setName(v);
          setErr('');
        }}
        autoCapitalize="words"
        icon="account"
        error={err && !name.trim() ? err : undefined}
      />
      <View style={{ gap: 6 }}>
        <Txt v="smallMed" color={C.inkSoft}>
          {isCoolie ? t('setup.workStation') : t('setup.station')}
        </Txt>
        <Card flat pad={6}>
          <ListRow icon="train" title={`${loc(lang, st.name, st.nameHi)} (${st.code})`} subtitle={loc(lang, st.city, st.cityHi)} onPress={() => setPicker(true)} />
        </Card>
      </View>

      {isCoolie ? (
        <>
          <Field
            label={t('setup.badge')}
            value={badge}
            onChangeText={(v) => {
              setBadge(v);
              setErr('');
            }}
            autoCapitalize="characters"
            icon="card-account-details-star"
            help={t('setup.badgeHelp')}
            error={err && !badge.trim() ? err : undefined}
          />
          {badge.trim() ? <Billa number={badge.trim().toUpperCase()} size="lg" /> : null}
          <Card flat style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt v="bodyMed">{t('setup.years')}</Txt>
            <Stepper value={years} onChange={setYears} min={0} max={50} />
          </Card>
        </>
      ) : (
        <>
          <Field label={t('setup.email')} optionalLabel={t('common.optional')} placeholder={t('setup.emailPh')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" icon="email-outline" />
          <Txt v="h3" style={{ marginTop: 6 }}>
            {t('setup.emergency')}{' '}
            <Txt v="tiny" color={C.muted}>
              ({t('common.optional')})
            </Txt>
          </Txt>
          <Field label={t('setup.emergencyName')} value={eName} onChangeText={setEName} icon="account-heart" autoCapitalize="words" />
          <Field label={t('setup.emergencyPhone')} value={ePhone} onChangeText={(v) => setEPhone(v.replace(/\D/g, '').slice(0, 10))} keyboardType="number-pad" prefix="+91" />
        </>
      )}
      <StationPicker
        visible={picker}
        value={stationCode}
        onClose={() => setPicker(false)}
        onPick={(code) => {
          setStationCode(code);
          if (isCoolie && badge.startsWith(`${stationCode}-`)) setBadge(badge.replace(`${stationCode}-`, `${code}-`));
        }}
      />
    </Screen>
  );
}
