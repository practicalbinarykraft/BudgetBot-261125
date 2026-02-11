import { StyleSheet } from "react-native";
import { Spacing } from "../../constants/theme";

export const styles = StyleSheet.create({
  cardTitle: { fontWeight: "600" },
  content: { gap: Spacing.md },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusLabel: { flex: 1, fontWeight: "500" },
  label: { fontWeight: "500" },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  codeText: { letterSpacing: 4 },
  steps: { gap: Spacing.xs },
});
