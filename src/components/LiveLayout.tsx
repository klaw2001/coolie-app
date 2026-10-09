import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { activeRoute, cooliePosition, stationGate } from '@/data/journey';
import { station } from '@/data/stations';
import { loc, useLang, useT } from '@/i18n';
import type { Booking } from '@/store/types';
import { C, R } from '@/theme';

import { TripMap } from './map/TripMap';
import type { MapMarker } from './map/types';
import { TrainStrip } from './PlatformTracker';
import { Icon, Segmented, StickyFooter, Txt } from './ui';

export type LiveView = 'map' | 'station';

interface Props {
  booking: Booking;
  now: number;
  view: LiveView;
  onView: (v: LiveView) => void;
  topRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Map or station view on top, scrolling trip panel underneath. Shared by the passenger and coolie trip screens. */
export function LiveLayout({ booking: b, now, view, onView, topRight, children, footer }: Props) {
  const t = useT();
  const lang = useLang();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const topH = Math.max(300, Math.round(height * 0.42));
  const st = station(b.stationCode);
  const scroll = useRef<ScrollView>(null);
  const phase = `${b.status}-${b.stage}`;
  useEffect(() => {
    // Each new phase brings new info (OTP, next step) to the top of the panel.
    scroll.current?.scrollTo({ y: 0, animated: true });
  }, [phase]);

  const markers: MapMarker[] = [];
  const coachLabel = `${t('common.pf', { n: b.train.platform })} · ${b.train.coach}`;
  if (b.journeyType === 'home_to_train') {
    markers.push({ id: 'meet', coord: b.meet.coord, kind: 'home', label: loc(lang, b.meet.subtitle ?? b.meet.title, b.meet.subtitleHi ?? b.meet.titleHi) });
    markers.push({ id: 'station', coord: stationGate(b.stationCode), kind: 'station', label: st.code });
  } else if (b.journeyType === 'gate_to_train') {
    markers.push({ id: 'meet', coord: b.meet.coord, kind: 'pickup', label: loc(lang, b.meet.title, b.meet.titleHi) });
    markers.push({ id: 'drop', coord: b.drop.coord, kind: 'station', label: coachLabel });
  } else {
    markers.push({ id: 'meet', coord: b.meet.coord, kind: 'station', label: coachLabel });
    markers.push({ id: 'drop', coord: b.drop.coord, kind: 'drop', label: loc(lang, b.drop.title, b.drop.titleHi) });
  }
  const pos = cooliePosition(b, now);
  if (pos) markers.push({ id: 'coolie', coord: pos, kind: 'coolie' });
  const fitKey = `${view}-${b.status}-${b.journeyType === 'home_to_train' && b.status === 'in_progress' ? Math.min(b.stage, 2) : 0}`;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />
      <View style={{ height: topH }}>
        {view === 'map' ? (
          <TripMap markers={markers} route={activeRoute(b)} fitKey={fitKey} padding={{ top: insets.top + 90, right: 60, bottom: 70, left: 60 }} />
        ) : (
          <View style={[s.station, { paddingTop: insets.top + 70 }]}>
            <View style={s.board}>
              <Icon name="train" size={18} color="#FFD25E" />
              <Txt v="smallMed" color="#FFD25E" numberOfLines={1} style={{ flex: 1 }}>
                {b.train.number} {b.train.name.toUpperCase()}
              </Txt>
              <Txt v="smallMed" color="#FFD25E">
                {t('common.pf', { n: b.train.platform })}
              </Txt>
            </View>
            <TrainStrip booking={b} now={now} />
          </View>
        )}
        <View style={[s.float, { top: insets.top + 10 }]}>
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.round} accessibilityLabel={t('common.back')}>
            <Icon name="arrow-left" size={22} color={C.ink} />
          </Pressable>
          <View style={{ flex: 1, maxWidth: 230 }}>
            <Segmented
              dense
              value={view}
              onChange={onView}
              options={[
                { value: 'map', label: t('trip.mapTab'), icon: 'map' },
                { value: 'station', label: t('trip.stationTab'), icon: 'train-car' },
              ]}
            />
          </View>
          {topRight ?? <View style={{ width: 42 }} />}
        </View>
      </View>
      <View style={s.panel}>
        <View style={s.grab} />
        <ScrollView ref={scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        {footer ? <StickyFooter>{footer}</StickyFooter> : null}
      </View>
    </View>
  );
}

export function SosButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.round, { backgroundColor: C.red, borderColor: C.red }]} accessibilityLabel="SOS">
      <Txt v="tiny" color={C.white} weight="extrabold">
        SOS
      </Txt>
    </Pressable>
  );
}

const s = StyleSheet.create({
  station: { flex: 1, backgroundColor: '#F4ECE6', paddingHorizontal: 4, gap: 14 },
  board: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12, backgroundColor: '#1D1A17', borderRadius: R.sm, paddingHorizontal: 12, paddingVertical: 8 },
  float: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  round: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line, boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' },
  panel: { flex: 1, marginTop: -22, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', boxShadow: '0px -8px 24px rgba(0,0,0,0.10)' },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: C.lineStrong, marginTop: 8 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
});
