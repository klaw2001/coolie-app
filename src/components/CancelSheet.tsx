import { useState } from 'react';

import { useT, type TKey } from '@/i18n';
import { C } from '@/theme';

import { Button, ListRow, Sheet, Icon } from './ui';

const REASONS: TKey[] = ['reason.plans', 'reason.late', 'reason.mistake', 'reason.self', 'reason.other'];

export function CancelSheet({ visible, onClose, onConfirm }: { visible: boolean; onClose: () => void; onConfirm: (reason: TKey) => void }) {
  const t = useT();
  const [reason, setReason] = useState<TKey>('reason.plans');
  return (
    <Sheet visible={visible} onClose={onClose} title={t('trip.cancelTitle')} subtitle={t('trip.cancelReason')}>
      {REASONS.map((r) => (
        <ListRow
          key={r}
          title={t(r)}
          chevron={false}
          selected={r === reason}
          onPress={() => setReason(r)}
          right={<Icon name={r === reason ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={r === reason ? C.red : C.lineStrong} />}
        />
      ))}
      <Button title={t('trip.cancel')} variant="primary" onPress={() => onConfirm(reason)} style={{ marginTop: 6 }} />
      <Button title={t('common.back')} variant="ghost" onPress={onClose} />
    </Sheet>
  );
}
