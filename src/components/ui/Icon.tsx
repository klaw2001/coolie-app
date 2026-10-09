import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, type ColorValue, type StyleProp, type TextStyle } from 'react-native';

import { C } from '@/theme';

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface Props {
  name: IconName | string;
  size?: number;
  color?: ColorValue;
  style?: StyleProp<TextStyle>;
  onPress?: () => void;
}

export function Icon({ name, size = 22, color = C.ink, style, onPress }: Props) {
  const icon = <MaterialCommunityIcons name={name as IconName} size={size} color={color} style={style} />;
  if (!onPress) return icon;
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" style={({ pressed }) => pressed && { opacity: 0.6 }}>
      {icon}
    </Pressable>
  );
}
