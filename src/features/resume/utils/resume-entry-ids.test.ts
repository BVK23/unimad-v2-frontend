import { describe, expect, it } from "vitest";
import { isLegacyTimestampEntryId, nextResumeEntryId } from "./resume-entry-ids";

describe("resume-entry-ids", () => {
  it("ignores legacy timestamp ids when allocating", () => {
    expect(nextResumeEntryId(["1783631607384"], "exp")).toBe("exp_1");
    expect(nextResumeEntryId(["1783631607384", "exp_2"], "exp")).toBe("exp_3");
  });

  it("continues prefixed sequence", () => {
    expect(nextResumeEntryId(["exp_1", "exp_3"], "exp")).toBe("exp_4");
    expect(nextResumeEntryId(["edu_1", "2"], "edu")).toBe("edu_3");
  });

  it("detects timestamp legacy ids", () => {
    expect(isLegacyTimestampEntryId("1783631607384")).toBe(true);
    expect(isLegacyTimestampEntryId("edu_1")).toBe(false);
    expect(isLegacyTimestampEntryId("42")).toBe(false);
  });
});
