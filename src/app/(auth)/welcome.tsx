import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LangToggle } from '@/components/LangToggle';
import { Logo, PartnerLogo } from '@/components/Logo';
import { Button, Icon, Txt } from '@/components/ui';
import { useT, type TKey } from '@/i18n';
import { useApp } from '@/store/useApp';
import type { Role } from '@/store/types';
import { C, PC } from '@/theme';

type Slide = { icons: [string, string]; title: TKey; body: TKey };

const SLIDES: Record<Role, Slide[]> = {
  passenger: [
    { icons: ['human-dolly', 'train'], title: 'welcome.slide1.title', body: 'welcome.slide1.body' },
    { icons: ['scale-balance', 'currency-inr'], title: 'welcome.slide2.title', body: 'welcome.slide2.body' },
    { icons: ['map-marker-path', 'seat-recline-normal'], title: 'welcome.slide3.title', body: 'welcome.slide3.body' },
  ],
  coolie: [
    { icons: ['bell-ring', 'train'], title: 'pw.s1.title', body: 'pw.s1.body' },
    { icons: ['tag-check', 'scale-balance'], title: 'pw.s2.title', body: 'pw.s2.body' },
    { icons: ['bank', 'cash-multiple'], title: 'pw.s3.title', body: 'pw.s3.body' },
  ],
};

export default function Welcome() {
  const t = useT();
  const { app: appParam } = useLocalSearchParams<{ app?: string }>();
  const app: Role = appParam === 'coolie' ? 'coolie' : 'passenger';
  const partner = app === 'coolie';
  const { width } = useWindowDimensions();
  const markOnboarded = useApp((s) => s.markOnboarded);
  const ref = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const slides = SLIDES[app];
  const last = page === slides.length - 1;

  const start = () => {
    markOnboarded(app);
    router.replace({ pathname: '/login', params: { app } });
  };

  return (
    <LinearGradient colors={partner ? [PC.night2, PC.night, '#0E0809'] : [C.red, C.redDark, C.redDeep]} style={{ flex: 1 }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.top}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={s.back} accessibilityLabel={t('common.back')}>
            <Icon name="arrow-left" size={22} color={C.white} />
          </Pressable>
          <View style={s.brand}>
            {partner ? <PartnerLogo size={36} /> : <Logo size={36} bg={C.white} fg={C.red} />}
            <Txt v="h2" color={C.white}>
              {partner ? t('partner.name') : t('app.name')}
            </Txt>
          </View>
          <LangToggle light />
        </View>

        <ScrollView
          ref={ref}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
          style={{ flex: 1 }}>
          {slides.map((sl, i) => (
            <View key={i} style={[s.slide, { width }]}>
              <View style={s.art}>
                <View style={[s.ringOuter, partner && { backgroundColor: 'rgba(232,196,104,0.08)' }]}>
                  <View style={[s.ringInner, partner && { backgroundColor: 'rgba(211,37,43,0.35)' }]}>
                    <Icon name={sl.icons[0]} size={84} color={C.white} />
                  </View>
                </View>
                <View style={[s.chip, partner && { backgroundColor: PC.brassLight, borderColor: C.red }]}>
                  <Icon name={sl.icons[1]} size={30} color={partner ? PC.night : C.red} />
                </View>
              </View>
              <Txt v="display" color={C.white} center>
                {t(sl.title)}
              </Txt>
              <Txt v="body" color="rgba(255,255,255,0.86)" center style={{ maxWidth: 340 }}>
                {t(sl.body)}
              </Txt>
            </View>
          ))}
        </ScrollView>

        <View style={s.bottom}>
          <View style={s.dots}>
            {slides.map((_, i) => (
              <View key={i} style={[s.dot, i === page && [s.dotOn, partner && { backgroundColor: PC.brassLight }]]} />
            ))}
          </View>
          <Button
            variant="light"
            title={last ? t('welcome.getStarted') : t('welcome.next')}
            iconRight="arrow-right"
            onPress={() => {
              if (last) start();
              else {
                ref.current?.scrollTo({ x: (page + 1) * width, animated: true });
                setPage(page + 1);
              }
            }}
          />
          {!last ? (
            <Pressable onPress={start} style={s.skip} accessibilityRole="button">
              <Txt v="bodyMed" color="rgba(255,255,255,0.9)">
                {t('welcome.skip')}
              </Txt>
            </Pressable>
          ) : (
            <View style={s.skip} />
          )}
          <Txt v="tiny" color="rgba(255,255,255,0.7)" center>
            {partner ? t('partner.tagline') : t('app.tagline')}
          </Txt>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 14 },
  art: { marginBottom: 24 },
  ringOuter: { width: 210, height: 210, borderRadius: 105, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  chip: { position: 'absolute', right: 6, bottom: 18, width: 62, height: 62, borderRadius: 31, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: C.brass },
  bottom: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  skip: { height: 48, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotOn: { width: 26, backgroundColor: C.white },
});
