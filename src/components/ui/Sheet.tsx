import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, R } from '@/theme';

import { Icon } from './Icon';
import { Txt } from './Txt';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  scroll?: boolean;
}

export function Sheet({ visible, onClose, title, subtitle, children, scroll }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.root}>
        <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={s.grab} />
          {title ? (
            <View style={s.head}>
              <View style={{ flex: 1 }}>
                <Txt v="h2">{title}</Txt>
                {subtitle ? (
                  <Txt v="small" color={C.muted}>
                    {subtitle}
                  </Txt>
                ) : null}
              </View>
              <Pressable onPress={onClose} hitSlop={10} style={s.close} accessibilityLabel="Close">
                <Icon name="close" size={20} color={C.inkSoft} />
              </Pressable>
            </View>
          ) : null}
          {scroll ? (
            <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          ) : (
            <View style={{ gap: 8 }}>{children}</View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: C.overlay },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, paddingHorizontal: 18, paddingTop: 10, gap: 10 },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: C.lineStrong, marginBottom: 6 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
});
