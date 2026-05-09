import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, ChevronDown, ChevronUp, Circle, Lock, PlayCircle, Sparkles, Star, SendHorizontal } from "lucide-react";

type ContentTab = "overview" | "resources";

type OverviewSection = { title: string; body: string };

type ResourceItem = {
  title: string;
  body?: string;
  /** Reserved 16:9 slot for a video (no URL yet). Ignored if `videoUrl` yields a valid embed. */
  hasVideo?: boolean;
  /** Optional embed URL (YouTube watch, youtu.be, or direct embed URL). */
  videoUrl?: string;
};

type Stage = {
  id: string;
  title: string;
  subtitle: string;
  callMilestone: 1 | 2 | 3 | null;
  isCallStage: boolean;
  overview: OverviewSection[];
  tasks: string[];
  resources: ResourceItem[];
  nextActionLabel: string;
};

/** Allow only YouTube watch, youtu.be, or embed URLs → embed src. */
function videoUrlToEmbedSrc(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/youtube\.com\/embed\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      if (u.hostname.replace(/^www\./i, "").toLowerCase() === "youtube.com") return u.toString();
    } catch {
      return null;
    }
  }
  const m = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  return null;
}

const STAGES: Stage[] = [
  {
    id: "call-1-prep",
    title: "Stage 1 - Call 1 Prep",
    subtitle: "Niche fixing, base resume, and LinkedIn optimization before Call 1.",
    callMilestone: 1,
    isCallStage: true,
    overview: [
      {
        title: "Niche and market fit",
        body: "Define your niche clearly and validate it against market demand. Map who you serve, what problems you solve, and how hiring managers in that space describe success. Use the worksheet to pressure-test assumptions before you invest time in assets.",
      },
      {
        title: "Base resume",
        body: "Build a strong base resume focused on outcomes, not duties. Lead with impact bullets, quantify results where you can, and align language with roles you want. Expect several iterations; the goal is a document you can tailor quickly per application.",
      },
      {
        title: "LinkedIn before Call 1",
        body: "Optimize your LinkedIn headline and About section so they match your niche story. Recruiters skim both in seconds—make the first lines specific and credible. Add proof (projects, metrics, links) where it strengthens your positioning.",
      },
    ],
    tasks: ["Complete niche fixing worksheet", "Upload base resume draft", "Update LinkedIn headline and about section"],
    resources: [
      {
        title: "Niche Worksheet",
        body: "Walk through prompts to lock your niche statement and supporting evidence.",
      },
      {
        title: "Base Resume Guide",
        body: "Structure, bullet formulas, and examples for outcome-led resumes.",
      },
      {
        title: "LinkedIn Optimization Checklist",
        body: "Headline, About, featured links, and activity habits before your first call.",
      },
    ],
    nextActionLabel: "Book Call 1",
  },
  {
    id: "post-call-1",
    title: "Stage 2 - Post Call 1 Tasks",
    subtitle: "Execute post-call actions and complete portfolio tasks.",
    callMilestone: null,
    isCallStage: false,
    overview: [
      {
        title: "Resume revisions",
        body: "Revise your resume based on coach feedback from Call 1. Capture every change request in a single doc so you can batch edits. Prioritize clarity and proof over length—most strong resumes stay tight once feedback is applied.",
      },
      {
        title: "LinkedIn follow-through",
        body: "Complete all LinkedIn tasks from Call 1 before you request Call 2. Treat LinkedIn as a living asset: update once, then reinforce with posts or comments that match your niche story.",
      },
      {
        title: "Portfolio tasks",
        body: "Your portfolio is built offline by the coach; complete assigned portfolio tasks on your side so assets stay aligned with what you pitch in applications. If something is unclear, note blockers in coach chat early.",
      },
    ],
    tasks: ["Revise resume", "Complete LinkedIn tasks", "Complete assigned portfolio tasks"],
    resources: [
      {
        title: "Resume Revision Checklist",
        body: "Section-by-section pass after coach comments.",
      },
      {
        title: "LinkedIn Task Board",
        body: "Track each LinkedIn deliverable and mark done when live on your profile.",
      },
      {
        title: "Portfolio Completion Notes",
        body: "What to verify before you sign off on portfolio-related tasks.",
      },
    ],
    nextActionLabel: "Unlock Call 2",
  },
  {
    id: "call-2",
    title: "Stage 3 - Call 2",
    subtitle: "Do one quality application together with your coach.",
    callMilestone: 2,
    isCallStage: true,
    overview: [
      {
        title: "One live application with your coach",
        body: "Use your polished assets to execute one high-quality application with your coach on the call. The goal is not speed—it is calibration. You should leave knowing what “good” looks like for your niche so you can repeat it without guesswork.",
      },
      {
        title: "Quality bar and repeatable framework",
        body: "Understand quality application standards: role fit, proof, specificity in answers, and follow-up. Capture the checklist your coach uses so your next solo applications inherit the same bar.",
      },
    ],
    tasks: [
      "Shortlist one target role and company",
      "Submit job description before call",
      "Attend Call 2 and complete one quality application",
    ],
    resources: [
      {
        title: "Quality Application Framework",
        body: "Criteria for role research, tailoring, and submission quality.",
      },
      {
        title: "Application Quality Checklist",
        body: "A printable pass before you hit submit on any application.",
      },
    ],
    nextActionLabel: "Join Call 2",
  },
  {
    id: "post-call-2",
    title: "Stage 4 - Post Call 2 Tasks",
    subtitle: "Start consistent execution and complete personal branding video.",
    callMilestone: null,
    isCallStage: false,
    overview: [
      {
        title: "Independent execution",
        body: "Apply the same quality framework independently across multiple roles. Track where you cut corners—that is usually where response rate drops. Consistency beats bursts of activity.",
      },
      {
        title: "Personal branding video",
        body: "Watch the personal branding pre-recorded video and execute the action points. Treat it as implementation homework: pause, take notes, and schedule concrete posts or profile updates on your calendar.",
      },
    ],
    tasks: ["Complete 5 quality applications", "Watch personal branding video", "Post one personal branding update"],
    resources: [
      {
        title: "Personal Branding Video",
        body: "Pre-recorded walkthrough plus prompts to adapt to your niche.",
        hasVideo: true,
      },
      {
        title: "Weekly Application Planner",
        body: "Capacity, targets, and review rhythm for steady outbound.",
      },
      {
        title: "Networking Starter Template",
        body: "Short outreach angles that do not read like mass mail.",
      },
    ],
    nextActionLabel: "Prepare for Call 3",
  },
  {
    id: "call-3",
    title: "Stage 5 - Call 3",
    subtitle: "Interview preparation and personal branding refinement.",
    callMilestone: 3,
    isCallStage: true,
    overview: [
      {
        title: "Interview strategy",
        body: "Prepare for interviews with role-specific strategy: company context, likely questions, and stories that map to their language. Bring real JDs and interview loops you expect so feedback stays concrete.",
      },
      {
        title: "Personal branding refinement",
        body: "Refine personal branding with direct feedback from your coach—messaging, proof points, and how you show up in writing versus live conversation. Align public narrative with what you say in interviews.",
      },
    ],
    tasks: ["Submit interview target companies", "Complete interview prep worksheet", "Attend Call 3"],
    resources: [
      {
        title: "Interview Preparation Framework",
        body: "Structure for company research, story banks, and follow-up.",
      },
      {
        title: "Behavioral Question Bank",
        body: "Prompts mapped to STAR-style evidence from your experience.",
      },
      {
        title: "Personal Branding Review Sheet",
        body: "A coach-led rubric for headlines, About, and activity signals.",
      },
    ],
    nextActionLabel: "Join Call 3",
  },
  {
    id: "complete",
    title: "Stage 6 - Program Complete",
    subtitle: "Continue the system and sustain momentum.",
    callMilestone: null,
    isCallStage: false,
    overview: [
      {
        title: "What you have unlocked",
        body: "You have completed all three calls and mandatory stage tasks. The system you built—assets, outreach, interview prep—is yours to reuse. The remaining work is rhythm, not reinvention.",
      },
      {
        title: "Sustaining momentum",
        body: "Continue applying the same system with consistency: weekly targets, honest quality checks, and coach updates when you stall. Small steady improvements compound faster than occasional sprints.",
      },
    ],
    tasks: ["Follow weekly execution system", "Share progress update with your coach"],
    resources: [
      {
        title: "Weekly Execution System",
        body: "Cadence template for applications, networking, and follow-ups.",
      },
      {
        title: "Interview Confidence Toolkit",
        body: "Warm-up drills and last-mile checks before high-stakes rounds.",
      },
    ],
    nextActionLabel: "Continue System",
  },
];

const STAGE_CHAT_SEED: Record<string, { sender: "coach" | "student"; text: string }[]> = {
  "call-1-prep": [
    {
      sender: "coach",
      text: "Start with your niche worksheet first, then upload your resume draft.",
    },
  ],
  "post-call-1": [{ sender: "coach", text: "Great Call 1. Complete resume + LinkedIn tasks to unlock Call 2." }],
  "call-2": [{ sender: "coach", text: "Share one target JD before we meet for Call 2." }],
  "post-call-2": [{ sender: "coach", text: "Now stay consistent. Finish quality applications + branding video." }],
  "call-3": [{ sender: "coach", text: "Bring your interview doubts. We will sharpen your narrative." }],
  complete: [{ sender: "coach", text: "You made it. Keep following the system weekly." }],
};

const Unicoach: React.FC = () => {
  const [activeStageId, setActiveStageId] = useState(STAGES[0].id);
  const [activeTab, setActiveTab] = useState<ContentTab>("overview");
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [chatByStage, setChatByStage] = useState(STAGE_CHAT_SEED);
  const [chatDraft, setChatDraft] = useState("");
  const [isCoachChatCollapsed, setIsCoachChatCollapsed] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState<Record<string, boolean>>({});
  const [seenCoachMessageCountByStage, setSeenCoachMessageCountByStage] = useState<Record<string, number>>(() =>
    Object.fromEntries(STAGES.map(stage => [stage.id, (STAGE_CHAT_SEED[stage.id] ?? []).filter(msg => msg.sender === "coach").length]))
  );

  const firstIncompleteStageIndex = useMemo(() => {
    const index = STAGES.findIndex(stage => stage.tasks.some(task => !completedTaskIds.includes(`${stage.id}:${task}`)));
    return index === -1 ? STAGES.length - 1 : index;
  }, [completedTaskIds]);

  const activeStage = STAGES.find(stage => stage.id === activeStageId) ?? STAGES[0];

  const totalTaskCount = STAGES.reduce((total, stage) => total + stage.tasks.length, 0);
  const completionPercent = Math.round((completedTaskIds.length / totalTaskCount) * 100);

  const completedCalls = [1, 2, 3].filter(milestone => {
    const stageForCall = STAGES.find(stage => stage.callMilestone === milestone);
    if (!stageForCall) return false;
    return stageForCall.tasks.every(task => completedTaskIds.includes(`${stageForCall.id}:${task}`));
  }).length;

  /** Horizontal % along the bar for Call 1 / 2 / 3 prep gates (task-weighted). */
  const callMilestonePercents = useMemo(() => {
    if (totalTaskCount === 0) return [0, 0, 0] as [number, number, number];
    const cumThroughStage = (stageIndex: number) => STAGES.slice(0, stageIndex + 1).reduce((n, s) => n + s.tasks.length, 0);
    const idxCall1 = STAGES.findIndex(s => s.callMilestone === 1);
    const idxPost1 = STAGES.findIndex(s => s.id === "post-call-1");
    const idxPost2 = STAGES.findIndex(s => s.id === "post-call-2");
    const p1 = (cumThroughStage(idxCall1 >= 0 ? idxCall1 : 0) / totalTaskCount) * 100;
    const p2 = (cumThroughStage(idxPost1 >= 0 ? idxPost1 : 0) / totalTaskCount) * 100;
    const p3 = (cumThroughStage(idxPost2 >= 0 ? idxPost2 : 0) / totalTaskCount) * 100;
    const clamp = (x: number) => Math.min(100, Math.max(0, x));
    return [clamp(p1), clamp(p2), clamp(p3)] as [number, number, number];
  }, [totalTaskCount]);

  const allProgramTasksDone = useMemo(
    () => STAGES.every(stage => stage.tasks.every(task => completedTaskIds.includes(`${stage.id}:${task}`))),
    [completedTaskIds]
  );

  const prevCompletedCallsRef = useRef(completedCalls);
  const prevAllProgramDoneRef = useRef(allProgramTasksDone);

  useEffect(() => {
    if (completedCalls > prevCompletedCallsRef.current) {
      confetti({
        particleCount: 130,
        spread: 72,
        origin: { y: 0.32 },
        ticks: 220,
        scalar: 0.95,
      });
      confetti({
        particleCount: 40,
        spread: 100,
        origin: { y: 0.28 },
        angle: 120,
        shapes: ["star"],
        scalar: 0.85,
      });
    }
    prevCompletedCallsRef.current = completedCalls;
  }, [completedCalls]);

  useEffect(() => {
    if (allProgramTasksDone && !prevAllProgramDoneRef.current) {
      confetti({
        particleCount: 160,
        spread: 85,
        origin: { y: 0.42 },
        ticks: 280,
        colors: ["#2563eb", "#eab308", "#22c55e", "#f8fafc"],
      });
      confetti({
        particleCount: 45,
        spread: 100,
        origin: { y: 0.38 },
        angle: 90,
        shapes: ["star"],
        scalar: 0.75,
        colors: ["#eab308", "#fbbf24"],
      });
    }
    prevAllProgramDoneRef.current = allProgramTasksDone;
  }, [allProgramTasksDone]);

  const isActiveStageFullyComplete = activeStage.tasks.every(task => completedTaskIds.includes(`${activeStage.id}:${task}`));

  const toggleTask = (stageId: string, task: string) => {
    const taskId = `${stageId}:${task}`;
    setCompletedTaskIds(prev => (prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]));
  };

  const handleSendMessage = () => {
    if (!chatDraft.trim()) return;
    setChatByStage(prev => ({
      ...prev,
      [activeStage.id]: [...(prev[activeStage.id] ?? []), { sender: "student", text: chatDraft.trim() }],
    }));
    setChatDraft("");
  };

  const unreadCoachMessageCount = useMemo(
    () =>
      STAGES.reduce((total, stage) => {
        const coachMessageCount = (chatByStage[stage.id] ?? []).filter(msg => msg.sender === "coach").length;
        const seenCount = seenCoachMessageCountByStage[stage.id] ?? 0;
        return total + Math.max(0, coachMessageCount - seenCount);
      }, 0),
    [chatByStage, seenCoachMessageCountByStage]
  );

  const accordionKey = (kind: "overview" | "resources", index: number) => `${activeStage.id}:${kind}:${index}`;
  const isAccordionOpen = (kind: "overview" | "resources", index: number) => accordionOpen[accordionKey(kind, index)] ?? index === 0;
  const toggleAccordion = (kind: "overview" | "resources", index: number) => {
    const key = accordionKey(kind, index);
    setAccordionOpen(prev => {
      const current = prev[key] ?? index === 0;
      return { ...prev, [key]: !current };
    });
  };

  const markCurrentStageCoachMessagesSeen = useCallback(() => {
    const coachMessageCount = (chatByStage[activeStage.id] ?? []).filter(msg => msg.sender === "coach").length;
    setSeenCoachMessageCountByStage(prev => ({
      ...prev,
      [activeStage.id]: coachMessageCount,
    }));
  }, [activeStage.id, chatByStage]);

  useEffect(() => {
    if (isCoachChatCollapsed) return;
    const markSeenTimeout = window.setTimeout(() => {
      markCurrentStageCoachMessagesSeen();
    }, 0);
    return () => window.clearTimeout(markSeenTimeout);
  }, [isCoachChatCollapsed, markCurrentStageCoachMessagesSeen]);

  const getStageStatus = (stage: Stage, index: number) => {
    if (index > firstIncompleteStageIndex) return "locked";
    const stageTasksDone = stage.tasks.every(task => completedTaskIds.includes(`${stage.id}:${task}`));
    if (stageTasksDone) return "complete";
    if (stage.id === activeStage.id) return "active";
    return "unlocked";
  };

  return (
    <>
      <div className="flex-1 bg-slate-50 dark:bg-[#0a0a0a] h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
          <section className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl text-slate-900 dark:text-white font-medium mt-1">Unicoach Journey</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  No stage skipping. Complete mandatory tasks to unlock the next stage.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Program Progress</p>
                  <p className="text-lg font-medium text-slate-900 dark:text-white">{completionPercent}%</p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Calls Completed</p>
                  <p className="text-lg font-medium text-slate-900 dark:text-white">{completedCalls}/3</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="relative flex h-10 w-full items-center">
                <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-600 dark:bg-brand-500 transition-all duration-300"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                {([1, 2, 3] as const).map((call, i) => {
                  const done = completedCalls >= call;
                  const left = callMilestonePercents[i];
                  return (
                    <div
                      key={call}
                      className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${left}%` }}
                      title={
                        done
                          ? `Call ${call} prep milestone complete`
                          : `Call ${call} prep milestone — finish tasks up to here on the journey`
                      }
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-sm ring-2 ring-white dark:ring-[#111] ${
                          done
                            ? "border-amber-300/90 bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300 dark:border-amber-400/50 dark:from-amber-400/90 dark:via-yellow-300/80 dark:to-amber-500/90"
                            : "border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800"
                        }`}
                      >
                        <Star
                          size={15}
                          className={done ? "text-amber-800 dark:text-amber-100" : "text-slate-300 dark:text-slate-500"}
                          fill={done ? "currentColor" : "none"}
                          strokeWidth={done ? 0 : 1.75}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {[1, 2, 3].map(call => {
                const done = call <= completedCalls;
                return (
                  <div
                    key={call}
                    className={`px-2.5 py-1 rounded-full border ${
                      done
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300"
                        : "bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                    }`}
                  >
                    Call {call}
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <aside className="lg:col-span-3 space-y-2">
              {STAGES.map((stage, index) => {
                const status = getStageStatus(stage, index);
                const isLocked = status === "locked";
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => {
                      if (!isLocked) {
                        setActiveStageId(stage.id);
                        setActiveTab("overview");
                      }
                    }}
                    className={`w-full text-left rounded-xl border p-3 transition-colors ${
                      stage.id === activeStage.id
                        ? "border-brand-200 bg-brand-50 dark:border-brand-500/50 dark:bg-brand-500/10"
                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-[#111] dark:hover:bg-slate-900/50"
                    } ${isLocked ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {status === "complete" ? (
                          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                        ) : status === "locked" ? (
                          <Lock size={16} className="text-slate-400" />
                        ) : (
                          <Circle size={16} className="text-brand-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Stage {index + 1}</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{stage.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{stage.subtitle}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </aside>

            <section className="lg:col-span-6 space-y-4">
              <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-medium text-slate-900 dark:text-white">{activeStage.title}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{activeStage.subtitle}</p>
                  </div>
                  {activeStage.isCallStage && (
                    <div className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-300 bg-gradient-to-br from-amber-200 via-yellow-200 to-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.35)] dark:border-amber-300/50 dark:from-amber-300/80 dark:via-yellow-300/80 dark:to-amber-500/80 dark:shadow-[0_0_18px_rgba(245,158,11,0.3)] overflow-hidden">
                      <span className="pointer-events-none absolute -left-10 top-0 h-full w-8 bg-white/45 blur-[0.5px] [transform:skewX(-20deg)] [animation:unicoachShine_10s_ease-in-out_infinite]" />
                      <Star size={14} className="relative z-10 text-amber-800 dark:text-amber-100" fill="currentColor" />
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(["overview", "resources"] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                        activeTab === tab
                          ? "bg-brand-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                {activeTab === "overview" && (
                  <div className="space-y-2">
                    {activeStage.overview.map((section, index) => {
                      const open = isAccordionOpen("overview", index);
                      return (
                        <div
                          key={`${activeStage.id}-ov-${index}`}
                          className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => toggleAccordion("overview", index)}
                            className="w-full flex items-center justify-between gap-3 text-left px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <Sparkles size={16} className="text-brand-500 mt-0.5 shrink-0" />
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{section.title}</span>
                            </div>
                            {open ? (
                              <ChevronUp size={16} className="text-slate-400 shrink-0" />
                            ) : (
                              <ChevronDown size={16} className="text-slate-400 shrink-0" />
                            )}
                          </button>
                          {open && (
                            <div className="px-3 pb-3 pl-9 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                              {section.body}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === "resources" && (
                  <div className="space-y-2">
                    {activeStage.resources.map((resource, index) => {
                      const open = isAccordionOpen("resources", index);
                      const embedSrc = resource.videoUrl ? videoUrlToEmbedSrc(resource.videoUrl) : null;
                      const showVideoPlaceholder = Boolean(resource.hasVideo && !embedSrc);
                      const hasVideoVisual = Boolean(embedSrc || resource.hasVideo || resource.videoUrl);
                      return (
                        <div
                          key={`${activeStage.id}-res-${index}`}
                          className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => toggleAccordion("resources", index)}
                            className="w-full flex items-center justify-between gap-3 text-left px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <PlayCircle
                                size={16}
                                className={`mt-0.5 shrink-0 ${hasVideoVisual ? "text-brand-500" : "text-slate-400 dark:text-slate-500"}`}
                              />
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{resource.title}</span>
                            </div>
                            {open ? (
                              <ChevronUp size={16} className="text-slate-400 shrink-0" />
                            ) : (
                              <ChevronDown size={16} className="text-slate-400 shrink-0" />
                            )}
                          </button>
                          {open && (
                            <div className="px-3 pb-3 space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                              {resource.body && (
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-7">{resource.body}</p>
                              )}
                              {embedSrc && (
                                <div className="pl-7 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 aspect-video">
                                  <iframe
                                    title={resource.title}
                                    src={embedSrc}
                                    className="h-full w-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              )}
                              {showVideoPlaceholder && (
                                <div
                                  className="pl-7 aspect-video rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/60 flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500"
                                  aria-hidden
                                >
                                  <PlayCircle size={28} strokeWidth={1.25} className="opacity-60" />
                                  <span className="text-xs font-medium uppercase tracking-wide">Video</span>
                                </div>
                              )}
                              {resource.videoUrl && !embedSrc && !resource.hasVideo && (
                                <p className="text-xs text-amber-700 dark:text-amber-400 pl-7">
                                  Video link could not be embedded. Use a YouTube URL or paste an embed link from your host.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <aside className="lg:col-span-3 space-y-4">
              <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">Task checklist</p>
                <div className="mt-4 space-y-3">
                  {activeStage.tasks.map(task => {
                    const taskId = `${activeStage.id}:${task}`;
                    const checked = completedTaskIds.includes(taskId);
                    return (
                      <label key={task} className="flex items-start gap-3 text-sm rounded-xl px-1 py-0.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTask(activeStage.id, task)}
                          className="h-4 w-4 min-h-4 min-w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500 mt-0.5"
                        />
                        <span
                          className={`leading-5 ${checked ? "text-slate-500 dark:text-slate-500 line-through" : "text-slate-700 dark:text-slate-300"}`}
                        >
                          {task}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={!isActiveStageFullyComplete}
                  className={`mt-3 w-full rounded-xl text-sm py-2.5 transition-colors ${
                    isActiveStageFullyComplete
                      ? "bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700 text-white"
                      : "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                  }`}
                >
                  {activeStage.nextActionLabel}
                </button>
              </div>

              <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCoachChatCollapsed(prev => {
                      const next = !prev;
                      if (!next) markCurrentStageCoachMessagesSeen();
                      return next;
                    });
                  }}
                  className={`w-full flex items-center justify-between gap-3 ${isCoachChatCollapsed ? "" : "border-b border-slate-100 dark:border-slate-800 pb-3"}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full border-2 border-emerald-500/80 shadow-[0_0_0_2px_rgba(16,185,129,0.15)] bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 flex items-center justify-center text-[10px] font-semibold">
                      UC
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">Coach Chat</p>
                    {unreadCoachMessageCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-600 text-white text-[10px] font-semibold">
                        {unreadCoachMessageCount}
                      </span>
                    )}
                  </div>
                  {isCoachChatCollapsed ? (
                    <ChevronDown size={16} className="text-slate-400" />
                  ) : (
                    <ChevronUp size={16} className="text-slate-400" />
                  )}
                </button>
                {!isCoachChatCollapsed && (
                  <div className="mt-3 space-y-3">
                    <div className="max-h-64 overflow-auto space-y-2 pr-1">
                      {(chatByStage[activeStage.id] ?? []).map((message, idx) => (
                        <div
                          key={`${activeStage.id}-${idx}`}
                          className={`flex ${message.sender === "coach" ? "justify-start" : "justify-end"}`}
                        >
                          {message.sender === "coach" ? (
                            <div className="max-w-[92%] rounded-2xl rounded-bl-md px-3 py-2 text-xs bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                              {message.text}
                            </div>
                          ) : (
                            <div className="max-w-[90%] rounded-2xl rounded-br-md px-3 py-2 text-xs bg-brand-600 text-white">
                              {message.text}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={chatDraft}
                        onChange={event => setChatDraft(event.target.value)}
                        placeholder="Ask your coach..."
                        className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs outline-none focus:border-brand-500"
                      />
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        className="h-9 w-9 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors inline-flex items-center justify-center"
                        aria-label="Send message"
                      >
                        <SendHorizontal size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes unicoachShine {
          0% {
            transform: translateX(0) skewX(-20deg);
            opacity: 0;
          }
          6% {
            transform: translateX(56px) skewX(-20deg);
            opacity: 0.9;
          }
          12% {
            transform: translateX(72px) skewX(-20deg);
            opacity: 0;
          }
          100% {
            transform: translateX(72px) skewX(-20deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};

export default Unicoach;
