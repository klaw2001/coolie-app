import { Alert, Platform } from 'react-native';

interface ConfirmOpts {
  ok: string;
  cancel: string;
  destructive?: boolean;
  onOk: () => void;
}

/** Native alert on phones; the browser's confirm() on web, where react-native-web's Alert does nothing. */
export function confirmDialog(title: string, message: string | undefined, { ok, cancel, destructive, onOk }: ConfirmOpts) {
  if (Platform.OS === 'web') {
    if (window.confirm([title, message].filter(Boolean).join('\n\n'))) onOk();
    return;
  }
  Alert.alert(title, message, [
    { text: cancel, style: 'cancel' },
    { text: ok, style: destructive ? 'destructive' : 'default', onPress: onOk },
  ]);
}

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert([title, message].filter(Boolean).join('\n\n'));
    return;
  }
  Alert.alert(title, message);
}
