import { StyleSheet, View } from 'react-native';

import { Txt } from './Txt';

/** The brass arm badge ("billa") every licensed railway coolie wears, with their number on it. */
export function Billa({ number, size = 'md' }: { number: string; size?: 'sm' | 'md' | 'lg' }) {
  const big = size === 'lg';
  const small = size === 'sm';
  return (
    <View style={[s.outer, big && { paddingHorizontal: 18, paddingVertical: 10 }, small && { paddingHorizontal: 8, paddingVertical: 2 }]}>
      <View style={s.inner}>
        {!small ? (
          <Txt v="tiny" color="#5C4310" weight="semibold" size={big ? 11 : 9}>
            LICENSED PORTER
          </Txt>
        ) : null}
        <Txt weight="extrabold" color="#4A350A" size={big ? 22 : small ? 11 : 14} style={{ letterSpacing: 1 }}>
          {number}
        </Txt>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outer: {
    alignSelf: 'flex-start',
    backgroundColor: '#D9AE48',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#A87D1E',
    paddingHorizontal: 12,
    paddingVertical: 4,
    boxShadow: 'inset 0px 1px 0px rgba(255,255,255,0.55), 0px 2px 4px rgba(90,60,10,0.25)',
  },
  inner: { alignItems: 'center' },
});

