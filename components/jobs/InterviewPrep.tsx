import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Play,
  Square,
  SkipForward,
  BarChart2,
  Clock,
  Calendar,
  ChevronRight,
  Volume2,
  MicOff,
  MessageSquare,
  X,
  Smartphone,
  Globe,
  Bot,
  Trash2,
} from "lucide-react";
import { MOCK_INTERVIEWS, InterviewSession } from "../../types/jobs";
import InterviewReportModal from "./InterviewReportModal";

const InterviewPrep: React.FC = () => {
  const [view, setView] = useState<"dashboard" | "setup" | "active" | "report">("dashboard");
  const [isListening, setIsListening] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
  const [pastSessions, setPastSessions] = useState<InterviewSession[]>(MOCK_INTERVIEWS);

  // Web Speech API Refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const questions = [
    "Tell me about a time you handled a difficult stakeholder.",
    "How do you prioritize your design tasks when under a tight deadline?",
    "Walk me through your portfolio piece for the Fintech app.",
  ];

  useEffect(() => {
    // Initialize Speech Synthesis
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }

    // Initialize Speech Recognition
    if ("webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + " " + event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };
    }
  }, []);

  const speakQuestion = (text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel(); // Stop previous
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      synthRef.current.speak(utterance);
    }
  };

  const startInterview = () => {
    setView("active");
    setCurrentQuestionIndex(0);
    setTranscript("");
    // Delay speaking slightly for transition
    setTimeout(() => speakQuestion(questions[0]), 500);
  };

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSkip = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setTranscript("");
      setIsListening(false);
      recognitionRef.current?.stop();
      setTimeout(() => speakQuestion(questions[nextIndex]), 500);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    setView("report");
    recognitionRef.current?.stop();
    setIsListening(false);
    synthRef.current?.cancel();
  };

  // Dashboard View
  if (view === "dashboard") {
    return (
      <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
        {/* Content Lab Style Start Card */}
        <div className="bg-[#0B1121] rounded-3xl p-10 text-white mb-10 shadow-2xl relative overflow-hidden group border border-slate-800">
          {/* Blue Glow Effect */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-[100px] pointer-events-none group-hover:bg-blue-600/30 transition-all duration-700"></div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium mb-6">
              <Bot size={12} fill="currentColor" /> AI Interview Coach
            </div>
            <h2 className="text-4xl font-semibold mb-4 tracking-tight">Ace Your Next Interview</h2>
            <p className="text-slate-400 mb-8 text-lg leading-relaxed">
              Practice with our AI interviewer. Get real-time feedback on your answers, pacing, and tone. Tailored to your target job
              description.
            </p>
            <button
              onClick={() => setView("setup")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-medium shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2.5"
            >
              <Mic size={20} /> Start New Session
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium text-slate-900 dark:text-white">Past Sessions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pastSessions.map(session => (
            <div
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-lg font-medium text-slate-500 overflow-hidden">
                  {session.company[0]}
                </div>
                <div>
                  <h4 className="font-medium text-base text-slate-900 dark:text-white mb-0.5">{session.jobRole}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{session.company}</span>
                    <div className="w-0.5 h-0.5 bg-slate-300 rounded-full"></div>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {session.date}
                    </span>
                    <div className="w-0.5 h-0.5 bg-slate-300 rounded-full"></div>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {session.duration}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className={`block text-xl font-medium ${session.score >= 80 ? "text-green-600" : "text-orange-500"}`}>
                    {session.score}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Score</span>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setPastSessions(prev => prev.filter(s => s.id !== session.id));
                  }}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors ml-2"
                  title="Delete Session"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {selectedSession && (
          <InterviewReportModal
            session={selectedSession}
            onClose={() => setSelectedSession(null)}
            onRetake={() => {
              setSelectedSession(null);
              setView("setup");
            }}
          />
        )}
      </div>
    );
  }

  // Setup Modal
  if (view === "setup") {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-2xl rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-medium text-slate-900 dark:text-white">Setup Interview</h3>
              <p className="text-slate-500 mt-1">Configure your AI interviewer context.</p>
            </div>
            <button
              onClick={() => setView("dashboard")}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6 mb-10">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Company</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400">
                  <Globe size={18} />
                </span>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Google, Airbnb, Stripe"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Job Description / Role</label>
              <textarea
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm h-40 resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="Paste the JD here or type the role title (e.g. Senior Product Designer)..."
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setView("dashboard")}
              className="flex-1 py-3.5 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={startInterview}
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Start Interview <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Interview UI
  if (view === "active") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#0B1121] text-white">
        {/* Visualizer Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
          <div
            className={`w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] transition-all duration-300 ${isListening ? "scale-110 opacity-50" : "scale-100"}`}
          ></div>
        </div>

        {/* Header */}
        <div className="p-8 flex justify-between items-center relative z-20">
          <div className="flex items-center gap-3 opacity-60">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium uppercase tracking-widest">Live Session</span>
          </div>
          <button
            onClick={handleFinish}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
          >
            End Interview
          </button>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto w-full">
          <span className="text-blue-400 font-medium tracking-widest text-sm uppercase mb-8">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold leading-tight mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            &quot;{questions[currentQuestionIndex]}&quot;
          </h2>

          {/* Audio Visualizer (CSS Bars) */}
          {isListening && (
            <div className="flex items-center justify-center gap-1.5 h-16 mb-12">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-blue-400 rounded-full animate-bounce"
                  style={{
                    height: `${Math.random() * 100}%`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`,
                  }}
                ></div>
              ))}
            </div>
          )}

          <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-8 mb-12 text-left min-h-[120px] backdrop-blur-sm relative">
            <div className="absolute -top-3 left-6 px-3 py-1 bg-blue-600 rounded-md text-xs font-semibold uppercase tracking-wider shadow-lg">
              You
            </div>
            <p className="text-slate-200 text-xl leading-relaxed">
              {transcript || <span className="text-slate-500 italic">Tap the mic to start speaking...</span>}
            </p>
          </div>

          <div className="flex items-center gap-8">
            <button
              onClick={toggleMic}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl shadow-2xl transition-all hover:scale-105 active:scale-95 ${isListening ? "bg-red-500 ring-4 ring-red-500/30" : "bg-blue-600 hover:bg-blue-500"}`}
            >
              {isListening ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
            <button
              onClick={handleSkip}
              className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all hover:scale-105"
              title="Next Question"
            >
              <SkipForward size={24} />
            </button>
          </div>
          <p className="mt-8 text-slate-500 text-sm font-medium">{isListening ? "Listening..." : "Tap microphone to answer"}</p>
        </div>
      </div>
    );
  }

  // Report View
  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setView("dashboard")}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <ChevronRight className="rotate-180" />
        </button>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Interview Report</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <span className="block text-5xl font-medium text-blue-600 mb-2">85</span>
          <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Overall Score</span>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <span className="block text-5xl font-medium text-green-500 mb-2">High</span>
          <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Confidence</span>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <span className="block text-5xl font-medium text-orange-500 mb-2">3</span>
          <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Improvements</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-medium text-lg mb-4 text-slate-900 dark:text-white">Feedback Summary</h3>
        <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
          You demonstrated strong problem-solving skills and provided clear examples. However, try to be more concise when describing the
          &quot;Situation&quot; in your STAR method answers.
        </p>
        <h4 className="font-medium text-sm text-slate-400 uppercase tracking-wider mb-4">Question Breakdown</h4>
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium text-base text-slate-800 dark:text-slate-200 mb-1">{q}</h5>
                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                  Good
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Strong opening, but the conclusion was a bit rushed. Consider summarizing your impact more clearly.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InterviewPrep;
