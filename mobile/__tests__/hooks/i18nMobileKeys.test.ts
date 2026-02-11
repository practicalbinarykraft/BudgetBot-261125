/**
 * Test: all mobile-specific i18n keys resolve to translated strings (not raw keys).
 */

import { t } from "../../../shared/i18n/index";
import { mobileExtraTranslations } from "../../../shared/i18n/mobile-extra";

const mobileKeys = Object.keys(mobileExtraTranslations);

describe("i18n mobile keys", () => {
  it.each(mobileKeys)("t('%s', 'en') returns a translated string", (key) => {
    const result = t(key, "en");
    expect(result).not.toBe(key);
    expect(result.length).toBeGreaterThan(0);
  });

  it.each(mobileKeys)("t('%s', 'ru') returns a translated string", (key) => {
    const result = t(key, "ru");
    expect(result).not.toBe(key);
    expect(result.length).toBeGreaterThan(0);
  });

  it("billing.title returns 'Биллинг' in Russian", () => {
    expect(t("billing.title", "ru")).toBe("Биллинг");
  });
});
