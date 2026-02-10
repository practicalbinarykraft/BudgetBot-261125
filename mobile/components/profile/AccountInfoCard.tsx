import React from "react";
import { View } from "react-native";
import { ThemedText } from "../ThemedText";
import { Card, CardHeader, CardContent } from "../Card";
import { useTheme } from "../../hooks/useTheme";
import { styles } from "./profileStyles";
import type { User } from "../../types";

interface AccountInfoCardProps {
  user: User | null;
}

export default function AccountInfoCard({ user }: AccountInfoCardProps) {
  const { theme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <ThemedText type="h4" style={styles.cardTitle}>
          {"Account Information"}
        </ThemedText>
      </CardHeader>
      <CardContent style={styles.accountContent}>
        <View style={styles.infoRow}>
          <ThemedText type="small" color={theme.textSecondary}>
            {"Name"}
          </ThemedText>
          <ThemedText type="bodySm" style={styles.infoValue}>
            {user?.name || "User"}
          </ThemedText>
        </View>
        <View
          style={[
            styles.infoRow,
            { borderTopWidth: 1, borderTopColor: theme.cardBorder },
          ]}
        >
          <ThemedText type="small" color={theme.textSecondary}>
            {"Email"}
          </ThemedText>
          <ThemedText type="bodySm" style={styles.infoValue}>
            {user?.email || "-"}
          </ThemedText>
        </View>
      </CardContent>
    </Card>
  );
}
