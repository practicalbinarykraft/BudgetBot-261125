# Balance Integrity

## How wallet balance works

- `wallet.balanceUsd` is a **cache** updated incrementally by `updateWalletBalance()`.
- `wallet.openingBalanceUsd` is set once at wallet creation and never auto-updated.

## Integrity functions (`wallet-balance-integrity.service.ts`)

- `recalculateWalletBalanceUsd(walletId, userId)` — recomputes from `openingBalanceUsd + SUM(income) - SUM(expense)`.
- `verifyWalletBalanceUsd(walletId, userId)` — compares cached vs recalculated, logs warning if drift > $0.02.
- `repairWalletBalanceUsd(walletId, userId)` — sets `balanceUsd` to recalculated value if drifted.
- `validateBalanceDelta(amountUsd, context)` — rejects NaN, Infinity, and deltas > $1M.

## Guards

All balance mutations are guarded by `validateBalanceDelta`:
- `updateWalletBalance()` — validates input amount and computed result.
- `calibrateWallet()` — validates the calibration difference.

## Trend chart sync

The trend chart anchors to `currentWalletsBalance` (not raw `openingBalanceUsd`) so today's capital point always matches the dashboard header:

```
syncedOpeningBalance = SUM(wallet.balanceUsd) - net(all transactions)
capital[today] = syncedOpeningBalance + totalIncome - totalExpense + assetsNet
```

This is mathematically guaranteed: `capital[today] = currentWalletsBalance + assetsNet`.
Income and expense lines are unchanged.

### Algebraic proof

For any `historyDays`, transactions split into beforePeriod + inPeriod = total:

```
capital[today] = (syncedOpening + beforePeriodNet) + inPeriodIncome - inPeriodExpense + assetsNet
               = syncedOpening + totalNet + assetsNet
               = (currentWalletsBalance - totalNet) + totalNet + assetsNet
               = currentWalletsBalance + assetsNet
```

The split point cancels out, so the invariant holds for any chart range.

### Verification (2026-02-23, User #1, 31 transactions)

| historyDays | capital[today] | SUM(balanceUsd) | diff |
|-------------|----------------|-----------------|------|
| 7           | $26,386.18     | $26,386.18      | $0.00 |
| 30          | $26,386.18     | $26,386.18      | $0.00 |
| 90          | $26,386.18     | $26,386.18      | $0.00 |

Drift from raw `openingBalanceUsd`: $25,364.83 (corrected at render time, not in DB).

## Known limitations (this PR)

### Sync anchor is a rendering workaround, not a data fix

`openingBalanceUsd` remains stale in the database. The trend chart corrects for drift at render time via `syncedOpeningBalance`. This is intentional as a safe hotfix — the UI is consistent, but the underlying data model still has a drifted anchor.

### Direct balance writes bypass `updateWalletBalance()`

Three routes update `wallet.balanceUsd` directly via `storage.updateWallet()`, bypassing the guarded `updateWalletBalance()` path. This means `validateBalanceDelta` does not protect these writes, and balance drift can still accumulate:

| Route file | Endpoint | What it does |
|------------|----------|--------------|
| `planned-income.routes.ts` | `POST /:id/receive` | Creates income tx, directly writes new balanceUsd |
| `planned.routes.ts` | `POST /:id/purchase` | Creates expense tx, directly writes new balance |
| `currency.routes.ts` | `POST /wallets/refresh-rates` | Recalculates balanceUsd from exchange rates |

Note: `currency.routes.ts` is a different case — it recalculates USD equivalent from native balance + rates, not a transaction-based change. It may be acceptable as-is.

## Follow-up tasks (post-merge)

1. **Route all balance writes through `updateWalletBalance()`**
   - `planned-income.routes.ts:138-145` — replace `storage.updateWallet()` with `updateWalletBalance()`
   - `planned.routes.ts:111-114` — replace `storage.updateWallet()` with `updateWalletBalance()`
   - Audit `currency.routes.ts:52` — decide if exchange rate refresh needs the same guard

2. **Repair `openingBalanceUsd` migration**
   - One-time migration: set `openingBalanceUsd = balanceUsd - net(all tx)` for each wallet
   - After repair, `syncedOpeningBalance == openingBalancesTotal` and the drift correction becomes a no-op
   - Consider replacing `openingBalanceUsd` anchor with a snapshot/ledger model long-term
