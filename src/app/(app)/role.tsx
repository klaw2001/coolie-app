import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { Icon, Screen, Txt } from '@/components/ui';
import { useT, type TKey } from '@/i18n';
import { useApp } from '@/store/useApp';
import type { Role } from '@/store/types';
import { C, R, shadow } from '@/theme';

const OPTIONS: { role: Role; icon: string; title: TKey; body: TKey }[] = [
  { role: 'passenger', icon: 'bag-suitcase', title: 'role.passenger', body: 'role.passengerBody' },
  { role: 'coolie', icon: 'human-dolly', title: 'role.coolie', body: 'role.coolieBody' },
];

export default function RolePick() {
  const t = useT();
  const setRole = useApp((s) => s.setRole);
  const hasPassenger = useApp((s) => !!s.passenger);
  const hasCoolie = useApp((s) => !!s.coolie);

  const pick = (role: Role) => {
    setRole(role);
    const ready = role === 'passenger' ? hasPassenger : hasCoolie;
    if (ready) router.replace('/');
    else router.push({ pathname: '/setup', params: { role } });
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 12 }}>
        <Logo size={64} />
        <Txt v="h1" center>
          {t('role.title')}
        </Txt>
        <Txt v="body" color={C.muted} center>
          {t('role.subtitle')}
        </Txt>
      </View>
      {OPTIONS.map((o) => (
        <Pressable key={o.role} onPress={() => pick(o.role)} style={({ pressed }) => [s.card, pressed && { transform: [{ scale: 0.99 }] }]}>
          <View style={[s.icon, o.role === 'coolie' && { backgroundColor: C.red }]}>
            <Icon name={o.icon} size={36} color={o.role === 'coolie' ? C.white : C.red} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt v="h2">{t(o.title)}</Txt>
            <Txt v="small" color={C.inkSoft}>
              {t(o.body)}
            </Txt>
          </View>
          <Icon name="chevron-right" size={26} color={C.red} />
        </Pressable>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: R.xl, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.line, ...shadow.md },
  icon: { width: 72, height: 72, borderRadius: R.lg, backgroundColor: C.redSoft, alignItems: 'center', justifyContent: 'center' },
});
