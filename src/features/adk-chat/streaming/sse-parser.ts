/**
 * SSE Parser Utilities
 *
 * This module handles the extraction and parsing of Server-Sent Event (SSE) data.
 * It contains complex JSON parsing logic for various types of SSE messages
 * including text content, thoughts, function calls, and function responses.
 */
import { extractStreamErrorFromSsePayload } from "../format-stream-error";
import { ParsedSSEData, RawSSEData } from "./types";

type NormalizedSseContent = {
  parts?: Array<Record<string, unknown>>;
};

function normalizeSseContent(content: RawSSEData["content"]): NormalizedSseContent | null {
  if (!content) return null;
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content) as unknown;
      if (parsed && typeof parsed === "object" && "parts" in parsed && Array.isArray((parsed as NormalizedSseContent).parts)) {
        return parsed as NormalizedSseContent;
      }
    } catch {
      return null;
    }
    return null;
  }
  if (typeof content === "object" && content !== null && "parts" in content && Array.isArray(content.parts)) {
    return content as NormalizedSseContent;
  }
  return null;
}

/**
 * Extracts and processes data from SSE JSON strings
 *
 * This function handles the complex parsing of SSE data received from the backend,
 * extracting various types of content including regular text, AI thoughts,
 * function calls/responses, and source information.
 *
 * @param data - Raw SSE data string to parse
 * @returns Structured data object with extracted information
 */
export function extractDataFromSSE(data: string): ParsedSSEData {
  const sseError = extractStreamErrorFromSsePayload(data);
  if (sseError) {
    throw sseError;
  }

  try {
    const parsed: RawSSEData = JSON.parse(data);

    let textParts: string[] = [];
    let agent = "";
    let functionCall = undefined;
    let functionResponse = undefined;

    // Extract message ID from backend
    const messageId = parsed.id;

    // Extract text from content.parts (separate thoughts from regular text)
    let thoughtParts: string[] = [];
    const normalizedContent = normalizeSseContent(parsed.content);
    if (normalizedContent?.parts) {
      const parts = normalizedContent.parts;

      // ALWAYS filter out thoughts from main text content (like working /web/ project)
      // This ensures thoughts are processed separately as timeline activities
      textParts = parts
        .filter((part: { text?: string; thought?: boolean }) => part.text && !part.thought)
        .map((part: { text?: string }) => part.text!)
        .filter((text): text is string => text !== undefined);

      // Extract thoughts separately for timeline activities (for both backends)
      thoughtParts = parts
        .filter((part: { text?: string; thought?: boolean }) => part.text && part.thought)
        .map((part: { text?: string }) => part.text!)
        .filter((text): text is string => text !== undefined);

      // Check for function calls (camelCase or snake_case from ADK / Agent Engine)
      for (const part of parts) {
        const rawCall =
          (part as { functionCall?: unknown; function_call?: unknown }).functionCall ?? (part as { function_call?: unknown }).function_call;
        if (rawCall && typeof rawCall === "object") {
          functionCall = rawCall as { name: string; args: Record<string, unknown>; id: string };
          break;
        }
      }

      // Check for function responses
      for (const part of parts) {
        const rawResponse =
          (part as { functionResponse?: unknown; function_response?: unknown }).functionResponse ??
          (part as { function_response?: unknown }).function_response;
        if (rawResponse && typeof rawResponse === "object") {
          functionResponse = rawResponse as {
            name: string;
            response: Record<string, unknown>;
            id: string;
          };
          break;
        }
      }
    }

    // Extract agent information
    if (parsed.author) {
      agent = parsed.author;
    }

    let transferToAgent: string | undefined;
    const actions = parsed.actions;
    if (actions && typeof actions === "object") {
      const target = actions.transferToAgent ?? actions.transfer_to_agent;
      if (typeof target === "string" && target.trim().length > 0) {
        transferToAgent = target.trim();
      }
    }

    const partial = parsed.partial === true;

    const streamActivityHint =
      typeof parsed.unimadStreamActivity === "string" && parsed.unimadStreamActivity.trim().length > 0
        ? parsed.unimadStreamActivity.trim()
        : undefined;

    return {
      messageId,
      textParts,
      thoughtParts,
      agent,
      partial,
      streamActivityHint,
      transferToAgent,
      functionCall,
      functionResponse,
    };
  } catch (error) {
    return handleSSEParsingError(data, error);
  }
}

/**
 * Handles errors that occur during SSE data parsing
 *
 * @param data - Original data that failed to parse
 * @param error - The parsing error
 * @returns Default parsed data structure with error information logged
 */
function handleSSEParsingError(data: string, error: unknown): ParsedSSEData {
  const sseError = extractStreamErrorFromSsePayload(data);
  if (sseError) {
    throw sseError;
  }

  const truncatedData = data.length > 200 ? data.substring(0, 200) + "..." : data;
  console.error('Error parsing SSE data. Raw data (truncated): "', truncatedData, '". Error details:', error);

  return {
    messageId: undefined,
    textParts: [],
    thoughtParts: [],
    agent: "",
    transferToAgent: undefined,
    functionCall: undefined,
    functionResponse: undefined,
  };
}

/**
 * Validates if a parsed SSE data object is valid
 *
 * @param data - Parsed SSE data to validate
 * @returns True if the data structure is valid, false otherwise
 */
export function validateParsedSSEData(data: ParsedSSEData): boolean {
  return Array.isArray(data.textParts) && Array.isArray(data.thoughtParts) && typeof data.agent === "string";
}

/**
 * Checks if parsed SSE data contains meaningful content
 *
 * @param data - Parsed SSE data to check
 * @returns True if the data contains any meaningful content
 */
export function hasSSEContent(data: ParsedSSEData): boolean {
  return (
    data.textParts.length > 0 ||
    data.thoughtParts.length > 0 ||
    data.functionCall !== undefined ||
    data.functionResponse !== undefined ||
    data.agent !== ""
  );
}
