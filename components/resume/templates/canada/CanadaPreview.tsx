import React from "react";
import { ResumeData } from "../../../../types";
import { SECTIONS, isCustomSection } from "../../config/constants";
import HtmlDisplay from "../../shared/HtmlDisplay";
import ScaledA4PreviewShell from "../../shared/ScaledA4PreviewShell";
import { parseDate as formatDateMonthYear } from "../../shared/dateUtils";
import { deduplicateSectionOrder } from "../../shared/sectionOrderUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";

interface CanadaPreviewProps {
  data: ResumeData;
  previewScale?: number;
  isModal?: boolean;
}

const CanadaPreview: React.FC<CanadaPreviewProps> = ({ data, previewScale = 1, isModal = false }) => {
  const profile = data.profile || {};
  const jobTitle = profile.title || "";

  // Sort sections just like PDF
  const sortedSections = data.sectionOrder || [
    { id: SECTIONS.PROFILE },
    { id: SECTIONS.EXPERIENCE },
    { id: SECTIONS.EDUCATION },
    { id: SECTIONS.SKILLS },
    { id: SECTIONS.PROJECTS },
    { id: SECTIONS.CERTIFICATIONS },
  ];

  const sectionTitleClass = "text-[15px] font-medium text-[#111111] uppercase tracking-[0.5px]";
  const sectionTitleWrapClass = "text-center mb-[2px]";
  const dividerClass = "h-px bg-black mt-[2px] mb-[8px]";
  const bodyTextClass = "text-[13px] text-[#111111] leading-[1.4] text-justify";
  const titleMutedClass = "text-[16px] font-normal text-[#666666]";
  const subtitleClass = "text-[14.5px] text-[#111111]";

  const generateContactRow = () => {
    const contactPieces: React.ReactNode[] = [];

    if (profile.email) {
      contactPieces.push(
        <a key="email" href={`mailto:${profile.email}`} className="hover:underline text-gray-900 mx-1">
          {profile.email}
        </a>
      );
    }

    if (profile.linkedin) {
      contactPieces.push(
        <a
          key="linkedin"
          href={getLinkedinUrl(profile.linkedin)}
          className="hover:underline text-gray-900 mx-1"
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
          className="hover:underline text-gray-900 mx-1"
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
          className="hover:underline text-gray-900 mx-1"
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
        <span key="location" className="text-gray-900 mx-1">
          {loc}
        </span>
      );
    }

    if (contactPieces.length === 0 && !profile.phone) return null;

    if (profile.phone) {
      contactPieces.unshift(
        <span key="phone" className="text-gray-900 mx-1">
          {profile.phone}
        </span>
      );
    }

    return (
      <div className="flex flex-wrap justify-center items-center text-xs text-[#111111] leading-[1.2] mt-[1px] mb-[2px] relative z-10">
        {contactPieces.map((piece, i) => (
          <React.Fragment key={i}>
            {piece}
            {i < contactPieces.length - 1 && <span className="mx-1 text-gray-900 select-none">•</span>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const Experiences = ({ experiences }: { experiences: ResumeData["experience"] }) => {
    const visibleExperiences = (experiences || []).filter(exp => !exp.hidden);
    if (!visibleExperiences.length) return null;

    return (
      <div className="mb-[12px]">
        <div className={sectionTitleWrapClass}>
          <h2 className={sectionTitleClass}>Experience</h2>
        </div>
        <div className={dividerClass} />
        {visibleExperiences.map((exp, idx) => (
          <div key={idx} className="mb-[11px]">
            <div className="flex justify-between items-start w-full">
              <span className={`${titleMutedClass} flex-1`}>{exp.company}</span>
              <span className={`${subtitleClass} text-right shrink-0 ml-[6px]`}>{exp.location || ""}</span>
            </div>
            <div className="flex justify-between items-start w-full">
              <span className={subtitleClass}>{exp.role}</span>
              <span className={`${subtitleClass} text-right shrink-0 ml-[6px]`}>
                {formatDateMonthYear(exp.startDate)} — {exp.current ? "Present" : formatDateMonthYear(exp.endDate)}
              </span>
            </div>
            {exp.description && (
              <div className="mt-[2px]">
                <HtmlDisplay content={exp.description} className={bodyTextClass} variant="pdfTight" />
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
      <div className="mb-[12px]">
        <div className={sectionTitleWrapClass}>
          <h2 className={sectionTitleClass}>Education</h2>
        </div>
        <div className={dividerClass} />
        {visibleEducations.map((edu, idx) => (
          <div key={idx} className="mb-[11px]">
            <div className="flex justify-between items-start w-full">
              <span className={`${titleMutedClass} flex-1`}>{edu.school}</span>
              <span className={`${subtitleClass} text-right shrink-0 ml-[6px]`}>{edu.location || ""}</span>
            </div>
            <div className="flex justify-between items-start w-full">
              <span className={subtitleClass}>{edu.degree}</span>
              <span className={`${subtitleClass} text-right shrink-0 ml-[6px]`}>
                {formatDateMonthYear(edu.startDate)} — {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
              </span>
            </div>
            {edu.description && (
              <div className="mt-[2px]">
                <HtmlDisplay content={edu.description} className="text-[12px] text-[#111111] leading-[1.4]" variant="pdfTight" />
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
      <div className="mb-[12px]">
        <div className={sectionTitleWrapClass}>
          <h2 className={sectionTitleClass}>Projects</h2>
        </div>
        <div className={dividerClass} />
        {visibleProjects.map((project, idx) => (
          <div key={idx} className="mb-[11px]">
            <div className={titleMutedClass}>
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
              <div className="mt-[2px]">
                <HtmlDisplay content={project.description} className={bodyTextClass} variant="pdfTight" />
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
      <div className="mb-[12px]">
        <div className={sectionTitleWrapClass}>
          <h2 className={sectionTitleClass}>Certifications</h2>
        </div>
        <div className={dividerClass} />
        {visibleCertifications.map((cert, idx) => (
          <div key={idx} className="mb-[8px]">
            <div className="flex justify-between items-start w-full">
              <div className={titleMutedClass}>
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
                  cert.title
                )}
              </div>
              <span className={`${subtitleClass} text-right shrink-0 ml-[6px]`}>{cert.date ? formatDateMonthYear(cert.date) : ""}</span>
            </div>
            <div className={subtitleClass}>{cert.issuer}</div>
            {cert.description && (
              <div className="mt-[2px]">
                <HtmlDisplay content={cert.description} className={bodyTextClass} variant="pdfTight" />
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

    const skillItems = visibleSkills.map(s => s.name);

    return (
      <div className="mb-[12px]">
        <div className={sectionTitleWrapClass}>
          <h2 className={sectionTitleClass}>Skills</h2>
        </div>
        <div className={dividerClass} />
        <div className={bodyTextClass}>{skillItems.join(" - ")}</div>
      </div>
    );
  };

  const SectionRenderer = ({ resume, type }: { resume: ResumeData; type: string }) => {
    if (isCustomSection(type)) {
      const customSection = resume.customSections?.find(s => s.id === type);
      if (!customSection || !customSection.items || !customSection.items.some(item => !item.hidden)) return null;

      const visibleItems = customSection.items.filter(d => !d.hidden);

      return (
        <div className="mb-[12px]">
          {visibleItems.map((item, i) => (
            <div key={i} className="mb-[11px]" style={{ breakInside: i === 0 ? "avoid" : "auto" }}>
              {i === 0 && (
                <>
                  <div className={sectionTitleWrapClass}>
                    <h2 className={sectionTitleClass}>{customSection.title || "Custom Section"}</h2>
                  </div>
                  <div className={dividerClass} />
                </>
              )}
              <div className="flex justify-between items-start w-full">
                {item.title && <span className={`${titleMutedClass} flex-1`}>{item.title}</span>}
                {item.location && <span className={`${subtitleClass} text-right shrink-0 ml-[6px]`}>{item.location}</span>}
              </div>
              <div className="flex justify-between items-start w-full">
                {item.subtitle && <span className={subtitleClass}>{item.subtitle}</span>}
                {item.startDate && (
                  <span className={`${subtitleClass} text-right shrink-0 ml-[6px]`}>
                    {formatDateMonthYear(item.startDate)} — {item.current ? "Present" : formatDateMonthYear(item.endDate)}
                  </span>
                )}
              </div>
              {item.description && (
                <div className="mt-[2px]">
                  <HtmlDisplay content={item.description} className={bodyTextClass} variant="pdfTight" />
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    switch (type) {
      case SECTIONS.PROFILE:
        return resume.profile?.summary ? (
          <div className="mb-[12px]">
            <div className={sectionTitleWrapClass}>
              <h2 className={sectionTitleClass}>Professional Summary</h2>
            </div>
            <div className={dividerClass} />
            <div className="mt-[2px]">
              <HtmlDisplay content={resume.profile.summary} className={bodyTextClass} variant="pdfTight" />
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
      outerClassName="bg-white text-gray-900 font-sans"
      nonModalOuterClassName="shadow-2xl"
      innerClassName="flex-1"
      scaledInnerStyle={{ padding: "40px" }}
      modalPadding="40px"
    >
      <div className="text-center mb-4 relative z-10">
        <h1 className="text-2xl font-semibold text-gray-900 uppercase tracking-tight m-0 leading-tight">
          {profile.fullName || "YOUR NAME"}
        </h1>
        {jobTitle && <p className="text-[14.5px] text-gray-600 m-0 mt-0.5">{jobTitle}</p>}
        {generateContactRow()}
      </div>

      <div className="flex flex-col relative z-10">
        {deduplicateSectionOrder(sortedSections)
          .filter(s => !s.hidden)
          .map(section => (
            <SectionRenderer key={section.id} resume={data} type={section.id} />
          ))}
      </div>
    </ScaledA4PreviewShell>
  );
};

export default CanadaPreview;
