"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { recordInterviewUsage, saveInterviewAnswer } from "@/src/features/interview-prep/server-actions/interview-actions";
import type { InterviewQuestion, InterviewRoundType } from "@/src/features/interview-prep/types";
import { Mic, MicOff, SkipForward } from "lucide-react";
import InterviewAnalyzingView from "./InterviewAnalyzingView";
import { decodeBase64, pcmToAudioBuffer } from "./audio-utils";
import {
  cancelBrowserSynthesis,
  fetchGeminiApiKey,
  GEMINI_TTS_MODEL,
  GEMINI_TTS_SAMPLE_RATE,
  generateGeminiTtsAudio,
  speakWithBrowserSynthesis,
  type TtsUsage,
} from "./geminiTts";

interface InterviewActiveSessionProps {
  interviewId: string;
  roundType: InterviewRoundType;
  company: string;
  role: string;
  questions: InterviewQuestion[];
  initialQuestionIndex?: number;
  onEnd: () => void;
  onComplete: (interviewId: string) => void;
}

const EMPTY_USAGE: TtsUsage = {
  promptTokens: 0,
  completionTokens: 0,
  thinkingTokens: 0,
  totalTokens: 0,
};

const InterviewActiveSession: React.FC<InterviewActiveSessionProps> = ({
  interviewId,
  roundType,
  company,
  role,
  questions,
  initialQuestionIndex = 0,
  onEnd,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialQuestionIndex);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apiKeyRef = useRef<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const speakGenerationRef = useRef(0);
  const ttsUsageRef = useRef<TtsUsage>({ ...EMPTY_USAGE });
  const usageReportedRef = useRef(false);

  const currentQuestion = questions[currentIndex];

  const stopGeminiAudio = useCallback(() => {
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
    });
    activeSourcesRef.current.clear();
  }, []);

  const reportAccumulatedUsage = useCallback(() => {
    if (usageReportedRef.current) return;
    const usage = ttsUsageRef.current;
    if (usage.totalTokens <= 0 && usage.promptTokens <= 0 && usage.completionTokens <= 0) return;
    usageReportedRef.current = true;
    void recordInterviewUsage({
      interviewId,
      modelId: GEMINI_TTS_MODEL,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      thinkingTokens: usage.thinkingTokens,
      totalTokens: usage.totalTokens,
      kind: "tts",
      roundType,
    }).catch(() => {
      /* best-effort ledger */
    });
  }, [interviewId, roundType]);

  const speakQuestion = useCallback(
    async (text: string) => {
      const generation = ++speakGenerationRef.current;
      stopGeminiAudio();
      cancelBrowserSynthesis();

      const playPcm = async (audioBase64: string) => {
        if (generation !== speakGenerationRef.current) return;

        const AudioContextClass =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        let ctx = audioCtxRef.current;
        if (!ctx || ctx.state === "closed") {
          ctx = new AudioContextClass({ sampleRate: GEMINI_TTS_SAMPLE_RATE });
          audioCtxRef.current = ctx;
        }
        if (ctx.state === "suspended") await ctx.resume();
        if (generation !== speakGenerationRef.current) return;

        const audioBuffer = await pcmToAudioBuffer(decodeBase64(audioBase64), ctx, GEMINI_TTS_SAMPLE_RATE);
        if (generation !== speakGenerationRef.current) return;

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => {
          activeSourcesRef.current.delete(source);
        };
        source.start(0);
        activeSourcesRef.current.add(source);
      };

      try {
        let apiKey = apiKeyRef.current;
        if (!apiKey) {
          apiKey = await fetchGeminiApiKey();
          apiKeyRef.current = apiKey;
        }
        if (generation !== speakGenerationRef.current) return;

        const { audioBase64, usage } = await generateGeminiTtsAudio(apiKey, text);
        if (generation !== speakGenerationRef.current) return;

        ttsUsageRef.current = {
          promptTokens: ttsUsageRef.current.promptTokens + usage.promptTokens,
          completionTokens: ttsUsageRef.current.completionTokens + usage.completionTokens,
          thinkingTokens: ttsUsageRef.current.thinkingTokens + usage.thinkingTokens,
          totalTokens: ttsUsageRef.current.totalTokens + usage.totalTokens,
        };

        await playPcm(audioBase64);
      } catch {
        if (generation !== speakGenerationRef.current) return;
        speakWithBrowserSynthesis(text);
      }
    },
    [stopGeminiAudio]
  );

  const stopSessionAudio = useCallback(() => {
    speakGenerationRef.current += 1;
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
    stopGeminiAudio();
    cancelBrowserSynthesis();
    recognitionRef.current?.stop();
    setIsListening(false);
  }, [stopGeminiAudio]);

  const handleEnd = () => {
    stopSessionAudio();
    reportAccumulatedUsage();
    onEnd();
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    void fetchGeminiApiKey()
      .then(key => {
        apiKeyRef.current = key;
      })
      .catch(() => {
        /* browser TTS fallback still works */
      });

    type SpeechRecognitionCtor = new () => {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      start: () => void;
      stop: () => void;
      onresult:
        | ((event: { resultIndex: number; results: { isFinal: boolean; length: number; [i: number]: { transcript: string } }[] }) => void)
        | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
    };

    const win = window as Window & {
      webkitSpeechRecognition?: SpeechRecognitionCtor;
      SpeechRecognition?: SpeechRecognitionCtor;
    };
    const SpeechRecognitionCtor = win.SpeechRecognition ?? win.webkitSpeechRecognition;

    if (SpeechRecognitionCtor) {
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = event => {
        let interim = "";
        let finalChunk = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalChunk += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }
        if (finalChunk) {
          setTranscript(prev => `${prev} ${finalChunk}`.trim());
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }

    const startIndex = Math.min(Math.max(initialQuestionIndex, 0), Math.max(questions.length - 1, 0));
    speakTimeoutRef.current = setTimeout(() => {
      speakTimeoutRef.current = null;
      if (questions[startIndex]) void speakQuestion(questions[startIndex].question);
    }, 400);

    return () => {
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
        speakTimeoutRef.current = null;
      }
    };
  }, [questions, speakQuestion, initialQuestionIndex]);

  useEffect(() => {
    return () => {
      stopSessionAudio();
      reportAccumulatedUsage();
      void audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
  }, [stopSessionAudio, reportAccumulatedUsage]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser. Type your answer below.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const goToNext = async () => {
    if (!currentQuestion || isSaving) return;
    const answer = transcript.trim();
    if (!answer) {
      setError("Please record or type an answer before continuing.");
      return;
    }

    setIsSaving(true);
    setError(null);
    stopSessionAudio();

    const isLast = currentIndex >= questions.length - 1;
    if (isLast) {
      setIsAnalyzing(true);
    }

    try {
      await saveInterviewAnswer({
        interviewId,
        questionId: currentQuestion.id,
        roundType,
        answer,
        isLastQuestion: isLast,
      });

      if (isLast) {
        reportAccumulatedUsage();
        onComplete(interviewId);
        return;
      }

      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setTranscript("");
      setInterimTranscript("");
      speakTimeoutRef.current = setTimeout(() => {
        speakTimeoutRef.current = null;
        void speakQuestion(questions[nextIndex].question);
      }, 400);
    } catch (e) {
      if (isLast) setIsAnalyzing(false);
      setError(e instanceof Error ? e.message : "Failed to save answer");
    } finally {
      setIsSaving(false);
    }
  };

  const getTextareaValue = () => {
    if (isListening || interimTranscript) {
      return [transcript, interimTranscript].filter(Boolean).join(" ");
    }
    return transcript;
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranscript(e.target.value);
    setInterimTranscript("");
  };

  if (isAnalyzing) {
    return (
      <ModalPortalOverlay className="flex flex-col overflow-hidden bg-[#0B1121] text-white">
        <InterviewAnalyzingView />
      </ModalPortalOverlay>
    );
  }

  return (
    <ModalPortalOverlay className="flex flex-col overflow-hidden bg-[#0B1121] text-white">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
        <div
          className={`h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px] transition-all duration-300 ${isListening ? "scale-110 opacity-50" : "scale-100"}`}
        />
      </div>

      <div className="relative z-20 flex shrink-0 items-center justify-between p-6 sm:p-8">
        <div className="flex items-center gap-3 opacity-60">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-sm font-medium uppercase tracking-widest">
            {roundType} • {company}
          </span>
        </div>
        <button
          type="button"
          onClick={handleEnd}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20"
        >
          End Interview
        </button>
      </div>

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-4 text-center sm:px-8 sm:py-6">
          <span className="mb-2 text-xs font-medium uppercase tracking-widest text-blue-400">{role}</span>
          <span className="mb-6 text-sm font-medium uppercase tracking-widest text-slate-400 sm:mb-8">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <h2 className="mb-8 text-2xl font-semibold leading-tight sm:mb-10 sm:text-3xl md:text-4xl">
            &quot;{currentQuestion?.question}&quot;
          </h2>

          {isListening && (
            <div className="mb-8 flex h-16 items-center justify-center gap-1.5 sm:mb-10">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 animate-bounce rounded-full bg-blue-400"
                  style={{
                    height: `${30 + Math.random() * 70}%`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-sm sm:p-8">
            <div className="absolute -top-3 left-6 rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider shadow-lg">
              You
            </div>
            <textarea
              value={getTextareaValue()}
              onChange={handleTextareaChange}
              placeholder="Tap the mic to speak, or type your answer..."
              rows={3}
              className="min-h-[72px] w-full resize-none bg-transparent text-base leading-relaxed text-slate-200 outline-none placeholder:text-slate-500 sm:min-h-[80px] sm:text-lg"
            />
          </div>
        </div>
      </div>

      <div className="relative z-20 shrink-0 border-t border-white/10 bg-[#0B1121]/95 px-6 py-5 backdrop-blur-sm sm:px-8 sm:py-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
          {error && <p className="mb-4 text-center text-sm text-red-400">{error}</p>}

          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={toggleMic}
              className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl text-white shadow-2xl transition-all hover:scale-105 active:scale-95 sm:h-20 sm:w-20 ${
                isListening ? "bg-red-500 ring-4 ring-red-500/30" : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {isListening ? <MicOff className="h-7 w-7 sm:h-8 sm:w-8" /> : <Mic className="h-7 w-7 sm:h-8 sm:w-8" />}
            </button>
            <button
              type="button"
              onClick={goToNext}
              disabled={isSaving}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition-all hover:scale-105 hover:bg-white/20 disabled:opacity-50 sm:h-14 sm:w-14"
              title={currentIndex >= questions.length - 1 ? "Submit and analyse" : "Next question"}
            >
              <SkipForward size={24} className={isSaving ? "opacity-40" : ""} />
            </button>
          </div>
          <p className="mt-4 text-center text-sm font-medium text-slate-500">
            {isListening ? "Listening..." : "Tap microphone to answer, then skip to continue"}
          </p>
        </div>
      </div>
    </ModalPortalOverlay>
  );
};

export default InterviewActiveSession;
