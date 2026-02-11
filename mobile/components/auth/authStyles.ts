import { StyleSheet } from "react-native";
import { Spacing, BorderRadius } from "../../constants/theme";

export const authStyles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing["4xl"],
  },
  container: {
    width: "100%",
    maxWidth: 448,
    alignSelf: "center",
    gap: Spacing["2xl"],
  },
  header: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontWeight: "700",
  },
  tabList: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  tabTrigger: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  tabText: {
    fontWeight: "500",
  },
  card: {
    width: "100%",
  },
  formContent: {
    gap: 0,
  },
  errorBanner: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  submitButton: {
    marginTop: Spacing.sm,
    width: "100%",
  },
  forgotPasswordRow: {
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  dividerContainer: {
    marginTop: Spacing.lg,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    height: 20,
  },
  dividerLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    top: 10,
  },
  dividerTextWrap: {
    paddingHorizontal: Spacing.sm,
    zIndex: 1,
  },
  dividerText: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  langRow: {
    alignItems: "flex-end",
  },
  langButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  telegramButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    opacity: 0.6,
  },
  telegramText: {
    fontWeight: "500",
  },
  telegramHint: {
    textAlign: "center",
    marginTop: Spacing.xs,
  },
});
