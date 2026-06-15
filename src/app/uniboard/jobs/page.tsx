import JobsPageClient from "./JobsPageClient";

export const metadata = {
  title: "Jobs",
  description: "Job discovery and applications",
};

export default async function JobsPage() {
  return <JobsPageClient />;
}
