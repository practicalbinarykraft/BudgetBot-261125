import { useState } from "react";
import { uiAlert } from "@/lib/uiAlert";
import { useNavigation } from "@react-navigation/native";
import { api } from "../lib/api-client";

export type Step = "request" | "verify" | "reset";

export function usePasswordRecovery() {
  const navigation = useNavigation();

  const [step, setStep] = useState<Step>("request");
  const [emailOrTelegramId, setEmailOrTelegramId] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleRequestRecovery = async () => {
    if (!emailOrTelegramId.trim()) {
      uiAlert("Error", "Email or Telegram ID is required");
      return;
    }
    setIsPending(true);
    try {
      await api.post("/api/auth/request-password-recovery", {
        emailOrTelegramId: emailOrTelegramId.trim(),
      });
      setStep("verify");
      uiAlert("Success", "Recovery code sent! Check your Telegram.");
    } catch (error: any) {
      uiAlert("Error", error.message || "Failed to request recovery code");
    } finally {
      setIsPending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      uiAlert("Error", "Code must be exactly 6 digits");
      return;
    }
    setIsPending(true);
    try {
      const result = await api.post<{ resetToken: string }>(
        "/api/auth/verify-recovery-code",
        {
          emailOrTelegramId: emailOrTelegramId.trim(),
          code,
        }
      );
      if (!result.resetToken) {
        throw new Error("Invalid or expired code");
      }
      setResetToken(result.resetToken);
      setStep("reset");
      uiAlert("Success", "Code verified! Now set your new password.");
    } catch (error: any) {
      uiAlert("Error", error.message || "Invalid or expired code");
    } finally {
      setIsPending(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      uiAlert("Error", "Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      uiAlert("Error", "Passwords do not match");
      return;
    }
    setIsPending(true);
    try {
      await api.post("/api/auth/reset-password", {
        token: resetToken,
        newPassword,
      });
      uiAlert("Success", "Password reset! You can now login.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      uiAlert("Error", error.message || "Failed to reset password");
    } finally {
      setIsPending(false);
    }
  };

  const stepNum = step === "request" ? 1 : step === "verify" ? 2 : 3;

  return {
    step,
    stepNum,
    emailOrTelegramId,
    setEmailOrTelegramId,
    code,
    setCode,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isPending,
    handleRequestRecovery,
    handleVerifyCode,
    handleResetPassword,
  };
}
