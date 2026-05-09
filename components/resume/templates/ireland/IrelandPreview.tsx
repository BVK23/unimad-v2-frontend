import React from "react";
import { ResumeData } from "../../../../types";
import { SECTIONS, isCustomSection } from "../../config/constants";
import HtmlDisplay from "../../shared/HtmlDisplay";
import ScaledA4PreviewShell from "../../shared/ScaledA4PreviewShell";
import { parseDate as formatDateMonthYear } from "../../shared/dateUtils";
import { deduplicateSectionOrder } from "../../shared/sectionOrderUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";

interface IrelandPreviewProps {
  data: ResumeData;
  previewScale?: number;
  isModal?: boolean;
}

type IrelandCustomSection = ResumeData["customSections"][number];
type IrelandCustomItem = IrelandCustomSection["items"][number];

const IrelandPreview: React.FC<IrelandPreviewProps> = ({ data, previewScale = 1, isModal = false }) => {
  const profile = data.profile || {};

  const sortedSections = data.sectionOrder || [
    { id: SECTIONS.EXPERIENCE },
    { id: SECTIONS.PROJECTS },
    { id: SECTIONS.SKILLS },
    { id: SECTIONS.CERTIFICATIONS },
    { id: SECTIONS.EDUCATION },
  ];

  const generateContactRow = () => {
    const contactPieces: React.ReactNode[] = [];

    if (profile.email) {
      contactPieces.push(
        <span key="email" className="text-[#000000]">
          {profile.email}
        </span>
      );
    }

    if (profile.phone) {
      contactPieces.push(
        <span key="phone" className="text-[#000000]">
          {profile.phone}
        </span>
      );
    }

    if (profile.linkedin) {
      contactPieces.push(
        <a
          key="linkedin"
          href={getLinkedinUrl(profile.linkedin)}
          className="text-[#000000] hover:underline"
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
          className="text-[#000000] hover:underline"
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
          className="text-[#000000] hover:underline"
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
        <span key="location" className="text-[#000000]">
          {loc}
        </span>
      );
    }

    if (contactPieces.length === 0) return null;

    return (
      <div className="flex flex-wrap justify-center items-center text-[11px] text-[#000000] gap-[4px] mb-[20px]">
        {contactPieces.map((piece, i) => (
          <React.Fragment key={i}>
            {piece}
            {i < contactPieces.length - 1 && <span className="text-[#000000] mx-[2px]">|</span>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderSectionHeading = (title: string, isFirstSection: boolean) => (
    <div className="mb-[4px]">
      <div className={`w-full border-b border-[#000000] ${isFirstSection ? "mt-[4px]" : "mt-[12px]"} mb-[12px]`} />
      <h2 className="text-[12px] font-bold text-[#000000] uppercase tracking-[0.2px] font-serif leading-none mb-[4px]">{title}</h2>
    </div>
  );

  const Experiences = ({ experiences, isFirstSection = false }: { experiences: ResumeData["experience"]; isFirstSection?: boolean }) => {
    const visibleExperiences = (experiences || []).filter(exp => !exp.hidden);
    if (visibleExperiences.length === 0) return null;

    return (
      <div className="mb-0">
        <div className="flex flex-col">
          {visibleExperiences.map((exp, idx) => (
            <div key={idx} className="flex flex-col mb-[6px]">
              {idx === 0 && renderSectionHeading("Experience", isFirstSection)}
              <div className="flex justify-between items-start mb-[4px]">
                <div className="flex-1 pr-8">
                  <div className="text-[11px] font-bold text-[#000000] leading-none mb-[2px]">{exp.company}</div>
                  {exp.role && <div className="text-[10px] font-bold text-[#000000] leading-none">{exp.role}</div>}
                </div>
                <div className="min-w-[90px] flex flex-col items-end gap-[4px]">
                  <div className="text-[10px] font-bold text-[#000000] leading-none">
                    {formatDateMonthYear(exp.startDate)} — {exp.current ? "Present" : formatDateMonthYear(exp.endDate)}
                  </div>
                  {exp.location && <div className="text-[10px] font-bold text-[#000000] leading-none">{exp.location}</div>}
                </div>
              </div>
              <HtmlDisplay content={exp.description} className="text-[10px] text-[#000000] leading-[1.4]" variant="pdfTight" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Projects = ({ projects, isFirstSection = false }: { projects: ResumeData["projects"]; isFirstSection?: boolean }) => {
    const visibleProjects = (projects || []).filter(proj => !proj.hidden);
    if (visibleProjects.length === 0) return null;

    return (
      <div className="mb-0">
        <div className="flex flex-col">
          {visibleProjects.map((proj, idx) => (
            <div key={idx} className="flex flex-col mb-[6px]">
              {idx === 0 && renderSectionHeading("Projects", isFirstSection)}
              <div className="text-[11px] font-bold text-[#000000] leading-none mb-[2px]">{proj.title}</div>
              <HtmlDisplay content={proj.description} className="text-[10px] text-[#000000] leading-[1.4]" variant="pdfTight" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Skills = ({ skills, isFirstSection = false }: { skills: ResumeData["skills"]; isFirstSection?: boolean }) => {
    const visibleSkills = (skills || []).filter(skill => !skill.hidden);
    if (visibleSkills.length === 0) return null;

    const groupedSkills = visibleSkills.reduce(
      (acc, skill) => {
        const category = skill.category?.trim() || "Other";
        if (!acc[category]) acc[category] = [];
        acc[category].push(skill.name);
        return acc;
      },
      {} as Record<string, string[]>
    );

    return (
      <div className="mb-0">
        {renderSectionHeading("Skills", isFirstSection)}
        <div>
          {Object.entries(groupedSkills).map(([category, items], idx) => (
            <div key={idx} className="flex flex-row mb-[2px] pl-[12px]">
              <span className="w-[10px] text-[10px] text-[#000000] ml-[-12px]">•</span>
              <span className="text-[10px] text-[#000000]">
                <span className="font-bold">{category}:</span> {items.join(", ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Certifications = ({
    certifications,
    isFirstSection = false,
  }: {
    certifications: ResumeData["certifications"];
    isFirstSection?: boolean;
  }) => {
    const visibleCertifications = (certifications || []).filter(cert => !cert.hidden);
    if (visibleCertifications.length === 0) return null;

    return (
      <div className="mb-0">
        <div className="flex flex-col">
          {visibleCertifications.map((cert, idx) => (
            <div key={idx} className="flex flex-col mb-[6px]">
              {idx === 0 && renderSectionHeading("Certifications", isFirstSection)}
              <div className="flex justify-between items-start mb-[4px]">
                <div className="flex-1 pr-8">
                  {cert.credentialUrl ? (
                    <a
                      href={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-[#000000] leading-none hover:underline"
                    >
                      {cert.title}
                    </a>
                  ) : (
                    <div className="text-[11px] font-bold text-[#000000] leading-none">{cert.title}</div>
                  )}
                </div>
                <div className="min-w-[90px] flex flex-col items-end gap-[4px]">
                  {cert.date && <div className="text-[10px] font-bold text-[#000000] leading-none">{formatDateMonthYear(cert.date)}</div>}
                </div>
              </div>
              <div className="text-[10px] font-normal text-[#000000] leading-none mt-[2px]">{cert.issuer}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Educations = ({ educations, isFirstSection = false }: { educations: ResumeData["education"]; isFirstSection?: boolean }) => {
    const visibleEducations = (educations || []).filter(edu => !edu.hidden);
    if (visibleEducations.length === 0) return null;

    return (
      <div className="mb-0">
        <div className="flex flex-col">
          {visibleEducations.map((edu, idx) => (
            <div key={idx} className="flex flex-col mb-[6px]">
              {idx === 0 && renderSectionHeading("Education", isFirstSection)}
              <div className="flex justify-between items-start mb-[4px]">
                <div className="flex-1 pr-8">
                  <div className="text-[11px] font-bold text-[#000000] leading-none mb-[2px]">{edu.degree}</div>
                  <div className="text-[10px] font-normal text-[#000000] leading-none mb-[2px]">{edu.school}</div>
                </div>
                <div className="min-w-[90px] flex flex-col items-end gap-[4px]">
                  <div className="text-[10px] font-bold text-[#000000] leading-none">
                    {formatDateMonthYear(edu.startDate)} — {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
                  </div>
                  {edu.location && <div className="text-[10px] font-bold text-[#000000] leading-none">{edu.location}</div>}
                </div>
              </div>
              {edu.description && (
                <div className="mt-[4px] w-full">
                  <HtmlDisplay
                    content={edu.description}
                    className="text-[10px] font-normal text-[#000000] leading-[1.4]"
                    variant="pdfTight"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const CustomSectionRenderer = ({
    customSection,
    isFirstSection = false,
  }: {
    customSection: IrelandCustomSection;
    isFirstSection?: boolean;
  }) => {
    const visibleItems = (customSection?.items || []).filter((item: IrelandCustomItem) => !item.hidden);
    if (visibleItems.length === 0) return null;

    return (
      <div className="mb-0">
        <div className="flex flex-col">
          {visibleItems.map((item: IrelandCustomItem, idx: number) => (
            <div key={idx} className="flex flex-col mb-[6px]">
              {idx === 0 && renderSectionHeading(customSection.title || "Custom Section", isFirstSection)}
              <div className="flex justify-between items-start mb-[4px]">
                <div className="flex-1 pr-8">
                  <div className="text-[11px] font-bold text-[#000000] leading-none mb-[2px]">{item.title}</div>
                  {item.subtitle && <div className="text-[10px] font-bold text-[#000000] leading-none">{item.subtitle}</div>}
                </div>
                <div className="min-w-[90px] flex flex-col items-end gap-[4px]">
                  {item.startDate && (
                    <div className="text-[10px] font-bold text-[#000000] leading-none">
                      {formatDateMonthYear(item.startDate)} — {item.endDate ? formatDateMonthYear(item.endDate) : "Present"}
                    </div>
                  )}
                  {item.location && <div className="text-[10px] font-bold text-[#000000] leading-none">{item.location}</div>}
                </div>
              </div>
              <HtmlDisplay content={item.description} className="text-[10px] text-[#000000] leading-[1.4]" variant="pdfTight" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Summary = ({ isFirstSection = false }: { isFirstSection?: boolean }) => {
    if (!profile.summary) return null;
    return (
      <div className="mb-0">
        {renderSectionHeading("Professional Summary", isFirstSection)}
        <HtmlDisplay content={profile.summary} className="text-[10px] text-[#000000] leading-[1.4]" variant="pdfTight" />
      </div>
    );
  };

  return (
    <ScaledA4PreviewShell
      previewScale={previewScale}
      isModal={isModal}
      outerClassName="bg-white shadow-2xl"
      innerClassName="font-sans text-[#000000] relative mx-auto flex flex-col"
      scaledInnerStyle={{ padding: "40px" }}
      modalPadding="40px"
    >
      <h1 className="text-center text-[30px] font-bold tracking-[0.4px] mb-[2px] leading-[1.1] text-[#000000] font-serif">
        {profile.fullName || "Your Name"}
      </h1>

      {generateContactRow()}

      <div className="flex-1">
        {deduplicateSectionOrder(sortedSections).map((section, idx) => {
          const sectionId = section.id;
          const isFirstSection = idx === 0;
          if (isCustomSection(sectionId)) {
            const customSectionData = data.customSections?.find(s => s.id === sectionId);
            if (!customSectionData) return null;
            return <CustomSectionRenderer key={sectionId} customSection={customSectionData} isFirstSection={isFirstSection} />;
          }

          switch (sectionId) {
            case SECTIONS.PROFILE:
              return <Summary key={sectionId} isFirstSection={isFirstSection} />;
            case SECTIONS.EXPERIENCE:
              return <Experiences key={sectionId} experiences={data.experience} isFirstSection={isFirstSection} />;
            case SECTIONS.EDUCATION:
              return <Educations key={sectionId} educations={data.education} isFirstSection={isFirstSection} />;
            case SECTIONS.SKILLS:
              return <Skills key={sectionId} skills={data.skills} isFirstSection={isFirstSection} />;
            case SECTIONS.PROJECTS:
              return <Projects key={sectionId} projects={data.projects} isFirstSection={isFirstSection} />;
            case SECTIONS.CERTIFICATIONS:
              return <Certifications key={sectionId} certifications={data.certifications} isFirstSection={isFirstSection} />;
            default:
              return null;
          }
        })}
      </div>
    </ScaledA4PreviewShell>
  );
};

export default IrelandPreview;
