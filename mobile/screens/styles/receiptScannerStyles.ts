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
  photoHint: {
    textAlign: "center",
    paddingHorizontal: Spacing.md,
  },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  imageThumb: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
  },
  imageThumbWrapper: {
    position: "relative",
  },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  photoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
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
  currencySection: {
    gap: Spacing.sm,
  },
  currencyRow: {
    gap: Spacing.sm,
  },
  currencyBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
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
