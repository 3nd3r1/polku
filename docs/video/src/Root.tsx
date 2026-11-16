import React from "react";
import { Composition } from "remotion";
import { PolkuVideo, TOTAL } from "./Video";
import { PolkuVideo2, TOTAL2 } from "./v2/Video2";
import { FPS } from "./theme";

export const Root: React.FC = () => (
  <>
    <Composition id="Polku" component={PolkuVideo} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
    <Composition id="PolkuV2" component={PolkuVideo2} defaultProps={{ people: true }} durationInFrames={TOTAL2} fps={FPS} width={1920} height={1080} />
    <Composition id="PolkuV2Drawn" component={PolkuVideo2} defaultProps={{ people: false }} durationInFrames={TOTAL2} fps={FPS} width={1920} height={1080} />
  </>
);
