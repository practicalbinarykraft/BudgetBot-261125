import React from "react";
import { View, Modal, Pressable, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { useTheme } from "../../hooks/useTheme";
import { timezones } from "./profileConstants";
import { styles } from "./profileStyles";

interface TimezoneModalProps {
  visible: boolean;
  timezone: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}

export default function TimezoneModal({
  visible,
  timezone,
  onSelect,
  onClose,
}: TimezoneModalProps) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modal, { backgroundColor: theme.background }]}>
        <View style={styles.modalHeader}>
          <ThemedText type="h3">{"Select Timezone"}</ThemedText>
          <Pressable onPress={onClose}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>
        <FlatList
          data={timezones}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
            const isActive = timezone === item.key;
            return (
              <Pressable
                onPress={() => {
                  onSelect(item.key);
                  onClose();
                }}
                style={[
                  styles.tzItem,
                  {
                    backgroundColor: isActive ? theme.primary + "15" : "transparent",
                    borderColor: isActive ? theme.primary : theme.border,
                  },
                ]}
              >
                <View style={styles.tzInfo}>
                  <ThemedText type="bodySm" style={styles.tzLabel}>
                    {item.label}
                  </ThemedText>
                  <ThemedText type="small" color={theme.textSecondary}>
                    {item.key}
                  </ThemedText>
                </View>
                {isActive ? (
                  <Feather name="check" size={18} color={theme.primary} />
                ) : null}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}
