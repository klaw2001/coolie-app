import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner, Button, Field, Icon, OtpBoxes, Row, Screen, StickyFooter, Toggle, TopBar, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import { C, R } from '@/theme';
import { rupee } from '@/utils/format';
import { cardBrand, DECLINE_CARD, formatCard, formatExpiry, luhn, validExpiry } from '@/utils/payment';

export default function CardPay() {
  const t = useT();
  const { id, saved } = useLocalSearchParams<{ id: string; saved?: string }>();
  const intent = useApp((s) => s.intents.find((i) => i.id === id));
  const savedCard = useApp((s) => s.savedCards.find((c) => c.id === saved));
  const phone = useApp((s) => s.phone);
  const setOutcome = useApp((s) => s.setIntentOutcome);
  const saveCard = useApp((s) => s.saveCard);

  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [save, setSave] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [busy, setBusy] = useState(false);

  const digits = number.replace(/\D/g, '');
  const brand = savedCard?.brand ?? cardBrand(digits);
  const last4 = savedCard?.last4 ?? digits.slice(-4);
  const amount = rupee(intent?.amount ?? 0);

  const submitForm = () => {
    const e: Record<string, string> = {};
    if (!savedCard) {
      if (!luhn(digits)) e.number = t('card.invalidNumber');
      if (!validExpiry(expiry)) e.expiry = t('card.invalidExpiry');
      if (!name.trim()) e.name = t('card.invalidName');
    }
    if (!/^\d{3,4}$/.test(cvv)) e.cvv = t('card.invalidCvv');
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setStep('otp');
    }, 900);
  };

  const submitOtp = (code = otp) => {
    if (code !== '123456') {
      setOtpError(true);
      return;
    }
    const declined = !savedCard && digits === DECLINE_CARD;
    if (!declined && !savedCard && save) saveCard({ brand, last4, bank: 'Demo Bank', expiry });
    setOutcome(id, { outcome: declined ? 'failed' : 'success', method: 'card', methodLabel: `${brand} •• ${last4}`, failReason: declined ? 'fail.declined' : undefined });
    router.replace({ pathname: '/pay/result', params: { id } });
  };

  if (step === 'otp') {
    return (
      <Screen
        keyboard
        header={<TopBar title={t('card.otpTitle')} onBack={() => setStep('form')} />}
        footer={
          <StickyFooter>
            <Button title={t('otp.verify')} disabled={otp.length < 6} onPress={() => submitOtp()} />
          </StickyFooter>
        }>
        <View style={s.bank}>
          <Icon name="bank" size={28} color={C.blue} />
          <View style={{ flex: 1 }}>
            <Txt v="h3">Demo Bank SecureCode</Txt>
            <Txt v="small" color={C.muted}>
              {t('card.pay', { amount })} · {brand} •• {last4}
            </Txt>
          </View>
        </View>
        <Txt v="small" color={C.inkSoft}>
          {t('card.otpSub', { last4 })} ({phone ? `+91 XXXXXX${phone.slice(-4)}` : ''})
        </Txt>
        <OtpBoxes
          length={6}
          value={otp}
          error={otpError}
          onChange={(v) => {
            setOtp(v);
            setOtpError(false);
            if (v.length === 6) submitOtp(v);
          }}
        />
        {otpError ? (
          <Txt v="smallMed" color={C.red} center>
            {t('card.otpWrong')}
          </Txt>
        ) : null}
        <Banner tone="blue">
          <Icon name="information" size={18} color={C.blue} />
          <Txt v="smallMed" color={C.blue}>
            {t('card.otpHint')}
          </Txt>
        </Banner>
      </Screen>
    );
  }

  return (
    <Screen
      keyboard
      header={<TopBar title={t('card.title')} subtitle={amount} />}
      footer={
        <StickyFooter>
          <Button title={t('card.pay', { amount })} icon="lock" loading={busy} onPress={submitForm} />
        </StickyFooter>
      }>
      <LinearGradient colors={[C.redDark, C.redDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
        <Row between>
          <Icon name="integrated-circuit-chip" size={34} color="#E8C66A" />
          <Txt weight="extrabold" color={C.white} size={18}>
            {brand}
          </Txt>
        </Row>
        <Txt weight="semibold" color={C.white} size={20} style={{ letterSpacing: 2 }}>
          {savedCard ? `•••• •••• •••• ${savedCard.last4}` : formatCard(digits).padEnd(19, '•') || '•••• •••• •••• ••••'}
        </Txt>
        <Row between>
          <Txt v="smallMed" color="rgba(255,255,255,0.85)" numberOfLines={1} style={{ flex: 1 }}>
            {savedCard ? savedCard.bank : name.toUpperCase() || 'NAME ON CARD'}
          </Txt>
          <Txt v="smallMed" color="rgba(255,255,255,0.85)">
            {savedCard ? savedCard.expiry : expiry || 'MM/YY'}
          </Txt>
        </Row>
      </LinearGradient>

      {savedCard ? (
        <Field label={t('card.savedCvv', { card: `${savedCard.brand} •• ${savedCard.last4}` })} value={cvv} onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secureTextEntry maxLength={4} error={errors.cvv} icon="lock" />
      ) : (
        <>
          <Field label={t('card.number')} value={formatCard(number)} onChangeText={setNumber} keyboardType="number-pad" maxLength={23} placeholder="4111 1111 1111 1111" error={errors.number} icon="credit-card-outline" autoComplete="cc-number" />
          <Row gap={12} style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Field label={t('card.expiry')} value={expiry} onChangeText={(v) => setExpiry(formatExpiry(v))} keyboardType="number-pad" maxLength={5} placeholder="08/29" error={errors.expiry} autoComplete="cc-exp" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label={t('card.cvv')} value={cvv} onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secureTextEntry maxLength={4} placeholder="123" error={errors.cvv} autoComplete="cc-csc" />
            </View>
          </Row>
          <Field label={t('card.name')} value={name} onChangeText={setName} autoCapitalize="characters" error={errors.name} autoComplete="cc-name" />
          <Row between>
            <Txt v="smallMed" style={{ flex: 1 }}>
              {t('card.save')}
            </Txt>
            <Toggle value={save} onChange={setSave} />
          </Row>
          <Banner tone="blue">
            <Icon name="information" size={18} color={C.blue} />
            <Txt v="tiny" color={C.blue} style={{ flex: 1 }}>
              {t('card.hint')}
            </Txt>
          </Banner>
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: R.lg, padding: 20, gap: 18, aspectRatio: 1.62, justifyContent: 'space-between', boxShadow: '0px 12px 28px rgba(122,14,18,0.35)' },
  bank: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.blueSoft, padding: 14, borderRadius: R.md },
});
