import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PickMap } from '@/components/map/PickMap';
import { Button, Chip, Field, Icon, Row, StickyFooter, TopBar, Txt } from '@/components/ui';
import { AREAS, nearestArea } from '@/data/areas';
import { MAX_HOME_KM, PER_KM } from '@/data/fare';
import { station } from '@/data/stations';
import { loc, useLang, useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import type { Address, LatLng } from '@/store/types';
import { C, R } from '@/theme';
import { km, rupee } from '@/utils/format';
import { roadKm } from '@/utils/geo';

export default function MapPick() {
  const t = useT();
  const lang = useLang();
  const params = useLocalSearchParams<{ station?: string; standalone?: string }>();
  const draft = useApp((s) => s.draft);
  const addAddress = useApp((s) => s.addAddress);
  const patchDraft = useApp((s) => s.patchDraft);
  const standalone = params.standalone === '1';
  const code = params.station ?? draft.train?.stationCode ?? 'CSMT';
  const st = station(code);
  const start = !standalone && draft.meet?.kind === 'address' ? draft.meet.coord : (AREAS[code]?.[0]?.coord ?? st.coord);
  const [coord, setCoord] = useState<LatLng>(start);
  const [line, setLine] = useState('');
  const [label, setLabel] = useState<Address['label']>('home');

  const area = nearestArea(code, coord);
  const d = roadKm(coord, st.coord);
  const tooFar = d > MAX_HOME_KM;

  const confirm = () => {
    const a = addAddress({ label, line: line.trim() || area.name, area: area.name, areaHi: area.nameHi, coord });
    if (standalone) {
      router.back();
      return;
    }
    patchDraft({
      meet: { kind: 'address', id: a.id, title: a.line, subtitle: area.name, subtitleHi: area.nameHi, coord },
      distanceKm: d,
    });
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1 }}>
        <PickMap initial={start} onChange={setCoord} reference={{ coord: st.coord, label: st.code }} />
        <View pointerEvents="none" style={s.pinWrap}>
          <View style={s.pinBubble}>
            <Txt v="tiny" color={C.white}>
              {t('map.drag')}
            </Txt>
          </View>
          <Icon name="map-marker" size={48} color={C.red} />
        </View>
        <SafeAreaView edges={['top']} style={s.top}>
          <View style={s.topCard}>
            <TopBar title={t('map.title')} icon="close" />
          </View>
        </SafeAreaView>
      </View>
      <StickyFooter>
        <Row gap={10}>
          <View style={s.areaIcon}>
            <Icon name="map-marker-radius" size={22} color={C.red} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt v="bodyMed">{t('map.near', { area: loc(lang, area.name, area.nameHi) })}</Txt>
            <Txt v="tiny" color={tooFar ? C.red : C.muted}>
              {tooFar ? t('book.point.tooFar', { km: MAX_HOME_KM }) : `${t('book.point.away', { km: km(d, lang) })} · ${t('book.point.charge', { amount: rupee(Math.round(d * PER_KM)) })}`}
            </Txt>
          </View>
        </Row>
        <Field placeholder={t('map.flatPh')} label={t('map.flat')} value={line} onChangeText={setLine} />
        <Row gap={8}>
          <Txt v="smallMed" color={C.inkSoft}>
            {t('map.label')}
          </Txt>
          {(['home', 'work', 'other'] as const).map((l) => (
            <Chip key={l} label={t(`label.${l}`)} selected={label === l} onPress={() => setLabel(l)} />
          ))}
        </Row>
        <Button title={t('map.confirm')} onPress={confirm} disabled={tooFar} />
      </StickyFooter>
    </View>
  );
}

const s = StyleSheet.create({
  pinWrap: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingBottom: 48 },
  pinBubble: { backgroundColor: C.ink, paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.pill, marginBottom: 2 },
  top: { position: 'absolute', left: 0, right: 0, top: 0 },
  topCard: { margin: 12, backgroundColor: C.white, borderRadius: R.lg, boxShadow: '0px 6px 18px rgba(0,0,0,0.12)' },
  areaIcon: { width: 42, height: 42, borderRadius: R.sm, backgroundColor: C.redSoft, alignItems: 'center', justifyContent: 'center' },
});
