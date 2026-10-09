import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BookShell } from '@/components/BookShell';
import { Banner, Button, Chip, Icon, Txt } from '@/components/ui';
import { direction } from '@/data/journey';
import { useLang, useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import { C, R } from '@/theme';
import { dayLabel, fmtDateTime, fmtTime, startOfDay } from '@/utils/format';

const Q = 15 * 60000;
const ceilQ = (ms: number) => Math.ceil(ms / Q) * Q;
const floorQ = (ms: number) => Math.floor(ms / Q) * Q;

export default function ScheduleStep() {
  const t = useT();
  const lang = useLang();
  const draft = useApp((s) => s.draft);
  const patchDraft = useApp((s) => s.patchDraft);
  const [now] = useState(() => Date.now());
  const train = draft.train;

  const arrival = direction(draft.journeyType) === 'arrival';
  const home = draft.journeyType === 'home_to_train';
  const trainTime = train?.time ?? now;
  const latest = arrival ? trainTime + 60 * 60000 : trainTime - (home ? 60 : 30) * 60000;
  const earliest = arrival ? Math.max(now + 30 * 60000, trainTime - 15 * 60000) : Math.max(now + 30 * 60000, latest - 3 * 3600000);
  const slots: number[] = [];
  for (let x = ceilQ(earliest); x <= latest; x += Q) slots.push(x);
  const recTarget = arrival ? floorQ(trainTime) : floorQ(trainTime - (home ? 90 : 45) * 60000);
  const recommended = slots.length ? slots.reduce((a, b) => (Math.abs(b - recTarget) < Math.abs(a - recTarget) ? b : a)) : undefined;
  const days = Array.from(new Set(slots.map(startOfDay)));

  const [when, setWhen] = useState<'now' | 'later'>(slots.length ? draft.when : 'now');
  const initialSlot = draft.scheduledAt && slots.includes(draft.scheduledAt) ? draft.scheduledAt : recommended;
  const [slot, setSlot] = useState<number | undefined>(initialSlot);
  const [day, setDay] = useState<number>(initialSlot ? startOfDay(initialSlot) : (days[0] ?? startOfDay(now)));

  if (!train) return null;
  const far = !arrival && trainTime - now > 6 * 3600000;
  const valid = when === 'now' || !!slot;

  return (
    <BookShell
      step={4}
      title={t('book.when.title')}
      footer={
        <Button
          title={t('common.continue')}
          iconRight="arrow-right"
          disabled={!valid}
          onPress={() => {
            patchDraft({ when, scheduledAt: when === 'later' ? slot : undefined });
            router.push('/book/review');
          }}
        />
      }>
      <Banner tone="blue">
        <Icon name="train-variant" size={18} color={C.blue} />
        <Txt v="smallMed" color={C.blue} style={{ flex: 1 }}>
          {arrival ? t('book.when.trainArrives', { when: fmtDateTime(trainTime, lang) }) : t('book.when.trainDeparts', { when: fmtDateTime(trainTime, lang) })}
        </Txt>
      </Banner>

      <View style={s.options}>
        <Option icon="lightning-bolt" title={t('book.when.now')} body={t('book.when.nowBody')} on={when === 'now'} onPress={() => setWhen('now')} />
        <Option icon="calendar-clock" title={t('book.when.later')} body={t('book.when.laterBody')} on={when === 'later'} disabled={!slots.length} onPress={() => setWhen('later')} />
      </View>

      {when === 'now' && far ? (
        <Banner tone="amber">
          <Icon name="clock-alert-outline" size={18} color={C.amber} />
          <Txt v="small" color={C.amber} style={{ flex: 1 }}>
            {t('book.when.nowWarn')}
          </Txt>
        </Banner>
      ) : null}

      {when === 'later' ? (
        slots.length === 0 ? (
          <Txt v="small" color={C.muted}>
            {t('book.when.noSlots')}
          </Txt>
        ) : (
          <>
            <Txt v="smallMed" color={C.inkSoft}>
              {t('book.when.pickDay')}
            </Txt>
            <View style={s.wrap}>
              {days.map((d) => (
                <Chip key={d} label={dayLabel(d, lang)} selected={d === day} onPress={() => setDay(d)} />
              ))}
            </View>
            <Txt v="smallMed" color={C.inkSoft}>
              {t('book.when.pickTime')}
            </Txt>
            <View style={s.wrap}>
              {slots
                .filter((x) => startOfDay(x) === day)
                .map((x) => (
                  <Chip key={x} label={fmtTime(x, lang)} selected={x === slot} onPress={() => setSlot(x)} sub={x === recommended ? '★' : undefined} />
                ))}
            </View>
            {recommended ? (
              <Txt v="tiny" color={C.muted}>
                ★ {t('book.when.recommended')}: {fmtTime(recommended, lang)}
              </Txt>
            ) : null}
          </>
        )
      ) : null}
    </BookShell>
  );
}

function Option({ icon, title, body, on, onPress, disabled }: { icon: string; title: string; body: string; on: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[s.option, on && s.optionOn, disabled && { opacity: 0.4 }]} accessibilityRole="radio" accessibilityState={{ checked: on }}>
      <View style={[s.optIcon, on && { backgroundColor: C.red }]}>
        <Icon name={icon} size={24} color={on ? C.white : C.red} />
      </View>
      <Txt v="h3">{title}</Txt>
      <Txt v="tiny" color={C.muted}>
        {body}
      </Txt>
    </Pressable>
  );
}

const s = StyleSheet.create({
  options: { flexDirection: 'row', gap: 12 },
  option: { flex: 1, gap: 6, padding: 14, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.white },
  optionOn: { borderColor: C.red, backgroundColor: C.redTint },
  optIcon: { width: 44, height: 44, borderRadius: R.sm, backgroundColor: C.redSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
