import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { C } from '@/theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  bg?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  keyboard?: boolean;
}

export function Screen({ children, scroll = true, edges = ['top'], bg = C.bg, header, footer, contentStyle, keyboard }: Props) {
  const body = scroll ? (
    <ScrollView
      style={s.flex}
      contentContainerStyle={[s.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[s.flex, contentStyle]}>{children}</View>
  );
  const inner = (
    <>
      {header}
      {body}
      {footer}
    </>
  );
  return (
    <SafeAreaView edges={edges} style={[s.flex, { backgroundColor: bg }]}>
      {keyboard ? (
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {inner}
        </KeyboardAvoidingView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
});
