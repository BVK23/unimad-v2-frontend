import { GoogleGenAI, Modality } from "@google/genai";

export const GEMINI_TTS_MODEL = "gemini-3.1-flash-tts-preview";
export const GEMINI_TTS_VOICE = "Kore";
export const GEMINI_TTS_SAMPLE_RATE = 24000;

export type TtsUsage = {
  promptTokens: number;
  completionTokens: number;
  thinkingTokens: number;
  totalTokens: number;
};

function usageAttr(um: Record<string, unknown> | null | undefined, ...names: string[]): number {
  if (!um) return 0;
  for (const name of names) {
    const raw = um[name];
    if (raw != null) {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) return Math.max(0, Math.floor(n));
    }
  }
  return 0;
}

export function extractTtsUsage(response: unknown): TtsUsage {
  const um = (response as { usageMetadata?: Record<string, unknown> } | null)?.usageMetadata ?? null;
  const promptTokens = usageAttr(um, "promptTokenCount", "prompt_token_count");
  const completionTokens = usageAttr(um, "candidatesTokenCount", "candidates_token_count");
  const thinkingTokens = usageAttr(um, "thoughtsTokenCount", "thoughts_token_count");
  let totalTokens = usageAttr(um, "totalTokenCount", "total_token_count");
  if (totalTokens <= 0) totalTokens = promptTokens + completionTokens + thinkingTokens;
  return { promptTokens, completionTokens, thinkingTokens, totalTokens };
}

export async function fetchGeminiApiKey(): Promise<string> {
  const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (envKey) return envKey;

  const res = await fetch("/api/gemini-api-key");
  if (!res.ok) throw new Error(`Failed to fetch API key (${res.status})`);
  const data = (await res.json()) as { api_key?: string; key?: string };
  const key = data.api_key ?? data.key;
  if (!key) throw new Error("No API key in response");
  return key;
}

export async function generateGeminiTtsAudio(apiKey: string, text: string): Promise<{ audioBase64: string; usage: TtsUsage }> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: GEMINI_TTS_MODEL,
    contents: [{ parts: [{ text: `Say clearly as an interviewer: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_TTS_VOICE } },
      },
    },
  });

  const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioBase64) {
    throw new Error("Gemini TTS returned no audio data");
  }

  return {
    audioBase64,
    usage: extractTtsUsage(response),
  };
}

export function speakWithBrowserSynthesis(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

export function cancelBrowserSynthesis(): void {
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
}
