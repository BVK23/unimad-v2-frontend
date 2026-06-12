"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DOCUMENT_AUTOSAVE_DELAY_MS, DOCUMENT_SAVED_CONFIRMATION_MS } from "@/constants/documentAutosave";

type UseDocumentAutosaveOptions = {
  enabled?: boolean;
  onSave: () => Promise<void>;
};

export function useDocumentAutosave({ enabled = true, onSave }: UseDocumentAutosaveOptions) {
  const [hasPendingUnsavedChanges, setHasPendingUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedConfirmationVisible, setSavedConfirmationVisible] = useState(false);

  const saveInFlightRef = useRef(false);
  const savedConfirmationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

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

  const runSave = useCallback(async () => {
    if (!enabled || saveInFlightRef.current) return;

    saveInFlightRef.current = true;
    setIsSaving(true);
    try {
      await onSaveRef.current();
      setHasPendingUnsavedChanges(false);
      showSavedConfirmation();
    } catch {
      // Caller may surface errors elsewhere; keep dirty state for retry.
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  }, [enabled, showSavedConfirmation]);

  const markDirty = useCallback(() => {
    if (!enabled) return;
    setHasPendingUnsavedChanges(true);
    setSavedConfirmationVisible(false);
    clearSavedConfirmationTimer();
  }, [clearSavedConfirmationTimer, enabled]);

  const reset = useCallback(() => {
    setHasPendingUnsavedChanges(false);
    setIsSaving(false);
    setSavedConfirmationVisible(false);
    clearSavedConfirmationTimer();
  }, [clearSavedConfirmationTimer]);

  useEffect(() => {
    if (!enabled || !hasPendingUnsavedChanges) return;

    const timer = window.setTimeout(() => {
      void runSave();
    }, DOCUMENT_AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [enabled, hasPendingUnsavedChanges, runSave]);

  useEffect(() => {
    return () => clearSavedConfirmationTimer();
  }, [clearSavedConfirmationTimer]);

  return {
    hasPendingUnsavedChanges,
    isSaving,
    savedConfirmationVisible,
    markDirty,
    runSave,
    reset,
  };
}
