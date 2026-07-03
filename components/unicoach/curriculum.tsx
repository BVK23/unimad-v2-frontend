export type ContentTab = "overview" | "resources" | "dashboard";

export type OverviewSection = {
  title: string;
  body: string;
  href?: string;
  hrefLabel?: string;
};

export type ResourceItem = {
  title: string;
  body?: string;
  hasVideo?: boolean;
  videoUrl?: string;
  href?: string;
  hrefLabel?: string;
};

export type UnicoachCurriculumStage = {
  id: string;
  title: string;
  subtitle: string;
  callMilestone: 1 | 2 | 3 | 4 | null;
  isCallStage: boolean;
  overview: OverviewSection[];
  tasks: string[];
  resources: ResourceItem[];
  nextActionLabel: string;
  hasDashboard?: boolean;
  showBookingCta?: boolean;
};

export const videoUrlToEmbedSrc = (url: string): string | null => {
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
};

export const UNICOACH_STAGES: UnicoachCurriculumStage[] = [
  {
    id: "call-1",
    title: "Discovery call",
    subtitle: "Confirm the role best suited for your profile and build the resume that backs it up.",
    callMilestone: 1,
    isCallStage: true,
    overview: [
      {
        title: "Lock your role and build your base resume",
        body: "Your Unicoach will help you fix the role from your homework, then help you build the base resume everything else gets tailored from.",
      },
      {
        title: "Discovery and direction",
        body: "Use your first call to clarify your target role, market fit, and what success looks like in the next 90 days. Leave with a concrete plan for assets and outbound.",
      },
      {
        title: "Base resume",
        body: "Lead with outcomes, quantify impact, and keep bullets tight. One page for most early-career profiles; two only when every line earns its place.",
        href: "/uniboard/resume",
        hrefLabel: "Open Resume",
      },
    ],
    tasks: ["Fix your role", "Build your resume", "Personalised job search strategy"],
    resources: [
      {
        title: "Build your base resume",
        body: "Start or refine your base resume in the Resume feature — your coach will tailor from this on the call.",
        href: "/uniboard/resume",
        hrefLabel: "Open Resume",
      },
      {
        title: "Don't overcomplicate your CV",
        body: `It is way easier than you think. Follow the points given below.

Use of words
Standard words → Golden words
Responsible for → Led, Orchestrated, Directed
Assisted → Collaborated, Contributed, Supported
Participated in → Executed, Implemented, Drove
Helped → Facilitated, Enabled, Boosted
Tried or Attempted → Pioneered, Initiated, Launched
Familiar with → Proficient in, Skilled at, Adept with
Experienced in → Expertise in, Specialised in
Utilised → Leveraged, Optimised, Maximised
Worked on → Developed, Created, Designed
Seasoned → Expert, Veteran, Authority
Dabbled in → Cultivated skills in, Developed proficiency in
Managed → Oversaw, Guided, Mentored
Handled → Resolved, Addressed, Streamlined
Duties included → Accomplishments include, Key contributions`,
      },
      {
        title: "Tips & pointers — purpose of a CV",
        body: "The purpose of a CV is to just get you the interview. Once you get that it's basically useless.",
      },
      {
        title: "6 pointers for a killer CV",
        body: `1. Outcome-based sentences — Nobody cares about what you did. They care about outcomes and numbers.

Normal: I worked as a Prompt engineer for Unimad and enhanced chatbot accuracy.
Outcome-based: Enhanced chatbot accuracy by 30% through customising 50 unique prompts and utilising Vertex AI.

2. Strictly 1-page resume if you have less than 5 years of experience.
3. No summary needed — help recruiters skim achievements with minimum content.
4. Use PDF format only — .docx leads to straight rejection.
5. Minimal and clean — simple English, no jargon.
6. No fancy design — super simple format highlighting achievements.`,
      },
    ],
    nextActionLabel: "Book your 2nd",
    showBookingCta: true,
  },
  {
    id: "call-2",
    title: "LinkedIn branding",
    subtitle: "Upgrade your LinkedIn profile and build the system that keeps you visible.",
    callMilestone: 2,
    isCallStage: true,
    overview: [
      {
        title: "Your LinkedIn, redesigned",
        body: "Your photo, cover, headline, and about section rewritten and redesigned for you. Then we'll build the system that keeps you visible.",
      },
      {
        title: "The visibility system",
        body: "A monthly content engine, a comments strategy that gets you on recruiters' radars, and a personal outbound plan so the right people hear from you consistently.",
      },
      {
        title: "CCC framework",
        body: "Making Connections · Posting Comments · Posting Content. Master these 3 pillars and you'll attract recruiters to your profile directly.",
      },
      {
        title: "Optimise your LinkedIn profile",
        body: "Your coach will walk through profile updates live on Call 2. Use our LinkedIn feature to prepare and track changes.",
        href: "/uniboard/linkedin",
        hrefLabel: "Open LinkedIn",
      },
    ],
    tasks: ["Change your DP", "Change your banner", "Change your headline", "Change your about section", "Add two recommendations"],
    resources: [
      {
        title: "Personal branding video",
        body: "Pre-recorded walkthrough plus prompts to adapt to your niche.",
        hasVideo: true,
      },
      {
        title: "CCC framework — Making connections",
        body: "Daily outbound rhythm: log connection requests and build your network in your niche.",
        href: "/uniboard/linkedin",
        hrefLabel: "Open LinkedIn",
      },
      {
        title: "Making comments",
        body: "Meaningful comments on posts in your niche — quality over quantity.",
      },
      {
        title: "Posting content — 30-day LinkedIn plan",
        body: "Aim for at least one post every other day. Use Studio for drafts.",
        href: "/uniboard/studio",
        hrefLabel: "Open Studio",
      },
    ],
    nextActionLabel: "Book Call 3",
    hasDashboard: true,
    showBookingCta: true,
  },
  {
    id: "call-3",
    title: "Application Strategy",
    subtitle: "One application done right, then a system to repeat it every single time.",
    callMilestone: 3,
    isCallStage: true,
    overview: [
      {
        title: "One full application, end to end",
        body: "We'll do one full application together — tailoring your resume, writing a cold email that gets a reply, and tracking every move.",
      },
      {
        title: "The repeatable system",
        body: "Then we'll build the system around it: a daily application checklist, a referral strategy, and a portfolio that backs everything up. By the end, you'll know exactly how to do it again.",
      },
      {
        title: "Job system implementation",
        body: "You're 2 more levels away from that job offer. Your checklist is simple. Doing it consistently is the only hard part.",
      },
      {
        title: "Go get your interview",
        body: "Every student who has followed this system consistently has landed an interview. Hit your daily targets, track your numbers, and when the interview lands, book your next session.",
      },
      {
        title: "Your portfolio on this call",
        body: "Your portfolio is built during this module. Humanise it and make it back up everything you pitch.",
        href: "/uniboard/portfolio",
        hrefLabel: "Open Portfolio",
      },
    ],
    tasks: [
      "Publish your resume",
      "Add other Achievements",
      "Film your intro video",
      "Humanise your portfolio",
      "Set up your booking link",
    ],
    resources: [
      {
        title: "Sites to apply",
        body: "Use the Jobs feature to shortlist roles, prepare applications, and track every move.",
        href: "/uniboard/jobs",
        hrefLabel: "Open Jobs",
      },
      {
        title: "Application tracker",
        body: "Shortlist roles and use your job tracker to stay organised before and after your call.",
        href: "/uniboard/jobs",
        hrefLabel: "Open Jobs tracker",
      },
    ],
    nextActionLabel: "",
    hasDashboard: true,
    showBookingCta: false,
  },
  {
    id: "call-4",
    title: "Interview Prep & VPD",
    subtitle: "Every interview is a rep. Decode, sharpen, and go again until you get the offer.",
    callMilestone: 4,
    isCallStage: true,
    overview: [
      {
        title: "What goes into your VPD?",
        body: `Three questions. Most candidates can't answer them on the spot. You'll have them locked before you walk in.

What value do you bring to this company?
What does this company offer your career?
How do you fit into how they work and what they stand for?

Proactive candidates win. This is how you become one.`,
        href: "/uniboard/vpd",
        hrefLabel: "Build your VPD now",
      },
      {
        title: "Interview preparation",
        body: "Research the company. Prep your answers. Run a mock round. Walk in knowing more about them than they expect any candidate to know.",
        href: "/uniboard/interview-prep",
        hrefLabel: "Open Interview Prep",
      },
      {
        title: "Keep executing",
        body: "Keep following the execution calendar in Application Strategy. VPD and interview prep resources are here when you need them.",
      },
    ],
    tasks: ["Interview Preparation", "Watch VPD session", "Follow the system"],
    resources: [
      {
        title: "VPD session video",
        body: "Watch the VPD walkthrough before your call.",
        hasVideo: true,
      },
      {
        title: "Jobs tracker",
        body: "Track applications and interview-stage roles.",
        href: "/uniboard/jobs",
        hrefLabel: "Open Jobs tracker",
      },
    ],
    nextActionLabel: "Book Interviews & VPD call",
    showBookingCta: true,
  },
];
