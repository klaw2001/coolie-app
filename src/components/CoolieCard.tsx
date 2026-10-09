import { Pressable, StyleSheet, View } from 'react-native';

import { loc, useLang, useT } from '@/i18n';
import type { AssignedCoolie } from '@/store/types';
import { C, R } from '@/theme';

import { Avatar, Billa, Icon, Txt } from './ui';

interface Props {
  coolie: AssignedCoolie;
  onCall?: () => void;
  onChat?: () => void;
  onSos?: () => void;
  unread?: number;
  title?: string;
}

export function CoolieCard({ coolie, onCall, onChat, onSos, unread = 0, title }: Props) {
  const t = useT();
  const lang = useLang();
  return (
    <View style={s.wrap}>
      <View style={s.top}>
        <Avatar name={coolie.name} color={coolie.color} size={54} coolie />
        <View style={{ flex: 1, gap: 2 }}>
          {title ? (
            <Txt v="tiny" color={C.muted}>
              {title}
            </Txt>
          ) : null}
          <Txt v="h3" numberOfLines={1}>
            {loc(lang, coolie.name, coolie.nameHi)}
            {coolie.isYou ? ` (${t('common.you')})` : ''}
          </Txt>
          <View style={s.meta}>
            <Icon name="star" size={14} color="#E9A912" />
            <Txt v="smallMed">{coolie.rating.toFixed(1)}</Txt>
            <Txt v="small" color={C.muted}>
              · {t('trip.trips', { n: coolie.trips.toLocaleString('en-IN') })} · {t('trip.years', { n: coolie.years })}
            </Txt>
          </View>
          <Billa number={coolie.badge} size="sm" />
        </View>
      </View>
      {onCall || onChat || onSos ? (
        <View style={s.actions}>
          {onCall ? <Action icon="phone" label={t('common.call')} onPress={onCall} /> : null}
          {onChat ? <Action icon="message-text" label={t('common.chat')} onPress={onChat} badge={unread} /> : null}
          {onSos ? <Action icon="alarm-light" label={t('common.sos')} onPress={onSos} danger /> : null}
        </View>
      ) : null}
    </View>
  );
}

function Action({ icon, label, onPress, danger, badge = 0 }: { icon: string; label: string; onPress: () => void; danger?: boolean; badge?: number }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.action, danger && s.danger, pressed && { opacity: 0.8 }]} accessibilityRole="button">
      <Icon name={icon} size={18} color={danger ? C.white : C.red} />
      <Txt v="smallMed" color={danger ? C.white : C.red}>
        {label}
      </Txt>
      {badge > 0 ? (
        <View style={s.badge}>
          <Txt v="tiny" color={C.white} size={10}>
            {badge}
          </Txt>
        </View>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: R.md, backgroundColor: C.redSoft },
  danger: { backgroundColor: C.red },
  badge: { position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: C.white },
});
