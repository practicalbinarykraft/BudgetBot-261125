import { StyleSheet } from "react-native";
import { Spacing, BorderRadius } from "../../constants/theme";

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing["5xl"],
  },
  field: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.sm,
  },
  chipsRow: {
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  toggleBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    marginTop: Spacing.lg,
  },
});
