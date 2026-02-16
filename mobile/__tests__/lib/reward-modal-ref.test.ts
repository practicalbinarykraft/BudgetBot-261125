import {
  registerRewardModal,
  unregisterRewardModal,
  showRewardModal,
  type RewardData,
} from "../../lib/reward-modal-ref";

describe("reward-modal-ref", () => {
  afterEach(() => unregisterRewardModal());

  const data: RewardData = { creditsAwarded: 10, balanceBefore: 5, balanceAfter: 15 };

  it("calls registered fn on showRewardModal", () => {
    const fn = jest.fn();
    registerRewardModal(fn);
    showRewardModal(data);
    expect(fn).toHaveBeenCalledWith(data);
  });

  it("does not throw when no fn registered (noop)", () => {
    expect(() => showRewardModal(data)).not.toThrow();
  });

  it("does not call fn after unregister", () => {
    const fn = jest.fn();
    registerRewardModal(fn);
    unregisterRewardModal();
    showRewardModal(data);
    expect(fn).not.toHaveBeenCalled();
  });
});
