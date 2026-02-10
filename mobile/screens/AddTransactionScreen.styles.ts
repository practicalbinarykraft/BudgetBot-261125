import { StyleSheet } from "react-native";
import { Spacing, BorderRadius } from "../constants/theme";

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing["5xl"] },
  toggleRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.xl },
  toggleBtn: {
    flex: 1, height: 48, borderRadius: BorderRadius.sm,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  field: { marginBottom: Spacing.xl },
  label: { marginBottom: Spacing.sm },
  chipsRow: { gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  quickInputRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.xl },
  quickBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  submitBtn: { marginTop: Spacing.lg },
});
