import { StyleSheet, View } from 'react-native';

import { Banner, Card, Icon, KV, Screen, SectionTitle, TopBar, Txt } from '@/components/ui';
import { EXTRA_PER_20KG, MAX_KG_PER_COOLIE, PER_KM, SLABS, TROLLEY, WHEELCHAIR } from '@/data/fare';
import { useT } from '@/i18n';
import { C, R } from '@/theme';
import { rupee } from '@/utils/format';

export default function RateCard() {
  const t = useT();
  return (
    <Screen header={<TopBar title={t('rate.title')} />}>
      <SectionTitle title={t('rate.slabs')} />
      <View style={s.grid}>
        {SLABS.map((sl, i) => (
          <View key={sl.upTo} style={s.slab}>
            <Icon name="weight-kilogram" size={26} color={C.red} />
            <Txt v="small" color={C.inkSoft}>
              {i === 0 ? t('rate.upTo', { kg: sl.upTo }) : t('rate.range', { from: SLABS[i - 1].upTo + 1, to: sl.upTo })}
            </Txt>
            <Txt v="h1" color={C.red}>
              {rupee(sl.price)}
            </Txt>
          </View>
        ))}
        <View style={[s.slab, { backgroundColor: C.ink, borderColor: C.ink }]}>
          <Icon name="plus-circle" size={26} color={C.white} />
          <Txt v="small" color="rgba(255,255,255,0.85)">
            {t('rate.extra')}
          </Txt>
          <Txt v="h1" color={C.white}>
            +{rupee(EXTRA_PER_20KG)}
          </Txt>
        </View>
      </View>
      <SectionTitle title={t('rate.other')} />
      <Card style={{ gap: 6 }}>
        <KV k={t('rate.km')} v={t('rate.kmValue', { rate: PER_KM })} />
        <KV k={t('addon.trolley')} v={rupee(TROLLEY)} />
        <KV k={t('addon.wheelchair')} v={rupee(WHEELCHAIR)} />
      </Card>
      <Card style={{ gap: 10 }}>
        {[t('rate.note1'), t('rate.note2').replace('60', String(MAX_KG_PER_COOLIE)), t('rate.note3')].map((n) => (
          <View key={n} style={{ flexDirection: 'row', gap: 8 }}>
            <Icon name="check-circle" size={18} color={C.green} />
            <Txt v="small" style={{ flex: 1 }}>
              {n}
            </Txt>
          </View>
        ))}
      </Card>
      <Banner tone="amber">
        <Icon name="calculator-variant" size={18} color={C.amber} />
        <Txt v="smallMed" color={C.amber} style={{ flex: 1 }}>
          {t('rate.example')}
        </Txt>
      </Banner>
    </Screen>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slab: { width: '47.5%', flexGrow: 1, backgroundColor: C.white, borderRadius: R.lg, padding: 16, gap: 4, borderWidth: 1, borderColor: C.line },
});
