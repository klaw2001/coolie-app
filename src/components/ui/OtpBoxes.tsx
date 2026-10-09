import { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { C, F, R } from '@/theme';

import { Txt } from './Txt';

interface Props {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  error?: boolean;
  autoFocus?: boolean;
  secure?: boolean;
}

/** Row of digit boxes backed by one hidden input (works with SMS autofill and paste). */
export function OtpBoxes({ value, onChange, length = 4, error, autoFocus = true, secure }: Props) {
  const ref = useRef<TextInput>(null);
  const size = length > 4 ? 46 : 58;
  return (
    <Pressable onPress={() => ref.current?.focus()} style={s.row}>
      {Array.from({ length }).map((_, i) => {
        const ch = value[i];
        const active = i === value.length;
        return (
          <View
            key={i}
            style={[
              s.box,
              { width: size, height: size + 4 },
              active && { borderColor: C.red, backgroundColor: C.redTint },
              !!ch && { borderColor: C.ink },
              error && { borderColor: C.red, backgroundColor: C.redSoft },
            ]}>
            <Txt v="h1">{ch ? (secure ? '•' : ch) : ''}</Txt>
          </View>
        );
      })}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        style={s.hidden}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  box: { borderRadius: R.md, borderWidth: 1.5, borderColor: C.lineStrong, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white },
  hidden: { position: 'absolute', opacity: 0, width: '100%', height: '100%', fontFamily: F.regular },
});
