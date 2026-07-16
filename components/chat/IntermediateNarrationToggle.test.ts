import { describe, expect, it } from "vitest";
import { latestIntermediateLine } from "./IntermediateNarrationToggle";

describe("latestIntermediateLine", () => {
  it("returns the last non-empty line", () => {
    expect(latestIntermediateLine("Line one\n\nLine two\nLine three  ")).toBe("Line three");
  });

  it("handles a single line", () => {
    expect(latestIntermediateLine("Only one")).toBe("Only one");
  });
});
