export type ProfileEducation = {
  institution: string;
  course: string;
  startDate: string;
  endDate: string;
  courseWork: string;
  location: string;
};

export type ProfileExperience = {
  organisation: string;
  role: string;
  startDate: string;
  endDate: string;
  descriptions: string[];
  location: string;
};

export type ProfileProject = {
  title: string;
  descriptions: string[];
  url?: string;
};

export type ProfilePictureSources = {
  unimad?: string | null;
  google?: string | null;
  linkedin?: string | null;
};

export type OnboardingData = {
  preferred_name?: string | null;
  legal_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  course?: string | null;
  uni?: string | null;
  role?: string | null;
  graduation_year?: number | null;
  goal?: string | null;
  city?: string | null;
  country?: string | null;
  skills?: unknown[] | null;
  educations?: unknown[] | null;
  experiences?: unknown[] | null;
  projects?: unknown[] | null;
  desired_roles?: unknown[] | null;
  onboarded_at?: string | null;
};

export type LinkedInStoredData = {
  profile_url?: string | null;
  display_name?: string | null;
  headline?: string | null;
  about?: string | null;
  experience?: unknown[] | null;
  skills?: unknown[] | null;
  profile_picture_url?: string | null;
  cover_picture_url?: string | null;
  analyzed_at?: string | null;
  overall_score?: number | null;
};

export type ProfileData = {
  user_id?: number;
  name?: string | null;
  profilePictureUrl?: string | null;
  profilePictureSources?: ProfilePictureSources;
  email?: string | null;
  city?: string | null;
  country?: string | null;
  role?: string[] | null;
  linkedin_url?: string | null;
  headline?: string | null;
  phone_number?: string | null;
  portfolio_url?: string | null;
  github_url?: string | null;
  experiences?: ProfileExperience[] | null;
  educations?: ProfileEducation[] | null;
  skills?: string[] | null;
  projects?: ProfileProject[] | null;
  has_google?: boolean;
  has_linkedin?: boolean;
  onboarding_data?: OnboardingData | null;
  linkedin_stored_data?: LinkedInStoredData | null;
};

export type MediaItem = {
  url: string;
  blob_name: string;
  id?: number;
};

export type BillingHistoryRow = {
  start_date: string;
  end_date: string;
  plan: string;
  amount: number;
};

export type CurrentSubscription = {
  status?: string | null;
  plan?: string | null;
  plan_id?: string | null;
  unicoach_remaining_payment_amount?: number | null;
  amount?: number | null;
  next_billing_date?: string | null;
  ending_at?: string | null;
  ended_at?: string | null;
  last_action?: string | null;
  payment_verification_expired?: boolean;
};

export type SubscriptionData = {
  current_subscription?: CurrentSubscription | null;
  billing_history?: BillingHistoryRow[];
};
