import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { PartnerTopBar } from '@/components/PartnerTopBar';
import { StationPicker } from '@/components/StationPicker';
import { Banner, Billa, Button, Card, Chip, Field, Icon, ListRow, Screen, Stepper, StickyFooter, TopBar, Txt } from '@/components/ui';
import { LANGUAGES, languageLabel } from '@/data/people';
import { station } from '@/data/stations';
import { loc, useLang, useT } from '@/i18n';
import { useApp, useCoolie, usePassenger } from '@/store/useApp';
import type { Shift } from '@/store/types';
import { C } from '@/theme';
import { notify } from '@/utils/dialog';

const SHIFTS: Shift[] = ['morning', 'evening', 'night', 'full'];

/** Edit the signed-in account: passenger details, or a coolie partner's work profile. */
export default function EditProfile() {
  const t = useT();
  const lang = useLang();
  const passenger = usePassenger();
  const coolie = useCoolie();
  const updatePassenger = useApp((s) => s.updatePassenger);
  const updateCoolie = useApp((s) => s.updateCoolie);
  const isCoolie = !!coolie;

  const [name, setName] = useState(coolie?.profile.name ?? passenger?.profile.name ?? '');
  const [email, setEmail] = useState(passenger?.profile.email ?? '');
  const [stationCode, setStationCode] = useState(coolie?.profile.stationCode ?? passenger?.profile.stationCode ?? 'CSMT');
  const [eName, setEName] = useState(passenger?.profile.emergencyName ?? '');
  const [ePhone, setEPhone] = useState(passenger?.profile.emergencyPhone ?? '');
  const [years, setYears] = useState(coolie?.profile.years ?? 5);
  const [languages, setLanguages] = useState<string[]>(coolie?.profile.languages ?? []);
  const [shift, setShift] = useState<Shift>(coolie?.profile.shift ?? 'full');
  const [picker, setPicker] = useState(false);
  const [err, setErr] = useState('');
  const st = station(stationCode);

  const save = () => {
    if (!name.trim()) return setErr(t('setup.nameRequired'));
    if (isCoolie) {
      updateCoolie({ name: name.trim(), stationCode, years, languages, shift });
    } else {
      updatePassenger({
        name: name.trim(),
        email: email.trim() || undefined,
        stationCode,
        emergencyName: eName.trim() || undefined,
        emergencyPhone: ePhone.trim() || undefined,
      });
    }
    notify(t('profile.saved'));
    router.back();
  };

  return (
    <Screen
      keyboard
      edges={isCoolie ? ['bottom'] : ['top']}
      header={isCoolie ? <PartnerTopBar title={t('profile.edit')} /> : <TopBar title={t('profile.edit')} />}
      footer={
        <StickyFooter>
          <Button title={t('common.save')} variant={isCoolie ? 'dark' : 'primary'} onPress={save} />
        </StickyFooter>
      }>
      <Field
        label={t('setup.name')}
        value={name}
        onChangeText={(v) => {
          setName(v);
          setErr('');
        }}
        autoCapitalize="words"
        icon="account"
        error={err}
      />
      <View style={{ gap: 6 }}>
        <Txt v="smallMed" color={C.inkSoft}>
          {isCoolie ? t('setup.workStation') : t('setup.station')}
        </Txt>
        <Card flat pad={6}>
          <ListRow icon="train" title={`${loc(lang, st.name, st.nameHi)} (${st.code})`} subtitle={loc(lang, st.city, st.cityHi)} onPress={() => setPicker(true)} />
        </Card>
      </View>

      {coolie ? (
        <>
          <Billa number={coolie.profile.badge} size="lg" />
          <Banner tone="blue">
            <Icon name="shield-check" size={18} color={C.blue} />
            <Txt v="tiny" color={C.blue} style={{ flex: 1 }}>
              {t('edit.badgeLocked')}
            </Txt>
          </Banner>
          <Card flat style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt v="bodyMed">{t('setup.years')}</Txt>
            <Stepper value={years} onChange={setYears} min={0} max={50} />
          </Card>
          <Txt v="smallMed" color={C.inkSoft}>
            {t('ps.languages')}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {LANGUAGES.map((l) => {
              const on = languages.includes(l.en);
              return <Chip key={l.en} label={languageLabel(l.en, lang)} selected={on} onPress={() => setLanguages(on ? languages.filter((x) => x !== l.en) : [...languages, l.en])} />;
            })}
          </View>
          <Txt v="smallMed" color={C.inkSoft}>
            {t('ps.shift')}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SHIFTS.map((x) => (
              <Chip key={x} label={t(`shift.${x}`)} selected={shift === x} onPress={() => setShift(x)} />
            ))}
          </View>
        </>
      ) : (
        <>
          <Field label={t('setup.email')} optionalLabel={t('common.optional')} placeholder={t('setup.emailPh')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" icon="email-outline" />
          <Txt v="h3" style={{ marginTop: 6 }}>
            {t('setup.emergency')}
          </Txt>
          <Field label={t('setup.emergencyName')} value={eName} onChangeText={setEName} icon="account-heart" autoCapitalize="words" />
          <Field label={t('setup.emergencyPhone')} value={ePhone} onChangeText={(v) => setEPhone(v.replace(/\D/g, '').slice(0, 10))} keyboardType="number-pad" prefix="+91" />
        </>
      )}
      <StationPicker visible={picker} value={stationCode} onClose={() => setPicker(false)} onPick={setStationCode} />
    </Screen>
  );
}
