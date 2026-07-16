"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PortfolioItem } from "@/types";
import { duplicateVpd, updateVpdContent } from "../server-actions/vpd-actions";
import { isVpdTemplateId } from "../utils/isVpdTemplateId";
import { getVpdProjectEditSignature, mapStudioProjectToVpdUpdateContent } from "../utils/mapStudioProjectToVpdUpdatePayload";

/** Match `useVpdAutosave` debounce so claim timing feels like a save. */
const CLAIM_DEBOUNCE_MS = 5000;

type UseVpdTemplateClaimOptions = {
  enabled?: boolean;
  onClaimed?: (next: { id: string; title: string; project: PortfolioItem }) => void;
};

/**
 * When editing a template fixture, detect first dirty debounce and prompt once
 * to save as the user's own VPD (duplicate + update with current edits).
 */
export function useVpdTemplateClaim(project: PortfolioItem, options?: UseVpdTemplateClaimOptions) {
  const enabled = options?.enabled !== false && isVpdTemplateId(project.id);
  const onClaimedRef = useRef(options?.onClaimed);
  const projectRef = useRef(project);

  const [baselineSignature, setBaselineSignature] = useState("");
  const [promptOffered, setPromptOffered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    onClaimedRef.current = options?.onClaimed;
  }, [options?.onClaimed]);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  // New template session: seed baseline and reset prompt state.
  useEffect(() => {
    if (!enabled) {
      setBaselineSignature("");
      setPromptOffered(false);
      setShowModal(false);
      setShowBanner(false);
      setClaimError(null);
      return;
    }

    setBaselineSignature(getVpdProjectEditSignature(project));
    setPromptOffered(false);
    setShowModal(false);
    setShowBanner(false);
    setClaimError(null);
    // Intentionally only when template id / enabled flips — not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed on session start only
  }, [enabled, project.id]);

  const currentSignature = useMemo(() => (enabled ? getVpdProjectEditSignature(project) : ""), [enabled, project]);

  const isDirty = Boolean(enabled && baselineSignature && currentSignature !== baselineSignature);

  useEffect(() => {
    if (!enabled || !isDirty || promptOffered) return;

    const timer = window.setTimeout(() => {
      setPromptOffered(true);
      setShowModal(true);
    }, CLAIM_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [enabled, isDirty, promptOffered, currentSignature]);

  const dismissPrompt = useCallback(() => {
    setShowModal(false);
    setShowBanner(true);
    setPromptOffered(true);
  }, []);

  const claimAsMyVpd = useCallback(async () => {
    const current = projectRef.current;
    if (!isVpdTemplateId(current.id) || isClaiming) return;

    setIsClaiming(true);
    setClaimError(null);
    try {
      const duplicated = await duplicateVpd(String(current.id), true);
      // Always use backend placeholder title ("Untitled VPD"), not the template label.
      const nextTitle = duplicated.title?.trim() || "Untitled VPD";
      const nextProject: PortfolioItem = {
        ...current,
        id: duplicated.id,
        title: nextTitle,
      };
      await updateVpdContent(duplicated.id, mapStudioProjectToVpdUpdateContent(nextProject));
      setShowModal(false);
      setShowBanner(false);
      setPromptOffered(true);
      onClaimedRef.current?.({ id: duplicated.id, title: nextTitle, project: nextProject });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save as your VPD";
      setClaimError(message);
      setShowModal(true);
      setShowBanner(false);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setIsClaiming(false);
    }
  }, [isClaiming]);

  /** Explicit Save / Publish while still on a template. */
  const requestClaim = useCallback(() => {
    if (!enabled) return;
    setPromptOffered(true);
    if (showBanner && !showModal) {
      void claimAsMyVpd();
      return;
    }
    setShowModal(true);
  }, [claimAsMyVpd, enabled, showBanner, showModal]);

  return {
    isTemplateSession: enabled,
    isDirty,
    showModal,
    showBanner,
    isClaiming,
    claimError,
    dismissPrompt,
    claimAsMyVpd,
    requestClaim,
  };
}
