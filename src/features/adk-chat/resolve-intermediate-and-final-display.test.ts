import { describe, expect, it } from "vitest";
import { resolveIntermediateAndFinalDisplay, streamsUserFacingAnalysis } from "./resolve-intermediate-and-final-display";

describe("streamsUserFacingAnalysis", () => {
  it("treats ats_agent as user-facing analysis", () => {
    expect(streamsUserFacingAnalysis("ats_agent")).toBe(true);
    expect(streamsUserFacingAnalysis("ATS_AGENT")).toBe(true);
  });

  it("does not treat mutators / coordinators as user-facing analysis by default", () => {
    expect(streamsUserFacingAnalysis("portfolio_agent")).toBe(false);
    expect(streamsUserFacingAnalysis("resume_agent")).toBe(false);
    expect(streamsUserFacingAnalysis(undefined)).toBe(false);
  });
});

describe("resolveIntermediateAndFinalDisplay", () => {
  it("keeps parked narration as intermediate and content as final", () => {
    const result = resolveIntermediateAndFinalDisplay({
      modelVisibleText: "I've updated your portfolio section.",
      intermediateNarration: "Drafting a stronger USP…",
      isLiveStreaming: false,
    });
    expect(result).toEqual({
      intermediateText: "Drafting a stronger USP…",
      finalText: "I've updated your portfolio section.",
      intermediateIsStreaming: false,
    });
  });

  it("shows live streaming text as intermediate for non-analyst agents", () => {
    const result = resolveIntermediateAndFinalDisplay({
      modelVisibleText: "## Draft\n- bullet",
      isLiveStreaming: true,
      agent: "portfolio_agent",
    });
    expect(result.intermediateText).toContain("Draft");
    expect(result.finalText).toBe("");
    expect(result.intermediateIsStreaming).toBe(true);
  });

  it("streams ats_agent analysis as final (not intermediate)", () => {
    const result = resolveIntermediateAndFinalDisplay({
      modelVisibleText: "Your ATS score is **70**. Missing keywords: Bing.",
      isLiveStreaming: true,
      agent: "ats_agent",
    });
    expect(result.intermediateText).toBe("");
    expect(result.finalText).toContain("70");
    expect(result.intermediateIsStreaming).toBe(false);
  });

  it("promotes settled unparked text to final", () => {
    const result = resolveIntermediateAndFinalDisplay({
      modelVisibleText: "Done.",
      isLiveStreaming: false,
      agent: "portfolio_agent",
    });
    expect(result).toEqual({
      intermediateText: "",
      finalText: "Done.",
      intermediateIsStreaming: false,
    });
  });
});
