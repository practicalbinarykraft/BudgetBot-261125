import React from "react";
import LegacySpotlight from "./spotlight/LegacySpotlight";
import FlowSpotlight from "./spotlight/FlowSpotlight";

export default function SpotlightOverlay() {
  return (
    <>
      <FlowSpotlight />
      <LegacySpotlight />
    </>
  );
}
