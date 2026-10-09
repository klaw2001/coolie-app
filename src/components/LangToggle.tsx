import { Pressable, StyleSheet, View } from 'react-native';

import { useApp } from '@/store/useApp';
import { C, R } from '@/theme';

import { Txt } from './ui';

export function LangToggle({ light }: { light?: boolean }) {
  const lang = useApp((s) => s.lang);
  const setLang = useApp((s) => s.setLang);
  return (
    <View style={[s.wrap, light && s.light]}>
      {(['en', 'hi'] as const).map((l) => {
        const on = l === lang;
        return (
          <Pressable key={l} onPress={() => setLang(l)} style={[s.item, on && { backgroundColor: light ? C.white : C.red }]} accessibilityRole="button" accessibilityState={{ selected: on }}>
            <Txt v="tiny" color={on ? (light ? C.red : C.white) : light ? C.white : C.inkSoft}>
              {l === 'en' ? 'EN' : 'हिं'}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: R.pill, borderWidth: 1.5, borderColor: C.lineStrong, padding: 2, backgroundColor: C.white },
  light: { borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.12)' },
  item: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: R.pill, minWidth: 34, alignItems: 'center' },
});
