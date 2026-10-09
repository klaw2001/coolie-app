import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Banner, Button, Icon, OtpBoxes, Screen, TopBar, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import { C } from '@/theme';
import { fmtPhone } from '@/utils/format';

export default function Otp() {
  const t = useT();
  const { phone = '' } = useLocalSearchParams<{ phone: string }>();
  const login = useApp((s) => s.login);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(30);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const verify = (value = code) => {
    if (value.length < 4) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (value === '1234') {
        // Flipping loggedIn swaps the auth stack for the app stack, and the index route takes it from there.
        login(phone);
      } else {
        setError(true);
      }
    }, 700);
  };

  return (
    <Screen keyboard header={<TopBar />}>
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
      <Banner tone="blue">
        <Icon name="information" size={18} color={C.blue} />
        <Txt v="smallMed" color={C.blue} style={{ flex: 1 }}>
          {resent ? t('otp.resent') : t('otp.hint')}
        </Txt>
      </Banner>
      <Button title={t('otp.verify')} loading={busy} disabled={code.length < 4} onPress={() => verify()} />
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
