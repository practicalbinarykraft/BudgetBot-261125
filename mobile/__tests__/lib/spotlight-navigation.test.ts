import { InteractionManager } from "react-native";
import { showSpotlightOnMain } from "../../lib/spotlight-navigation";
import { showSpotlight } from "../../lib/spotlight-ref";

jest.mock("../../lib/spotlight-ref", () => ({
  showSpotlight: jest.fn(),
}));

describe("showSpotlightOnMain", () => {
  let originalRun: typeof InteractionManager.runAfterInteractions;

  beforeEach(() => {
    jest.clearAllMocks();
    originalRun = InteractionManager.runAfterInteractions;
    (InteractionManager as any).runAfterInteractions = jest.fn((cb: () => void) => {
      cb();
      return { then: jest.fn(), cancel: jest.fn() };
    });
  });

  afterEach(() => {
    (InteractionManager as any).runAfterInteractions = originalRun;
  });

  it("navigates to Main when current route is not Main", () => {
    const navigation = {
      navigate: jest.fn(),
      getState: () => ({
        routes: [{ name: "Main" }, { name: "AddWallet" }],
        index: 1,
      }),
    };

    showSpotlightOnMain(navigation as any, "voice_input");

    expect(navigation.navigate).toHaveBeenCalledWith("Main");
    expect(InteractionManager.runAfterInteractions).toHaveBeenCalled();
    expect(showSpotlight).toHaveBeenCalledWith("voice_input");
  });

  it("does not navigate when already on Main", () => {
    const navigation = {
      navigate: jest.fn(),
      getState: () => ({
        routes: [{ name: "Main" }],
        index: 0,
      }),
    };

    showSpotlightOnMain(navigation as any, "receipt_scan");

    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(InteractionManager.runAfterInteractions).toHaveBeenCalled();
    expect(showSpotlight).toHaveBeenCalledWith("receipt_scan");
  });
});
