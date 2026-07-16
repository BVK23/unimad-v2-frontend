"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DOCUMENT_SAVED_CONFIRMATION_MS } from "@/constants/documentAutosave";
import type { PortfolioItem } from "@/types";
import { updateVpdContent } from "../server-actions/vpd-actions";
import { isPersistedVpdId } from "../utils/isPersistedVpdId";
import { getVpdProjectContentSignature, mapStudioProjectToVpdUpdateContent } from "../utils/mapStudioProjectToVpdUpdatePayload";

/** Match portfolio autosave debounce (usePortfolioAutosave). */
const AUTOSAVE_DELAY_MS = 5000;

type UseVpdAutosaveOptions = {
  enabled?: boolean;
  onPersisted?: () => void;
};

export function useVpdAutosave(project: PortfolioItem, options?: UseVpdAutosaveOptions) {
  const persistedId = isPersistedVpdId(project.id) ? String(project.id) : "";
  const enabled = options?.enabled !== false && Boolean(persistedId);

  const [lastAcknowledgedSnapshot, setLastAcknowledgedSnapshot] = useState("");
  const [activeSaveSource, setActiveSaveSource] = useState<"auto" | "manual" | null>(null);
  const [isSavingRemote, setIsSavingRemote] = useState(false);
  const [savedConfirmationVisible, setSavedConfirmationVisible] = useState(false);
  const [lastSaveError, setLastSaveError] = useState<{ message: string; nonce: number } | null>(null);

  const saveInFlightRef = useRef(false);
  const savedConfirmationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queuedSaveRef = useRef(false);
  const latestSnapshotRef = useRef("");
  const latestProjectRef = useRef(project);
  const runSaveRef = useRef<((source: "auto" | "manual") => Promise<void>) | null>(null);
  const acknowledgedSeededForIdRef = useRef<string | null>(null);
  const onPersistedRef = useRef(options?.onPersisted);

  useEffect(() => {
    onPersistedRef.current = options?.onPersisted;
  }, [options?.onPersisted]);

  useEffect(() => {
    latestProjectRef.current = project;
  }, [project]);

  const currentSnapshot = useMemo(() => (enabled ? getVpdProjectContentSignature(project) : ""), [enabled, project]);

  useEffect(() => {
    latestSnapshotRef.current = currentSnapshot;
  }, [currentSnapshot]);

  useEffect(() => {
    if (!enabled || !persistedId) return;
    if (acknowledgedSeededForIdRef.current === persistedId) return;

    acknowledgedSeededForIdRef.current = persistedId;
    const initialSnapshot = getVpdProjectContentSignature(project);
    setLastAcknowledgedSnapshot(initialSnapshot);
    latestSnapshotRef.current = initialSnapshot;
    saveInFlightRef.current = false;
    queuedSaveRef.current = false;
    setActiveSaveSource(null);
    setIsSavingRemote(false);
    setLastSaveError(null);
  }, [enabled, persistedId, project]);

  useEffect(() => {
    if (acknowledgedSeededForIdRef.current !== persistedId) {
      acknowledgedSeededForIdRef.current = null;
    }
  }, [persistedId]);

  const hasPendingUnsavedChanges = enabled && currentSnapshot !== lastAcknowledgedSnapshot;

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
      if (!persistedId || saveInFlightRef.current) {
        if (saveInFlightRef.current) {
          queuedSaveRef.current = true;
        }
        return;
      }

      const snapshotAtStart = latestSnapshotRef.current;
      const dataToSave = latestProjectRef.current;
      if (!isPersistedVpdId(dataToSave.id)) return;

      saveInFlightRef.current = true;
      setIsSavingRemote(true);
      setActiveSaveSource(source);

      try {
        await updateVpdContent(String(dataToSave.id), mapStudioProjectToVpdUpdateContent(dataToSave));
        setLastSaveError(null);
        setLastAcknowledgedSnapshot(snapshotAtStart);
        onPersistedRef.current?.();
        if (latestSnapshotRef.current === snapshotAtStart) {
          showSavedConfirmation();
        }
        if (latestSnapshotRef.current !== snapshotAtStart) {
          queuedSaveRef.current = true;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to save VPD";
        console.error("[vpd-autosave] save failed", {
          vpdId: persistedId,
          source,
          message,
          error,
        });
        setLastSaveError({ message, nonce: Date.now() });
      } finally {
        saveInFlightRef.current = false;
        setIsSavingRemote(false);
        setActiveSaveSource(null);

        if (queuedSaveRef.current) {
          queuedSaveRef.current = false;
          if (runSaveRef.current) {
            void runSaveRef.current("auto");
          }
        }
      }
    },
    [persistedId, showSavedConfirmation]
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
