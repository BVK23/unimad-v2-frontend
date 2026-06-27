import React from "react";
import { ResumeData } from "../../../../types";
import { SECTIONS, isCustomSection } from "../../config/constants";
import HtmlDisplay from "../../shared/HtmlDisplay";
import ScaledA4PreviewShell from "../../shared/ScaledA4PreviewShell";
import { parseDate as formatDateMonthYear } from "../../shared/dateUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";

interface AusPreviewProps {
  data: ResumeData;
  previewScale?: number;
  isModal?: boolean;
}

const AusPreview: React.FC<AusPreviewProps> = ({ data, previewScale = 1, isModal = false }) => {
  const profile = data.profile || {};

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
      <div className="flex flex-wrap items-center text-[12px] text-[#373737] gap-[8px]">
        {contactPieces.map((piece, i) => (
          <React.Fragment key={i}>
            {piece}
            {i < contactPieces.length - 1 && <span className="text-[#373737] select-none text-[12px]">|</span>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const SectionHeading = ({ title }: { title: string }) => (
    <div className="flex flex-col gap-[3px] w-full mb-1">
      <h2 className="text-[16px] font-semibold text-[#666666] uppercase tracking-wide">{title}</h2>
    </div>
  );

  const Experiences = ({ experiences }: { experiences: ResumeData["experience"] }) => {
    const visibleExperiences = (experiences || []).filter(exp => !exp.hidden);
    if (!visibleExperiences.length) return null;

    return (
      <div className="flex flex-col w-full gap-[4px]">
        <SectionHeading title="Work Experience" />
        <div className="flex flex-col gap-3">
          {visibleExperiences.map((exp, idx) => (
            <div key={idx} className="flex flex-col gap-[2px] text-[#373737]">
              <div className="flex justify-between items-start w-full text-[13px] font-medium">
                <span>{exp.role}</span>
                <span className="text-[#666666] text-[11px] font-normal text-right shrink-0 ml-2">
                  {formatDateMonthYear(exp.startDate)} - {exp.current ? "Present" : formatDateMonthYear(exp.endDate)}
                </span>
              </div>
              <div className="flex justify-between items-start w-full text-[12px] text-[#346DE0] font-normal">
                <span>{exp.company}</span>
                <span className="text-[#666666] font-semibold text-right shrink-0 ml-2">{exp.location || ""}</span>
              </div>
              {exp.description && (
                <div className="text-[12px] font-normal leading-relaxed mt-[2px] pl-[2px]">
                  <HtmlDisplay content={exp.description} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Educations = ({ educations }: { educations: ResumeData["education"] }) => {
    const visibleEducations = (educations || []).filter(e => !e.hidden);
    if (!visibleEducations.length) return null;

    return (
      <div className="flex flex-col w-full gap-[4px]">
        <SectionHeading title="Education" />
        <div className="flex flex-col gap-2">
          {visibleEducations.map((edu, idx) => (
            <div key={idx} className="flex flex-col gap-[2px] text-[#373737]">
              <div className="flex justify-between items-start w-full text-[13px] font-medium">
                <span>{edu.degree}</span>
                <span className="text-[#666666] text-[11px] font-normal text-right shrink-0 ml-2">
                  {formatDateMonthYear(edu.startDate)} - {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
                </span>
              </div>
              <div className="flex justify-between items-start w-full text-[12px] font-normal">
                <span>{edu.school}</span>
                <span className="text-[#666666] font-semibold text-right shrink-0 ml-2">{edu.location || ""}</span>
              </div>
              {edu.description && (
                <div className="text-[12px] leading-relaxed mt-[2px] pl-[2px]">
                  <HtmlDisplay content={edu.description} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Projects = ({ projects }: { projects: ResumeData["projects"] }) => {
    const visibleProjects = (projects || []).filter(p => !p.hidden);
    if (!visibleProjects.length) return null;

    return (
      <div className="flex flex-col w-full gap-[4px]">
        <SectionHeading title="Projects" />
        <div className="flex flex-col gap-2">
          {visibleProjects.map((project, idx) => (
            <div key={idx} className="flex flex-col gap-[2px] text-[#373737]">
              <div className="text-[12px] font-medium text-[#346DE0]">
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
                <div className="text-[12px] leading-relaxed mt-[2px] pl-[2px]">
                  <HtmlDisplay content={project.description} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Certifications = ({ certifications }: { certifications: ResumeData["certifications"] }) => {
    const visibleCertifications = (certifications || []).filter(c => !c.hidden);
    if (!visibleCertifications.length) return null;

    return (
      <div className="flex flex-col w-full gap-[4px]">
        <SectionHeading title="Certifications" />
        <div className="flex flex-col gap-4">
          {visibleCertifications.map((cert, idx) => (
            <div key={idx} className="flex flex-col gap-[2px] text-[#373737]">
              <div className="flex justify-between items-center w-full text-[12px] font-medium text-[#346DE0]">
                {cert.credentialUrl ? (
                  <a
                    href={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {cert.title}
                  </a>
                ) : (
                  <span className="text-[#373737]">{cert.title}</span>
                )}
                <span className="text-[#666666] text-[11px] font-normal text-right shrink-0 ml-2">
                  {cert.date ? formatDateMonthYear(cert.date) : ""}
                </span>
              </div>
              <div className="flex justify-between items-start w-full text-[12px] font-normal">
                <span>{cert.issuer}</span>
              </div>
              {cert.description && (
                <div className="text-[12px] leading-relaxed mt-[2px] pl-[2px]">
                  <HtmlDisplay content={cert.description} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Skills = ({ skills }: { skills: ResumeData["skills"] }) => {
    const visibleSkills = (skills || []).filter(s => !s.hidden && s.name);
    if (!visibleSkills.length) return null;

    return (
      <div className="flex flex-col w-full gap-[4px]">
        <SectionHeading title="Skills" />
        <div className="flex flex-col gap-1 text-[#373737]">
          <div className="flex flex-row items-start w-[98%] gap-1">
            <span className="text-[12px] font-medium leading-tight text-[#346DE0] flex-shrink-0">Skills : </span>
            <span className="text-[12px] font-normal leading-tight">{visibleSkills.map(s => s.name).join(", ")}</span>
          </div>
        </div>
      </div>
    );
  };

  const SectionRenderer = ({ resume, type }: { resume: ResumeData; type: string }) => {
    if (isCustomSection(type)) {
      const customSection = resume.customSections?.find(s => s.id === type);
      if (!customSection || !customSection.items || !customSection.items.some(item => !item.hidden)) return null;

      const visibleItems = customSection.items.filter(d => !d.hidden);

      return (
        <div className="flex flex-col w-full gap-[4px]">
          <div className="flex flex-col gap-2">
            {visibleItems.map((item, i) => (
              <div key={i} className="flex flex-col gap-[2px] text-[#373737]" style={{ breakInside: i === 0 ? "avoid" : "auto" }}>
                {i === 0 && <SectionHeading title={customSection.title || "Custom Section"} />}
                <div className="flex justify-between items-start w-full text-[13px] font-medium">
                  {item.title && <span>{item.title}</span>}
                  {item.startDate && (
                    <span className="text-[#666666] text-[11px] font-normal text-right shrink-0 ml-2">
                      {formatDateMonthYear(item.startDate)} - {item.current ? "Present" : formatDateMonthYear(item.endDate)}
                    </span>
                  )}
                </div>
                {(item.subtitle || item.location) && (
                  <div className="flex justify-between items-start w-full text-[12px] text-[#346DE0] font-normal">
                    {item.subtitle && <span>{item.subtitle}</span>}
                    {item.location && <span className="text-[#666666] font-semibold text-right shrink-0 ml-2">{item.location}</span>}
                  </div>
                )}
                {item.description && (
                  <div className="text-[12px] leading-relaxed mt-[2px] pl-[2px]">
                    <HtmlDisplay content={item.description} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    switch (type) {
      case SECTIONS.PROFILE:
        return resume.profile?.summary ? (
          <div className="flex flex-col w-full gap-[4px]">
            <SectionHeading title="Professional Summary" />
            <div className="text-[#373737]">
              <div className="text-[12px] leading-relaxed pl-[2px]">
                <HtmlDisplay content={resume.profile.summary} />
              </div>
            </div>
          </div>
        ) : null;
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
      outerClassName="bg-white text-[#373737] font-sans"
      nonModalOuterClassName="shadow-2xl"
      innerClassName="flex-1"
      scaledInnerStyle={{ padding: "53px" }}
      modalPadding="2rem"
    >
      {/* Header - left aligned */}
      {profile.fullName && (
        <div className="w-full flex flex-col justify-start items-start gap-1 pb-2">
          <h1 className="text-[37px] font-semibold text-[#373737] mb-1">{profile.fullName || "YOUR NAME"}</h1>
          {generateContactRow()}
        </div>
      )}

      <div className="w-full mt-2 flex flex-col gap-[16px]">
        {sortedSections
          .filter(s => !s.hidden)
          .map(section => (
            <SectionRenderer key={section.id} resume={data} type={section.id} />
          ))}
      </div>
    </ScaledA4PreviewShell>
  );
};

export default AusPreview;
