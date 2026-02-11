import { StyleSheet } from "react-native";
import { Spacing, BorderRadius } from "../../constants/theme";

export const styles = StyleSheet.create({
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
  section: {
    gap: Spacing.md,
  },
  sectionHeading: {
    fontWeight: "600",
  },
  categoryList: {
    gap: Spacing.md,
  },
  categoryCard: {
    marginBottom: 0,
  },
  categoryCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  iconSquare: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 24,
  },
  categoryName: {
    fontWeight: "500",
    marginBottom: 4,
  },
  deleteBtn: {
    padding: Spacing.sm,
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
});
