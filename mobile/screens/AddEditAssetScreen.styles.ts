import { StyleSheet } from "react-native";
import { Spacing, BorderRadius } from "../constants/theme";

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing["5xl"] },
  field: { marginBottom: Spacing.xl },
  label: { fontWeight: "500", marginBottom: Spacing.sm },
  currencyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  currencyBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
  },
  footerRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  footerBtn: { flex: 1 },
});
