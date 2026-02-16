import { Alert, Platform } from "react-native";

type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

/**
 * Cross-platform alert that works on native (Alert.alert) and web (window.confirm/alert).
 * Drop-in replacement for Alert.alert — same signature.
 */
export function uiAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
) {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  // Web fallback
  const text = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length === 0) {
    window.alert(text);
    return;
  }

  // Single button (just "OK")
  if (buttons.length === 1) {
    window.alert(text);
    buttons[0].onPress?.();
    return;
  }

  // Two+ buttons: use confirm. The non-cancel button fires on OK.
  const actionBtn = buttons.find((b) => b.style !== "cancel") || buttons[buttons.length - 1];
  const cancelBtn = buttons.find((b) => b.style === "cancel");

  if (window.confirm(text)) {
    actionBtn.onPress?.();
  } else {
    cancelBtn?.onPress?.();
  }
}
