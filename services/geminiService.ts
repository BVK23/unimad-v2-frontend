/**
 * Legacy direct Gemini client. Production Uniboard chat uses the ADK lane
 * (see components/chat/AdkChatProvider.tsx and POST /api/run_sse).
 * Retain for local experiments; avoid new product flows on this path unless intentional.
 */
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// Next.js: NEXT_PUBLIC_ is available client + server; GEMINI_API_KEY is server-only (optional)
function getApiKey(): string {
  const key =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_GEMINI_API_KEY
      : (process.env.GEMINI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  if (!key || key.trim() === "") {
    throw new Error(
      "Gemini API key is not set. Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local (see .env.example) and restart the dev server."
    );
  }
  return key;
}

// Initialize a chat session
export const createChatSession = (): Chat => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  return ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction:
        "You are Unimad AI, a personal branding expert. You help users build their portfolios, write resumes, and improve their professional presence. Keep answers concise, helpful, and encouraging. Use markdown for formatting.",
    },
  });
};

// Send a message to the chat
export const sendMessageStream = async (chat: Chat, message: string): Promise<AsyncIterable<GenerateContentResponse>> => {
  try {
    return await chat.sendMessageStream({ message });
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
};
