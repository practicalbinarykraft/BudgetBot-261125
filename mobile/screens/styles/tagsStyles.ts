import { StyleSheet } from "react-native";
import { Spacing, BorderRadius } from "../../constants/theme";

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing["5xl"],
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  tagCard: {
    marginBottom: Spacing.md,
  },
  tagCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  tagInfoRow: {
    flex: 1,
    gap: Spacing.xs,
  },
  tagActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  defaultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  emptyContainer: {
    paddingVertical: Spacing["4xl"],
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyText: {
    marginTop: Spacing.md,
  },
  emptyBtn: {
    marginTop: Spacing.md,
    minWidth: 160,
  },
});
