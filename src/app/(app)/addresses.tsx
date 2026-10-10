import { router } from 'expo-router';

import { Button, Card, Empty, Icon, ListRow, Screen, StickyFooter, TopBar } from '@/components/ui';
import { loc, useLang, useT } from '@/i18n';
import { useApp, usePassenger } from '@/store/useApp';
import { C } from '@/theme';
import { confirmDialog } from '@/utils/dialog';

export default function Addresses() {
  const t = useT();
  const lang = useLang();
  const me = usePassenger();
  const addresses = me?.addresses ?? [];
  const remove = useApp((s) => s.removeAddress);
  const stationCode = me?.profile.stationCode ?? 'CSMT';

  const add = () => router.push({ pathname: '/book/map-pick', params: { station: stationCode, standalone: '1' } });

  return (
    <Screen
      header={<TopBar title={t('addr.title')} />}
      footer={
        <StickyFooter>
          <Button title={t('addr.add')} icon="plus" onPress={add} />
        </StickyFooter>
      }>
      {addresses.length === 0 ? (
        <Empty icon="map-marker-off" title={t('addr.empty')} />
      ) : (
        <Card flat pad={6}>
          {addresses.map((a) => (
            <ListRow
              key={a.id}
              icon={a.label === 'home' ? 'home-variant' : a.label === 'work' ? 'briefcase' : 'map-marker'}
              title={a.line}
              subtitle={`${t(`label.${a.label}`)} · ${loc(lang, a.area, a.areaHi)}`}
              chevron={false}
              right={
                <Icon
                  name="delete-outline"
                  size={22}
                  color={C.muted}
                  onPress={() =>
                    confirmDialog(t('addr.delete'), a.line, { ok: t('addr.delete'), cancel: t('common.cancel'), destructive: true, onOk: () => remove(a.id) })
                  }
                />
              }
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}
