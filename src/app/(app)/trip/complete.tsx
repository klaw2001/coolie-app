import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FareBreakdown } from '@/components/FareBreakdown';
import { Avatar, Button, Card, Chip, Field, Icon, Row, Screen, Segmented, Stars, StickyFooter, Txt } from '@/components/ui';
import { station } from '@/data/stations';
import { useBooking } from '@/hooks/useBooking';
import { loc, useLang, useT, type TKey } from '@/i18n';
import { useApp } from '@/store/useApp';
import { C } from '@/theme';
import { rupee } from '@/utils/format';
import { backToTab } from '@/utils/nav';

const TAGS: TKey[] = ['tag.polite', 'tag.ontime', 'tag.careful', 'tag.fast', 'tag.helpful'];
const TIPS = [0, 20, 50, 100];

export default function Complete() {
  const t = useT();
  const lang = useLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const b = useBooking(id);
  const markCashPaid = useApp((s) => s.markCashPaid);
  const submitRating = useApp((s) => s.submitRating);
  const createIntent = useApp((s) => s.createIntent);
  const [stars, setStars] = useState(b?.rating?.stars ?? 0);
  const [tags, setTags] = useState<string[]>(b?.rating?.tags ?? []);
  const [comment, setComment] = useState(b?.rating?.comment ?? '');
  const [tip, setTip] = useState(0);
  const [custom, setCustom] = useState('');
  const [tipMethod, setTipMethod] = useState<'online' | 'cash'>('online');
  const [error, setError] = useState('');

  if (!b || !b.coolie) return null;
  const name = loc(lang, b.coolie.name, b.coolie.nameHi);
  const tipAmount = custom ? Math.min(1000, Number(custom) || 0) : tip;
  const cashDue = b.payStatus === 'cash_due';
  const alreadyTipped = !!b.tip;
  const st = station(b.stationCode);

  const submit = () => {
    if (cashDue) return setError(t('done.needCash'));
    if (!stars) return setError(t('done.needStars'));
    const online = tipAmount > 0 && tipMethod === 'online' && !alreadyTipped;
    submitRating(b.id, { stars, tags: tags.map((x) => x.replace('tag.', '')), comment: comment.trim() || undefined }, !alreadyTipped && tipAmount > 0 && tipMethod === 'cash' ? tipAmount : undefined);
    if (online) router.push(`/pay/${createIntent(tipAmount, 'tip', b.id)}`);
    else backToTab('/home', `/booking/${b.id}`);
  };

  return (
    <Screen
      keyboard
      footer={
        <StickyFooter>
          {error ? (
            <Txt v="smallMed" color={C.red} center>
              {error}
            </Txt>
          ) : null}
          <Button
            title={tipAmount > 0 && tipMethod === 'online' && !alreadyTipped ? t('done.submitTip', { amount: rupee(tipAmount) }) : t('done.submit')}
            onPress={submit}
          />
          <Button title={t('done.skip')} variant="ghost" size="md" onPress={() => backToTab('/home')} />
        </StickyFooter>
      }>
      <View style={s.hero}>
        <View style={s.check}>
          <Icon name="check-bold" size={44} color={C.white} />
        </View>
        <Txt v="h1" center>
          {t('done.title')}
        </Txt>
        <Txt v="body" color={C.inkSoft} center>
          {b.journeyType === 'train_to_exit' ? t('done.subArrival', { city: loc(lang, st.city, st.cityHi) }) : t('done.sub')}
        </Txt>
      </View>

      {cashDue ? (
        <Card style={{ gap: 12, borderColor: C.amber, borderWidth: 1.5 }}>
          <Row gap={10}>
            <Icon name="cash" size={26} color={C.amber} />
            <Txt v="h3" style={{ flex: 1 }}>
              {t('done.payCash', { amount: rupee(b.fare.total), name })}
            </Txt>
          </Row>
          <Button
            title={t('done.markPaid')}
            variant="success"
            size="md"
            icon="check"
            onPress={() => {
              markCashPaid(b.id);
              setError('');
            }}
          />
        </Card>
      ) : (
        <Card style={{ gap: 8 }}>
          <Row gap={8}>
            <Icon name="check-decagram" size={20} color={C.green} />
            <Txt v="smallMed" color={C.green}>
              {b.payMethod === 'cash' ? t('done.cashPaid') : t('trip.prepaid', { amount: rupee(b.fare.total) })}
            </Txt>
          </Row>
          <FareBreakdown fare={b.fare} />
        </Card>
      )}

      <Card style={{ alignItems: 'center', gap: 12 }}>
        <Avatar name={b.coolie.name} color={b.coolie.color} size={64} coolie />
        <Txt v="h3">{t('done.rate')}</Txt>
        <Txt v="small" color={C.muted}>
          {name} · {b.coolie.badge}
        </Txt>
        <Stars
          value={stars}
          size={40}
          onChange={(n) => {
            setStars(n);
            setError('');
          }}
        />
        {stars > 0 ? (
          <>
            <Txt v="smallMed" color={C.inkSoft}>
              {t('done.tags')}
            </Txt>
            <View style={s.wrap}>
              {TAGS.map((k) => (
                <Chip key={k} label={t(k)} selected={tags.includes(k)} onPress={() => setTags(tags.includes(k) ? tags.filter((x) => x !== k) : [...tags, k])} />
              ))}
            </View>
            <View style={{ alignSelf: 'stretch' }}>
              <Field placeholder={t('done.comment')} value={comment} onChangeText={setComment} multiline style={{ minHeight: 60, textAlignVertical: 'top' }} />
            </View>
          </>
        ) : null}
      </Card>

      {!alreadyTipped ? (
        <Card style={{ gap: 12 }}>
          <Txt v="h3">{t('done.tip')}</Txt>
          <Txt v="tiny" color={C.muted}>
            {t('done.tipNote', { name })}
          </Txt>
          <View style={s.wrap}>
            {TIPS.map((x) => (
              <Chip
                key={x}
                label={x === 0 ? '—' : `₹${x}`}
                selected={!custom && tip === x}
                onPress={() => {
                  setTip(x);
                  setCustom('');
                }}
              />
            ))}
          </View>
          <Field placeholder={t('done.tipCustom')} prefix="₹" keyboardType="number-pad" value={custom} onChangeText={(v) => setCustom(v.replace(/\D/g, '').slice(0, 4))} />
          {tipAmount > 0 ? (
            <>
              <Txt v="smallMed" color={C.inkSoft}>
                {t('done.tipMethod')}
              </Txt>
              <Segmented
                value={tipMethod}
                onChange={setTipMethod}
                options={[
                  { value: 'online', label: t('done.tipOnline'), icon: 'cellphone' },
                  { value: 'cash', label: t('done.tipCash'), icon: 'cash' },
                ]}
              />
            </>
          ) : null}
        </Card>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: 'center', gap: 6, paddingVertical: 12 },
  check: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginBottom: 6, borderWidth: 6, borderColor: C.greenSoft },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
});

