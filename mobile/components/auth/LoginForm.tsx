import React from "react";
import { View, Pressable } from "react-native";
import { ThemedText } from "../ThemedText";
import { Input } from "../Input";
import { Button } from "../Button";
import { useTheme } from "../../hooks/useTheme";
import { TelegramSection } from "./TelegramSection";
import { authStyles as styles } from "./authStyles";
import type { LoginFormState } from "../../hooks/useAuthScreen";

interface LoginFormProps {
  state: LoginFormState;
}

export function LoginForm({ state }: LoginFormProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.formContent}>
      {state.apiError ? (
        <View
          style={[
            styles.errorBanner,
            { backgroundColor: theme.destructive + "15" },
          ]}
        >
          <ThemedText type="small" color={theme.destructive}>
            {state.apiError}
          </ThemedText>
        </View>
      ) : null}

      <Input
        label="Email"
        value={state.email}
        onChangeText={state.setEmail}
        error={state.errors.email}
        placeholder="your@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        containerStyle={styles.field}
      />

      <Input
        label="Password"
        value={state.password}
        onChangeText={state.setPassword}
        error={state.errors.password}
        placeholder="Your password"
        secureTextEntry
        containerStyle={styles.field}
      />

      <Button
        title={state.loading ? "Sign In..." : "Sign In"}
        onPress={state.handleLogin}
        loading={state.loading}
        disabled={state.loading}
        style={styles.submitButton}
      />

      <Pressable
        onPress={state.navigateToForgotPassword}
        style={styles.forgotPasswordRow}
      >
        <ThemedText type="bodySm" color={theme.primary}>
          {"Forgot password?"}
        </ThemedText>
      </Pressable>

      <TelegramSection />
    </View>
  );
}
