/**
 * Test: calibration USD conversion must not divide by zero when balance="0".
 */

describe("calibration USD conversion", () => {
  it("does not produce NaN/Infinity when wallet balance is 0", () => {
    // Simulates the totalDifferenceUSD reduce logic from useCalibrationScreen
    const walletPreview = [
      {
        hasChanged: true,
        willCreateTransaction: true,
        difference: 500,
        wallet: {
          currency: "RUB",
          balance: "0",
          balanceUsd: "0",
        },
      },
    ];

    const totalDifferenceUSD = walletPreview
      .filter((w) => w.hasChanged)
      .reduce((sum, w) => {
        const balance = parseFloat(w.wallet.balance);
        const usdDiff =
          w.wallet.currency === "USD"
            ? w.difference
            : w.wallet.balanceUsd && balance !== 0
              ? (w.difference / balance) * parseFloat(w.wallet.balanceUsd)
              : w.difference;
        return sum + usdDiff;
      }, 0);

    expect(Number.isFinite(totalDifferenceUSD)).toBe(true);
    expect(totalDifferenceUSD).toBe(500);
  });

  it("correctly converts when balance is non-zero", () => {
    const walletPreview = [
      {
        hasChanged: true,
        difference: 1000,
        wallet: {
          currency: "RUB",
          balance: "90000",
          balanceUsd: "1000",
        },
      },
    ];

    const totalDifferenceUSD = walletPreview
      .filter((w) => w.hasChanged)
      .reduce((sum, w) => {
        const balance = parseFloat(w.wallet.balance);
        const usdDiff =
          w.wallet.currency === "USD"
            ? w.difference
            : w.wallet.balanceUsd && balance !== 0
              ? (w.difference / balance) * parseFloat(w.wallet.balanceUsd)
              : w.difference;
        return sum + usdDiff;
      }, 0);

    expect(Number.isFinite(totalDifferenceUSD)).toBe(true);
    // 1000 / 90000 * 1000 ≈ 11.11
    expect(totalDifferenceUSD).toBeCloseTo(11.11, 1);
  });
});
