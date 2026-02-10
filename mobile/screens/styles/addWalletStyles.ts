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
    fontWeight: "500",
  },
  toggleRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  toggleBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  rowHalf: {
    flex: 1,
  },
  currencyRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  currencyBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  footerRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  footerBtn: {
    flex: 1,
  },
});
