"use client";

import { useState, useEffect, useCallback } from "react";

export interface UseBackendHealthReturn {
  isBackendReady: boolean;
  isCheckingBackend: boolean;
  lastChecked: Date | null;
  checkBackendHealth: () => Promise<boolean>;
  startHealthMonitoring: () => void;
  retryWithBackoff: <T>(fn: () => Promise<T>, maxRetries?: number, maxDuration?: number) => Promise<T>;
}

export function useBackendHealth(): UseBackendHealthReturn {
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const retryWithBackoff = useCallback(
    async <T>(fn: () => Promise<T>, maxRetries: number = 10, maxDuration: number = 120000): Promise<T> => {
      const startTime = Date.now();
      let lastError: Error = new Error("retry failed");

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (Date.now() - startTime > maxDuration) {
          throw new Error(`Retry timeout after ${maxDuration}ms`);
        }

        try {
          return await fn();
        } catch (error) {
          lastError = error as Error;
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      throw lastError;
    },
    []
  );

  const checkBackendHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/health", { method: "GET" });
      setLastChecked(new Date());
      return response.ok;
    } catch {
      try {
        const response = await fetch("/api/run_sse", {
          method: "OPTIONS",
          headers: { "Content-Type": "application/json" },
        });
        setLastChecked(new Date());
        return response.ok;
      } catch (error) {
        setLastChecked(new Date());
        return false;
      }
    }
  }, []);

  const startHealthMonitoring = useCallback((): void => {
    const checkBackend = async (): Promise<void> => {
      setIsCheckingBackend(true);
      const maxAttempts = 30;
      let attempts = 0;

      while (attempts < maxAttempts) {
        const isReady = await checkBackendHealth();
        if (isReady) {
          setIsBackendReady(true);
          setIsCheckingBackend(false);
          return;
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setIsCheckingBackend(false);
    };

    void checkBackend();
  }, [checkBackendHealth]);

  useEffect(() => {
    startHealthMonitoring();
  }, [startHealthMonitoring]);

  return {
    isBackendReady,
    isCheckingBackend,
    lastChecked,
    checkBackendHealth,
    startHealthMonitoring,
    retryWithBackoff,
  };
}
