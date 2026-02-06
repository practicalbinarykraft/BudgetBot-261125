/**
 * Auth group layout – no tab bar, no header.
 */

import { Stack } from 'expo-router';
import { COLORS } from '@/constants/config';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
