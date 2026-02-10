import { StyleSheet } from "react-native";
import { Spacing } from "../../constants/theme";

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: {
    padding: Spacing.lg,
    paddingBottom: Spacing["5xl"],
  },
  header: {
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardContent: {
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rateSection: {
    gap: 2,
  },
  rateValue: {
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statHalf: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    fontWeight: "500",
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    gap: 2,
  },
  empty: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
});
