import { StyleSheet, View } from 'react-native';

import { C } from '@/theme';

import { Button } from './Button';
import { Icon } from './Icon';
import { Txt } from './Txt';

interface Props {
  icon: string;
  title: string;
  body?: string;
  action?: { title: string; onPress: () => void };
}

export function Empty({ icon, title, body, action }: Props) {
  return (
    <View style={s.wrap}>
      <View style={s.circle}>
        <Icon name={icon} size={34} color={C.red} />
      </View>
      <Txt v="h3" center>
        {title}
      </Txt>
      {body ? (
        <Txt v="small" color={C.muted} center>
          {body}
        </Txt>
      ) : null}
      {action ? <Button title={action.title} onPress={action.onPress} size="md" full={false} style={{ alignSelf: 'center', marginTop: 8 }} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24, gap: 6 },
  circle: { width: 76, height: 76, borderRadius: 38, backgroundColor: C.redSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
