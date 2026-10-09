import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { Card, Icon, ListRow, Row, Screen, SectionTitle, TopBar, Txt } from '@/components/ui';
import { useT, type TKey } from '@/i18n';
import { C } from '@/theme';
import { notify } from '@/utils/dialog';

const FAQ: [TKey, TKey][] = [
  ['help.q1', 'help.a1'],
  ['help.q2', 'help.a2'],
  ['help.q3', 'help.a3'],
  ['help.q4', 'help.a4'],
  ['help.q5', 'help.a5'],
];

export default function Help() {
  const t = useT();
  const [open, setOpen] = useState<number>(0);
  return (
    <Screen header={<TopBar title={t('help.title')} />}>
      <SectionTitle title={t('help.faq')} />
      <Card flat pad={4}>
        {FAQ.map(([q, a], i) => (
          <Pressable key={q} onPress={() => setOpen(open === i ? -1 : i)} style={{ padding: 12, gap: 6, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
            <Row between>
              <Txt v="bodyMed" style={{ flex: 1 }}>
                {t(q)}
              </Txt>
              <Icon name={open === i ? 'chevron-up' : 'chevron-down'} size={22} color={C.muted} />
            </Row>
            {open === i ? (
              <Txt v="small" color={C.inkSoft}>
                {t(a)}
              </Txt>
            ) : null}
          </Pressable>
        ))}
      </Card>
      <SectionTitle title={t('help.contact')} />
      <Card flat pad={6}>
        <ListRow icon="headset" title={t('help.call')} subtitle={t('call.demo')} onPress={() => notify(t('help.call'), t('sos.supportBody'))} />
        <ListRow icon="email-outline" title={t('help.email')} subtitle="support@coolie.example" onPress={() => Linking.openURL('mailto:support@coolie.example').catch(() => {})} />
        <ListRow icon="train" title={t('sos.railway')} subtitle={t('sos.railwayBody')} onPress={() => Linking.openURL('tel:139').catch(() => {})} />
      </Card>
      <View style={{ height: 12 }} />
    </Screen>
  );
}
