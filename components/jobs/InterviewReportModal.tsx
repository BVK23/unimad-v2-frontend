import React from "react";
import { X, Calendar, Clock, ChevronRight, RotateCcw } from "lucide-react";
import { InterviewSession } from "../../types/jobs";

interface InterviewReportModalProps {
  session: InterviewSession;
  onClose: () => void;
  onRetake: () => void;
}

const InterviewReportModal: React.FC<InterviewReportModalProps> = ({ session, onClose, onRetake }) => {
  // Calculate color based on score for the text
  const scoreColor = session.score >= 80 ? "text-green-600" : session.score >= 50 ? "text-yellow-600" : "text-orange-600";

  // Mock transcript data since our mock object might not have it fully populated
  const mockTranscript = [
    {
      q: "Tell me about a time you handled a difficult stakeholder.",
      a: "I once had a PM who pushed for a feature that wasn't user-tested. I set up a quick usability test to gather data...",
      feedback: "Great use of data to back your decision.",
      score: "Good",
    },
    {
      q: "How do you prioritize your design tasks?",
      a: "I use the Eisenhower Matrix...",
      feedback: "Solid framework, but try to be more specific to product design context.",
      score: "Neutral",
    },
    {
      q: "Walk me through your portfolio piece.",
      a: "So, this project was for a fintech app...",
      feedback: "Good structure, but you started a bit abruptly. Set the context first.",
      score: "Good",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{session.jobRole}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                {session.company}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> {session.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} /> {session.duration}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Hiring Probability Graph */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Hiring Probability</h3>
                <p className="text-slate-500 text-sm">Based on your answers, tone, and pacing.</p>
              </div>
              <div className="text-right">
                <span className={`text-3xl font-bold ${scoreColor}`}>{session.score}%</span>
              </div>
            </div>

            <div className="relative pt-6 pb-2">
              {/* The Gradient Bar */}
              <div className="h-4 w-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 shadow-inner"></div>

              {/* The Arrow Indicator */}
              <div
                className="absolute top-0 flex flex-col items-center transition-all duration-1000 ease-out"
                style={{ left: `${session.score}%`, transform: "translateX(-50%)" }}
              >
                <div className="text-slate-900 dark:text-white font-bold text-xs mb-1">{session.score}%</div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-800 dark:border-t-white drop-shadow-sm"></div>
              </div>

              {/* Labels */}
              <div className="flex justify-between text-xs text-slate-400 font-medium mt-3 uppercase tracking-wider">
                <span>Low Chance</span>
                <span>Possible</span>
                <span>High Chance</span>
              </div>
            </div>
          </div>

          {/* Overall feedback */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 p-6 rounded-2xl">
            <h4 className="flex items-center gap-2 font-medium text-blue-900 dark:text-blue-200 mb-2">
              <span className="text-lg">💡</span> AI Coach Feedback
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
              You demonstrated strong technical knowledge and cultural fit. To increase your hiring probability to the next level, focus on
              structuring your &quot;Situation&quot; and &quot;Task&quot; sections more concisely in behavioral questions.
            </p>
          </div>

          {/* Transcript Details */}
          <div>
            <h3 className="font-medium text-lg text-slate-900 dark:text-white mb-4">Response Breakdown</h3>
            <div className="space-y-4">
              {mockTranscript.map((item, idx) => (
                <div
                  key={idx}
                  className="group border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-blue-200 dark:hover:border-blue-700 transition-colors bg-white dark:bg-slate-900/50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                      Q{idx + 1}: {item.q}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${item.score === "Good" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {item.score}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 pl-3 border-l-2 border-slate-200 dark:border-slate-700 font-mono bg-slate-50 dark:bg-black/20 p-2 rounded-r-lg">
                    &quot;{item.a}&quot;
                  </p>
                  <div className="flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                    <span className="font-bold">Feedback:</span> {item.feedback}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            onClick={onRetake}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <RotateCcw size={18} /> Retake Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewReportModal;
