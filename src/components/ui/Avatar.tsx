import { StyleSheet, View } from 'react-native';

import { C } from '@/theme';
import { initials } from '@/utils/format';

import { Icon } from './Icon';
import { Txt } from './Txt';

interface Props {
  name: string;
  size?: number;
  color?: string;
  coolie?: boolean;
}

/** Initials avatar. Coolies get a small red-uniform ring so they read as porters at a glance. */
export function Avatar({ name, size = 48, color = C.red, coolie }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          s.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
          coolie && { borderWidth: 3, borderColor: C.white, outlineColor: C.red, outlineWidth: 2 },
        ]}>
        <Txt weight="bold" size={size * 0.36} color={C.white}>
          {initials(name)}
        </Txt>
      </View>
      {coolie ? (
        <View style={[s.badge, { width: size * 0.42, height: size * 0.42, borderRadius: size * 0.21 }]}>
          <Icon name="bag-suitcase" size={size * 0.24} color={C.white} />
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: C.brass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.white,
  },
});
