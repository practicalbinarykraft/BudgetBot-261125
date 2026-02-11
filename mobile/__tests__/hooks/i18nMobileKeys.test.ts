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
  "receipts.scan",
  "billing.your_balance",
  "billing.total_granted",
  "billing.total_used",
  "billing.unlimited",
  "billing.credits_remaining",
  "billing.low_balance",
  "billing.what_costs",
  "billing.pricing_plans",
  "billing.credits_per_month",
  "billing.per_month",
  "billing.free",
  "common.theme",
  "common.system_theme",
  "voice_input.description",
  "voice_input.recording",
  "voice_input.tap_to_record",
  "voice_input.hint",
  "voice_input.transcribing",
  "voice_input.create_transaction",
  "voice_input.transcription",
  "voice_input.parsed_transaction",
  "receipts.title",
  "receipts.description",
  "receipts.take_photo",
  "receipts.pick_from_library",
  "receipts.scanning",
  "receipts.scan_success",
  "receipts.found_items",
  "receipts.receipt",
  "receipts.extracted_items",
  "receipts.unknown_item",
  "receipts.qty",
  "receipts.total",
  "receipts.empty_state",
  "nav.add_transaction",
  "nav.edit_transaction",
  "nav.category",
  "nav.budget",
  "nav.add_wallet",
  "nav.calibration",
  "nav.currency_history",
  "nav.tag_detail",
  "nav.tag",
  "nav.add_recurring",
  "nav.add_wishlist_item",
  "nav.add_planned_expense",
  "nav.add_planned_income",
  "nav.product_detail",
  "nav.credits_billing",
  "nav.asset_detail",
  "nav.add_asset",
  "nav.notifications",
  "nav.swipe_sort",
  "nav.expense_analytics",
  "nav.advanced_analytics",
  "nav.ai_chat",
  "nav.receipt_scanner",
  "nav.voice_input",
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
