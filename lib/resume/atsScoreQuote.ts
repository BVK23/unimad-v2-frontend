import { ATS_COMPLETE_THRESHOLD } from './atsConstants';

/** Short contextual copy shown under the ATS progress bar. */
export function getAtsScoreQuote(score: number): string {
  if (score >= 80) {
    return 'Strong resume. Fine-tune wording and keywords to stand out in competitive applicant pools.';
  }
  if (score >= ATS_COMPLETE_THRESHOLD) {
    return 'You are close. Sharpen your summary and experience bullets to clear more ATS filters.';
  }
  if (score >= 40) {
    return 'Recruiters may pass on this draft. Add depth to experience, skills, and education first.';
  }
  return 'Foundational gaps remain. Build out core sections before optimizing for specific roles.';
}
