import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Icon, Row, Screen, SectionTitle, TopBar, Txt } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { useLang, useT } from '@/i18n';
import { coolieBalance, coolieJobs, jobEarning, useApp } from '@/store/useApp';
import { C, R } from '@/theme';
import { dayLabel, fmtDateTime, rupee, startOfDay } from '@/utils/format';
import { txnTitle } from '@/utils/txn';
import { notify } from '@/utils/dialog';

export default function Earnings() {
  const t = useT();
  const lang = useLang();
  const now = useNow(60_000);
  const bookings = useApp((s) => s.bookings);
  const allTxns = useApp((s) => s.txns);
  const withdraw = useApp((s) => s.withdraw);
  const txns = allTxns.filter((x) => x.owner === 'coolie').sort((a, b) => b.at - a.at);
  const done = coolieJobs(bookings).filter((b) => b.status === 'completed');
  const today0 = startOfDay(now);
  const days = Array.from({ length: 7 }, (_, i) => today0 - (6 - i) * 86400000);
  const perDay = days.map((d) => done.filter((b) => b.statusAt >= d && b.statusAt < d + 86400000).reduce((x, b) => x + jobEarning(b), 0));
  const max = Math.max(1, ...perDay);
  const week = done.filter((b) => b.statusAt >= days[0]);
  const weekTotal = week.reduce((x, b) => x + jobEarning(b), 0);
  const tips = week.reduce((x, b) => x + (b.tip?.amount ?? 0), 0);
  const cash = week.filter((b) => b.payMethod === 'cash').reduce((x, b) => x + b.fare.total, 0);
  const online = week.filter((b) => b.payMethod !== 'cash').reduce((x, b) => x + b.fare.total, 0);
  const balance = coolieBalance(allTxns);

  return (
    <Screen header={<TopBar title={t('earn.title')} back={false} />}>
      <LinearGradient colors={[C.red, C.redDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <Txt v="smallMed" color="rgba(255,255,255,0.85)">
          {t('earn.week')}
        </Txt>
        <Txt v="display" color={C.white} size={36}>
          {rupee(weekTotal)}
        </Txt>
        <Txt v="small" color="rgba(255,255,255,0.85)">
          {week.length} {t('earn.trips')} · {t('earn.avg')} {rupee(week.length ? weekTotal / week.length : 0)}
        </Txt>
      </LinearGradient>

      <SectionTitle title={t('earn.daily')} />
      <Card>
        <View style={s.chart}>
          {perDay.map((v, i) => {
            const today = i === 6;
            return (
              <View key={i} style={s.col}>
                <Txt v="tiny" color={C.muted} size={10}>
                  {v ? `₹${v}` : ''}
                </Txt>
                <View style={[s.bar, { height: Math.max(4, (v / max) * 130), backgroundColor: today ? C.red : C.redSoft }]} />
                <Txt v="tiny" color={today ? C.red : C.muted} size={10}>
                  {dayLabel(days[i], lang).split(' ')[0]}
                </Txt>
              </View>
            );
          })}
        </View>
      </Card>

      <View style={s.tiles}>
        <Tile icon="cash" label={t('earn.cash')} value={rupee(cash)} />
        <Tile icon="cellphone-check" label={t('earn.online')} value={rupee(online)} />
        <Tile icon="hand-heart" label={t('earn.tips')} value={rupee(tips)} />
        <Tile icon="bag-suitcase" label={t('earn.trips')} value={String(week.length)} />
      </View>

      <Card style={{ gap: 12 }}>
        <Row between>
          <View>
            <Txt v="tiny" color={C.muted}>
              {t('earn.balance')}
            </Txt>
            <Txt v="h1">{rupee(balance)}</Txt>
          </View>
          <Icon name="bank" size={32} color={C.red} />
        </Row>
        <Button
          title={t('earn.withdraw')}
          size="md"
          icon="bank-transfer-out"
          disabled={balance <= 0}
          onPress={() => {
            const amt = withdraw();
            notify(amt ? t('earn.withdrawn', { amount: rupee(amt) }) : t('earn.nothing'));
          }}
        />
      </Card>

      <SectionTitle title={t('earn.payouts')} />
      <Card flat pad={6}>
        {txns.slice(0, 20).map((x) => (
          <View key={x.id} style={s.txn}>
            <View style={[s.txnIcon, { backgroundColor: x.dir === 'credit' ? C.greenSoft : C.blueSoft }]}>
              <Icon name={x.dir === 'credit' ? 'arrow-bottom-left' : 'bank-transfer-out'} size={18} color={x.dir === 'credit' ? C.green : C.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt v="smallMed" numberOfLines={1}>
                {txnTitle(x, t)}
              </Txt>
              <Txt v="tiny" color={C.muted}>
                {fmtDateTime(x.at, lang)}
              </Txt>
            </View>
            <Txt v="num" color={x.dir === 'credit' ? C.green : C.ink}>
              {x.dir === 'credit' ? '+' : '−'}
              {rupee(x.amount)}
            </Txt>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

function Tile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.tile}>
      <Icon name={icon} size={20} color={C.red} />
      <Txt v="h3">{value}</Txt>
      <Txt v="tiny" color={C.muted}>
        {label}
      </Txt>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { borderRadius: R.xl, padding: 20, gap: 4 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 180, gap: 6 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { width: '70%', borderRadius: 6 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '47.5%', flexGrow: 1, backgroundColor: C.white, borderRadius: R.lg, padding: 14, gap: 2, borderWidth: 1, borderColor: C.line },
  txn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  txnIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
