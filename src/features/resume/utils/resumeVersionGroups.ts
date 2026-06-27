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

function getVersionSuffixNumber(title: string, rootTitle: string): number | null {
  if (title === rootTitle) {
    return 0;
  }

  const match = title.match(VERSION_SUFFIX_PATTERN);
  if (!match || match[1] !== rootTitle) {
    return null;
  }

  return Number.parseInt(match[2], 10);
}

export function buildResumeVersionMetadata(resumes: Pick<ResumeData, "id" | "title">[]): Map<string, ResumeVersionMetadata> {
  const families = new Map<string, Pick<ResumeData, "id" | "title">[]>();

  for (const resume of resumes) {
    const rootTitle = getVersionRootTitle(resume.title);
    const members = families.get(rootTitle) ?? [];
    members.push(resume);
    families.set(rootTitle, members);
  }

  const metadata = new Map<string, ResumeVersionMetadata>();

  for (const [rootTitle, members] of families) {
    const familySize = members.length;
    let rootCardId = members[0]?.id ?? "";

    if (familySize > 1) {
      const exactRoot = members.find(member => member.title === rootTitle);
      if (exactRoot) {
        rootCardId = exactRoot.id;
      } else {
        let lowestSuffixMember = members[0];
        let lowestSuffix = Number.POSITIVE_INFINITY;

        for (const member of members) {
          const suffix = getVersionSuffixNumber(member.title, rootTitle);
          if (suffix !== null && suffix < lowestSuffix) {
            lowestSuffix = suffix;
            lowestSuffixMember = member;
          }
        }

        rootCardId = lowestSuffixMember.id;
      }
    }

    for (const member of members) {
      const isRootCard = member.id === rootCardId;
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
