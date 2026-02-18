import React from "react";
import { View } from "react-native";
import { render } from "@testing-library/react-native";
import { Card, CardContent } from "../../components/Card";
import { Spacing } from "../../constants/theme";

jest.mock("../../hooks/useTheme", () => ({
  useTheme: () => ({
    theme: {
      card: "#f9f9f9",
      cardBorder: "#efefef",
      text: "#000",
    },
  }),
}));

describe("CardContent", () => {
  it("has symmetric padding (top, bottom, horizontal all equal Spacing.lg)", () => {
    const tree = render(
      <Card>
        <CardContent>
          <View testID="inner" />
        </CardContent>
      </Card>,
    ).toJSON() as any;

    // tree = Card View → CardContent View → inner View
    const cardContentNode = tree.children[0];
    const style = Array.isArray(cardContentNode.props.style)
      ? Object.assign({}, ...cardContentNode.props.style.filter(Boolean))
      : cardContentNode.props.style;

    expect(style.padding).toBe(Spacing.lg);
    expect(style.paddingHorizontal).toBeUndefined();
    expect(style.paddingBottom).toBeUndefined();
  });
});
