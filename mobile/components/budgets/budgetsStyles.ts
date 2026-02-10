import { StyleSheet } from "react-native";
import { Spacing, BorderRadius } from "../../constants/theme";

export const budgetsStyles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing["5xl"],
  },
  headerRow: {
    gap: Spacing.md,
  },
  headerTitle: {
    fontWeight: "700",
  },
  alert: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  progressSection: {
    gap: Spacing.md,
  },
  sectionHeading: {
    fontWeight: "600",
  },
  progressList: {
    gap: Spacing.lg,
  },
  progressItem: {
    gap: Spacing.sm,
  },
  progressLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  progressName: {
    fontWeight: "500",
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  budgetCards: {
    gap: Spacing.md,
  },
  budgetCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: Spacing.sm,
  },
  budgetNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
    marginRight: Spacing.sm,
  },
  budgetName: {
    fontWeight: "600",
    flex: 1,
  },
  budgetActions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  actionBtn: {
    padding: Spacing.xs,
  },
  budgetCardContent: {
    gap: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monoBold: {
    fontWeight: "600",
  },
  boldText: {
    fontWeight: "600",
  },
  trackBar: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  fillBar: {
    height: 8,
    borderRadius: BorderRadius.full,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.md,
  },
  emptyTitle: {
    fontWeight: "600",
  },
  emptyDescription: {
    textAlign: "center",
  },
});
