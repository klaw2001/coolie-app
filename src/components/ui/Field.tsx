import { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { C, F, R } from '@/theme';

import { Icon } from './Icon';
import { Txt } from './Txt';

interface Props extends TextInputProps {
  label?: string;
  prefix?: string;
  icon?: string;
  error?: string;
  help?: string;
  right?: React.ReactNode;
  optionalLabel?: string;
}

export const Field = forwardRef<TextInput, Props>(function Field(
  { label, prefix, icon, error, help, right, optionalLabel, style, ...rest },
  ref,
) {
  return (
    <View style={s.wrap}>
      {label ? (
        <View style={s.labelRow}>
          <Txt v="smallMed" color={C.inkSoft}>
            {label}
          </Txt>
          {optionalLabel ? (
            <Txt v="tiny" color={C.muted}>
              {optionalLabel}
            </Txt>
          ) : null}
        </View>
      ) : null}
      <View style={[s.box, !!error && { borderColor: C.red }]}>
        {icon ? <Icon name={icon} size={20} color={C.muted} /> : null}
        {prefix ? (
          <View style={s.prefix}>
            <Txt v="bodyMed">{prefix}</Txt>
          </View>
        ) : null}
        <TextInput ref={ref} placeholderTextColor={C.muted} selectionColor={C.red} style={[s.input, style]} {...rest} />
        {right}
      </View>
      {error ? (
        <Txt v="tiny" color={C.red}>
          {error}
        </Txt>
      ) : help ? (
        <Txt v="tiny" color={C.muted}>
          {help}
        </Txt>
      ) : null}
    </View>
  );
});

const s = StyleSheet.create({
  wrap: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: C.lineStrong,
    borderRadius: R.md,
    backgroundColor: C.white,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  prefix: { paddingRight: 10, borderRightWidth: 1, borderRightColor: C.line },
  input: { flex: 1, minWidth: 0, fontFamily: F.medium, fontSize: 16, color: C.ink, paddingVertical: 12 },
});
