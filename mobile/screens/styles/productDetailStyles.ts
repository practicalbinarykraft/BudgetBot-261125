import { StyleSheet } from "react-native";
import { Spacing } from "../../constants/theme";

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.md },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing["5xl"] },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  headerInfo: { flex: 1, gap: Spacing.sm },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statCard: { width: "47%" },
  statContent: { gap: Spacing.xs },
  bold: { fontWeight: "600" },
  storesContent: { gap: Spacing.lg },
  storeSection: { gap: Spacing.sm },
  storeName: { fontWeight: "600" },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
  },
  historyContent: { gap: 0 },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  historyLeft: { flex: 1, gap: 2 },
});
