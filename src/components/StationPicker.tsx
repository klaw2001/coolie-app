import { useState } from 'react';

import { STATIONS } from '@/data/stations';
import { loc, useLang, useT } from '@/i18n';

import { Field, ListRow, Sheet } from './ui';

export function StationPicker({ visible, onClose, onPick, value }: { visible: boolean; onClose: () => void; onPick: (code: string) => void; value?: string }) {
  const t = useT();
  const lang = useLang();
  const [q, setQ] = useState('');
  const list = STATIONS.filter((s) => {
    const k = q.trim().toLowerCase();
    if (!k) return true;
    return [s.name, s.nameHi, s.city, s.cityHi, s.code].some((x) => x.toLowerCase().includes(k));
  });
  return (
    <Sheet visible={visible} onClose={onClose} title={t('station.pick')} scroll>
      <Field icon="magnify" placeholder={t('station.search')} value={q} onChangeText={setQ} autoCorrect={false} />
      {list.map((s) => (
        <ListRow
          key={s.code}
          icon="train"
          title={`${loc(lang, s.name, s.nameHi)} (${s.code})`}
          subtitle={`${loc(lang, s.city, s.cityHi)} · ${t('station.platforms', { n: s.platforms })}`}
          selected={s.code === value}
          chevron={false}
          onPress={() => {
            onPick(s.code);
            onClose();
            setQ('');
          }}
        />
      ))}
    </Sheet>
  );
}
