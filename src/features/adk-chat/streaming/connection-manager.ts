/**
 * Connection Manager
 *
 * This module handles SSE streaming connection lifecycle management including
 * connection establishment, data streaming, error handling, and cleanup.
 */
import { RefObject } from "react";
import { buildRunSseFetchInit, isDirectAdkSseInDev, resolveAdkChatStreamUrl } from "@/src/lib/adk/client-run-sse";
import { createDebugLog } from "@/src/lib/adk/run-sse-common";
import { isAdkActivityTraceEnabled } from "./activity-trace";
import { processSseEventData } from "./stream-processor";
import { SSEConnectionState, StreamProcessingCallbacks, StreamingAPIPayload, ConnectionManagerOptions } from "./types";

/** Next.js proxy in prod; optional direct ADK in dev (see NEXT_PUBLIC_ADK_SSE_DIRECT). */
export const ADK_CHAT_STREAM_ENDPOINT = "/api/run_sse";

/**
 * Manages SSE streaming connections
 */
export class StreamingConnectionManager {
  private connectionState: SSEConnectionState = "idle";
  private retryFn: <T>(fn: () => Promise<T>) => Promise<T>;
  private endpoint: string;
  private streamTiming: ConnectionManagerOptions["streamTiming"];
  private abortController: AbortController | null = null;

  constructor(options: ConnectionManagerOptions = {}) {
    this.retryFn = options.retryFn || (fn => fn());
    this.endpoint = options.endpoint || ADK_CHAT_STREAM_ENDPOINT;
    this.streamTiming = options.streamTiming;
  }

  /**
   * Gets the current connection state
   */
  public getConnectionState(): SSEConnectionState {
    return this.connectionState;
  }

  /**
   * Starts a streaming connection and processes SSE events in real-time
   *
   * @param apiPayload - API request payload
   * @param callbacks - Stream processing callbacks
   * @param accumulatedTextRef - Reference to accumulated text
   * @param currentAgentRef - Reference to current agent state
   * @param setCurrentAgent - Agent state setter
   * @param setIsLoading - Loading state setter
   * @returns Whether any assistant text was streamed into the bubble
   */
  public async submitMessage(
    apiPayload: StreamingAPIPayload,
    callbacks: StreamProcessingCallbacks,
    accumulatedTextRef: RefObject<string>,
    currentAgentRef: RefObject<string>,
    setCurrentAgent: (agent: string) => void,
    setIsLoading: (loading: boolean) => void,
    aiMessageId: string
  ): Promise<boolean> {
    this.connectionState = "connecting";
    setIsLoading(true);
    accumulatedTextRef.current = "";
    currentAgentRef.current = "";
    this.abortController = new AbortController();

    const streamUrl = resolveAdkChatStreamUrl();
    const fetchInit = buildRunSseFetchInit(apiPayload);

    try {
      createDebugLog("CONNECTION", "Sending API request", {
        endpoint: streamUrl,
        directAdk: isDirectAdkSseInDev(),
        apiPayload,
      });
      if (isDirectAdkSseInDev() && isAdkActivityTraceEnabled()) {
        console.info(`[adk-activity] stream via direct ADK (${streamUrl}) — bypasses Next dev buffering`);
      }

      this.streamTiming?.onFetchStart?.();
      const requestStartedAt = Date.now();
      const response = await this.retryFn(() =>
        fetch(streamUrl, {
          ...fetchInit,
          signal: this.abortController?.signal,
        })
      );
      const headersAt = Date.now();
      if (isAdkActivityTraceEnabled()) {
        const ttfbMs = headersAt - requestStartedAt;
        console.info(
          `[adk-activity] fetch headers +${ttfbMs}ms from fetch start | content-type=${response.headers.get("content-type") ?? "?"}`
        );
        if (ttfbMs > 3000) {
          console.warn(
            "[adk-activity] slow TTFB — HTTP headers arrived only when the run finished. " +
              "Common causes: local antivirus/HTTPS inspection buffering POST SSE, gzip middleware, or Next dev. " +
              "Try disabling AV SSL scan for localhost, confirm Content-Encoding: identity on /api/run_sse, " +
              "or test with curl -N vs browser fetch on the same URL."
          );
        }
      }
      this.streamTiming?.onFetchResponse?.(response);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        const detail = errorBody.trim() ? ` ${errorBody.slice(0, 800)}` : "";
        throw new Error(`API error: ${response.status} ${response.statusText}${detail}`);
      }

      this.connectionState = "connected";

      // Handle SSE streaming with proper event processing
      await this.handleSSEStream(
        response,
        aiMessageId,
        callbacks,
        accumulatedTextRef,
        currentAgentRef,
        setCurrentAgent,
        requestStartedAt,
        headersAt
      );

      this.connectionState = "idle";
      setIsLoading(false);
      return accumulatedTextRef.current.trim().length > 0;
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        this.connectionState = "closed";
        createDebugLog("CONNECTION", "Request was cancelled by the user");
      } else {
        this.connectionState = "error";
        createDebugLog("CONNECTION", "Streaming error", error);
      }

      setIsLoading(false);
      if ((error as Error).name !== "AbortError") {
        throw error;
      }
      return accumulatedTextRef.current.trim().length > 0;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Cancels the current streaming connection
   *
   * @param accumulatedTextRef - Reference to accumulated text (for cleanup)
   * @param currentAgentRef - Reference to current agent state (for cleanup)
   * @param setCurrentAgent - Agent state setter (for cleanup)
   * @param setIsLoading - Loading state setter
   */
  public cancelRequest(
    accumulatedTextRef: RefObject<string>,
    currentAgentRef: RefObject<string>,
    setCurrentAgent: (agent: string) => void,
    setIsLoading: (loading: boolean) => void
  ): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.connectionState = "closed";
    setIsLoading(false);

    // Clear any accumulated state
    accumulatedTextRef.current = "";
    currentAgentRef.current = "";
    setCurrentAgent("");
  }

  /**
   * Handle SSE streaming from both local backend and Agent Engine
   * Both backends now send standard SSE format (text/event-stream)
   *
   * @param response - Fetch response with SSE stream
   * @param aiMessageId - AI message ID for updates
   * @param callbacks - Stream processing callbacks
   * @param accumulatedTextRef - Reference to accumulated text
   * @param currentAgentRef - Reference to current agent state
   * @param setCurrentAgent - Agent state setter
   */
  private async handleSSEStream(
    response: Response,
    aiMessageId: string,
    callbacks: StreamProcessingCallbacks,
    accumulatedTextRef: RefObject<string>,
    currentAgentRef: RefObject<string>,
    setCurrentAgent: (agent: string) => void,
    requestStartedAt: number,
    headersAt: number
  ): Promise<void> {
    const contentType = response.headers.get("content-type") || "";

    createDebugLog("ROUTING", `Content-Type: ${contentType} - Processing as SSE`);

    // Both local backend and Agent Engine now send standard SSE format
    // No content-type branching needed - unified SSE processing for all backends

    // Handle SSE streaming response from both backends
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No readable stream available");
    }

    const decoder = new TextDecoder();
    let lineBuffer = "";
    let eventDataBuffer = "";

    createDebugLog("SSE START", "Beginning to process streaming response");

    let firstSseChunkReported = false;
    let browserChunkIndex = 0;
    const activityDedupRef = { current: new Set<string>() };

    // Use recursive pump function instead of while(true) loop
    const pump = async (): Promise<void> => {
      const { done, value } = await reader.read();

      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        browserChunkIndex += 1;
        if (!firstSseChunkReported) {
          firstSseChunkReported = true;
          this.streamTiming?.onFirstSseChunk?.();
        }
        if (isAdkActivityTraceEnabled() && browserChunkIndex <= 30) {
          console.info(
            `[adk-activity] browser chunk #${browserChunkIndex} +${Date.now() - requestStartedAt}ms from fetch | +${Date.now() - headersAt}ms from headers | bytes=${chunk.length}`
          );
        }
        lineBuffer += chunk;
        createDebugLog("SSE CHUNK", `Received ${chunk.length} bytes`);
      }

      // Process all complete lines in the buffer
      let eolIndex;
      while ((eolIndex = lineBuffer.indexOf("\n")) >= 0 || (done && lineBuffer.length > 0)) {
        let line: string;
        if (eolIndex >= 0) {
          line = lineBuffer.substring(0, eolIndex);
          lineBuffer = lineBuffer.substring(eolIndex + 1);
        } else {
          // Only if done and lineBuffer has content without a trailing newline
          line = lineBuffer;
          lineBuffer = "";
        }

        createDebugLog("SSE LINE", `Processing line: "${line}"`);

        if (line.trim() === "") {
          // Empty line: dispatch event
          if (eventDataBuffer.length > 0) {
            const jsonDataToParse = eventDataBuffer.endsWith("\n") ? eventDataBuffer.slice(0, -1) : eventDataBuffer;

            createDebugLog("SSE DISPATCH EVENT", jsonDataToParse.substring(0, 200) + "...");

            // Process the event immediately for real-time updates
            try {
              await processSseEventData(
                jsonDataToParse,
                aiMessageId,
                callbacks,
                accumulatedTextRef,
                currentAgentRef,
                setCurrentAgent,
                activityDedupRef
              );
            } catch (error) {
              console.error("❌ [SSE ERROR] Failed to process SSE event:", error);
              console.error("❌ [SSE ERROR] Problematic JSON:", jsonDataToParse.substring(0, 500));
              // Keep streaming — one bad event must not abort the whole turn.
            }
            eventDataBuffer = ""; // Reset for next event
            // One TCP chunk may contain many SSE events — yield so label presenter can paint.
            await new Promise<void>(resolve => {
              setTimeout(resolve, 0);
            });
          }
        } else if (line.startsWith("data:")) {
          // Accumulate data lines for this event
          eventDataBuffer += line.substring(5).trimStart() + "\n";
          createDebugLog("SSE DATA", `Added to buffer: "${line.substring(5).trimStart()}"`);
        } else if (line.startsWith(":")) {
          createDebugLog("SSE COMMENT", `Ignoring comment: "${line}"`);
          // Comment line, ignore
        }
      }

      if (done) {
        // Handle any remaining data in buffer
        if (eventDataBuffer.length > 0) {
          const jsonDataToParse = eventDataBuffer.endsWith("\n") ? eventDataBuffer.slice(0, -1) : eventDataBuffer;

          createDebugLog("SSE DISPATCH FINAL EVENT", jsonDataToParse.substring(0, 200) + "...");

          try {
            await processSseEventData(
              jsonDataToParse,
              aiMessageId,
              callbacks,
              accumulatedTextRef,
              currentAgentRef,
              setCurrentAgent,
              activityDedupRef
            );
          } catch (error) {
            console.error("❌ [SSE ERROR] Failed to process final SSE event:", error);
            console.error("❌ [SSE ERROR] Problematic JSON:", jsonDataToParse.substring(0, 500));
          }
          eventDataBuffer = "";
        }
        createDebugLog("SSE END", "Stream processing finished");
        return; // Exit recursion
      }

      // Continue processing next chunk
      return pump();
    };

    try {
      await pump();
    } catch (error) {
      createDebugLog("SSE ERROR", "Error reading stream", error);
      throw error;
    }
  }

  // Removed Agent Engine JSON processing methods:
  // - handleAgentEngineJsonStream()
  // - processCompleteJsonLines()
  // - processAgentEngineJsonPart()
  // - hashPart()
  //
  // These are no longer needed since Agent Engine now sends standard SSE format
  // and uses the same processing pipeline as local backend.
}
