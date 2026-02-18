import { styles } from "../../screens/BillingScreen.styles";
import { Spacing } from "../../constants/theme";

describe("BillingScreen styles", () => {
  describe("balanceAmount", () => {
    const s = styles.balanceAmount as any;

    it("has lineHeight >= fontSize to prevent clipping", () => {
      expect(s.lineHeight).toBe(56);
    });

    it("does not have alignSelf: stretch", () => {
      expect(s.alignSelf).toBeUndefined();
    });

    it("does not have flexShrink", () => {
      expect(s.flexShrink).toBeUndefined();
    });
  });

  describe("opContent", () => {
    const s = styles.opContent as any;

    it("has alignItems flex-start to prevent badge stretching", () => {
      expect(s.alignItems).toBe("flex-start");
    });
  });

  describe("opIcon", () => {
    const s = styles.opIcon as any;

    it("has lineHeight >= fontSize to prevent emoji clipping", () => {
      expect(s.lineHeight).toBeGreaterThanOrEqual(s.fontSize);
    });
  });
});
