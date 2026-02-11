import React from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/Card";
import { useTheme } from "../hooks/useTheme";
import { useAuthScreen } from "../hooks/useAuthScreen";
import { useTranslation } from "../i18n";
import { AuthHeader } from "../components/auth/AuthHeader";
import { AuthTabToggle } from "../components/auth/AuthTabToggle";
import { LoginForm } from "../components/auth/LoginForm";
import { RegisterForm } from "../components/auth/RegisterForm";
import { authStyles as styles } from "../components/auth/authStyles";

interface AuthScreenProps {
  onLogin: (email: string, password: string) => Promise<any>;
  onRegister: (name: string, email: string, password: string) => Promise<any>;
}

export default function AuthScreen({ onLogin, onRegister }: AuthScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { activeTab, setActiveTab, language, toggleLanguage, login, register } =
    useAuthScreen(onLogin, onRegister);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <AuthHeader
            language={language}
            onToggleLanguage={toggleLanguage}
          />

          <AuthTabToggle activeTab={activeTab} onTabChange={setActiveTab} />

          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>
                {activeTab === "login" ? t("auth.welcome_back") : t("auth.create_account")}
              </CardTitle>
              <CardDescription>
                {activeTab === "login"
                  ? t("auth.login_description")
                  : t("auth.register_description")}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {activeTab === "login" ? (
                <LoginForm state={login} />
              ) : (
                <RegisterForm state={register} />
              )}
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
