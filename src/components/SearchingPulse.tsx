import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { C } from '@/theme';

import { Logo } from './Logo';

export function SearchingPulse({ size = 220 }: { size?: number }) {
  const [rings] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));
  useEffect(() => {
    const anims = rings.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 600),
          Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [rings]);
  return (
    <View style={[s.wrap, { width: size, height: size }]}>
      {rings.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            s.ring,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
              transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
            },
          ]}
        />
      ))}
      <View style={s.core}>
        <Logo size={76} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', backgroundColor: C.red },
  core: { borderRadius: 22, boxShadow: '0px 10px 30px rgba(211,37,43,0.45)' },
});
