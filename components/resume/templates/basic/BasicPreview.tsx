import React from "react";
import { htmlToPlainText } from "@/utils/html-to-text";
import { ResumeData } from "../../../../types";
import { SECTIONS, isCustomSection, getTemplateConfig } from "../../config/constants";
import HtmlDisplay from "../../shared/HtmlDisplay";
import ScaledA4PreviewShell from "../../shared/ScaledA4PreviewShell";
import { parseDate as formatDateMonthYear } from "../../shared/dateUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";

interface BasicPreviewProps {
  data: ResumeData;
  previewScale?: number;
  isModal?: boolean;
}

const BasicPreview: React.FC<BasicPreviewProps> = ({ data, previewScale = 1, isModal = false }) => {
  const profile = data.profile || {};
  const fontStack = {
    fontFamily: `${getTemplateConfig("basic").pdf.fontFamily}, ui-sans-serif, system-ui, sans-serif`,
  } as const;

  const sortedSections = data.sectionOrder || [
    { id: SECTIONS.PROFILE },
    { id: SECTIONS.EXPERIENCE },
    { id: SECTIONS.EDUCATION },
    { id: SECTIONS.SKILLS },
    { id: SECTIONS.PROJECTS },
    { id: SECTIONS.CERTIFICATIONS },
  ];

  const generateContactRow = () => {
    const contactPieces: React.ReactNode[] = [];

    if (profile.email) {
      contactPieces.push(
        <span key="email" className="text-[#373737]">
          {profile.email}
        </span>
      );
    }

    if (profile.phone) {
      contactPieces.push(
        <span key="phone" className="text-[#373737]">
          {profile.phone}
        </span>
      );
    }

    if (profile.linkedin) {
      contactPieces.push(
        <a
          key="linkedin"
          href={getLinkedinUrl(profile.linkedin)}
          className="text-[#373737] hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
      );
    }

    if (profile.portfolio) {
      contactPieces.push(
        <a
          key="portfolio"
          href={getPortfolioUrl(profile.portfolio)}
          className="text-[#373737] hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Portfolio
        </a>
      );
    }

    if (profile.github) {
      contactPieces.push(
        <a
          key="github"
          href={getGithubUrl(profile.github)}
          className="text-[#373737] hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      );
    }

    const loc = [profile.city, profile.country].filter(Boolean).join(", ");
    if (loc) {
      contactPieces.push(
        <span key="location" className="text-[#373737]">
          {loc}
        </span>
      );
    }

    if (contactPieces.length === 0) return null;

    return (
      <div className="flex flex-wrap justify-center items-center text-[9pt] text-[#373737] leading-tight gap-[6px] relative z-10">
        {contactPieces.map((piece, i) => (
          <React.Fragment key={i}>
            {piece}
            {i < contactPieces.length - 1 && <span className="text-[12pt] text-[#373737] select-none translate-y-[-1px]">|</span>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const SectionHeading = ({ title }: { title: string }) => (
    <div className="flex flex-col gap-[2.4pt] w-full shrink-0 mb-[3pt]">
      <h2 className="text-[12pt] font-semibold text-[#373737] leading-none m-0">{title}</h2>
      <div className="w-full h-px bg-[#373737]" />
    </div>
  );

  const Experiences = ({ experiences }: { experiences: ResumeData["experience"] }) => {
    const visibleExperiences = (experiences || []).filter(exp => !exp.hidden);
    if (!visibleExperiences.length) return null;

    return (
      <div className="flex flex-col w-full gap-[9pt]">
        {visibleExperiences.map((exp, idx) => (
          <div key={idx} className="flex flex-col gap-[3.4px] text-[#373737]">
            {idx === 0 && <SectionHeading title="Work Experience" />}
            <div className="flex flex-col gap-[2px] w-full">
              <div className="flex justify-between items-start w-full text-[9pt] font-semibold">
                <span>{exp.role}</span>
                <span className="font-normal text-right shrink-0 ml-2">
                  {formatDateMonthYear(exp.startDate)} — {exp.current ? "Present" : formatDateMonthYear(exp.endDate)}
                </span>
              </div>
              <div className="flex justify-between items-start w-full text-[9pt] font-semibold">
                <span>{exp.company}</span>
                <span className="font-normal text-right shrink-0 ml-2">{exp.location || ""}</span>
              </div>
            </div>
            {exp.description && (
              <div className="text-[8.80pt] mt-[2px] leading-[1.4]">
                <HtmlDisplay content={exp.description} variant="pdfTight" />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const Educations = ({ educations }: { educations: ResumeData["education"] }) => {
    const visibleEducations = (educations || []).filter(e => !e.hidden);
    if (!visibleEducations.length) return null;

    return (
      <div className="flex flex-col w-full gap-[9pt]">
        {visibleEducations.map((edu, idx) => (
          <div key={idx} className="flex flex-col gap-[3.4px] text-[#373737]">
            {idx === 0 && <SectionHeading title="Education" />}
            <div className="flex flex-col gap-[2px] w-full">
              <div className="flex justify-between items-start w-full text-[9pt] font-semibold">
                <span>{edu.degree}</span>
                <span className="font-normal text-right shrink-0 ml-2">
                  {formatDateMonthYear(edu.startDate)} — {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
                </span>
              </div>
              <div className="flex justify-between items-start w-full text-[9pt] font-semibold">
                <span>{edu.school}</span>
                <span className="font-normal text-right shrink-0 ml-2">{edu.location || ""}</span>
              </div>
            </div>
            {edu.description && (
              <div className="text-[8.8pt] mt-[2px] leading-[1.4]">
                <HtmlDisplay content={edu.description} variant="pdfTight" />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const Projects = ({ projects }: { projects: ResumeData["projects"] }) => {
    const visibleProjects = (projects || []).filter(p => !p.hidden);
    if (!visibleProjects.length) return null;

    return (
      <div className="flex flex-col w-full gap-[9pt]">
        {visibleProjects.map((project, idx) => (
          <div key={idx} className="flex flex-col gap-[3.4px] text-[#373737]">
            {idx === 0 && <SectionHeading title="Projects" />}
            <div className="text-[9pt] font-semibold">
              {project.url ? (
                <a
                  href={project.url.startsWith("http") ? project.url : `https://${project.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {project.title}
                </a>
              ) : (
                project.title
              )}
            </div>
            {project.description && (
              <div className="text-[8.8pt] mt-[2px] leading-[1.4]">
                <HtmlDisplay content={project.description} variant="pdfTight" />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const Certifications = ({ certifications }: { certifications: ResumeData["certifications"] }) => {
    const visibleCertifications = (certifications || []).filter(c => !c.hidden);
    if (!visibleCertifications.length) return null;

    return (
      <div className="flex flex-col w-full">
        {visibleCertifications.map((cert, idx) => (
          <div key={idx} className="flex flex-col gap-[3.4px] text-[#373737] mb-[5pt]">
            {idx === 0 && <SectionHeading title="Certifications" />}
            <div className="flex justify-between items-center w-full text-[9pt] font-semibold">
              {cert.credentialUrl ? (
                <a
                  href={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-[#373737]"
                >
                  {cert.title}
                </a>
              ) : (
                <span>{cert.title}</span>
              )}
              <span className="text-[8pt] text-[#666666] font-normal shrink-0 ml-2">
                {cert.issuer}
                {cert.issuer && cert.date ? " - " : ""}
                {cert.date ? formatDateMonthYear(cert.date) : ""}
              </span>
            </div>
            {cert.description && (
              <div className="text-[8.8pt] mt-[2px] leading-[1.4]">
                <HtmlDisplay content={cert.description} variant="pdfTight" />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const Skills = ({ skills }: { skills: ResumeData["skills"] }) => {
    const visibleSkills = (skills || []).filter(s => !s.hidden && s.name);
    if (!visibleSkills.length) return null;

    const groupedSkills = visibleSkills.reduce(
      (acc, skill) => {
        const cat = skill.category?.trim() || "Other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(skill.name);
        return acc;
      },
      {} as Record<string, string[]>
    );

    return (
      <div className="flex flex-col w-full">
        {Object.entries(groupedSkills).map(([category, items], idx) => (
          <div key={idx} className="flex flex-col w-full">
            {idx === 0 && <SectionHeading title="Skills" />}
            <div className="flex flex-row items-start w-[98%] gap-[3pt] text-[#373737]">
              <span className="text-[8.8pt] font-bold leading-tight ">
                {category} : <span className="font-normal">{items.join(", ")}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const SectionRenderer = ({ resume, type }: { resume: ResumeData; type: string }) => {
    if (isCustomSection(type)) {
      const customSection = resume.customSections?.find(s => s.id === type);
      if (!customSection || !customSection.items || !customSection.items.some(item => !item.hidden)) return null;

      return (
        <div className="flex flex-col w-full">
          {customSection.items
            .filter(d => !d.hidden)
            .map((item, i) => (
              <div key={i} className="flex flex-col gap-[2pt] text-[#373737] mb-[4pt]">
                {i === 0 && <SectionHeading title={customSection.title || "Custom Section"} />}
                <div className="flex flex-col gap-[2px] w-full">
                  <div className="flex justify-between items-start w-full text-[9pt] font-semibold">
                    {item.title && <span>{item.title}</span>}
                    {item.startDate && (
                      <span className="font-normal text-right shrink-0 ml-2">
                        {formatDateMonthYear(item.startDate)} — {item.current ? "Present" : formatDateMonthYear(item.endDate)}
                      </span>
                    )}
                  </div>
                  {(item.subtitle || item.location) && (
                    <div className="flex justify-between items-start w-full text-[9pt] font-semibold">
                      {item.subtitle && <span>{item.subtitle}</span>}
                      {item.location && <span className="font-normal text-right shrink-0 ml-2">{item.location}</span>}
                    </div>
                  )}
                </div>
                {item.description && (
                  <div className="text-[9pt] mt-[2px] leading-[1.4]">
                    <HtmlDisplay content={item.description} variant="pdfTight" />
                  </div>
                )}
              </div>
            ))}
        </div>
      );
    }

    switch (type) {
      case SECTIONS.PROFILE: {
        const summary = resume.profile?.summary;
        const hasSummary = Boolean(summary && htmlToPlainText(summary).trim());
        return hasSummary ? (
          <div className="flex flex-col w-full">
            <SectionHeading title="Professional Summary" />
            <div className="text-[#373737]">
              <div className="text-[9pt] leading-[1.4]">
                <HtmlDisplay content={resume.profile.summary} variant="pdfTight" />
              </div>
            </div>
          </div>
        ) : null;
      }
      case SECTIONS.SKILLS:
        return <Skills skills={resume.skills} />;
      case SECTIONS.EXPERIENCE:
        return <Experiences experiences={resume.experience} />;
      case SECTIONS.EDUCATION:
        return <Educations educations={resume.education} />;
      case SECTIONS.CERTIFICATIONS:
        return <Certifications certifications={resume.certifications} />;
      case SECTIONS.PROJECTS:
        return <Projects projects={resume.projects} />;
      default:
        return null;
    }
  };

  return (
    <ScaledA4PreviewShell
      previewScale={previewScale}
      isModal={isModal}
      outerClassName="bg-white text-[#373737]"
      nonModalOuterClassName="shadow-2xl"
      innerClassName="flex-1"
      scaledInnerStyle={{ padding: "40px", ...fontStack }}
      modalInnerStyle={fontStack}
    >
      {profile.fullName && (
        <div className="w-full flex justify-center items-center flex-col pb-[7pt] text-center gap-[3pt] relative z-10">
          <h1 className="text-[21pt] font-bold mb-[6pt] leading-tight m-0 text-[#373737]">{profile.fullName || "YOUR NAME"}</h1>
          {generateContactRow()}
        </div>
      )}

      <div className="w-full mx-auto mt-[2px] flex flex-col gap-[11pt] relative z-10">
        {sortedSections
          .filter(s => !s.hidden)
          .map(section => (
            <SectionRenderer key={section.id} resume={data} type={section.id} />
          ))}
      </div>
    </ScaledA4PreviewShell>
  );
};

export default BasicPreview;
