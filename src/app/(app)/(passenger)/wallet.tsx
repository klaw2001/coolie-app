import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Empty, Icon, ListRow, Row, Screen, SectionTitle, TopBar, Txt } from '@/components/ui';
import { useLang, useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import { C, R } from '@/theme';
import { fmtDateTime, rupee } from '@/utils/format';
import { txnTitle } from '@/utils/txn';
import { confirmDialog } from '@/utils/dialog';

export default function Wallet() {
  const t = useT();
  const lang = useLang();
  const balance = useApp((s) => s.walletBalance);
  const allTxns = useApp((s) => s.txns);
  const txns = allTxns.filter((x) => x.owner === 'passenger');
  const cards = useApp((s) => s.savedCards);
  const vpas = useApp((s) => s.savedUpi);
  const removeCard = useApp((s) => s.removeCard);
  const removeUpi = useApp((s) => s.removeUpi);

  const confirmRemove = (label: string, fn: () => void) =>
    confirmDialog(t('wallet.remove'), label, { ok: t('wallet.remove'), cancel: t('common.cancel'), destructive: true, onOk: fn });

  return (
    <Screen header={<TopBar title={t('wallet.title')} back={false} />}>
      <LinearGradient colors={[C.red, C.redDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.balance}>
        <Row between>
          <Txt v="smallMed" color="rgba(255,255,255,0.85)">
            {t('wallet.balance')}
          </Txt>
          <Icon name="wallet" size={26} color="rgba(255,255,255,0.85)" />
        </Row>
        <Txt v="display" color={C.white} size={38}>
          {rupee(balance)}
        </Txt>
        <Button title={t('wallet.add')} variant="light" size="md" icon="plus" full={false} onPress={() => router.push('/topup')} />
      </LinearGradient>

      <SectionTitle title={t('wallet.methods')} />
      <Card flat pad={6}>
        {cards.length === 0 && vpas.length === 0 ? (
          <Txt v="small" color={C.muted} style={{ padding: 10 }}>
            {t('wallet.noMethods')}
          </Txt>
        ) : null}
        {cards.map((c) => (
          <ListRow
            key={c.id}
            icon="credit-card"
            iconColor={C.blue}
            iconBg={C.blueSoft}
            title={`${c.brand} •• ${c.last4}`}
            subtitle={`${c.bank} · ${c.expiry}`}
            chevron={false}
            right={<Icon name="delete-outline" size={22} color={C.muted} onPress={() => confirmRemove(`${c.brand} •• ${c.last4}`, () => removeCard(c.id))} />}
          />
        ))}
        {vpas.map((v) => (
          <ListRow
            key={v}
            icon="at"
            iconColor={C.green}
            iconBg={C.greenSoft}
            title={v}
            subtitle="UPI"
            chevron={false}
            right={<Icon name="delete-outline" size={22} color={C.muted} onPress={() => confirmRemove(v, () => removeUpi(v))} />}
          />
        ))}
      </Card>

      <SectionTitle title={t('wallet.history')} />
      {txns.length === 0 ? (
        <Empty icon="receipt" title={t('wallet.empty')} />
      ) : (
        <Card flat pad={6}>
          {txns
            .slice()
            .sort((a, b) => b.at - a.at)
            .map((x) => (
              <View key={x.id} style={s.txn}>
                <View style={[s.txnIcon, { backgroundColor: x.dir === 'credit' ? C.greenSoft : C.redSoft }]}>
                  <Icon name={x.dir === 'credit' ? 'arrow-bottom-left' : 'arrow-top-right'} size={18} color={x.dir === 'credit' ? C.green : C.red} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt v="smallMed" numberOfLines={1}>
                    {txnTitle(x, t)}
                  </Txt>
                  <Txt v="tiny" color={C.muted}>
                    {fmtDateTime(x.at, lang)} · {t(`method.${x.method}`)}
                  </Txt>
                </View>
                <Txt v="num" color={x.dir === 'credit' ? C.green : C.ink}>
                  {x.dir === 'credit' ? '+' : '−'}
                  {rupee(x.amount)}
                </Txt>
              </View>
            ))}
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  balance: { borderRadius: R.xl, padding: 20, gap: 8, boxShadow: '0px 12px 28px rgba(122,14,18,0.3)' },
  txn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  txnIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
