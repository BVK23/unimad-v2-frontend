export type ApplicationStatus = "draft" | "applied" | "interviewing" | "offer" | "rejected";

export interface Job {
  id: string;
  role: string;
  company: string;
  logo: string; // URL or placeholder initials
  location: string;
  postedDate: string;
  matchScore: number;
  isRecommended?: boolean;
  isSponsoring?: boolean;
  salaryRange?: string;
  description: string; // Short summary
  requirements?: string[];
  applicationStatus?: ApplicationStatus;
  appliedDate?: string;
  isSaved?: boolean;
  applyUrl?: string;
}

export interface InterviewSession {
  id: string;
  jobRole: string;
  company: string;
  date: string;
  duration: string;
  score: number;
  status: "completed" | "in-progress";
}

export type ContentGeneratorType = "cover-letter" | "cold-email" | "referral" | "vpd" | "resume" | "linkedin-post";

export interface GeneratorContext {
  type: ContentGeneratorType;
  jobId?: string;
  company?: string;
  role?: string;
  description?: string;
  recipientName?: string; // For cold emails
  /** Existing asset id when opening studio (cover letter, cold email, etc.). */
  assetId?: string;
  fromInterviewVpd?: boolean;
  /** Opened from Prepare Application modal — show Save & return bar. */
  fromPrepareApplication?: boolean;
  /** Where Save & return should reopen Prepare Application (jobs discovery vs tracker). */
  navigate?: "jobs" | "tracker";
  /** Auto-open Unibot improve chips after asset hydrates (Prepare → Studio). */
  openImproveMode?: boolean;
}

// Mock Data for Discovery
export const MOCK_JOBS: Job[] = [
  {
    id: "1",
    role: "Senior Product Designer",
    company: "Airbnb",
    logo: "https://logo.clearbit.com/airbnb.com",
    location: "Remote",
    postedDate: "2 days ago",
    matchScore: 98,
    isRecommended: true,
    isSponsoring: true,
    salaryRange: "$140k - $180k",
    description: "Leading design initiatives for the core booking experience.",
    requirements: ["5+ years exp", "Figma", "Prototyping"],
    applicationStatus: "interviewing",
    appliedDate: "2024-01-15",
  },
  {
    id: "2",
    role: "Frontend Engineer",
    company: "Linear",
    logo: "https://logo.clearbit.com/linear.app",
    location: "San Francisco, CA",
    postedDate: "5 hours ago",
    matchScore: 100,
    isRecommended: true,
    salaryRange: "$160k - $210k",
    description: "Building the next generation of issue tracking tools.",
    requirements: ["React", "TypeScript", "WebGL"],
  },
  {
    id: "3",
    role: "Product Manager",
    company: "Notion",
    logo: "https://logo.clearbit.com/notion.so",
    location: "New York, NY",
    postedDate: "1 week ago",
    matchScore: 85,
    isRecommended: false,
    salaryRange: "$130k - $170k",
    description: "Owning the roadmap for collaboration features.",
    applicationStatus: "applied",
    appliedDate: "2024-01-20",
  },
  {
    id: "4",
    role: "UX Researcher",
    company: "Spotify",
    logo: "https://logo.clearbit.com/spotify.com",
    location: "London, UK",
    postedDate: "3 days ago",
    matchScore: 78,
    isRecommended: false,
    isSponsoring: true,
    description: "Understanding how people discover and listen to music.",
  },
  {
    id: "5",
    role: "Full Stack Developer",
    company: "Vercel",
    logo: "https://logo.clearbit.com/vercel.com",
    location: "Remote",
    postedDate: "1 day ago",
    matchScore: 92,
    isRecommended: true,
    salaryRange: "$150k - $190k",
    description: "Improving the developer experience on the Vercel platform.",
  },
];

export const MOCK_INTERVIEWS: InterviewSession[] = [
  {
    id: "1",
    jobRole: "Product Designer",
    company: "Airbnb",
    date: "Jan 15, 2024",
    duration: "25 mins",
    score: 85,
    status: "completed",
  },
  {
    id: "2",
    jobRole: "Frontend Engineer",
    company: "Linear",
    date: "Jan 22, 2024",
    duration: "10 mins",
    score: 0,
    status: "in-progress",
  },
];
