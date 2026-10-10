import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Banner, Button, Card, Field, Icon, Row, Screen, StickyFooter, TopBar, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { useApp, usePassenger } from '@/store/useApp';
import { C } from '@/theme';
import { mmss, rupee } from '@/utils/format';
import { validVpa } from '@/utils/payment';

export default function UpiId() {
  const t = useT();
  const { id, vpa: preset } = useLocalSearchParams<{ id: string; vpa?: string }>();
  const intent = useApp((s) => s.intents.find((i) => i.id === id));
  const name = usePassenger()?.profile.name ?? 'Account holder';
  const setOutcome = useApp((s) => s.setIntentOutcome);
  const saveUpi = useApp((s) => s.saveUpi);
  const [vpa, setVpa] = useState(preset ?? '');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(!!preset);
  const [error, setError] = useState('');
  const [waitingSince, setWaitingSince] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const finish = () => {
    const fail = vpa.trim().toLowerCase() === 'fail@upi';
    if (!fail) saveUpi(vpa.trim().toLowerCase());
    setOutcome(id, { outcome: fail ? 'failed' : 'success', method: 'upi', methodLabel: vpa.trim(), failReason: fail ? 'fail.vpa' : undefined });
    router.replace({ pathname: '/pay/result', params: { id } });
  };

  useEffect(() => {
    if (waitingSince === null) return;
    const tick = setInterval(() => setNow(Date.now()), 500);
    const auto = setTimeout(finish, 6000);
    return () => {
      clearInterval(tick);
      clearTimeout(auto);
    };
    // finish reads the latest vpa; we only restart on a new request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitingSince]);

  const verify = () => {
    if (!validVpa(vpa)) {
      setError(t('upi.invalid'));
      return;
    }
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 900);
  };

  const left = waitingSince ? 300 - (now - waitingSince) / 1000 : 300;

  return (
    <Screen
      keyboard
      header={<TopBar title={t('pay.upiId')} subtitle={rupee(intent?.amount ?? 0)} />}
      footer={
        <StickyFooter>
          {waitingSince ? (
            <Button title={t('upi.approveDemo')} variant="success" icon="check" onPress={finish} />
          ) : (
            <Button
              title={t('upi.sendRequest')}
              disabled={!verified}
              onPress={() => {
                setNow(Date.now());
                setWaitingSince(Date.now());
              }}
            />
          )}
        </StickyFooter>
      }>
      <Field
        label={t('upi.idLabel')}
        placeholder={t('upi.idPh')}
        value={vpa}
        editable={!waitingSince}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        icon="at"
        onChangeText={(v) => {
          setVpa(v);
          setVerified(false);
          setError('');
        }}
        error={error}
        right={
          verified ? (
            <Icon name="check-decagram" size={22} color={C.green} />
          ) : (
            <Txt v="smallMed" color={C.red} onPress={verify}>
              {verifying ? '…' : t('upi.verify')}
            </Txt>
          )
        }
      />
      {verified ? (
        <Row gap={6}>
          <Icon name="account-check" size={18} color={C.green} />
          <Txt v="smallMed" color={C.green}>
            {t('upi.verified', { name })}
          </Txt>
        </Row>
      ) : null}
      {waitingSince ? (
        <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
          <ActivityIndicator size="large" color={C.red} />
          <Txt v="h3">{t('upi.request')}</Txt>
          <Txt v="small" color={C.inkSoft} center>
            {t('upi.approveIn', { amount: rupee(intent?.amount ?? 0), time: mmss(left) })}
          </Txt>
        </Card>
      ) : null}
      <View style={{ flex: 1 }} />
      <Banner tone="blue">
        <Icon name="information" size={18} color={C.blue} />
        <Txt v="tiny" color={C.blue} style={{ flex: 1 }}>
          {t('upi.idHint')}
        </Txt>
      </Banner>
    </Screen>
  );
}
