import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthScreen from "../screens/AuthScreen";
import PasswordRecoveryScreen from "../screens/PasswordRecoveryScreen";
import { useTheme } from "../hooks/useTheme";

export type AuthStackParamList = {
  Auth: undefined;
  PasswordRecovery: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

interface AuthStackNavigatorProps {
  onLogin: (email: string, password: string) => Promise<any>;
  onRegister: (name: string, email: string, password: string) => Promise<any>;
}

export default function AuthStackNavigator({
  onLogin,
  onRegister,
}: AuthStackNavigatorProps) {
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth">
        {() => <AuthScreen onLogin={onLogin} onRegister={onRegister} />}
      </Stack.Screen>
      <Stack.Screen
        name="PasswordRecovery"
        component={PasswordRecoveryScreen}
      />
    </Stack.Navigator>
  );
}
