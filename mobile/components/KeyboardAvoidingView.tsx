import React from "react";
import {
  Platform,
  View,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  type KeyboardAvoidingViewProps,
} from "react-native";

/**
 * Web-safe KeyboardAvoidingView.
 * On native: standard KeyboardAvoidingView with iOS/Android behavior.
 * On web: renders a plain View (keyboard handling is native to browsers).
 */
export function KeyboardAvoidingView(props: KeyboardAvoidingViewProps) {
  if (Platform.OS === "web") {
    const { behavior, keyboardVerticalOffset, contentContainerStyle, ...rest } = props;
    return <View {...rest} />;
  }
  return <RNKeyboardAvoidingView {...props} />;
}
