import React from "react";
import { View, StyleSheet } from "react-native";
import { Input } from "../Input";
import { Button } from "../Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../Card";
import { Spacing } from "../../constants/theme";
import type { Step } from "../../hooks/usePasswordRecovery";

interface Props {
  step: Step;
  emailOrTelegramId: string;
  setEmailOrTelegramId: (text: string) => void;
  code: string;
  setCode: (text: string) => void;
  newPassword: string;
  setNewPassword: (text: string) => void;
  confirmPassword: string;
  setConfirmPassword: (text: string) => void;
  isPending: boolean;
  onRequestRecovery: () => void;
  onVerifyCode: () => void;
  onResetPassword: () => void;
}

export function RecoveryStepForms({
  step,
  emailOrTelegramId,
  setEmailOrTelegramId,
  code,
  setCode,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  isPending,
  onRequestRecovery,
  onVerifyCode,
  onResetPassword,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {step === "request" && "Request Recovery Code"}
          {step === "verify" && "Verify Code"}
          {step === "reset" && "Reset Password"}
        </CardTitle>
        <CardDescription>
          {step === "request" &&
            "We will send a recovery code to your Telegram"}
          {step === "verify" &&
            "Enter the 6-digit code you received"}
          {step === "reset" && "Choose a strong password"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "request" && (
          <View style={styles.formContent}>
            <Input
              label="Email or Telegram ID"
              value={emailOrTelegramId}
              onChangeText={setEmailOrTelegramId}
              placeholder="email@example.com or 123456789"
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={styles.field}
            />
            <Button
              title={
                isPending ? "Requesting..." : "Request Recovery Code"
              }
              onPress={onRequestRecovery}
              loading={isPending}
              disabled={isPending}
            />
          </View>
        )}

        {step === "verify" && (
          <View style={styles.formContent}>
            <Input
              label="Recovery Code"
              value={code}
              onChangeText={(text) =>
                setCode(text.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              containerStyle={styles.field}
            />
            <Button
              title={isPending ? "Verifying..." : "Verify Code"}
              onPress={onVerifyCode}
              loading={isPending}
              disabled={isPending || code.length !== 6}
            />
          </View>
        )}

        {step === "reset" && (
          <View style={styles.formContent}>
            <Input
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              containerStyle={styles.field}
            />
            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              secureTextEntry
              containerStyle={styles.field}
            />
            <Button
              title={isPending ? "Resetting..." : "Reset Password"}
              onPress={onResetPassword}
              loading={isPending}
              disabled={isPending}
            />
          </View>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  formContent: {
    gap: 0,
  },
  field: {
    marginBottom: Spacing.lg,
  },
});
