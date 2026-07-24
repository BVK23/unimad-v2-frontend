"use client";

import React, { useEffect, useRef, useState } from "react";
import type { VoiceInterviewConfig, VoiceLiveUsage, VoiceTranscriptEntry } from "@/src/features/interview-prep/types";
import { VOICE_LIVE_MODEL_ID } from "@/src/features/interview-prep/types";
import { GoogleGenAI, Modality } from "@google/genai";
import { Mic, MicOff, PhoneOff, Loader2, AlertCircle, X } from "lucide-react";
import InterviewVisualizer from "./InterviewVisualizer";
import { createPcmBlob, decodeBase64, pcmToAudioBuffer } from "./audio-utils";

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

interface VoiceInterviewSessionProps {
  config: VoiceInterviewConfig;
  onEnd: (transcript: VoiceTranscriptEntry[], usage?: VoiceLiveUsage) => void;
  onCancel: () => void;
}

type UsageTotals = {
  prompt_tokens: number;
  completion_tokens: number;
  thinking_tokens: number;
  total_tokens: number;
};

function readUsageNumber(source: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const raw = source[key];
    if (raw == null) continue;
    const n = typeof raw === "number" ? raw : Number(raw);
    if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  }
  return 0;
}

/** Extract prompt/completion/thinking/total from Live usageMetadata (camelCase or snake_case). */
function parseUsageMetadata(raw: unknown): UsageTotals | null {
  if (!raw || typeof raw !== "object") return null;
  const um = raw as Record<string, unknown>;
  const prompt_tokens = readUsageNumber(um, "promptTokenCount", "prompt_token_count", "inputTokenCount", "input_token_count");
  const completion_tokens = readUsageNumber(
    um,
    "candidatesTokenCount",
    "candidates_token_count",
    "responseTokenCount",
    "response_token_count",
    "outputTokenCount",
    "output_token_count"
  );
  const thinking_tokens = readUsageNumber(um, "thoughtsTokenCount", "thoughts_token_count", "thinkingTokenCount", "thinking_token_count");
  let total_tokens = readUsageNumber(um, "totalTokenCount", "total_token_count");
  if (total_tokens <= 0) total_tokens = prompt_tokens + completion_tokens + thinking_tokens;
  if (prompt_tokens <= 0 && completion_tokens <= 0 && thinking_tokens <= 0 && total_tokens <= 0) {
    return null;
  }
  return { prompt_tokens, completion_tokens, thinking_tokens, total_tokens };
}

const VoiceInterviewSession: React.FC<VoiceInterviewSessionProps> = ({ config, onEnd, onCancel }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<"ai" | "user" | "none">("none");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isMicMutedRef = useRef(false);
  const transcriptRef = useRef<VoiceTranscriptEntry[]>([]);
  const currentTextRef = useRef<{ role: "user" | "model"; text: string } | null>(null);
  const usageTotalsRef = useRef<UsageTotals>({
    prompt_tokens: 0,
    completion_tokens: 0,
    thinking_tokens: 0,
    total_tokens: 0,
  });
  const usageReportedRef = useRef(false);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const buildUsagePayload = (): VoiceLiveUsage => {
    const t = usageTotalsRef.current;
    return {
      model_id: VOICE_LIVE_MODEL_ID,
      prompt_tokens: t.prompt_tokens,
      completion_tokens: t.completion_tokens,
      thinking_tokens: t.thinking_tokens,
      total_tokens: t.total_tokens > 0 ? t.total_tokens : t.prompt_tokens + t.completion_tokens + t.thinking_tokens,
      input_modality: "audio",
      output_modality: "audio",
    };
  };

  const flushTranscript = () => {
    if (currentTextRef.current?.text.trim()) {
      transcriptRef.current.push({
        role: currentTextRef.current.role,
        text: currentTextRef.current.text.trim(),
        timestamp: Date.now(),
      });
    }
    currentTextRef.current = null;
  };

  const reportSessionEnd = () => {
    if (usageReportedRef.current) return;
    usageReportedRef.current = true;
    flushTranscript();
    onEndRef.current(transcriptRef.current, buildUsagePayload());
  };

  useEffect(() => {
    const fetchApiKey = async () => {
      const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (envKey) {
        setApiKey(envKey);
        return;
      }
      try {
        const res = await fetch("/api/gemini-api-key");
        if (!res.ok) throw new Error(`Failed to fetch API key (${res.status})`);
        const data = await res.json();
        const key = data.api_key ?? data.key;
        if (!key) throw new Error("No API key in response");
        setApiKey(key);
      } catch (e) {
        setConnectionState("error");
        setErrorMsg(e instanceof Error ? e.message : "Failed to initialize");
      }
    };
    fetchApiKey();
  }, []);

  useEffect(() => {
    if (!apiKey) return;

    let mounted = true;
    usageReportedRef.current = false;
    usageTotalsRef.current = {
      prompt_tokens: 0,
      completion_tokens: 0,
      thinking_tokens: 0,
      total_tokens: 0,
    };

    /** Accumulate transcript silently (no UI) for post-session feedback only. */
    const appendToTranscriptSilent = (role: "user" | "model", text: string) => {
      if (currentTextRef.current?.role !== role) {
        if (currentTextRef.current?.text.trim()) {
          transcriptRef.current.push({
            role: currentTextRef.current.role,
            text: currentTextRef.current.text.trim(),
            timestamp: Date.now(),
          });
        }
        currentTextRef.current = { role, text: "" };
      }
      currentTextRef.current.text += text;
    };

    const accumulateUsage = (raw: unknown) => {
      const parsed = parseUsageMetadata(raw);
      if (!parsed) return;
      const acc = usageTotalsRef.current;
      // Live may send session-cumulative totals or per-turn deltas.
      // If all fields are >= current, treat as cumulative snapshot; otherwise add as deltas.
      if (
        parsed.prompt_tokens >= acc.prompt_tokens &&
        parsed.completion_tokens >= acc.completion_tokens &&
        parsed.thinking_tokens >= acc.thinking_tokens &&
        parsed.total_tokens >= acc.total_tokens
      ) {
        acc.prompt_tokens = parsed.prompt_tokens;
        acc.completion_tokens = parsed.completion_tokens;
        acc.thinking_tokens = parsed.thinking_tokens;
        acc.total_tokens = parsed.total_tokens;
      } else {
        acc.prompt_tokens += parsed.prompt_tokens;
        acc.completion_tokens += parsed.completion_tokens;
        acc.thinking_tokens += parsed.thinking_tokens;
        acc.total_tokens += parsed.total_tokens;
      }
    };

    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const AudioContextClass =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const inputCtx = new AudioContextClass({ sampleRate: 16000 });
        const outputCtx = new AudioContextClass({ sampleRate: 24000 });
        inputContextRef.current = inputCtx;
        outputContextRef.current = outputCtx;

        if (inputCtx.state === "suspended") await inputCtx.resume();
        if (outputCtx.state === "suspended") await outputCtx.resume();

        const systemInstruction = `
          You are an expert interviewer at ${config.company}.
          You are interviewing a candidate for the role of ${config.role}.
          This is a ${config.roundType} interview round.

          Job Description context: "${(config.jobDescription || "").slice(0, 2000)}"

          Guidelines:
          - Welcome briefly, then ask your first question right away.
          - Ask ONE question at a time. Wait for the candidate to finish, then move to the next question promptly.
          - Do not repeat the full welcome after the first turn.
          - Keep responses concise. Avoid long monologues between questions.
          - Technical round: ask technical depth. Behavioral round: STAR-style questions. Screening: motivation and fit.
        `;

        const sessionPromise = ai.live.connect({
          model: VOICE_LIVE_MODEL_ID,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction,
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
            },
            // Transcription captured silently (not shown) for end-of-session feedback only.
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
          callbacks: {
            onopen: async () => {
              if (!mounted) return;
              setConnectionState("connected");

              try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;
                const source = inputCtx.createMediaStreamSource(stream);
                sourceRef.current = source;
                const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;
                isMicMutedRef.current = isMicMuted;

                processor.onaudioprocess = e => {
                  if (isMicMutedRef.current) return;
                  const inputData = e.inputBuffer.getChannelData(0);
                  let sum = 0;
                  for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                  const rms = Math.sqrt(sum / inputData.length);
                  if (rms > 0.02) setCurrentSpeaker("user");
                  else setCurrentSpeaker(prev => (prev === "user" ? "none" : prev));

                  sessionPromise.then(session => session.sendRealtimeInput({ media: createPcmBlob(inputData) })).catch(() => {});
                };

                source.connect(processor);
                processor.connect(inputCtx.destination);
              } catch {
                setErrorMsg("Could not access microphone.");
              }
            },
            onmessage: async msg => {
              if (!mounted) return;

              const usageRaw =
                (msg as { usageMetadata?: unknown; usage_metadata?: unknown }).usageMetadata ??
                (msg as { usage_metadata?: unknown }).usage_metadata;
              if (usageRaw) accumulateUsage(usageRaw);

              const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData && outputCtx) {
                setCurrentSpeaker("ai");
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                try {
                  const audioBuffer = await pcmToAudioBuffer(decodeBase64(audioData), outputCtx);
                  const source = outputCtx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(outputCtx.destination);
                  source.onended = () => {
                    activeSourcesRef.current.delete(source);
                    if (activeSourcesRef.current.size === 0) {
                      setCurrentSpeaker(prev => (prev === "ai" ? "none" : prev));
                    }
                  };
                  if (outputCtx.state === "suspended") await outputCtx.resume();
                  source.start(nextStartTimeRef.current);
                  activeSourcesRef.current.add(source);
                  nextStartTimeRef.current += audioBuffer.duration;
                } catch {
                  /* ignore */
                }
              }

              if (msg.serverContent?.interrupted) {
                activeSourcesRef.current.forEach(s => {
                  try {
                    s.stop();
                  } catch {
                    /* ignore */
                  }
                });
                activeSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setCurrentSpeaker("none");
              }

              const outText = msg.serverContent?.outputTranscription?.text;
              if (outText) appendToTranscriptSilent("model", outText);

              const inText = msg.serverContent?.inputTranscription?.text;
              if (inText) appendToTranscriptSilent("user", inText);

              if (msg.serverContent?.turnComplete && currentTextRef.current?.role === "user") {
                if (currentTextRef.current.text.trim()) {
                  transcriptRef.current.push({
                    role: "user",
                    text: currentTextRef.current.text.trim(),
                    timestamp: Date.now(),
                  });
                }
                currentTextRef.current = null;
              }
            },
            onclose: () => {
              if (!mounted) return;
              setConnectionState("disconnected");
              // Best-effort: if the socket closes unexpectedly before End, still report usage once.
              if (!usageReportedRef.current && transcriptRef.current.length > 0) {
                reportSessionEnd();
              }
            },
            onerror: err => {
              if (mounted) {
                setConnectionState("error");
                setErrorMsg(`Connection error: ${String(err) || "Unknown"}`);
              }
            },
          },
        });
      } catch (e) {
        setConnectionState("error");
        setErrorMsg(e instanceof Error ? e.message : "Failed to initialize");
      }
    };

    startSession();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      inputContextRef.current?.close();
      outputContextRef.current?.close();
      activeSourcesRef.current.forEach(s => {
        try {
          s.stop();
        } catch {
          /* ignore */
        }
      });
    };
  }, [apiKey, config]);

  const handleDisconnect = () => {
    reportSessionEnd();
  };

  const toggleMute = () => {
    const next = !isMicMuted;
    setIsMicMuted(next);
    isMicMutedRef.current = next;
  };

  const roundLabel = config.roundType.charAt(0).toUpperCase() + config.roundType.slice(1);

  if (connectionState === "error") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
        <p className="text-lg font-medium text-slate-900 dark:text-white">Could not start session</p>
        <p className="mt-2 text-sm text-slate-500">{errorMsg}</p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-6 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-3xl flex-col px-6 py-8 font-sans">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">Live mock interview</p>
          <h2 className="mt-1 text-2xl font-medium tracking-tight text-slate-900 dark:text-white">{config.company}</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {config.role} · {roundLabel} round
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-[#1a1a1a]">
          {connectionState === "connecting" ? (
            <div className="flex h-40 flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="text-sm font-medium">Connecting to your AI interviewer…</span>
            </div>
          ) : (
            <div className="h-40">
              <InterviewVisualizer
                isActive={connectionState === "connected"}
                mode={currentSpeaker === "ai" ? "speaking" : currentSpeaker === "user" ? "listening" : "idle"}
              />
            </div>
          )}
        </div>

        <p className="max-w-md text-center text-sm text-slate-500 dark:text-slate-400">
          {connectionState === "connected"
            ? currentSpeaker === "ai"
              ? "Interviewer is speaking…"
              : currentSpeaker === "user"
                ? "Listening to your answer…"
                : "Speak when ready. The interviewer will guide the conversation."
            : "Setting up your session…"}
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={toggleMute}
            className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-all ${
              isMicMuted ? "bg-red-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            aria-label={isMicMuted ? "Unmute" : "Mute"}
          >
            {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-medium text-white shadow-md transition-all hover:bg-red-500"
          >
            <PhoneOff size={18} /> End &amp; get feedback
          </button>
        </div>

        <div className="flex max-w-lg items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-left dark:border-amber-900/50 dark:bg-amber-950/30">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs leading-relaxed text-amber-900/90 dark:text-amber-200/90">
            Unimad AI Interview can make mistakes. Answers and feedback are for practice only — not hiring decisions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceInterviewSession;
