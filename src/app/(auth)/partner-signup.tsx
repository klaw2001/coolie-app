import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { PartnerTopBar } from '@/components/PartnerTopBar';
import { StationPicker } from '@/components/StationPicker';
import { Avatar, Banner, Billa, Button, Card, Chip, Field, Icon, ListRow, Row, Screen, Stepper, StepBar, StickyFooter, Txt } from '@/components/ui';
import { LANGUAGES, languageLabel } from '@/data/people';
import { station } from '@/data/stations';
import { loc, useLang, useT, type TKey } from '@/i18n';
import { useApp } from '@/store/useApp';
import type { Shift } from '@/store/types';
import { C, PC, R } from '@/theme';
import { fmtPhone } from '@/utils/format';

type DocId = 'photo' | 'licence' | 'aadhaar';
type Upload = 'idle' | 'uploading' | 'done';

const DOCS: { id: DocId; icon: string; title: TKey; body: TKey; file: string }[] = [
  { id: 'photo', icon: 'account-box', title: 'ps.photo', body: 'ps.photoBody', file: 'photo_uniform.jpg · 1.4 MB' },
  { id: 'licence', icon: 'card-account-details-star', title: 'ps.licence', body: 'ps.licenceBody', file: 'porter_licence.jpg · 0.9 MB' },
  { id: 'aadhaar', icon: 'card-account-details', title: 'ps.aadhaar', body: 'ps.aadhaarBody', file: 'aadhaar_front.jpg · 1.1 MB' },
];
const STEPS: TKey[] = ['ps.step1', 'ps.step2', 'ps.step3', 'ps.step4'];
const SHIFTS: Shift[] = ['morning', 'evening', 'night', 'full'];

/** Coolie Partner registration with simulated KYC, reached after OTP for a new number. */
export default function PartnerSignup() {
  const t = useT();
  const lang = useLang();
  const { phone = '' } = useLocalSearchParams<{ phone: string }>();
  const registerCoolie = useApp((s) => s.registerCoolie);
  const [step, setStep] = useState(1);
  const [err, setErr] = useState('');

  const [name, setName] = useState('');
  const [years, setYears] = useState(5);
  const [languages, setLanguages] = useState<string[]>(['Hindi']);
  const [stationCode, setStationCode] = useState('CSMT');
  const [badge, setBadge] = useState(`CSMT-${(phone || '000').slice(-3)}`);
  const [shift, setShift] = useState<Shift>('full');
  const [uploads, setUploads] = useState<Record<DocId, Upload>>({ photo: 'idle', licence: 'idle', aadhaar: 'idle' });
  const [aadhaar, setAadhaar] = useState('');
  const [account, setAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [consent, setConsent] = useState(false);
  const [picker, setPicker] = useState(false);
  const st = station(stationCode);

  const upload = (id: DocId) => {
    setUploads((u) => ({ ...u, [id]: 'uploading' }));
    setTimeout(() => setUploads((u) => ({ ...u, [id]: 'done' })), 1300);
    setErr('');
  };

  const validate = (): string => {
    if (step === 1) {
      if (!name.trim()) return t('setup.nameRequired');
      if (!languages.length) return t('ps.errLanguages');
    }
    if (step === 2 && !badge.trim()) return t('setup.badgeRequired');
    if (step === 3) {
      if (uploads.photo !== 'done' || uploads.licence !== 'done') return t('ps.errDocs');
      if (!/^\d{12}$/.test(aadhaar) || uploads.aadhaar !== 'done') return t('ps.errAadhaar');
      if (!/^\d{9,18}$/.test(account) || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return t('ps.errBank');
    }
    if (step === 4 && !consent) return t('ps.errConsent');
    return '';
  };

  const next = () => {
    const e = validate();
    setErr(e);
    if (e) return;
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    const id = registerCoolie(
      phone,
      { name: name.trim(), badge: badge.trim().toUpperCase(), stationCode, years, languages, shift, baseTrips: 0 },
      { aadhaarLast4: aadhaar.slice(-4), bankLast4: account.slice(-4), ifsc, docs: ['photo', 'licence', 'aadhaar', 'bank'] },
    );
    router.replace({ pathname: '/partner-review', params: { id } });
  };

  return (
    <Screen
      keyboard
      edges={['bottom']}
      header={
        <>
          <PartnerTopBar
            title={t('ps.title')}
            subtitle={t('ps.stepOf', { n: step, name: t(STEPS[step - 1]) })}
            onBack={() => (step > 1 ? setStep(step - 1) : router.back())}
          />
          <View style={{ paddingTop: 10, backgroundColor: C.bg }}>
            <StepBar step={step} total={4} label={fmtPhone(phone)} />
          </View>
        </>
      }
      footer={
        <StickyFooter>
          {err ? (
            <Txt v="smallMed" color={C.red} center>
              {err}
            </Txt>
          ) : null}
          <Button title={step < 4 ? t('ps.next') : t('ps.submit')} variant="dark" iconRight={step < 4 ? 'arrow-right' : 'send'} onPress={next} />
        </StickyFooter>
      }>
      {step === 1 ? (
        <>
          <Field label={t('setup.name')} placeholder="e.g. Ramesh Yadav" value={name} onChangeText={setName} autoCapitalize="words" icon="account" />
          <Card flat style={s.between}>
            <Txt v="bodyMed">{t('setup.years')}</Txt>
            <Stepper value={years} onChange={setYears} min={0} max={50} />
          </Card>
          <Txt v="smallMed" color={C.inkSoft}>
            {t('ps.languages')}
          </Txt>
          <View style={s.wrap}>
            {LANGUAGES.map((l) => {
              const on = languages.includes(l.en);
              return (
                <Chip
                  key={l.en}
                  label={languageLabel(l.en, lang)}
                  selected={on}
                  onPress={() => setLanguages(on ? languages.filter((x) => x !== l.en) : [...languages, l.en])}
                />
              );
            })}
          </View>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <View style={{ gap: 6 }}>
            <Txt v="smallMed" color={C.inkSoft}>
              {t('setup.workStation')}
            </Txt>
            <Card flat pad={6}>
              <ListRow icon="train" title={`${loc(lang, st.name, st.nameHi)} (${st.code})`} subtitle={loc(lang, st.city, st.cityHi)} onPress={() => setPicker(true)} />
            </Card>
          </View>
          <Field
            label={t('setup.badge')}
            value={badge}
            onChangeText={setBadge}
            autoCapitalize="characters"
            icon="card-account-details-star"
            help={t('setup.badgeHelp')}
          />
          {badge.trim() ? <Billa number={badge.trim().toUpperCase()} size="lg" /> : null}
          <Txt v="smallMed" color={C.inkSoft}>
            {t('ps.shift')}
          </Txt>
          <View style={s.wrap}>
            {SHIFTS.map((x) => (
              <Chip key={x} label={t(`shift.${x}`)} selected={shift === x} onPress={() => setShift(x)} />
            ))}
          </View>
          <StationPicker
            visible={picker}
            value={stationCode}
            onClose={() => setPicker(false)}
            onPick={(code) => {
              if (badge.startsWith(`${stationCode}-`)) setBadge(badge.replace(`${stationCode}-`, `${code}-`));
              setStationCode(code);
            }}
          />
        </>
      ) : null}

      {step === 3 ? (
        <>
          {DOCS.map((d) => (
            <UploadCard key={d.id} icon={d.icon} title={t(d.title)} body={t(d.body)} file={d.file} state={uploads[d.id]} onUpload={() => upload(d.id)}>
              {d.id === 'aadhaar' ? (
                <Field
                  label={t('ps.aadhaarNo')}
                  value={aadhaar.replace(/(\d{4})(?=\d)/g, '$1 ')}
                  onChangeText={(v) => setAadhaar(v.replace(/\D/g, '').slice(0, 12))}
                  keyboardType="number-pad"
                  placeholder="XXXX XXXX XXXX"
                  maxLength={14}
                />
              ) : null}
            </UploadCard>
          ))}
          <Card style={{ gap: 10 }}>
            <Row gap={10}>
              <View style={s.docIcon}>
                <Icon name="bank" size={22} color={C.red} />
              </View>
              <Txt v="bodyMed" style={{ flex: 1 }}>
                {t('ps.bank')}
              </Txt>
            </Row>
            <Field label={t('ps.accountNo')} value={account} onChangeText={(v) => setAccount(v.replace(/\D/g, '').slice(0, 18))} keyboardType="number-pad" placeholder="000123456789" />
            <Field label={t('ps.ifsc')} value={ifsc} onChangeText={(v) => setIfsc(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))} autoCapitalize="characters" placeholder="SBIN0000300" />
          </Card>
          <Banner tone="blue">
            <Icon name="shield-lock" size={18} color={C.blue} />
            <Txt v="tiny" color={C.blue} style={{ flex: 1 }}>
              {t('ps.demoNote')}
            </Txt>
          </Banner>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <Card style={{ alignItems: 'center', gap: 10, backgroundColor: PC.night, borderColor: PC.night }}>
            <Avatar name={name || '?'} size={72} coolie />
            <Txt v="h2" color={C.white}>
              {name}
            </Txt>
            <Billa number={badge.trim().toUpperCase()} />
            <Txt v="small" color={PC.nightText}>
              {loc(lang, st.name, st.nameHi)} · {t(`shift.${shift}`)} · {t('cp.yrs', { n: years })}
            </Txt>
          </Card>
          <Card flat pad={6}>
            <ListRow icon="phone" title={fmtPhone(phone)} subtitle={t('ps.mobile')} chevron={false} />
            <ListRow icon="translate" title={languages.map((l) => languageLabel(l, lang)).join(', ')} subtitle={t('cp.languages')} chevron={false} />
            <ListRow icon="card-account-details" title={`XXXX XXXX ${aadhaar.slice(-4)}`} subtitle={t('ps.aadhaar')} chevron={false} right={<Icon name="check-circle" size={20} color={C.green} />} />
            <ListRow icon="bank" title={`•••• ${account.slice(-4)} · ${ifsc}`} subtitle={t('ps.bank')} chevron={false} right={<Icon name="check-circle" size={20} color={C.green} />} />
            <ListRow icon="file-check" title={`${t('ps.photo')}, ${t('ps.licence')}`} subtitle={t('ps.step3')} chevron={false} right={<Icon name="check-circle" size={20} color={C.green} />} />
          </Card>
          <Pressable onPress={() => setConsent(!consent)} style={s.consent} accessibilityRole="checkbox" accessibilityState={{ checked: consent }}>
            <Icon name={consent ? 'checkbox-marked' : 'checkbox-blank-outline'} size={24} color={consent ? C.red : C.muted} />
            <Txt v="small" style={{ flex: 1 }}>
              {t('ps.consent')}
            </Txt>
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}

function UploadCard({ icon, title, body, file, state, onUpload, children }: { icon: string; title: string; body: string; file: string; state: Upload; onUpload: () => void; children?: React.ReactNode }) {
  const t = useT();
  return (
    <Card style={{ gap: 10 }}>
      <Row gap={10}>
        <View style={[s.docIcon, state === 'done' && { backgroundColor: C.greenSoft }]}>
          <Icon name={state === 'done' ? 'check-bold' : icon} size={22} color={state === 'done' ? C.green : C.red} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt v="bodyMed">{title}</Txt>
          <Txt v="tiny" color={state === 'done' ? C.green : C.muted}>
            {state === 'done' ? `${t('ps.uploaded')} · ${file}` : body}
          </Txt>
        </View>
        {state === 'uploading' ? (
          <ActivityIndicator color={C.red} />
        ) : (
          <Pressable onPress={onUpload} style={[s.uploadBtn, state === 'done' && s.uploadDone]} accessibilityRole="button">
            <Icon name={state === 'done' ? 'refresh' : 'upload'} size={16} color={state === 'done' ? C.inkSoft : C.white} />
            <Txt v="tiny" color={state === 'done' ? C.inkSoft : C.white}>
              {state === 'done' ? t('common.change') : t('ps.upload')}
            </Txt>
          </Pressable>
        )}
      </Row>
      {state === 'uploading' ? (
        <Txt v="tiny" color={C.muted}>
          {t('ps.uploading')}
        </Txt>
      ) : null}
      {children}
    </Card>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  docIcon: { width: 44, height: 44, borderRadius: R.sm, backgroundColor: C.redSoft, alignItems: 'center', justifyContent: 'center' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: R.pill, backgroundColor: PC.night },
  uploadDone: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.lineStrong },
  consent: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, backgroundColor: C.white, borderRadius: R.md, borderWidth: 1, borderColor: C.line },
});
