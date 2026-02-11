import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";

type IconName = React.ComponentProps<typeof Feather>["name"];

function Btn({ name, size, color, bg, d, border, onPress }: {
  name: IconName; size: number; color: string; bg: string;
  d: number; border?: string; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.btn, {
        width: d, height: d, borderRadius: d / 2, backgroundColor: bg,
        borderColor: border ?? "transparent", borderWidth: border ? 1 : 0,
      }]}
    >
      <Feather name={name} size={size} color={color} />
    </Pressable>
  );
}

export default function FloatingActionPanel() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<NativeStackNavigationProp<any>>();
  const bottom = insets.bottom + 8;
  const s = { bg: theme.card, border: theme.cardBorder, c: theme.text };

  return (
    <View style={[styles.root, { bottom }]} pointerEvents="box-none">
      <View style={styles.container} pointerEvents="box-none">
        <View style={[styles.abs, { top: 0, left: 48 }]}>
          <Btn name="mic" size={28} color="#fff" bg={theme.primary} d={64}
            onPress={() => nav.navigate("VoiceInput")} />
        </View>
        <View style={[styles.abs, { top: 56, left: 0 }]}>
          <Btn name="home" size={22} color={s.c} bg={s.bg} d={48} border={s.border}
            onPress={() => nav.navigate("Main", { screen: "Dashboard" })} />
        </View>
        <View style={[styles.abs, { top: 56, right: 0 }]}>
          <Btn name="message-circle" size={22} color={s.c} bg={s.bg} d={48} border={s.border}
            onPress={() => nav.navigate("AIChat")} />
        </View>
        <View style={[styles.abs, { bottom: 0, left: 56 }]}>
          <Btn name="plus" size={22} color={s.c} bg={s.bg} d={48} border={s.border}
            onPress={() => nav.navigate("AddTransaction")} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 50 },
  container: { width: 160, height: 160 },
  abs: { position: "absolute" },
  btn: {
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
});
