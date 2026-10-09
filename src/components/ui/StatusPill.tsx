import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import type { BookingStatus } from '@/store/types';
import { C, R } from '@/theme';

import { Txt } from './Txt';

const TONE: Record<BookingStatus, [string, string]> = {
  payment_pending: [C.amberSoft, C.amber],
  scheduled: [C.blueSoft, C.blue],
  searching: [C.amberSoft, C.amber],
  accepted: [C.redSoft, C.redDark],
  arrived: [C.redSoft, C.redDark],
  in_progress: [C.redSoft, C.redDark],
  completed: [C.greenSoft, C.green],
  cancelled: ['#F1ECEB', C.inkSoft],
};

export function StatusPill({ status }: { status: BookingStatus }) {
  const t = useT();
  const [bg, fg] = TONE[status];
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <View style={[s.dot, { backgroundColor: fg }]} />
      <Txt v="tiny" color={fg}>
        {t(`status.${status}`)}
      </Txt>
    </View>
  );
}

const s = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: R.pill, alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
