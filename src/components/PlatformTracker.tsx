import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, View } from 'react-native';

import { STAGE_ICON, STAGES, stageKey, stageMs, stageVars } from '@/data/journey';
import { useLang, useT } from '@/i18n';
import type { Booking } from '@/store/types';
import { C } from '@/theme';

import { Chip, Icon, Txt } from './ui';

const COACH_W = 44;
const GAP = 4;

function Pulse() {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.pulse,
        { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] }) }] },
      ]}
    />
  );
}

/** Where along the train the coolie is (0..1 between stairs and coach), or null when off the platform. */
function platformProgress(b: Booking, now: number): { at: 'stairs' | 'coach' | 'between'; t: number } | null {
  const stages = STAGES[b.journeyType];
  const id = stages[b.stage];
  const frac = (from: number, dur: number) => Math.min(b.mode === 'manual' ? 0.92 : 1, Math.max(0, (now - from) / dur));
  if (b.journeyType === 'train_to_exit') {
    if (b.status === 'accepted') return { at: 'between', t: 1 - frac(b.statusAt, b.arriveMs ?? 14000) };
    if (b.status === 'arrived') return { at: 'coach', t: 1 };
    if (b.status === 'in_progress') {
      if (id === 'loaded') return { at: 'coach', t: 1 };
      if (id === 'on_platform') return { at: 'between', t: 1 - frac(b.stageAt, stageMs(id)) };
      return null;
    }
    return null;
  }
  if (b.status === 'completed') return { at: 'coach', t: 1 };
  if (b.status !== 'in_progress') return null;
  if (id === 'at_platform') return { at: 'between', t: frac(b.stageAt, stageMs(id)) };
  if (id === 'at_coach') return { at: 'coach', t: 1 };
  return null;
}

export function TrainStrip({ booking: b, now }: { booking: Booking; now: number }) {
  const t = useT();
  const scroll = useRef<ScrollView>(null);
  const comp = b.train.composition;
  const coachIdx = Math.max(0, comp.indexOf(b.train.coach));
  const mid = Math.floor(comp.length / 2);
  const stairsIdx = Math.abs(mid - coachIdx) < 2 ? Math.min(comp.length - 1, coachIdx + 3) : mid;
  const x = (i: number) => i * (COACH_W + GAP) + COACH_W / 2;
  const prog = platformProgress(b, now);
  const coolieX = prog ? x(stairsIdx) + (x(coachIdx) - x(stairsIdx)) * prog.t : null;

  return (
    <View style={s.wrap}>
      <View style={s.chips}>
        <Chip label={t('tracker.platform', { pf: b.train.platform })} icon="sign-real-estate" selected />
        <Chip label={t('common.coach', { c: b.train.coach })} icon="train-car" />
        <Chip label={t('common.seat', { s: b.train.seat })} icon="seat-recline-normal" />
      </View>
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          scroll.current?.scrollTo({ x: Math.max(0, x(coachIdx) - w / 2), animated: false });
        }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 30 }}>
        <View style={{ width: comp.length * (COACH_W + GAP), paddingTop: 34 }}>
          <View style={[s.stairs, { left: x(stairsIdx) - 18 }]}>
            <Icon name="stairs" size={16} color={C.inkSoft} />
          </View>
          {coolieX !== null ? (
            <View style={[s.coolie, { left: coolieX - 15 }]}>
              <Icon name="human-dolly" size={18} color={C.white} />
            </View>
          ) : null}
          <View style={s.platformLine} />
          <View style={s.train}>
            {comp.map((c, i) => {
              const mine = i === coachIdx;
              const eng = c === 'ENG';
              return (
                <View key={i} style={[s.coach, eng && s.eng, mine && s.mine]}>
                  {eng ? (
                    <Icon name="train" size={16} color={C.white} />
                  ) : (
                    <Txt v="tiny" color={mine ? C.white : C.inkSoft}>
                      {c}
                    </Txt>
                  )}
                </View>
              );
            })}
          </View>
          <View style={[s.mineTag, { left: x(coachIdx) - 40 }]}>
            <Icon name="menu-up" size={18} color={C.red} />
            <Txt v="tiny" color={C.red}>
              {t('tracker.yourCoach')}
            </Txt>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export function TripSteps({ booking: b }: { booking: Booking }) {
  const t = useT();
  const lang = useLang();
  const stages = STAGES[b.journeyType];
  const vars = stageVars(b, lang);
  const steps = [
    { key: 'meet', icon: 'handshake', label: t('stage.meet', vars) },
    ...stages.map((id) => ({ key: id, icon: STAGE_ICON[id], label: t(stageKey(b.journeyType, id), vars) })),
    { key: 'done', icon: 'check-decagram', label: t('stage.done') },
  ];
  const current =
    b.status === 'accepted' || b.status === 'arrived'
      ? 0
      : b.status === 'in_progress'
        ? b.stage + 1
        : b.status === 'completed'
          ? steps.length
          : -1;
  return (
    <View>
      {steps.map((st, i) => {
        const done = i < current;
        const cur = i === current;
        return (
          <View key={st.key} style={s.step}>
            <View style={s.rail}>
              <View style={[s.dot, done && s.dotDone, cur && s.dotCur]}>
                {cur ? <Pulse /> : null}
                <Icon name={done ? 'check' : st.icon} size={15} color={done || cur ? C.white : C.muted} />
              </View>
              {i < steps.length - 1 ? <View style={[s.line, done && { backgroundColor: C.green }]} /> : null}
            </View>
            <Txt v={cur ? 'bodyMed' : 'small'} color={done ? C.inkSoft : cur ? C.ink : C.muted} style={s.stepLabel}>
              {st.label}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 14 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  platformLine: { height: 6, backgroundColor: '#D9CFC5', borderRadius: 3, marginBottom: 6 },
  train: { flexDirection: 'row', gap: GAP },
  coach: { width: COACH_W, height: 30, borderRadius: 6, backgroundColor: '#F2E8E6', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.lineStrong },
  eng: { backgroundColor: C.inkSoft, borderColor: C.inkSoft },
  mine: { backgroundColor: C.red, borderColor: C.redDark },
  mineTag: { position: 'absolute', bottom: -34, width: 80, alignItems: 'center' },
  stairs: { position: 'absolute', top: 6, width: 36, height: 22, borderRadius: 6, backgroundColor: C.white, borderWidth: 1, borderColor: C.lineStrong, alignItems: 'center', justifyContent: 'center' },
  coolie: { position: 'absolute', top: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: C.red, borderWidth: 2, borderColor: C.white, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  step: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 30 },
  dot: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.lineStrong, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: C.green, borderColor: C.green },
  dotCur: { backgroundColor: C.red, borderColor: C.red },
  pulse: { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: C.red },
  line: { width: 2, flex: 1, minHeight: 18, backgroundColor: C.line },
  stepLabel: { flex: 1, paddingTop: 4, paddingBottom: 14 },
});
