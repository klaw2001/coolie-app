import { Stack } from 'expo-router';

import { C } from '@/theme';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: 'slide_from_right' }}>
      <Stack.Screen name="pay/result" options={{ gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="trip/complete" options={{ gestureEnabled: false, animation: 'fade_from_bottom' }} />
      <Stack.Screen name="book/map-pick" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
