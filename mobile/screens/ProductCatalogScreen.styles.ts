import { StyleSheet } from "react-native";
import { Spacing, BorderRadius } from "../constants/theme";

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: Spacing.lg, paddingBottom: Spacing["5xl"] },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  headerText: { flex: 1, gap: Spacing.xs },
  searchInput: { marginBottom: Spacing.md },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  catBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  statsText: { marginBottom: Spacing.md },
  productCard: { marginBottom: Spacing.sm },
  productContent: {},
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productInfo: { flex: 1, gap: Spacing.xs },
  productName: { fontWeight: "500" },
  empty: {
    paddingVertical: Spacing["4xl"],
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyTitle: { marginTop: Spacing.md },
});
