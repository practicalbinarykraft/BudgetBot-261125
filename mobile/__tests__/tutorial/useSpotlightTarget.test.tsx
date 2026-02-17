import React from "react";
import { View } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";

const mockRegister = jest.fn();
const mockUnregister = jest.fn();
jest.mock("../../lib/spotlight-ref", () => ({
  registerSpotlightTarget: (...args: any[]) => mockRegister(...args),
  unregisterSpotlightTarget: (...args: any[]) => mockUnregister(...args),
}));

import { useSpotlightTarget } from "../../tutorial/spotlight/useSpotlightTarget";

function TestComponent({ targetId }: { targetId: string }) {
  const { ref, onLayout } = useSpotlightTarget(targetId);
  return <View ref={ref} onLayout={onLayout} testID="target" />;
}

describe("useSpotlightTarget", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns ref and onLayout", () => {
    const { getByTestId } = render(<TestComponent targetId="test_id" />);
    expect(getByTestId("target")).toBeTruthy();
  });

  it("unregisters on unmount", () => {
    const { unmount } = render(<TestComponent targetId="test_id" />);
    unmount();
    expect(mockUnregister).toHaveBeenCalledWith("test_id");
  });
});
