"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DOCUMENT_SAVED_CONFIRMATION_MS } from "@/constants/documentAutosave";
import { waitForPortfolioLayoutSettle } from "@/features/portfolio/layout/portfolioLayoutRemeasure";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import { getPortfolioContentSignature } from "@/features/portfolio/utils/getPortfolioContentSignature";
import { useUpdatePortfolio } from "./useUpdatePortfolio";

const AUTOSAVE_DELAY_MS = 5000;

export function usePortfolioAutosave(portfolioId: string, options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false && Boolean(portfolioId?.trim());
  const portfolio = usePortfolioStore(s => (enabled ? s.getPortfolioData(portfolioId) : undefined));
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

  const currentSnapshot = useMemo(() => (portfolio ? getPortfolioContentSignature(portfolio) : ""), [portfolio]);

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
    if (!enabled) return "";
    if (isSavingRemote) return activeSaveSource === "manual" ? "Saving..." : "Autosaving...";
    if (hasPendingUnsavedChanges) return "Unsaved changes";
    return "All changes saved";
  }, [activeSaveSource, enabled, hasPendingUnsavedChanges, isSavingRemote]);

  const runSave = useCallback(
    async (source: "auto" | "manual") => {
      if (!portfolioId || saveInFlightRef.current) {
        if (saveInFlightRef.current) {
          queuedSaveRef.current = true;
        }
        return;
      }

      const snapshotAtStart = latestSnapshotRef.current;

      await waitForPortfolioLayoutSettle();

      const dataToSave = usePortfolioStore.getState().getPortfolioData(portfolioId);
      if (!dataToSave) return;

      saveInFlightRef.current = true;
      setActiveSaveSource(source);

      try {
        await updatePortfolioMutation(dataToSave);
        setLastSaveError(null);
        setLastAcknowledgedSnapshot(snapshotAtStart);
        if (latestSnapshotRef.current === snapshotAtStart) {
          showSavedConfirmation();
        }

        if (latestSnapshotRef.current !== snapshotAtStart) {
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
    [portfolioId, showSavedConfirmation, updatePortfolioMutation]
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
