import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { PartnerTopBar } from '@/components/PartnerTopBar';
import { Banner, Button, Icon, OtpBoxes, Row, Screen, TopBar, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { findAccount, useApp } from '@/store/useApp';
import type { CoolieAccount, Role } from '@/store/types';
import { C } from '@/theme';
import { fmtPhone } from '@/utils/format';

const DEMO_OTP = '1234';

export default function Otp() {
  const t = useT();
  const params = useLocalSearchParams<{ app?: string; phone?: string; demo?: string }>();
  const app: Role = params.app === 'coolie' ? 'coolie' : 'passenger';
  const partner = app === 'coolie';
  const phone = params.phone ?? '';
  const autofill = params.demo === '1';
  const loginAs = useApp((s) => s.loginAs);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(30);
  const [resent, setResent] = useState(false);
  const [reading, setReading] = useState(autofill);

  const verify = (value: string) => {
    if (value.length < 4) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (value !== DEMO_OTP) {
        setError(true);
        return;
      }
      const acct = findAccount(useApp.getState(), app, phone);
      if (!acct) {
        router.replace({ pathname: partner ? '/partner-signup' : '/signup', params: { phone } });
      } else if (partner && (acct as CoolieAccount).kyc.status !== 'approved') {
        router.replace({ pathname: '/partner-review', params: { id: acct.id } });
      } else {
        // Starting a session swaps the auth stack for the signed-in app; the index route picks the right home.
        loginAs(app, acct.id);
      }
    }, 600);
  };

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  useEffect(() => {
    // Demo accounts: pretend the SMS arrived and fill the code digit by digit.
    if (!autofill) return;
    const timers = DEMO_OTP.split('').map((_, i) => setTimeout(() => setCode(DEMO_OTP.slice(0, i + 1)), 900 + i * 180));
    const done = setTimeout(() => {
      setReading(false);
      verify(DEMO_OTP);
    }, 900 + DEMO_OTP.length * 180 + 250);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
    // Runs once for the demo hand-off.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autofill]);

  return (
    <Screen keyboard edges={partner ? ['bottom'] : ['top']} header={partner ? <PartnerTopBar title={t('partner.name')} /> : <TopBar />}>
      <View style={{ gap: 6, marginTop: 8 }}>
        <Txt v="h1">{t('otp.title')}</Txt>
        <Txt v="body" color={C.inkSoft}>
          {t('otp.subtitle', { phone: fmtPhone(phone) })}
        </Txt>
        <Txt v="smallMed" color={C.red} onPress={() => router.back()}>
          {t('otp.editNumber')}
        </Txt>
      </View>
      <View style={{ marginVertical: 16 }}>
        <OtpBoxes
          value={code}
          error={error}
          autoFocus={!autofill}
          onChange={(v) => {
            setCode(v);
            setError(false);
            if (v.length === 4) verify(v);
          }}
        />
      </View>
      {error ? (
        <Txt v="smallMed" color={C.red} center>
          {t('otp.wrong')}
        </Txt>
      ) : null}
      {reading ? (
        <Row gap={8} style={{ justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={C.red} />
          <Txt v="smallMed" color={C.inkSoft}>
            {t('otp.reading')}
          </Txt>
        </Row>
      ) : (
        <Banner tone="blue">
          <Icon name="information" size={18} color={C.blue} />
          <Txt v="smallMed" color={C.blue} style={{ flex: 1 }}>
            {resent ? t('otp.resent') : t('otp.hint')}
          </Txt>
        </Banner>
      )}
      <Button title={t('otp.verify')} variant={partner ? 'dark' : 'primary'} loading={busy} disabled={code.length < 4} onPress={() => verify(code)} />
      {left > 0 ? (
        <Txt v="small" color={C.muted} center>
          {t('otp.resendIn', { s: `0:${String(left).padStart(2, '0')}` })}
        </Txt>
      ) : (
        <Txt
          v="smallMed"
          color={C.red}
          center
          onPress={() => {
            setLeft(30);
            setResent(true);
          }}>
          {t('otp.resend')}
        </Txt>
      )}
    </Screen>
  );
}
