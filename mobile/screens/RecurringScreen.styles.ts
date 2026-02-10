import { StyleSheet } from "react-native";
import { Spacing, BorderRadius } from "../constants/theme";

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: {
    padding: Spacing.lg,
    paddingBottom: Spacing["5xl"],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flex: 1,
    gap: Spacing.xs,
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  cardLeft: {
    flex: 1,
    gap: Spacing.xs,
  },
  description: {
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  amount: {
    fontWeight: "600",
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    paddingVertical: Spacing["4xl"],
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyTitle: {
    marginTop: Spacing.md,
  },
  emptyBtn: {
    marginTop: Spacing.md,
    minWidth: 160,
  },
});
