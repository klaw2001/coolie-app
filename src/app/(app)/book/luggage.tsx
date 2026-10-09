import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BookShell } from '@/components/BookShell';
import { Button, Card, Icon, Row, SectionTitle, Stepper, Toggle, Txt } from '@/components/ui';
import { BAGS, bagCount, bagWeight } from '@/data/bags';
import { calcFare, MAX_COOLIES, MAX_KG_PER_COOLIE, minCoolies, TROLLEY, WHEELCHAIR } from '@/data/fare';
import { loc, useLang, useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import type { BagId } from '@/store/types';
import { C, R } from '@/theme';
import { rupee } from '@/utils/format';

export default function LuggageStep() {
  const t = useT();
  const lang = useLang();
  const draft = useApp((s) => s.draft);
  const patchDraft = useApp((s) => s.patchDraft);

  const base = bagWeight(draft.bags);
  const weight = base > 0 ? Math.max(1, base + draft.weightAdjust) : 0;
  const min = minCoolies(weight);
  const coolies = Math.max(draft.coolies, min);
  const fare = calcFare(weight, coolies, draft.distanceKm, draft.addons);
  const count = bagCount(draft.bags);

  const setBag = (id: BagId, n: number) => {
    const bags = { ...draft.bags, [id]: n };
    const nb = bagWeight(bags);
    const adj = nb > 0 ? Math.max(draft.weightAdjust, 1 - nb) : 0;
    patchDraft({ bags, weightAdjust: adj, coolies: Math.max(draft.coolies, minCoolies(nb + adj)) });
  };

  const setWeight = (w: number) => {
    patchDraft({ weightAdjust: w - base, coolies: Math.max(draft.coolies, minCoolies(w)) });
  };

  return (
    <BookShell
      step={3}
      title={t('book.luggage.title')}
      footer={
        <Row gap={14}>
          <View style={{ flex: 1 }}>
            <Txt v="tiny" color={C.muted}>
              {t('book.luggage.fareNow')}
            </Txt>
            <Txt v="h1">{rupee(fare.total)}</Txt>
          </View>
          <Button
            title={t('common.continue')}
            full={false}
            disabled={count === 0}
            iconRight="arrow-right"
            onPress={() => {
              patchDraft({ coolies });
              router.push('/book/schedule');
            }}
          />
        </Row>
      }>
      <Txt v="small" color={C.inkSoft}>
        {t('book.luggage.sub')}
      </Txt>
      <Card pad={8}>
        {BAGS.map((b, i) => (
          <View key={b.id} style={[s.bag, i > 0 && { borderTopWidth: 1, borderTopColor: C.line }]}>
            <View style={s.bagIcon}>
              <Icon name={b.icon} size={24} color={C.red} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt v="bodyMed">{loc(lang, b.name, b.nameHi)}</Txt>
              <Txt v="tiny" color={C.muted}>
                {t('book.luggage.approx', { kg: b.kg })}
              </Txt>
            </View>
            <Stepper value={draft.bags[b.id] ?? 0} onChange={(n) => setBag(b.id, n)} max={10} />
          </View>
        ))}
      </Card>

      {count === 0 ? (
        <Txt v="smallMed" color={C.muted} center>
          {t('book.luggage.empty')}
        </Txt>
      ) : (
        <>
          <Card style={{ gap: 12 }}>
            <Row between>
              <View>
                <Txt v="tiny" color={C.muted}>
                  {t('book.luggage.estimate')}
                </Txt>
                <Txt v="h1">{t('common.kg', { n: weight })}</Txt>
              </View>
              <Stepper value={weight} onChange={setWeight} min={Math.max(1, base - 20)} max={base + 40} />
            </Row>
            <Txt v="tiny" color={C.muted}>
              {t('book.luggage.adjust')} · {t(count === 1 ? 'unit.bag' : 'unit.bags', { n: count })}
            </Txt>
          </Card>

          <Card style={{ gap: 10 }}>
            <Row between>
              <View style={{ flex: 1 }}>
                <Txt v="h3">{t('book.luggage.coolies')}</Txt>
                <Txt v="tiny" color={C.muted}>
                  {t('book.luggage.perCoolie', { kg: fare.perCoolieKg })} · {rupee(fare.perCoolie)} / {t('unit.coolie', { n: 1 })}
                </Txt>
              </View>
              <Stepper value={coolies} onChange={(n) => patchDraft({ coolies: n })} min={min} max={MAX_COOLIES} />
            </Row>
            <View style={s.people}>
              {Array.from({ length: coolies }).map((_, i) => (
                <View key={i} style={s.person}>
                  <Icon name="human-dolly" size={22} color={C.white} />
                </View>
              ))}
            </View>
            <Txt v="tiny" color={C.inkSoft}>
              {t('book.luggage.cooliesHelp', { kg: MAX_KG_PER_COOLIE })}
              {min > 1 ? ` ${t('book.luggage.minNote', { n: min, kg: weight })}` : ''}
            </Txt>
          </Card>
        </>
      )}

      <SectionTitle title={t('book.luggage.addons')} />
      <Card pad={8}>
        <View style={s.addon}>
          <View style={s.bagIcon}>
            <Icon name="dolly" size={24} color={C.red} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt v="bodyMed">
              {t('addon.trolley')} · {rupee(TROLLEY)}
            </Txt>
            <Txt v="tiny" color={C.muted}>
              {t('addon.trolleyBody')}
            </Txt>
          </View>
          <Toggle value={draft.addons.trolley} onChange={(v) => patchDraft({ addons: { ...draft.addons, trolley: v } })} />
        </View>
        <View style={[s.addon, { borderTopWidth: 1, borderTopColor: C.line }]}>
          <View style={s.bagIcon}>
            <Icon name="wheelchair-accessibility" size={24} color={C.red} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt v="bodyMed">
              {t('addon.wheelchair')} · {rupee(WHEELCHAIR)}
            </Txt>
            <Txt v="tiny" color={C.muted}>
              {t('addon.wheelchairBody')}
            </Txt>
          </View>
          <Toggle value={draft.addons.wheelchair} onChange={(v) => patchDraft({ addons: { ...draft.addons, wheelchair: v } })} />
        </View>
      </Card>
    </BookShell>
  );
}

const s = StyleSheet.create({
  bag: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8 },
  bagIcon: { width: 44, height: 44, borderRadius: R.sm, backgroundColor: C.redSoft, alignItems: 'center', justifyContent: 'center' },
  people: { flexDirection: 'row', gap: 8 },
  person: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.brass },
  addon: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8 },
});
