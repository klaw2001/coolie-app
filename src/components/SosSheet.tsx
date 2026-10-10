import { Linking, Share } from 'react-native';

import { station } from '@/data/stations';
import { useT } from '@/i18n';
import { usePassenger } from '@/store/useApp';
import type { Booking } from '@/store/types';
import { C } from '@/theme';
import { confirmDialog, notify } from '@/utils/dialog';

import { ListRow, Sheet } from './ui';

export function SosSheet({ visible, onClose, booking }: { visible: boolean; onClose: () => void; booking: Booking }) {
  const t = useT();
  const contact = usePassenger()?.profile.emergencyName;
  const dial = (num: string) => {
    confirmDialog(t('sos.title'), t('sos.confirmDial', { num }), { ok: t('common.call'), cancel: t('common.cancel'), onOk: () => Linking.openURL(`tel:${num}`).catch(() => {}) });
  };
  const share = () => {
    const st = station(booking.stationCode);
    Share.share({
      message: t('trip.shareText', {
        coolie: booking.coolie?.name ?? '-',
        badge: booking.coolie?.badge ?? '-',
        train: `${booking.train.number} ${booking.train.name}`,
        coach: booking.train.coach,
        station: st.name,
        id: booking.id,
      }),
    }).catch(() => {});
  };
  return (
    <Sheet visible={visible} onClose={onClose} title={t('sos.title')} subtitle={t('sos.sub')}>
      <ListRow icon="train" title={t('sos.railway')} subtitle={t('sos.railwayBody')} onPress={() => dial('139')} />
      <ListRow icon="police-badge" title={t('sos.police')} subtitle={t('sos.policeBody')} onPress={() => dial('112')} />
      <ListRow
        icon="share-variant"
        iconColor={C.blue}
        iconBg={C.blueSoft}
        title={t('sos.share')}
        subtitle={contact ? t('sos.shareBody', { name: contact }) : t('sos.shareBodyNone')}
        onPress={share}
      />
      <ListRow
        icon="headset"
        iconColor={C.green}
        iconBg={C.greenSoft}
        title={t('sos.support')}
        subtitle={t('sos.supportBody')}
        onPress={() => {
          onClose();
          notify(t('sos.support'), t('sos.supportBody'));
        }}
      />
    </Sheet>
  );
}
