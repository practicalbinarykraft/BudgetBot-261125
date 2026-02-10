/**
 * Test: all mobile-specific i18n keys resolve to translated strings (not raw keys).
 */

import { t } from "../../../shared/i18n/index";

const mobileKeys = [
  "ai.analysis_title",
  "analytics.advanced",
  "analytics.expenses",
  "assets.manage",
  "billing.title",
  "budgets.limit",
  "categories.expense",
  "categories.income",
  "categories.manage",
  "categories.no_categories",
  "planned_income.manage",
  "planned.manage",
  "product_catalog.title",
  "recurring.add",
  "recurring.no_recurring",
  "tags.manage",
  "wallets.net_worth",
  "wishlist.add",
  "wishlist.manage",
];

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
