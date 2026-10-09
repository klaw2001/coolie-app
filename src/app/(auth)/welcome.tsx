import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LangToggle } from '@/components/LangToggle';
import { Logo } from '@/components/Logo';
import { Button, Icon, Txt } from '@/components/ui';
import { useT, type TKey } from '@/i18n';
import { useApp } from '@/store/useApp';
import { C } from '@/theme';

const SLIDES: { icons: [string, string]; title: TKey; body: TKey }[] = [
  { icons: ['human-dolly', 'train'], title: 'welcome.slide1.title', body: 'welcome.slide1.body' },
  { icons: ['scale-balance', 'currency-inr'], title: 'welcome.slide2.title', body: 'welcome.slide2.body' },
  { icons: ['map-marker-path', 'seat-recline-normal'], title: 'welcome.slide3.title', body: 'welcome.slide3.body' },
];

export default function Welcome() {
  const t = useT();
  const { width } = useWindowDimensions();
  const finish = useApp((s) => s.finishOnboarding);
  const ref = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const last = page === SLIDES.length - 1;

  const start = () => {
    finish();
    router.replace('/login');
  };

  return (
    <LinearGradient colors={[C.red, C.redDark, C.redDeep]} style={{ flex: 1 }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.top}>
          <View style={s.brand}>
            <Logo size={40} bg={C.white} fg={C.red} />
            <Txt v="h1" color={C.white}>
              {t('app.name')}
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
          {SLIDES.map((sl, i) => (
            <View key={i} style={[s.slide, { width }]}>
              <View style={s.art}>
                <View style={s.ringOuter}>
                  <View style={s.ringInner}>
                    <Icon name={sl.icons[0]} size={84} color={C.white} />
                  </View>
                </View>
                <View style={s.chip}>
                  <Icon name={sl.icons[1]} size={30} color={C.red} />
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
            {SLIDES.map((_, i) => (
              <View key={i} style={[s.dot, i === page && s.dotOn]} />
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
            {t('app.tagline')}
          </Txt>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
