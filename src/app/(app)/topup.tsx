import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Chip, Field, Screen, StickyFooter, TopBar, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { useApp, usePassenger } from '@/store/useApp';
import { C } from '@/theme';
import { rupee } from '@/utils/format';

const QUICK = [100, 200, 500, 1000, 2000];

export default function Topup() {
  const t = useT();
  const balance = usePassenger()?.walletBalance ?? 0;
  const createIntent = useApp((s) => s.createIntent);
  const [amount, setAmount] = useState('500');
  const n = Number(amount) || 0;
  const valid = n >= 50 && n <= 10000;

  return (
    <Screen
      keyboard
      header={<TopBar title={t('topup.title')} subtitle={`${t('wallet.balance')}: ${rupee(balance)}`} />}
      footer={
        <StickyFooter>
          <Button title={t('topup.proceed', { amount: rupee(n) })} disabled={!valid} onPress={() => router.push(`/pay/${createIntent(n, 'topup')}`)} />
        </StickyFooter>
      }>
      <Field label={t('topup.amount')} prefix="₹" keyboardType="number-pad" value={amount} onChangeText={(v) => setAmount(v.replace(/\D/g, '').slice(0, 5))} help={t('topup.limits')} error={amount && !valid ? t('topup.limits') : undefined} style={{ fontSize: 24 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {QUICK.map((q) => (
          <Chip key={q} label={rupee(q)} selected={n === q} onPress={() => setAmount(String(q))} />
        ))}
      </View>
      <Txt v="tiny" color={C.muted}>
        {t('pay.secure')}
      </Txt>
    </Screen>
  );
}
