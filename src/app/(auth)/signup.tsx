import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { StationPicker } from '@/components/StationPicker';
import { Button, Card, Field, ListRow, Screen, StickyFooter, TopBar, Txt } from '@/components/ui';
import { station } from '@/data/stations';
import { loc, useLang, useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import { C } from '@/theme';
import { fmtPhone } from '@/utils/format';

/** New passenger account, reached after OTP when the number isn't registered yet. */
export default function PassengerSignup() {
  const t = useT();
  const lang = useLang();
  const { phone = '' } = useLocalSearchParams<{ phone: string }>();
  const registerPassenger = useApp((s) => s.registerPassenger);
  const loginAs = useApp((s) => s.loginAs);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [stationCode, setStationCode] = useState('CSMT');
  const [eName, setEName] = useState('');
  const [ePhone, setEPhone] = useState('');
  const [picker, setPicker] = useState(false);
  const [err, setErr] = useState('');
  const st = station(stationCode);

  const submit = () => {
    if (!name.trim()) return setErr(t('setup.nameRequired'));
    const id = registerPassenger(phone, {
      name: name.trim(),
      email: email.trim() || undefined,
      stationCode,
      emergencyName: eName.trim() || undefined,
      emergencyPhone: ePhone.trim() || undefined,
    });
    loginAs('passenger', id);
  };

  return (
    <Screen
      keyboard
      header={<TopBar title={t('signup.title')} subtitle={fmtPhone(phone)} />}
      footer={
        <StickyFooter>
          <Button title={t('signup.create')} icon="account-check" onPress={submit} />
        </StickyFooter>
      }>
      <Txt v="small" color={C.inkSoft}>
        {t('signup.sub')}
      </Txt>
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
        error={err}
      />
      <Field label={t('setup.email')} optionalLabel={t('common.optional')} placeholder={t('setup.emailPh')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" icon="email-outline" />
      <View style={{ gap: 6 }}>
        <Txt v="smallMed" color={C.inkSoft}>
          {t('setup.station')}
        </Txt>
        <Card flat pad={6}>
          <ListRow icon="train" title={`${loc(lang, st.name, st.nameHi)} (${st.code})`} subtitle={loc(lang, st.city, st.cityHi)} onPress={() => setPicker(true)} />
        </Card>
      </View>
      <Txt v="h3" style={{ marginTop: 6 }}>
        {t('setup.emergency')}{' '}
        <Txt v="tiny" color={C.muted}>
          ({t('common.optional')})
        </Txt>
      </Txt>
      <Field label={t('setup.emergencyName')} value={eName} onChangeText={setEName} icon="account-heart" autoCapitalize="words" />
      <Field label={t('setup.emergencyPhone')} value={ePhone} onChangeText={(v) => setEPhone(v.replace(/\D/g, '').slice(0, 10))} keyboardType="number-pad" prefix="+91" />
      <StationPicker visible={picker} value={stationCode} onClose={() => setPicker(false)} onPick={setStationCode} />
    </Screen>
  );
}
