import { describe, expect, it } from "vitest";
import {
  collapseSimilarConsecutiveAiMessages,
  preferCollapsedAiMessage,
  shouldMergeSimilarAiMessages,
} from "./collapse-similar-consecutive-ai-messages";
import type { AgentMessage } from "./types";

function ai(id: string, content: string, agent?: string): AgentMessage {
  return { id, type: "ai", content, timestamp: new Date(), ...(agent ? { agent } : {}) };
}

function human(id: string, content: string): AgentMessage {
  return { id, type: "human", content, timestamp: new Date() };
}

describe("shouldMergeSimilarAiMessages", () => {
  it("merges identical and prefix-extension copies", () => {
    expect(shouldMergeSimilarAiMessages("I'll update your summary.", "I'll update your summary. Done.")).toBe(true);
    expect(shouldMergeSimilarAiMessages("Same text", "Same text")).toBe(true);
  });

  it("does not merge clearly different replies", () => {
    expect(shouldMergeSimilarAiMessages("I'll route you to the resume specialist.", "Here are three jobs that match your profile.")).toBe(
      false
    );
  });
});

describe("preferCollapsedAiMessage", () => {
  it("drops clarifying ask when same agent later reports an update", () => {
    const earlier = ai("a1", "How about we organize them into three categories? Does this sound like a good approach?", "skills_agent");
    const later = ai(
      "a2",
      "Great! I've updated your skills to highlight your strengths. Your skills are now organized into three categories.",
      "skills_agent"
    );
    const preferred = preferCollapsedAiMessage(earlier, later);
    expect(preferred?.id).toBe("a2");
  });

  it("keeps longer ATS analysis over short completion wrap-up", () => {
    const earlier = ai(
      "a1",
      "Your current ATS overall score is 68. Weak sections include experience and skills. Missing keywords: Magento, Yoast. Guideline: strengthen experience bullets.",
      "ats_agent"
    );
    const later = ai(
      "a2",
      "I have completed the ATS score analysis for your resume. I've provided all the information and guidance requested.",
      "ats_agent"
    );
    const preferred = preferCollapsedAiMessage(earlier, later);
    expect(preferred?.id).toBe("a1");
  });

  it("keeps long ATS analysis over resume_agent internal recap", () => {
    const earlier = ai(
      "a1",
      "Your ATS score is 70. Missing keywords: Bing, Article Submissions, Forum posting. Top improvements: integrate off-page techniques in Experience.",
      "ats_agent"
    );
    const later = ai(
      "a2",
      "I have analyzed your resume's ATS score. I've also provided a detailed guideline for the resume_agent prioritizing Experience and Skills.",
      "ats_agent"
    );
    const preferred = preferCollapsedAiMessage(earlier, later);
    expect(preferred?.id).toBe("a1");
  });

  it("does not collapse distinct authors", () => {
    const earlier = ai("a1", "I'll hand this to the job board agent.", "unibot");
    const later = ai("a2", "Here are five roles that fit your background.", "job_board_agent");
    expect(preferCollapsedAiMessage(earlier, later)).toBeNull();
  });
});

describe("collapseSimilarConsecutiveAiMessages", () => {
  it("keeps only the latest similar AI bubble per user turn", () => {
    const messages = [
      human("u1", "Improve my summary"),
      ai("a1", "I'll read your resume and update the summary."),
      ai("a2", "I'll read your resume and update the summary."),
      ai("a3", "I'll read your resume and update the summary. Review the highlighted changes."),
      human("u2", "Thanks"),
    ];

    const collapsed = collapseSimilarConsecutiveAiMessages(messages);
    expect(collapsed).toHaveLength(3);
    expect(collapsed[1].id).toBe("a3");
    expect(collapsed[1].content).toContain("Review the highlighted changes");
  });

  it("preserves multiple distinct AI bubbles from different authors", () => {
    const messages = [
      human("u1", "Find me jobs"),
      ai("a1", "I'll hand this to the job board agent.", "unibot"),
      ai("a2", "Here are five roles that fit your background.", "job_board_agent"),
    ];

    const collapsed = collapseSimilarConsecutiveAiMessages(messages);
    expect(collapsed).toHaveLength(3);
    expect(collapsed.map(m => m.id)).toEqual(["u1", "a1", "a2"]);
  });

  it("hides intermediate same-agent proposal after refresh", () => {
    const messages = [
      human("u1", "Skills first."),
      ai("a1", "I recommend consolidating them into 2-3 categories. Does this sound like a good approach?", "skills_agent"),
      ai("a2", "Great! I've updated your skills to highlight your strengths for an SEO Specialist role.", "skills_agent"),
    ];

    const collapsed = collapseSimilarConsecutiveAiMessages(messages);
    expect(collapsed).toHaveLength(2);
    expect(collapsed[1].id).toBe("a2");
  });
});
