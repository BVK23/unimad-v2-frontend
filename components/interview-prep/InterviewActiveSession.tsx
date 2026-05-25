"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { saveInterviewAnswer } from "@/src/features/interview-prep/server-actions/interview-actions";
import type { InterviewQuestion, InterviewRoundType } from "@/src/features/interview-prep/types";
import { Mic, MicOff, SkipForward, Loader2 } from "lucide-react";

interface InterviewActiveSessionProps {
  interviewId: string;
  roundType: InterviewRoundType;
  company: string;
  role: string;
  questions: InterviewQuestion[];
  onEnd: () => void;
  onComplete: (interviewId: string) => void;
}

const InterviewActiveSession: React.FC<InterviewActiveSessionProps> = ({
  interviewId,
  roundType,
  company,
  role,
  questions,
  onEnd,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const currentQuestion = questions[currentIndex];

  const speakQuestion = useCallback((text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    synthRef.current.speak(utterance);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    synthRef.current = window.speechSynthesis;

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

    const win = window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor; SpeechRecognition?: SpeechRecognitionCtor };
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

    const t = setTimeout(() => {
      if (questions[0]) speakQuestion(questions[0].question);
    }, 400);
    return () => clearTimeout(t);
  }, [questions, speakQuestion]);

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
    recognitionRef.current?.stop();
    setIsListening(false);
    synthRef.current?.cancel();

    const isLast = currentIndex >= questions.length - 1;

    try {
      await saveInterviewAnswer({
        interviewId,
        questionId: currentQuestion.id,
        roundType,
        answer,
        isLastQuestion: isLast,
      });

      if (isLast) {
        onComplete(interviewId);
        return;
      }

      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setTranscript("");
      setInterimTranscript("");
      setTimeout(() => speakQuestion(questions[nextIndex].question), 400);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save answer");
    } finally {
      setIsSaving(false);
    }
  };

  const displayTranscript = [transcript, interimTranscript].filter(Boolean).join(" ").trim();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B1121] text-white">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
        <div
          className={`h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px] transition-all duration-300 ${isListening ? "scale-110 opacity-50" : "scale-100"}`}
        />
      </div>

      <div className="relative z-20 flex items-center justify-between p-8">
        <div className="flex items-center gap-3 opacity-60">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-sm font-medium uppercase tracking-widest">
            {roundType} • {company}
          </span>
        </div>
        <button
          type="button"
          onClick={onEnd}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20"
        >
          End Interview
        </button>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center p-8 text-center">
        <span className="mb-2 text-xs font-medium uppercase tracking-widest text-blue-400">{role}</span>
        <span className="mb-8 text-sm font-medium uppercase tracking-widest text-slate-400">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <h2 className="mb-16 text-3xl font-semibold leading-tight md:text-4xl">&quot;{currentQuestion?.question}&quot;</h2>

        {isListening && (
          <div className="mb-12 flex h-16 items-center justify-center gap-1.5">
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

        <div className="relative mb-8 min-h-[140px] w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 text-left backdrop-blur-sm">
          <div className="absolute -top-3 left-6 rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider shadow-lg">
            You
          </div>
          <textarea
            value={displayTranscript || transcript}
            onChange={e => {
              setTranscript(e.target.value);
              setInterimTranscript("");
            }}
            placeholder="Tap the mic to speak, or type your answer..."
            className="min-h-[80px] w-full resize-none bg-transparent text-lg leading-relaxed text-slate-200 outline-none placeholder:text-slate-500"
          />
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={toggleMic}
            className={`flex h-20 w-20 items-center justify-center rounded-full text-3xl text-white shadow-2xl transition-all hover:scale-105 active:scale-95 ${
              isListening ? "bg-red-500 ring-4 ring-red-500/30" : "bg-blue-600 hover:bg-blue-500"
            }`}
          >
            {isListening ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
          <button
            type="button"
            onClick={goToNext}
            disabled={isSaving}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 transition-all hover:scale-105 hover:bg-white/20 disabled:opacity-50"
            title="Next question"
          >
            {isSaving ? <Loader2 size={24} className="animate-spin" /> : <SkipForward size={24} />}
          </button>
        </div>
        <p className="mt-8 text-sm font-medium text-slate-500">
          {isListening ? "Listening..." : "Tap microphone to answer, then skip to continue"}
        </p>
      </div>
    </div>
  );
};

export default InterviewActiveSession;
