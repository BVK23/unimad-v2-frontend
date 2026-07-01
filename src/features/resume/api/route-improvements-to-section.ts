import type { AtsSectionKey } from "./ats-types";

const ROUTING_RULES: { keys: AtsSectionKey[]; patterns: RegExp[] }[] = [
  {
    keys: ["profile"],
    patterns: [/professional summary/i, /\bsummary\b/i, /\babout\b/i, /\bheadline\b/i, /\bprofile\b/i],
  },
  {
    keys: ["experience"],
    patterns: [/\bexperience\b/i, /\bbullet/i, /\bwork history\b/i, /\brole\b/i, /\bjob\b/i, /\bemployment\b/i],
  },
  {
    keys: ["skills"],
    patterns: [/\bskills?\b/i, /\btools?\b/i, /\btechnologies\b/i, /\btechnical\b/i],
  },
  {
    keys: ["education"],
    patterns: [/\beducation\b/i, /\bdegree\b/i, /\buniversity\b/i, /\bcoursework\b/i, /\binstitution\b/i],
  },
  {
    keys: ["projects"],
    patterns: [/\bprojects?\b/i, /\bportfolio link\b/i, /\bgithub\b/i],
  },
  {
    keys: ["certifications"],
    patterns: [/\bcertifications?\b/i, /\bcertificate\b/i, /\blicen[cs]e\b/i],
  },
  {
    keys: ["header"],
    patterns: [/\bheader\b/i, /\bphone\b/i, /\bemail\b/i, /\bcontact\b/i, /\blinkedin\b/i],
  },
  {
    keys: ["formatting"],
    patterns: [/\bformatting\b/i, /\blength\b/i, /\bpage\b/i, /\bstructure\b/i, /\bats.?friendly\b/i],
  },
];

export type RoutedImprovements = Partial<Record<AtsSectionKey, string[]>>;

const matchSection = (text: string): AtsSectionKey | null => {
  for (const rule of ROUTING_RULES) {
    if (rule.patterns.some(pattern => pattern.test(text))) {
      return rule.keys[0];
    }
  }
  return null;
};

/** Heuristic routing of flat improvement strings to ATS section keys. */
export const routeImprovementsToSection = (improvements: string[], weakSectionKeys: AtsSectionKey[]): RoutedImprovements => {
  const routed: RoutedImprovements = {};
  const unmatched: string[] = [];

  for (const item of improvements) {
    const key = matchSection(item);
    if (key) {
      routed[key] = [...(routed[key] ?? []), item];
    } else {
      unmatched.push(item);
    }
  }

  if (unmatched.length === 0 || weakSectionKeys.length === 0) {
    return routed;
  }

  let index = 0;
  for (const item of unmatched) {
    const target = weakSectionKeys[index % weakSectionKeys.length];
    routed[target] = [...(routed[target] ?? []), item];
    index += 1;
  }

  return routed;
};

export const collectOrphanImprovements = (routed: RoutedImprovements, orphanKeys: AtsSectionKey[]): string[] => {
  const items: string[] = [];
  for (const key of orphanKeys) {
    items.push(...(routed[key] ?? []));
  }
  return items;
};

export const getRoutedImprovementsForSection = (routed: RoutedImprovements, sectionKey: AtsSectionKey): string[] =>
  routed[sectionKey] ?? [];
