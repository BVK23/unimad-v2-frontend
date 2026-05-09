import React from "react";
import { CustomSection, CustomSectionItem, ResumeData } from "../../../../types";
import { isCustomSection, SECTIONS } from "../../config/constants";
import HtmlDisplay from "../../shared/HtmlDisplay";
import ScaledA4PreviewShell from "../../shared/ScaledA4PreviewShell";
import { parseDate as formatDateMonthYear } from "../../shared/dateUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";
import { buildNextgenColumns } from "./nextgen-columns";
import { NEXTGEN_TOKENS as T, nextgenPtToPx } from "./nextgen-tokens";

const STANDARD_LABELS: Record<string, string> = {
  profile: "Summary",
  experience: "Experiences",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
};

interface NextgenPreviewProps {
  data: ResumeData;
  previewScale?: number;
  isModal?: boolean;
}

const NextgenPreview: React.FC<NextgenPreviewProps> = ({ data, previewScale = 1, isModal = false }) => {
  const profile = data.profile || {};
  const { leftColumnIds, rightColumnIds } = buildNextgenColumns(data);
  const educationSplit = data.educationLeftColumn === true;
  const contactTextClass = "text-[11pt] leading-[1.2] text-[#373737]";
  const contactPipeClass = "text-[12pt] leading-[1.2] text-[#373737] select-none";

  const contactPieces: React.ReactNode[] = [];
  if (profile.email) {
    contactPieces.push(
      <span key="email" className={contactTextClass}>
        {profile.email}
      </span>
    );
  }
  if (profile.phone) {
    contactPieces.push(
      <span key="pipe-p" className={contactPipeClass}>
        |
      </span>,
      <span key="phone" className={contactTextClass}>
        {profile.phone}
      </span>
    );
  }
  if (profile.linkedin) {
    contactPieces.push(
      <span key="pipe-l" className={contactPipeClass}>
        |
      </span>,
      <a
        key="linkedin"
        href={getLinkedinUrl(profile.linkedin)}
        className={`${contactTextClass} hover:underline`}
        target="_blank"
        rel="noopener noreferrer"
      >
        LinkedIn
      </a>
    );
  }
  if (profile.portfolio) {
    contactPieces.push(
      <span key="pipe-port" className={contactPipeClass}>
        |
      </span>,
      <a
        key="portfolio"
        href={getPortfolioUrl(profile.portfolio)}
        className={`${contactTextClass} hover:underline`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Portfolio
      </a>
    );
  }
  if (profile.github) {
    contactPieces.push(
      <span key="pipe-g" className={contactPipeClass}>
        |
      </span>,
      <a
        key="github"
        href={getGithubUrl(profile.github)}
        className={`${contactTextClass} hover:underline`}
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub
      </a>
    );
  }
  const loc = [profile.city, profile.country].filter(Boolean).join(profile.city && profile.country ? ", " : "");
  if (loc) {
    contactPieces.push(
      <span key="pipe-loc" className={contactPipeClass}>
        |
      </span>,
      <span key="loc" className={contactTextClass}>
        {loc}
      </span>
    );
  }

  const SectionHeading = ({ title }: { title: string }) => (
    <div className="flex flex-col gap-[2.4pt] ml-[28pt] mb-[2pt]" style={{ fontFamily: `${T.fontFamily}, sans-serif` }}>
      <h2 className="text-[16pt] font-bold text-[#373737] uppercase m-0">{title}</h2>
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
    <div className="flex flex-col" style={{ fontFamily: `${T.fontFamily}, sans-serif` }}>
      {credentialUrl ? (
        <a
          href={credentialUrl.startsWith("http") ? credentialUrl : `https://${credentialUrl}`}
          className="text-[12pt] font-semibold text-[#373737] hover:underline m-0"
          target="_blank"
          rel="noopener noreferrer"
        >
          {title}
        </a>
      ) : (
        <span className="text-[12pt] font-semibold text-[#373737]">{title}</span>
      )}
      <span className="text-[12pt] font-normal text-[#373737]">
        {issuer || ""}
        {issuer && dateStr ? " - " : ""}
        {dateStr ? formatDateMonthYear(dateStr) : ""}
      </span>
    </div>
  );

  const CustomSectionTitlePv = ({ item }: { item: CustomSectionItem }) => {
    const datePart =
      item.startDate && `${formatDateMonthYear(item.startDate)}${item.endDate ? ` - ${formatDateMonthYear(item.endDate)}` : ""}`;
    const rightText = [item.location, datePart].filter(Boolean).join(" | ");
    const sub = item.subtitle?.trim();
    return (
      <div className="flex flex-col" style={{ fontFamily: `${T.fontFamily}, sans-serif` }}>
        {item.title ? <span className="text-[12pt] font-semibold text-[#373737]">{item.title}</span> : null}
        {sub ? <span className="text-[12pt] font-normal text-[#373737]">{sub}</span> : null}
        {rightText ? <span className="text-[12pt] font-normal text-[#373737]">{rightText}</span> : null}
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
            <div key={item.id} className="mb-[6pt]">
              <CertificationTitlePv title={item.title || ""} issuer={item.subtitle} dateStr={item.endDate || item.startDate} />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        {visible.map(item => (
          <div key={item.id} className="mb-[8pt] flex flex-col gap-[3pt]">
            <CustomSectionTitlePv item={item} />
            {item.description ? (
              <HtmlDisplay
                content={item.description}
                variant="pdfTight"
                className="text-[10pt] text-justify text-[#373737] leading-[1.4]"
              />
            ) : null}
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
          <div key="profile" className="flex flex-col mb-[8pt] text-[#373737]" style={{ width: T.layout.sectionWidth }}>
            <SectionHeading title={STANDARD_LABELS.profile} />
            <div className="flex flex-col gap-[8pt] mt-0" style={{ marginLeft: `${T.spacing.sectionContentMarginLeft}pt` }}>
              <HtmlDisplay content={profile.summary} variant="pdfTight" className="text-[10pt] text-justify text-[#373737] leading-[1.4]" />
            </div>
          </div>
        );
      }
      case SECTIONS.EXPERIENCE: {
        const visible = (data.experience || []).filter(e => !e.hidden);
        if (visible.length === 0) return null;
        const experienceTitleLeftCol = "66%";
        const experienceTitleRightCol = "34%";
        return (
          <div key="experience" className="flex flex-col mb-[8pt]" style={{ width: T.layout.sectionWidth }}>
            <SectionHeading title={STANDARD_LABELS.experience} />
            <div className="flex flex-col gap-[8pt]" style={{ marginLeft: `${T.spacing.sectionContentMarginLeft}pt` }}>
              {visible.map(exp => (
                <div key={exp.id} className="flex flex-col gap-[2pt] mb-[8pt]">
                  <div className="flex flex-row justify-between items-start gap-[6pt]">
                    <div style={{ width: experienceTitleLeftCol }}>
                      <span className="text-[12pt] font-semibold text-[#373737] block">{exp.company}</span>
                    </div>
                    <div className="text-right" style={{ width: experienceTitleRightCol }}>
                      <span className="text-[12pt] font-semibold text-[#373737] block">{exp.role}</span>
                    </div>
                  </div>
                  <div className="flex flex-row justify-between items-start gap-[6pt]">
                    <div style={{ width: T.layout.experienceLeftCol }}>
                      <span className="text-[12pt] font-normal text-[#373737] block">
                        {formatDateMonthYear(exp.startDate)} - {exp.current ? "Present" : formatDateMonthYear(exp.endDate)}
                      </span>
                    </div>
                    <div className="text-right" style={{ width: T.layout.experienceRightCol }}>
                      <span className="text-[12pt] font-normal text-[#373737] block">{exp.location || ""}</span>
                    </div>
                  </div>
                  {exp.description ? (
                    <HtmlDisplay
                      content={exp.description}
                      variant="pdfTight"
                      className="text-[10pt] text-justify text-[#373737] leading-[1.4]"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        );
      }
      case SECTIONS.EDUCATION: {
        const visible = (data.education || []).filter(e => !e.hidden);
        if (visible.length === 0) return null;
        return (
          <div key="education" className="flex flex-col mb-[8pt]" style={{ width: T.layout.sectionWidth }}>
            <SectionHeading title={STANDARD_LABELS.education} />
            <div className="flex flex-col gap-[8pt]" style={{ marginLeft: `${T.spacing.sectionContentMarginLeft}pt` }}>
              {visible.map(edu => (
                <div key={edu.id} className="flex flex-col mb-[6pt]">
                  {educationSplit ? (
                    <>
                      <div className="flex flex-row justify-between items-start gap-[6pt]">
                        <div className="flex flex-col" style={{ width: T.layout.experienceLeftCol }}>
                          <span className="text-[12pt] font-semibold text-[#373737]">{edu.school}</span>
                          <span className="text-[12pt] font-normal text-[#373737]">{edu.degree}</span>
                        </div>
                        <span className="text-[12pt] font-normal text-[#373737]">
                          {formatDateMonthYear(edu.startDate)} - {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
                        </span>
                      </div>
                      <div className="flex flex-row flex-wrap gap-[3pt]">
                        <span className="text-[12pt] font-normal text-[#373737]">{edu.location || ""}</span>
                      </div>
                      {edu.description ? (
                        <HtmlDisplay
                          content={edu.description}
                          variant="pdfTight"
                          className="text-[10pt] text-justify text-[#373737] leading-[1.4]"
                        />
                      ) : null}
                    </>
                  ) : (
                    <>
                      <span className="text-[12pt] font-semibold text-[#373737] block">{edu.school}</span>
                      <span className="text-[12pt] font-normal text-[#373737] block">{edu.degree}</span>
                      <span className="text-[12pt] font-normal text-[#373737] block">
                        {formatDateMonthYear(edu.startDate)} - {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
                      </span>
                      <span className="text-[12pt] font-normal text-[#373737] block">{edu.location || ""}</span>
                      {edu.description ? (
                        <HtmlDisplay
                          content={edu.description}
                          variant="pdfTight"
                          className="text-[10pt] text-justify text-[#373737] leading-[1.4]"
                        />
                      ) : null}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }
      case SECTIONS.SKILLS: {
        const grouped = (data.skills || [])
          .filter(s => !s.hidden)
          .reduce(
            (acc, skill) => {
              const cat = skill.category?.trim() || "Other";
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(skill.name);
              return acc;
            },
            {} as Record<string, string[]>
          );
        if (Object.keys(grouped).length === 0) return null;
        return (
          <div key="skills" className="flex flex-col mb-[8pt]" style={{ width: T.layout.sectionWidth }}>
            <SectionHeading title={STANDARD_LABELS.skills} />
            <div className="flex flex-col gap-[8pt]" style={{ marginLeft: `${T.spacing.sectionContentMarginLeft}pt` }}>
              <div className="flex flex-col gap-[6pt]">
                {Object.keys(grouped).map(cat => (
                  <div key={cat}>
                    <span className="text-[12pt] font-semibold text-[#373737] block">{cat} :</span>
                    <span className="text-[12pt] font-normal text-[#373737] block">{grouped[cat].join(", ")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
      case SECTIONS.PROJECTS: {
        const visible = (data.projects || []).filter(p => !p.hidden);
        if (visible.length === 0) return null;
        return (
          <div key="projects" className="flex flex-col mb-[8pt]" style={{ width: T.layout.sectionWidth }}>
            <SectionHeading title={STANDARD_LABELS.projects} />
            <div className="flex flex-col gap-[8pt]" style={{ marginLeft: `${T.spacing.sectionContentMarginLeft}pt` }}>
              {visible.map(proj => (
                <div key={proj.id} className="flex flex-col gap-[6pt]">
                  {proj.url ? (
                    <a
                      href={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`}
                      className="text-[12pt] font-semibold text-[#373737] hover:underline m-0 inline-block"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {proj.title}
                    </a>
                  ) : (
                    <span className="text-[12pt] font-semibold text-[#373737]">{proj.title}</span>
                  )}
                  {proj.description ? (
                    <HtmlDisplay
                      content={proj.description}
                      variant="pdfTight"
                      className="text-[10pt] text-justify text-[#373737] leading-[1.4]"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        );
      }
      case SECTIONS.CERTIFICATIONS: {
        const visible = (data.certifications || []).filter(c => !c.hidden);
        if (visible.length === 0) return null;
        return (
          <div key="certifications" className="flex flex-col mb-[8pt]" style={{ width: T.layout.sectionWidth }}>
            <SectionHeading title={STANDARD_LABELS.certifications} />
            <div className="flex flex-col gap-[8pt]" style={{ marginLeft: `${T.spacing.sectionContentMarginLeft}pt` }}>
              {visible.map(cert => (
                <div key={cert.id} className="flex flex-col gap-[3pt]">
                  <div className="flex flex-col">
                    {cert.credentialUrl ? (
                      <a
                        href={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                        className="text-[12pt] font-semibold text-[#373737] hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {cert.title}
                      </a>
                    ) : (
                      <span className="text-[12pt] font-semibold text-[#373737]">{cert.title}</span>
                    )}
                    <span className="text-[12pt] font-semibold text-[#373737]">
                      {cert.issuer || ""}
                      {cert.issuer && cert.date ? " - " : ""}
                      {cert.date ? formatDateMonthYear(cert.date) : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const renderSectionById = (sectionId: string) => {
    if (isCustomSection(sectionId)) {
      const custom = data.customSections.find(s => s.id === sectionId);
      if (!custom) return null;
      const visibleItems = custom.items.filter(i => !i.hidden);
      if (visibleItems.length === 0) return null;
      return (
        <div key={sectionId} className="flex flex-col mb-[8pt]" style={{ width: T.layout.sectionWidth }}>
          <SectionHeading title={custom.title} />
          <div className="flex flex-col gap-[8pt]" style={{ marginLeft: `${T.spacing.sectionContentMarginLeft}pt` }}>
            {renderCustomBody(custom)}
          </div>
        </div>
      );
    }
    return renderStandard(sectionId);
  };

  const renderColumn = (ids: string[]) => (
    <>
      {ids.map(id => {
        const node = renderSectionById(id);
        return node ? <React.Fragment key={id}>{node}</React.Fragment> : null;
      })}
    </>
  );

  const fontStack = { fontFamily: `${T.fontFamily}, ui-sans-serif, system-ui, sans-serif` } as const;

  const scaledPad = {
    paddingTop: nextgenPtToPx(T.pagePaddingPt.top),
    paddingBottom: nextgenPtToPx(T.pagePaddingPt.bottom),
    paddingLeft: nextgenPtToPx(T.pagePaddingPt.horizontal),
    paddingRight: nextgenPtToPx(T.pagePaddingPt.horizontal),
    ...fontStack,
  } as const;

  return (
    <ScaledA4PreviewShell
      previewScale={previewScale}
      isModal={isModal}
      outerClassName="bg-white text-[#373737]"
      nonModalOuterClassName="shadow-2xl"
      innerClassName={isModal ? "flex-1 box-border" : ""}
      scaledInnerStyle={scaledPad}
      modalInnerStyle={fontStack}
      modalPadding="0"
    >
      <div className="w-full flex flex-col items-center text-center pt-0 pb-[7pt] gap-[3pt]">
        {profile.fullName ? (
          <h1 className="text-[40pt] font-extralight m-0 mb-[2pt] leading-[1.2] text-[#373737]">{profile.fullName}</h1>
        ) : null}
        {contactPieces.length > 0 ? (
          <div className="flex flex-row flex-wrap justify-center items-center gap-[6pt] leading-[1.2]">{contactPieces}</div>
        ) : null}
      </div>

      <div className="w-full h-[2px] bg-[#373737] mb-0" />

      <div className="flex flex-row w-full mt-0">
        <div className="flex flex-col" style={{ width: T.layout.leftColumnWidth }}>
          {renderColumn(leftColumnIds)}
        </div>
        <div className="flex flex-col" style={{ width: T.layout.rightColumnWidth, gap: `${T.spacing.rightColumnGap}pt` }}>
          {renderColumn(rightColumnIds)}
        </div>
      </div>
    </ScaledA4PreviewShell>
  );
};

export default NextgenPreview;
