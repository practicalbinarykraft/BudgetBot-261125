import type { SpotlightFlow } from "./spotlight.types";

export const SPOTLIGHT_FLOWS: Record<string, SpotlightFlow> = {
  create_wallet: {
    id: "create_wallet",
    steps: [
      {
        targetId: "wallet_balance",
        tooltipKey: "spotlight.flow.create_wallet.step1",
        navigateTo: "Wallets",
      },
      {
        targetId: "add_wallet_btn",
        tooltipKey: "spotlight.flow.create_wallet.step2",
        navigateTo: "AddWallet",
      },
      {
        targetId: "wallet_type_row",
        tooltipKey: "spotlight.flow.create_wallet.step3",
        autoAdvanceMs: 2500,
      },
      {
        targetId: "wallet_currency_row",
        tooltipKey: "spotlight.flow.create_wallet.step4",
        autoAdvanceMs: 2500,
      },
      {
        targetId: "wallet_submit_btn",
        tooltipKey: "spotlight.flow.create_wallet.step5",
      },
    ],
  },
};
