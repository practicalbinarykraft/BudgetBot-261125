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
  quickInputCol: { alignItems: "center", marginBottom: Spacing.xl },
  quickInputRow: { flexDirection: "row", gap: Spacing.md, width: "100%" },
  quickBtnWrap: { flex: 1 },
  quickBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  suggestionBox: {
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
    marginBottom: Spacing.xl, gap: Spacing.sm,
  },
  suggestionHeader: {
    flexDirection: "row", alignItems: "center", gap: Spacing.xs,
  },
  submitBtn: { marginTop: Spacing.lg },
});
