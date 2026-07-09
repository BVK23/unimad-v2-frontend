import type { ResumeData } from "@/types";

export type ResumeVersionMetadata = {
  rootTitle: string;
  familySize: number;
  isRootCard: boolean;
  versionBadgeLabel: string | null;
};

const VERSION_SUFFIX_PATTERN = /^(.+) \((\d+)\)$/;

export function getVersionRootTitle(title: string): string {
  const match = title.match(VERSION_SUFFIX_PATTERN);
  return match ? match[1] : title;
}

type ResumeVersionInput = Pick<ResumeData, "id" | "title" | "duplicatedFrom">;

function findVersionRootId(resume: ResumeVersionInput, byId: Map<string, ResumeVersionInput>): string {
  let current = resume;
  const seen = new Set<string>();

  while (current.duplicatedFrom && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = byId.get(current.duplicatedFrom);
    if (!parent) {
      break;
    }
    current = parent;
  }

  return current.id;
}

export function buildResumeVersionMetadata(resumes: ResumeVersionInput[]): Map<string, ResumeVersionMetadata> {
  const byId = new Map(resumes.map(resume => [resume.id, resume]));
  const families = new Map<string, ResumeVersionInput[]>();

  for (const resume of resumes) {
    const rootId = findVersionRootId(resume, byId);
    const members = families.get(rootId) ?? [];
    members.push(resume);
    families.set(rootId, members);
  }

  const metadata = new Map<string, ResumeVersionMetadata>();

  for (const [rootId, members] of families) {
    const familySize = members.length;
    const rootResume = byId.get(rootId);
    const rootTitle = rootResume?.title ?? members[0]?.title ?? "";

    for (const member of members) {
      const isRootCard = member.id === rootId;
      metadata.set(member.id, {
        rootTitle,
        familySize,
        isRootCard,
        versionBadgeLabel: familySize > 1 && isRootCard ? `${familySize} versions` : null,
      });
    }
  }

  return metadata;
}
