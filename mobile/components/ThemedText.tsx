import React from "react";
import { Text, Platform, type TextProps } from "react-native";
import { Typography } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";

type TextType = keyof typeof Typography;

interface ThemedTextProps extends TextProps {
  type?: TextType;
  color?: string;
  mono?: boolean;
}

export function ThemedText({
  type = "body",
  color,
  mono,
  style,
  ...rest
}: ThemedTextProps) {
  const { theme } = useTheme();
  const typeStyle = Typography[type];
  const fontFamily = mono
    ? Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" })
    : undefined;

  return (
    <Text
      style={[{ color: color || theme.text, fontFamily }, typeStyle, style]}
      {...rest}
    />
  );
}
