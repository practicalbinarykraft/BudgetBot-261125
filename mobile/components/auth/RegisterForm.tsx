import React from "react";
import { View } from "react-native";
import { ThemedText } from "../ThemedText";
import { Input } from "../Input";
import { Button } from "../Button";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { TelegramSection } from "./TelegramSection";
import { authStyles as styles } from "./authStyles";
import type { RegisterFormState } from "../../hooks/useAuthScreen";

interface RegisterFormProps {
  state: RegisterFormState;
}

export function RegisterForm({ state }: RegisterFormProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

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
        label={t("auth.name")}
        value={state.name}
        onChangeText={state.setName}
        error={state.errors.name}
        placeholder="Your name"
        autoCapitalize="words"
        containerStyle={styles.field}
      />

      <Input
        label={t("auth.email")}
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
        label={t("auth.password")}
        value={state.password}
        onChangeText={state.setPassword}
        error={state.errors.password}
        placeholder="Min 6 characters"
        secureTextEntry
        containerStyle={styles.field}
      />

      <Button
        title={state.loading ? `${t("auth.register_button")}...` : t("auth.register_button")}
        onPress={state.handleRegister}
        loading={state.loading}
        disabled={state.loading}
        style={styles.submitButton}
      />

      <TelegramSection />
    </View>
  );
}
