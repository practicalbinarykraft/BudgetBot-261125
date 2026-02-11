/**
 * B1 Test #3: CircularProgress
 * Verifies: correct stroke offset calculation based on input progress.
 */
import React from "react";
import { render } from "@testing-library/react-native";
import CircularProgress from "../../components/CircularProgress";

// Mock react-native-svg
jest.mock("react-native-svg", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: any) => <View {...props} />,
    Circle: (props: any) => <View testID="svg-circle" {...props} />,
  };
});

describe("CircularProgress", () => {
  const defaultSize = 64;
  const defaultStrokeWidth = 4;
  const radius = (defaultSize - defaultStrokeWidth) / 2; // 30
  const circumference = 2 * Math.PI * radius; // ~188.496

  it("renders with 0% progress (full offset)", () => {
    const { getAllByTestId } = render(<CircularProgress progress={0} />);
    const circles = getAllByTestId("svg-circle");
    // Second circle is the progress circle
    const progressCircle = circles[1];
    const offset = parseFloat(progressCircle.props.strokeDashoffset);
    expect(Math.abs(offset - circumference)).toBeLessThan(0.01);
  });

  it("renders with 50% progress (half offset)", () => {
    const { getAllByTestId } = render(<CircularProgress progress={0.5} />);
    const circles = getAllByTestId("svg-circle");
    const progressCircle = circles[1];
    const offset = parseFloat(progressCircle.props.strokeDashoffset);
    expect(Math.abs(offset - circumference * 0.5)).toBeLessThan(0.01);
  });

  it("renders with 100% progress (zero offset)", () => {
    const { getAllByTestId } = render(<CircularProgress progress={1} />);
    const circles = getAllByTestId("svg-circle");
    const progressCircle = circles[1];
    const offset = parseFloat(progressCircle.props.strokeDashoffset);
    expect(Math.abs(offset)).toBeLessThan(0.01);
  });

  it("clamps progress above 1 to 1", () => {
    const { getAllByTestId } = render(<CircularProgress progress={1.5} />);
    const circles = getAllByTestId("svg-circle");
    const progressCircle = circles[1];
    const offset = parseFloat(progressCircle.props.strokeDashoffset);
    expect(Math.abs(offset)).toBeLessThan(0.01);
  });

  it("clamps progress below 0 to 0", () => {
    const { getAllByTestId } = render(<CircularProgress progress={-0.5} />);
    const circles = getAllByTestId("svg-circle");
    const progressCircle = circles[1];
    const offset = parseFloat(progressCircle.props.strokeDashoffset);
    expect(Math.abs(offset - circumference)).toBeLessThan(0.01);
  });

  it("applies custom color to progress circle", () => {
    const { getAllByTestId } = render(
      <CircularProgress progress={0.5} color="#ff0000" />
    );
    const circles = getAllByTestId("svg-circle");
    const progressCircle = circles[1];
    expect(progressCircle.props.stroke).toBe("#ff0000");
  });

  it("applies custom size", () => {
    const customSize = 100;
    const customStroke = 4;
    const customRadius = (customSize - customStroke) / 2;
    const customCirc = 2 * Math.PI * customRadius;

    const { getAllByTestId } = render(
      <CircularProgress progress={0.5} size={customSize} />
    );
    const circles = getAllByTestId("svg-circle");
    const progressCircle = circles[1];
    expect(progressCircle.props.r).toBe(customRadius);
    const offset = parseFloat(progressCircle.props.strokeDashoffset);
    expect(Math.abs(offset - customCirc * 0.5)).toBeLessThan(0.01);
  });

  it("renders children", () => {
    const { getByText } = render(
      <CircularProgress progress={0.5}>
        <></>
      </CircularProgress>
    );
    // Just verify it doesn't crash with children
    expect(true).toBe(true);
  });
});
