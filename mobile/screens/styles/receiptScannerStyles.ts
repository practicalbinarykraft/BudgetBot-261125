import { StyleSheet } from "react-native";
import { Spacing, BorderRadius } from "../../constants/theme";

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing["5xl"],
  },
  headerRow: { gap: Spacing.sm },
  bold: { fontWeight: "600" },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfBtn: { flex: 1 },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
  },
  loadingContent: {
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  successText: { flex: 1, gap: 2 },
  itemsList: { gap: 0 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  itemLeft: { flex: 1, gap: 2 },
  itemRight: { alignItems: "flex-end", gap: 2 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderTopWidth: 1,
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  emptyState: {
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing["3xl"],
  },
});
