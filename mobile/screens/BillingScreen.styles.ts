import { StyleSheet } from "react-native";
import { Spacing, BorderRadius } from "../constants/theme";

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing["5xl"] },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  headerText: { flex: 1, gap: Spacing.xs },

  balanceContent: { alignItems: "center", gap: Spacing.md },
  balanceAmount: {
    fontSize: 48, lineHeight: 56, fontWeight: "700", textAlign: "center",
  },
  balanceStats: {
    flexDirection: "row", gap: Spacing.xl,
    flexWrap: "wrap", justifyContent: "center",
  },
  balanceStat: { alignItems: "center", gap: 2, minWidth: 80 },
  bold: { fontWeight: "600" },
  lowBalanceAlert: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    padding: Spacing.md, borderRadius: BorderRadius.md,
    borderWidth: 1, alignSelf: "stretch",
  },

  sectionTitle: { fontWeight: "600", marginTop: Spacing.xl, marginBottom: Spacing.md },
  opsGrid: { gap: Spacing.md },
  opCard: {},
  opContent: { gap: Spacing.sm, alignItems: "flex-start" as const },
  opIcon: { fontSize: 24, lineHeight: 32 },

  tierCard: { marginBottom: Spacing.md },
  tierContent: { gap: Spacing.sm },
  tierPriceRow: {
    flexDirection: "row", alignItems: "baseline",
    flexWrap: "wrap", gap: Spacing.xs,
  },
  featureList: { gap: Spacing.sm, marginTop: Spacing.sm },
  featureRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  featureText: { flex: 1, flexShrink: 1 },
});
