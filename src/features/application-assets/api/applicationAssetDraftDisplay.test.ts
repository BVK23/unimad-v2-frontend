import assert from "node:assert/strict";
import { applicationAssetDraftReviewMessage, stripApplicationAssetDraftFromMessage } from "./applicationAssetDraftDisplay";

const SAMPLE_DRAFT =
  "June 19, 2026\n\nSAP Hiring Team\n\nDear SAP Hiring Team,\n\nI am writing to express my interest in the Full Stack Developer role. " +
  "My experience building scalable applications aligns well with your mission to help the world run better.";

const draftJson = (data: string, assetType = "coverletter") =>
  `\`\`\`json
{"data": ${JSON.stringify(data)}, "asset_type": "${assetType}", "role": "Full Stack Developer", "company": "SAP"}
\`\`\``;

const runTests = () => {
  const reviewLine = applicationAssetDraftReviewMessage("coverletter");

  {
    const message = `Here is a revised draft for your cover letter. Please review it in Studio.${draftJson(SAMPLE_DRAFT)}`;
    const visible = stripApplicationAssetDraftFromMessage(message);
    assert.ok(!visible.includes("SAP Hiring Team") || visible.length <= 180, "short intro should not expose full letter");
    assert.ok(visible.includes("revised draft") || visible.includes("review"), "keeps short user-facing intro");
  }

  {
    const longReasoning =
      "The `body` from `get_application_asset_draft` still contains the prior draft.\n\n" +
      "The current correct base cover letter should be:\n\n" +
      SAMPLE_DRAFT +
      "\n\nNow, the user wants to change the call to action.\n\n" +
      draftJson(SAMPLE_DRAFT);
    const visible = stripApplicationAssetDraftFromMessage(longReasoning);
    assert.equal(visible, reviewLine, "long reasoning + letter prose collapses to review line");
  }

  {
    const message = draftJson(SAMPLE_DRAFT);
    const visible = stripApplicationAssetDraftFromMessage(message);
    assert.equal(visible, reviewLine, "json-only message collapses to review line");
  }

  {
    const message = "How can I help with your job search today?";
    const visible = stripApplicationAssetDraftFromMessage(message);
    assert.equal(visible, message, "non-draft message passes through unchanged");
  }
};

runTests();
console.log("OK: applicationAssetDraftDisplay tests passed");
