import { SPOTLIGHT_FLOWS } from "../../tutorial/spotlight/flows";

describe("create_wallet flow config", () => {
  it("step 0 has navigateBefore: 'Main' to ensure user is on Dashboard", () => {
    const flow = SPOTLIGHT_FLOWS.create_wallet;
    expect(flow).toBeDefined();
    expect(flow.steps.length).toBeGreaterThan(0);
    expect(flow.steps[0].navigateBefore).toBe("Main");
  });
});
