import React from "react";
import { CustomSection, CustomSectionItem, ResumeData } from "../../../../types";
import { isCustomSection, SECTIONS } from "../../config/constants";
import HtmlDisplay from "../../shared/HtmlDisplay";
import ScaledA4PreviewShell from "../../shared/ScaledA4PreviewShell";
import { parseDate as formatDateMonthYear } from "../../shared/dateUtils";
import { deduplicateSectionOrder } from "../../shared/sectionOrderUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";
import { PROFESSIONAL_TOKENS as T, professionalPtToPx } from "./professional-tokens";

const STANDARD_LABELS: Record<string, string> = {
  profile: "Summary",
  experience: "Experiences",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
};

interface ProfessionalPreviewProps {
  data: ResumeData;
  previewScale?: number;
  isModal?: boolean;
}

const ProfessionalPreview: React.FC<ProfessionalPreviewProps> = ({ data, previewScale = 1, isModal = false }) => {
  const { profile, experience, education, skills, projects, certifications, customSections, sectionOrder } = data;

  const formatRange = (start: string | undefined, end: string | undefined, current?: boolean) => {
    const a = formatDateMonthYear(start);
    const b = current ? "Present" : formatDateMonthYear(end);
    return `${a} - ${b}`;
  };

  const SectionHeading = ({ title }: { title: string }) => (
    <div
      className="flex flex-col mb-[12pt]"
      style={{
        gap: `${T.spacing.personalHeadingGap}pt`,
        fontFamily: `${T.fontFamily}, ui-sans-serif, system-ui, sans-serif`,
      }}
    >
      <h2 className="text-[18pt] font-semibold text-[#373737] m-0 leading-tight">{title}</h2>
      <div className="w-full h-px bg-[#373737]" />
    </div>
  );

  const CertificationTitlePv = ({
    title,
    credentialUrl,
    issuer,
    dateStr,
  }: {
    title: string;
    credentialUrl?: string;
    issuer?: string;
    dateStr?: string;
  }) => (
    <div
      className="flex flex-row justify-between items-center text-[11pt] font-semibold text-[#373737]"
      style={{ fontFamily: `${T.fontFamily}, ui-sans-serif, system-ui, sans-serif` }}
    >
      {credentialUrl ? (
        <a
          href={credentialUrl.startsWith("http") ? credentialUrl : `https://${credentialUrl}`}
          className="text-[#373737] no-underline hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {title}
        </a>
      ) : (
        <span>{title}</span>
      )}
      <span className="text-[8pt] font-normal text-[#666666]">
        {issuer || ""}
        {issuer && dateStr ? " - " : ""}
        {dateStr ? formatDateMonthYear(dateStr) : ""}
      </span>
    </div>
  );

  const CustomSectionLeftPv = ({ item }: { item: CustomSectionItem }) => (
    <div className="w-[40%] flex flex-col" style={{ fontFamily: `${T.fontFamily}, ui-sans-serif, system-ui, sans-serif` }}>
      {item.startDate ? (
        <span className="text-[11pt] font-bold text-[#373737] block">
          {formatDateMonthYear(item.startDate)} - {item.current ? "Present" : formatDateMonthYear(item.endDate)}
        </span>
      ) : null}
      {item.title ? <span className="text-[11pt] font-normal text-[#373737] block">{item.title}</span> : null}
      {item.subtitle?.trim() ? <span className="text-[11pt] font-normal text-[#666666] block">{item.subtitle.trim()}</span> : null}
      {item.location ? <span className="text-[11pt] font-extralight text-[#373737] block">{item.location}</span> : null}
    </div>
  );

  const renderStandardCertifications = () => {
    const visible = (certifications || []).filter(c => !c.hidden);
    if (visible.length === 0) return null;
    return (
      <div className="flex flex-col">
        {visible.map(cert => (
          <div key={cert.id} className="flex flex-col gap-[3pt] mb-[5pt]" style={{ fontFamily: `${T.fontFamily}, sans-serif` }}>
            <div className="flex flex-row justify-between items-center text-[9pt] font-semibold mb-[3pt]">
              {cert.credentialUrl ? (
                <a
                  href={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                  className="text-[11pt] font-normal text-[#373737] no-underline hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {cert.title}
                </a>
              ) : (
                <span className="font-semibold text-[#373737]">{cert.title}</span>
              )}
              <span className="text-[11pt] font-normal text-[#373737]">
                {cert.issuer || ""}
                {cert.issuer && cert.date ? " - " : ""}
                {cert.date ? formatDateMonthYear(cert.date) : ""}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCustomBody = (custom: CustomSection) => {
    const isCertSection = custom.title === "Certifications";
    const visible = custom.items.filter(i => !i.hidden);
    if (visible.length === 0) return null;

    if (isCertSection) {
      return (
        <div className="flex flex-col">
          {visible.map(item => (
            <div key={item.id} className="flex flex-col gap-[3pt]">
              <CertificationTitlePv title={item.title || ""} issuer={item.subtitle} dateStr={item.endDate || item.startDate} />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        {visible.map(item => (
          <div key={item.id} className="flex flex-row gap-[3pt] mb-[5pt]">
            <CustomSectionLeftPv item={item} />
            <div className="w-[60%] flex flex-col justify-start">
              {item.description ? (
                <HtmlDisplay content={item.description} className="text-[10pt] text-[#373737] leading-[1.4] [&>p]:mb-[3pt]" />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStandard = (sectionId: string) => {
    switch (sectionId) {
      case SECTIONS.PROFILE: {
        if (!profile.summary?.trim()) return null;
        return (
          <div key="profile" className="w-full flex flex-col text-[#373737]">
            <SectionHeading title={STANDARD_LABELS.profile} />
            <div className="flex flex-col gap-[8pt]">
              <HtmlDisplay content={profile.summary} className="text-[10pt] text-[#373737] leading-[1.4] [&>p]:mb-[3pt]" />
            </div>
          </div>
        );
      }
      case SECTIONS.EXPERIENCE: {
        const visible = experience.filter(e => !e.hidden);
        if (visible.length === 0) return null;
        return (
          <div key="experience" className="w-full flex flex-col">
            <SectionHeading title={STANDARD_LABELS.experience} />
            <div className="flex flex-col gap-[8pt]">
              {visible.map(exp => (
                <div key={exp.id} className="flex flex-row mb-[5pt]">
                  <div className="w-[40%] flex flex-col" style={{ fontFamily: `${T.fontFamily}, sans-serif` }}>
                    <span className="text-[11pt] font-bold text-[#373737]">{formatRange(exp.startDate, exp.endDate, exp.current)}</span>
                    <span className="text-[11pt] font-normal text-[#373737]">{exp.company}</span>
                    {exp.location ? <span className="text-[11pt] font-extralight text-[#373737]">{exp.location}</span> : null}
                  </div>
                  <div className="w-[60%] flex flex-col">
                    <span className="text-[11pt] font-bold text-[#373737]">{exp.role}</span>
                    {exp.description ? (
                      <HtmlDisplay content={exp.description} className="text-[10pt] text-[#373737] leading-[1.4] [&>p]:mb-[3pt]" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case SECTIONS.EDUCATION: {
        const visible = education.filter(e => !e.hidden);
        if (visible.length === 0) return null;
        return (
          <div key="education" className="w-full flex flex-col">
            <SectionHeading title={STANDARD_LABELS.education} />
            <div className="flex flex-col gap-[8pt]">
              {visible.map(edu => (
                <div key={edu.id} className="flex flex-row mb-[5pt]">
                  <div className="w-[40%] flex flex-col" style={{ fontFamily: `${T.fontFamily}, sans-serif` }}>
                    <span className="text-[11pt] font-bold text-[#373737]">{formatRange(edu.startDate, edu.endDate, edu.current)}</span>
                    <span className="text-[11pt] font-extralight text-[#373737]">{edu.school}</span>
                  </div>
                  <div className="w-[60%] flex flex-col">
                    <span className="text-[11pt] font-bold text-[#373737]">{edu.degree}</span>
                    {edu.description ? (
                      <HtmlDisplay content={edu.description} className="text-[10pt] text-[#373737] leading-[1.4] [&>p]:mb-[3pt]" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case SECTIONS.SKILLS: {
        const visible = skills.filter(s => !s.hidden);
        if (visible.length === 0) return null;
        return (
          <div key="skills" className="w-full flex flex-col">
            <SectionHeading title={STANDARD_LABELS.skills} />
            <div className="flex flex-col gap-[8pt]">
              <div className="flex flex-row flex-wrap gap-[3pt]" style={{ fontFamily: `${T.fontFamily}, sans-serif` }}>
                {visible.map(sk => (
                  <div key={sk.id} className="flex flex-row items-center gap-[1.5pt]">
                    <span className="text-[11pt] font-normal text-[#373737]">•</span>
                    <span className="text-[11pt] font-normal text-[#373737]">{sk.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
      case SECTIONS.PROJECTS: {
        const visible = projects.filter(p => !p.hidden);
        if (visible.length === 0) return null;
        return (
          <div key="projects" className="w-full flex flex-col">
            <SectionHeading title={STANDARD_LABELS.projects} />
            <div className="flex flex-col gap-[8pt]">
              {visible.map(proj => (
                <div key={proj.id} className="flex flex-row mb-[5pt]">
                  <div className="w-[40%]" style={{ fontFamily: `${T.fontFamily}, sans-serif` }}>
                    {proj.url ? (
                      <a
                        href={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`}
                        className="text-[11pt] font-bold text-[#373737] no-underline hover:underline block"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {proj.title}
                      </a>
                    ) : (
                      <span className="text-[11pt] font-bold text-[#373737]">{proj.title}</span>
                    )}
                  </div>
                  <div className="w-[60%]">
                    {proj.description ? (
                      <HtmlDisplay content={proj.description} className="text-[10pt] text-[#373737] leading-[1.4] [&>p]:mb-[3pt]" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case SECTIONS.CERTIFICATIONS: {
        const node = renderStandardCertifications();
        if (!node) return null;
        return (
          <div key="certifications" className="w-full flex flex-col">
            <SectionHeading title={STANDARD_LABELS.certifications} />
            <div className="flex flex-col gap-[8pt]">{node}</div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const renderSectionById = (sectionId: string) => {
    if (isCustomSection(sectionId)) {
      const custom = customSections.find(s => s.id === sectionId);
      if (!custom) return null;
      const visibleItems = custom.items.filter(i => !i.hidden);
      if (visibleItems.length === 0) return null;
      return (
        <div key={sectionId} className="w-full flex flex-col">
          <SectionHeading title={custom.title} />
          <div className="flex flex-col gap-[8pt]">{renderCustomBody(custom)}</div>
        </div>
      );
    }
    return renderStandard(sectionId);
  };

  const contactPieces: React.ReactNode[] = [];
  if (profile.phone) {
    contactPieces.push(
      <span key="phone" className="text-[11pt] text-[#373737]">
        {profile.phone}
      </span>
    );
  }
  const loc = [profile.city, profile.country].filter(Boolean).join(profile.city && profile.country ? ", " : "");
  if (loc) {
    contactPieces.push(
      <span key="loc" className="text-[11pt] text-[#373737]">
        {loc}
      </span>
    );
  }
  if (profile.email) {
    contactPieces.push(
      <span key="email" className="text-[11pt] text-[#373737]">
        {profile.email}
      </span>
    );
  }
  if (profile.linkedin) {
    contactPieces.push(
      <a
        key="linkedin"
        href={getLinkedinUrl(profile.linkedin)}
        className="text-[11pt] text-[#373737] no-underline hover:underline"
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
        className="text-[11pt] text-[#373737] no-underline hover:underline"
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
        className="text-[11pt] text-[#373737] no-underline hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub
      </a>
    );
  }

  const padPx = professionalPtToPx(T.pagePaddingPt);
  const fontStack = { fontFamily: `${T.fontFamily}, ui-sans-serif, system-ui, sans-serif` } as const;

  return (
    <ScaledA4PreviewShell
      previewScale={previewScale}
      isModal={isModal}
      outerClassName="bg-white text-[#373737]"
      nonModalOuterClassName="shadow-2xl"
      innerClassName={isModal ? "flex-1 box-border w-full flex flex-col" : "w-full flex flex-col"}
      scaledInnerStyle={{ padding: padPx, ...fontStack }}
      modalInnerStyle={fontStack}
    >
      {profile.fullName || profile.title || contactPieces.length > 0 ? (
        <div>
          {profile.fullName ? (
            <div className="flex justify-center items-center text-[26pt] font-semibold text-[#373737]">{profile.fullName}</div>
          ) : null}
          {profile.title ? (
            <div className="flex items-center justify-center font-extralight text-[16pt] text-[#373737] mb-[10pt]">{profile.title}</div>
          ) : null}
          {contactPieces.length > 0 ? (
            <div className="flex flex-row flex-wrap justify-center items-center gap-[10pt] text-[#373737] py-[10pt] border-t border-b border-[#373737] mb-[20pt]">
              {contactPieces}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="w-full flex flex-col" style={{ marginTop: `${T.spacing.mainSectionTop}pt`, gap: `${T.spacing.sectionGap}pt` }}>
        {deduplicateSectionOrder(sectionOrder)
          .filter(s => !s.hidden)
          .map(s => renderSectionById(s.id))}
      </div>
    </ScaledA4PreviewShell>
  );
};

export default ProfessionalPreview;
