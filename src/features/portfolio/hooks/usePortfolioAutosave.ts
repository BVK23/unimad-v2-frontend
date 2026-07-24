"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DOCUMENT_AUTOSAVE_DELAY_MS, DOCUMENT_SAVED_CONFIRMATION_MS } from "@/constants/documentAutosave";
import { useAdkPortfolioReviewStore } from "@/features/adk-chat/stores/useAdkPortfolioReviewStore";
import { waitForPortfolioLayoutSettle } from "@/features/portfolio/layout/portfolioLayoutRemeasure";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import { getPortfolioContentSignature, getPortfolioEditorialSignature } from "@/features/portfolio/utils/getPortfolioContentSignature";
import type { PortfolioData } from "@/types";
import { useUpdatePortfolio } from "./useUpdatePortfolio";

/** Match resume / document autosave debounce (~12s). */
const AUTOSAVE_DELAY_MS = DOCUMENT_AUTOSAVE_DELAY_MS;

export function usePortfolioAutosave(
  portfolioId: string,
  options?: {
    enabled?: boolean;
    onPersisted?: (id: string, portfolio: PortfolioData) => void;
  }
) {
  const portfolio = usePortfolioStore(s =>
    options?.enabled !== false && portfolioId?.trim() ? s.getPortfolioData(portfolioId) : undefined
  );
  const currentSnapshot = useMemo(() => (portfolio ? getPortfolioContentSignature(portfolio) : ""), [portfolio]);
  const editorialSnapshot = useMemo(() => (portfolio ? getPortfolioEditorialSignature(portfolio) : ""), [portfolio]);
  const holdingUnacceptedAdkDraft = useAdkPortfolioReviewStore(s => s.isHoldingUnacceptedAdkDraft(portfolioId, editorialSnapshot));
  // Pause autosave only while the ADK draft is untouched. Manual edits during Accept/Discard
  // should start the debounce (same pattern as resume / studio drafts).
  const enabled = options?.enabled !== false && Boolean(portfolioId?.trim()) && !holdingUnacceptedAdkDraft;
  const { mutateAsync: updatePortfolioMutation, isPending: isSavingRemote } = useUpdatePortfolio();

  const [lastAcknowledgedSnapshot, setLastAcknowledgedSnapshot] = useState("");
  const [activeSaveSource, setActiveSaveSource] = useState<"auto" | "manual" | null>(null);
  const [savedConfirmationVisible, setSavedConfirmationVisible] = useState(false);
  const [lastSaveError, setLastSaveError] = useState<{ message: string; nonce: number } | null>(null);

  const saveInFlightRef = useRef(false);
  const savedConfirmationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queuedSaveRef = useRef(false);
  const latestSnapshotRef = useRef("");
  const runSaveRef = useRef<((source: "auto" | "manual") => Promise<void>) | null>(null);
  const acknowledgedSeededForIdRef = useRef<string | null>(null);

  useEffect(() => {
    latestSnapshotRef.current = currentSnapshot;
  }, [currentSnapshot]);

  useEffect(() => {
    if (!portfolio) return;
    if (acknowledgedSeededForIdRef.current === portfolioId) return;

    acknowledgedSeededForIdRef.current = portfolioId;
    const initialSnapshot = getPortfolioContentSignature(portfolio);
    setLastAcknowledgedSnapshot(initialSnapshot);
    latestSnapshotRef.current = initialSnapshot;
    saveInFlightRef.current = false;
    queuedSaveRef.current = false;
    setActiveSaveSource(null);
  }, [portfolioId, portfolio]);

  useEffect(() => {
    if (acknowledgedSeededForIdRef.current !== portfolioId) {
      acknowledgedSeededForIdRef.current = null;
    }
  }, [portfolioId]);

  const hasPendingUnsavedChanges = Boolean(portfolio) && currentSnapshot !== lastAcknowledgedSnapshot;

  const clearSavedConfirmationTimer = useCallback(() => {
    if (savedConfirmationTimerRef.current) {
      clearTimeout(savedConfirmationTimerRef.current);
      savedConfirmationTimerRef.current = null;
    }
  }, []);

  const showSavedConfirmation = useCallback(() => {
    setSavedConfirmationVisible(true);
    clearSavedConfirmationTimer();
    savedConfirmationTimerRef.current = setTimeout(() => {
      setSavedConfirmationVisible(false);
      savedConfirmationTimerRef.current = null;
    }, DOCUMENT_SAVED_CONFIRMATION_MS);
  }, [clearSavedConfirmationTimer]);

  useEffect(() => {
    return () => clearSavedConfirmationTimer();
  }, [clearSavedConfirmationTimer]);

  useEffect(() => {
    if (hasPendingUnsavedChanges) {
      setSavedConfirmationVisible(false);
      clearSavedConfirmationTimer();
    }
  }, [clearSavedConfirmationTimer, hasPendingUnsavedChanges]);

  const saveStatusLabel = useMemo(() => {
    if (options?.enabled === false || !portfolioId?.trim()) return "";
    if (holdingUnacceptedAdkDraft) return "Review Unibot changes";
    if (isSavingRemote) return activeSaveSource === "manual" ? "Saving..." : "Autosaving...";
    if (hasPendingUnsavedChanges) return "Unsaved changes";
    return "All changes saved";
  }, [activeSaveSource, hasPendingUnsavedChanges, holdingUnacceptedAdkDraft, isSavingRemote, options?.enabled, portfolioId]);

  const runSave = useCallback(
    async (source: "auto" | "manual") => {
      if (!portfolioId || saveInFlightRef.current) {
        if (saveInFlightRef.current) {
          queuedSaveRef.current = true;
        }
        return;
      }

      await waitForPortfolioLayoutSettle();

      const dataToSave = usePortfolioStore.getState().getPortfolioData(portfolioId);
      if (!dataToSave) return;

      const savedSnapshot = getPortfolioContentSignature(dataToSave);

      saveInFlightRef.current = true;
      setActiveSaveSource(source);

      try {
        const result = await updatePortfolioMutation(dataToSave);
        setLastSaveError(null);

        if (result.created) {
          options?.onPersisted?.(result.id, result.portfolio);
        }

        const currentData =
          usePortfolioStore.getState().getPortfolioData(result.id) ?? usePortfolioStore.getState().getPortfolioData(portfolioId);
        const currentSnapshot = currentData ? getPortfolioContentSignature(currentData) : latestSnapshotRef.current;

        if (currentSnapshot === savedSnapshot) {
          setLastAcknowledgedSnapshot(savedSnapshot);
          if (latestSnapshotRef.current === savedSnapshot) {
            showSavedConfirmation();
          }
        }

        if (latestSnapshotRef.current !== savedSnapshot) {
          queuedSaveRef.current = true;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to save portfolio";
        console.error("[portfolio-autosave] save failed", {
          portfolioId,
          source,
          message,
          error,
        });
        setLastSaveError({ message, nonce: Date.now() });
      } finally {
        saveInFlightRef.current = false;
        setActiveSaveSource(null);

        if (queuedSaveRef.current) {
          queuedSaveRef.current = false;
          if (runSaveRef.current) {
            void runSaveRef.current("auto");
          }
        }
      }
    },
    [options?.onPersisted, portfolioId, showSavedConfirmation, updatePortfolioMutation]
  );

  useEffect(() => {
    runSaveRef.current = runSave;
  }, [runSave]);

  useEffect(() => {
    if (!enabled || !hasPendingUnsavedChanges) return;

    const timer = window.setTimeout(() => {
      void runSave("auto");
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [enabled, hasPendingUnsavedChanges, runSave]);

  useEffect(() => {
    if (!enabled || !hasPendingUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled, hasPendingUnsavedChanges]);

  return {
    saveStatusLabel,
    isSavingRemote,
    hasPendingUnsavedChanges,
    savedConfirmationVisible,
    lastSaveError,
    runSave,
  };
}
