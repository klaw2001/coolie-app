import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNow } from '@/hooks/useNow';
import { useT } from '@/i18n';
import { C } from '@/theme';
import { maskPhone, mmss } from '@/utils/format';

import { Avatar, Icon, Txt } from './ui';

interface Props {
  visible: boolean;
  onClose: () => void;
  name: string;
  phone: string;
  color?: string;
}

/** A pretend phone call, so the demo never dials a real number. */
export function CallSheet({ visible, ...rest }: Props) {
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={rest.onClose} statusBarTranslucent>
      {visible ? <Call {...rest} /> : null}
    </Modal>
  );
}

function Call({ onClose, name, phone, color }: Omit<Props, 'visible'>) {
  const t = useT();
  const [start] = useState(() => Date.now());
  const now = useNow(500);
  const elapsed = Math.max(0, (now - start) / 1000);
  const connected = elapsed > 2.5;
  return (
    <LinearGradient colors={[C.redDeep, '#2A0A0B']} style={StyleSheet.absoluteFill}>
      <SafeAreaView style={s.root}>
        <View style={s.top}>
          <Txt v="small" color="rgba(255,255,255,0.7)">
            {t('call.demo')}
          </Txt>
          <Avatar name={name} size={96} color={color ?? C.red} />
          <Txt v="h1" color={C.white}>
            {name}
          </Txt>
          <Txt v="bodyMed" color="rgba(255,255,255,0.8)">
            {connected ? `${t('call.connected')} · ${mmss(elapsed - 2.5)}` : t('call.calling')}
          </Txt>
          <Txt v="small" color="rgba(255,255,255,0.6)">
            {maskPhone(phone)}
          </Txt>
        </View>
        <View style={s.bottom}>
          <Txt v="small" color="rgba(255,255,255,0.7)" center>
            {t('call.masked', { name })}
          </Txt>
          <Pressable onPress={onClose} style={s.end} accessibilityLabel={t('call.end')}>
            <Icon name="phone-hangup" size={32} color={C.white} />
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between', padding: 24 },
  top: { alignItems: 'center', gap: 10, marginTop: 40 },
  bottom: { alignItems: 'center', gap: 22, marginBottom: 24 },
  end: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E53935', alignItems: 'center', justifyContent: 'center' },
});
