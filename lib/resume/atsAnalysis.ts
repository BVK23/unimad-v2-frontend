import type { ResumeData } from "@/types";

export type AtsSectionStatus = "good" | "warning" | "critical";

export interface AtsSectionAnalysis {
  name: string;
  status: AtsSectionStatus;
  feedback: string;
}

export interface AtsAnalysisResult {
  score: number;
  improvements: string[];
  sectionAnalysis: AtsSectionAnalysis[];
}

export function computeAtsAnalysis(resume: ResumeData): AtsAnalysisResult {
  let score = 100;
  const improvements: string[] = [];
  const sectionAnalysis: AtsSectionAnalysis[] = [];

  if (!resume.profile.summary || resume.profile.summary.length < 50) {
    score -= 10;
    improvements.push("Add a comprehensive professional summary");
    sectionAnalysis.push({ name: "Profile", status: "warning", feedback: "Summary is too brief." });
  } else {
    sectionAnalysis.push({ name: "Profile", status: "good", feedback: "Strong summary." });
  }

  if (resume.experience.length === 0) {
    score -= 30;
    improvements.push("Add work experience to showcase history");
    sectionAnalysis.push({ name: "Experience", status: "critical", feedback: "Missing experience." });
  } else {
    const shortDesc = resume.experience.some(e => e.description.length < 20);
    if (shortDesc) {
      score -= 15;
      improvements.push("Expand role descriptions with achievements");
      sectionAnalysis.push({ name: "Experience", status: "warning", feedback: "Descriptions lack detail." });
    } else {
      sectionAnalysis.push({ name: "Experience", status: "good", feedback: "Good role depth." });
    }
  }

  if (resume.skills.length < 4) {
    score -= 20;
    improvements.push("Add more skills to match job descriptions");
    sectionAnalysis.push({ name: "Skills", status: "warning", feedback: "Under 4 skills listed." });
  } else {
    sectionAnalysis.push({ name: "Skills", status: "good", feedback: "Solid skill set." });
  }

  if (resume.education.length === 0) {
    score -= 10;
    improvements.push("Add education details");
    sectionAnalysis.push({ name: "Education", status: "warning", feedback: "Education section is missing." });
  } else {
    sectionAnalysis.push({ name: "Education", status: "good", feedback: "Education included." });
  }

  if (resume.customSections.length > 0) {
    score += 5;
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    improvements,
    sectionAnalysis,
  };
}
