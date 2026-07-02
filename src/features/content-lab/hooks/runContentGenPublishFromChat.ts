import { normalizeLinkedinPostError } from "@/features/content-lab/api/normalizeLinkedinPostError";
import { postContentGenToLinkedIn, updateContentGenAsset } from "@/features/content-lab/server-actions/content-lab-actions";

export type ContentGenPublishStep = "validate" | "save_draft" | "schedule" | "post" | "done";

const STEP_LABELS: Record<ContentGenPublishStep, string> = {
  validate: "Checking draft…",
  save_draft: "Saving draft…",
  schedule: "Scheduling post…",
  post: "Posting to LinkedIn…",
  done: "Finishing up…",
};

export type RunContentGenPublishInput = {
  assetId: string;
  content: string;
  mode: "post_now" | "schedule";
  scheduledAt?: string;
  onStep?: (step: ContentGenPublishStep) => void;
};

export type RunContentGenPublishResult =
  | { ok: true; mode: "post_now" }
  | { ok: true; mode: "schedule"; scheduledAt: string }
  | { ok: false; message: string };

const formatScheduledAtForUser = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export const runContentGenPublishFromChat = async (input: RunContentGenPublishInput): Promise<RunContentGenPublishResult> => {
  const { assetId, content, mode, scheduledAt, onStep } = input;
  const trimmed = content.trim();

  onStep?.("validate");
  if (!assetId) {
    return { ok: false, message: "No saved draft found. Accept the draft review in chat first." };
  }
  if (!trimmed) {
    return { ok: false, message: "Your draft is empty. Generate or edit your post in Studio first." };
  }

  if (mode === "schedule" && !scheduledAt) {
    return {
      ok: false,
      message:
        'I need a specific date and time — for example: "schedule this post for today at 4:00 PM" or "schedule for tomorrow at 9am".',
    };
  }

  const scheduleDate = mode === "schedule" && scheduledAt ? new Date(scheduledAt) : null;
  if (scheduleDate && Number.isNaN(scheduleDate.getTime())) {
    return { ok: false, message: "I couldn't understand that date and time. Try again with a clearer time." };
  }
  if (scheduleDate && scheduleDate.getTime() <= Date.now()) {
    return { ok: false, message: "Pick a date and time in the future." };
  }

  try {
    onStep?.("save_draft");
    if (mode === "schedule" && scheduleDate) {
      onStep?.("schedule");
      const scheduleResult = await updateContentGenAsset({
        id: assetId,
        content: trimmed,
        dateScheduled: scheduleDate.toISOString(),
        status: "Scheduled",
      });
      if (!scheduleResult.success) {
        return { ok: false, message: normalizeLinkedinPostError(scheduleResult.error) };
      }
      onStep?.("done");
      return { ok: true, mode: "schedule", scheduledAt: scheduleDate.toISOString() };
    }

    onStep?.("save_draft");
    const saveResult = await updateContentGenAsset({ id: assetId, content: trimmed });
    if (!saveResult.success) {
      return { ok: false, message: normalizeLinkedinPostError(saveResult.error) };
    }
    onStep?.("post");
    const postResult = await postContentGenToLinkedIn(assetId);
    if (!postResult.success) {
      return { ok: false, message: normalizeLinkedinPostError(postResult.error) };
    }
    onStep?.("done");
    return { ok: true, mode: "post_now" };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Publish failed";
    return { ok: false, message: normalizeLinkedinPostError(raw) };
  }
};

export const successMessageForPublishResult = (result: RunContentGenPublishResult & { ok: true }): string => {
  if (result.mode === "post_now") {
    return "Your post was published to LinkedIn.";
  }
  return `Your post is scheduled for ${formatScheduledAtForUser(result.scheduledAt)}. You can view it under Scheduled posts in Studio.`;
};

export const publishStepLabel = (step: ContentGenPublishStep): string => STEP_LABELS[step];
