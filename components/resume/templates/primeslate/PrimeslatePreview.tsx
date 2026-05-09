import React from "react";
import { CustomSection, CustomSectionItem, ResumeData } from "../../../../types";
import { isCustomSection, SECTIONS } from "../../config/constants";
import HtmlDisplay from "../../shared/HtmlDisplay";
import ScaledA4PreviewShell from "../../shared/ScaledA4PreviewShell";
import { parseDate as formatDateMonthYear } from "../../shared/dateUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";
import { buildPrimeslateColumns } from "./primeslate-columns";
import { PRIMESLATE_TOKENS as T, primeslatePtToPx } from "./primeslate-tokens";

const STANDARD_LABELS: Record<string, string> = {
  profile: "Summary",
  experience: "Experiences",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
};

const isHttpUrl = (s: string) => /^https?:\/\//i.test(s.trim());

interface PrimeslatePreviewProps {
  data: ResumeData;
  previewScale?: number;
  isModal?: boolean;
}

const PrimeslatePreview: React.FC<PrimeslatePreviewProps> = ({ data, previewScale = 1, isModal = false }) => {
  const profile = data.profile || {};
  const { leftColumnIds, rightColumnIds } = buildPrimeslateColumns(data);

  const fontStack = { fontFamily: `${T.fontFamily}, ui-sans-serif, system-ui, sans-serif` } as const;

  const resolveHeading = (key: string) => (STANDARD_LABELS[key] ?? key).toUpperCase();

  const renderSectionHeading = (key: string) => (
    <h2 className="text-[12pt] font-bold text-[#2D4B98] uppercase m-0 mb-[3pt] leading-tight w-full">{resolveHeading(key)}</h2>
  );

  const renderCustomCertTitle = (title: string, issuer?: string, dateStr?: string) => (
    <div className="flex flex-col gap-[1.5pt]">
      <span className="text-[12pt] font-semibold text-[#373737]">{title}</span>
      <span className="text-[11pt] font-medium text-[#373737]">
        {issuer || ""}
        {issuer && dateStr ? " - " : ""}
        {dateStr ? formatDateMonthYear(dateStr) : ""}
      </span>
    </div>
  );

  const renderCustomSectionTitle = (item: CustomSectionItem) => {
    const datePart =
      item.startDate && `${formatDateMonthYear(item.startDate)}${item.endDate ? ` - ${formatDateMonthYear(item.endDate)}` : ""}`;
    const meta = [item.location, datePart].filter(Boolean).join(" | ");
    const sub = item.subtitle?.trim();
    return (
      <div className="flex flex-col gap-[1.5pt]">
        {item.title ? <span className="text-[12pt] font-semibold text-[#373737]">{item.title}</span> : null}
        {sub ? <span className="text-[11pt] font-medium text-[#373737]">{sub}</span> : null}
        {meta ? <span className="text-[11pt] font-medium text-[#373737]">{meta}</span> : null}
      </div>
    );
  };

  const renderCustomBody = (custom: CustomSection) => {
    const isCertSection = custom.title === "Certifications";
    const visible = custom.items.filter(i => !i.hidden);
    if (visible.length === 0) return null;

    if (isCertSection) {
      return (
        <div className="flex flex-col gap-[6pt]">
          {visible.map(item => (
            <div key={item.id}>{renderCustomCertTitle(item.title || "", item.subtitle, item.endDate || item.startDate)}</div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-[8pt]">
        {visible.map(item => (
          <div key={item.id} className="flex flex-col gap-[3pt] mb-[6pt]">
            {renderCustomSectionTitle(item)}
            {item.description ? (
              <HtmlDisplay content={item.description} className="text-[9pt] text-[#373737] leading-[1.4] [&>p]:mb-[3pt]" />
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  const renderContactBar = () => {
    const parts: React.ReactNode[] = [];
    const slash = <span className="text-[12pt] text-[#373737] select-none">/</span>;
    const push = (key: string, node: React.ReactNode) => {
      if (parts.length > 0) parts.push(<React.Fragment key={`s-${key}`}>{slash}</React.Fragment>);
      parts.push(<React.Fragment key={key}>{node}</React.Fragment>);
    };

    if (profile.email) push("email", <span className="text-[11pt] font-medium text-[#373737]">{profile.email}</span>);
    if (profile.phone) push("phone", <span className="text-[11pt] font-medium text-[#373737]">{profile.phone}</span>);
    if (profile.linkedin) {
      push(
        "linkedin",
        <a
          href={getLinkedinUrl(profile.linkedin)}
          className="text-[11pt] font-medium text-[#373737] hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
      );
    }
    if (profile.portfolio) {
      const href = profile.portfolio.startsWith("http") ? profile.portfolio : getPortfolioUrl(profile.portfolio);
      push(
        "portfolio",
        <a href={href} className="text-[11pt] font-medium text-[#373737] hover:underline" target="_blank" rel="noopener noreferrer">
          Portfolio
        </a>
      );
    }
    if (profile.github) {
      push(
        "github",
        <a
          href={getGithubUrl(profile.github)}
          className="text-[11pt] font-medium text-[#373737] hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      );
    }
    const loc = [profile.city, profile.country].filter(Boolean).join(profile.city && profile.country ? ", " : "");
    if (loc) push("loc", <span className="text-[11pt] font-medium text-[#373737]">{loc}</span>);

    if (parts.length === 0) return null;
    return (
      <div className="flex flex-row flex-wrap items-center justify-center gap-[8pt] py-[4pt] border-y border-black my-[8pt]">{parts}</div>
    );
  };

  const htmlClass = "text-[9pt] text-[#373737] leading-[1.4] [&>p]:mb-[3pt]";

  const shellClass = "flex flex-col gap-[8pt] mb-[8pt]";
  const shellWidthStyle = { width: T.layout.sectionShellWidth } as const;

  const renderStandard = (sectionId: string) => {
    switch (sectionId) {
      case SECTIONS.PROFILE:
        return null;
      case SECTIONS.EXPERIENCE: {
        const visible = (data.experience || []).filter(e => !e.hidden);
        if (visible.length === 0) return null;
        return (
          <section key="experience" className={shellClass} style={shellWidthStyle}>
            {renderSectionHeading(SECTIONS.EXPERIENCE)}
            <div className="flex flex-col gap-[8pt]">
              {visible.map(exp => (
                <div key={exp.id} className="flex flex-col gap-[3pt] mb-[4pt]">
                  <span className="text-[12pt] font-semibold text-[#373737]">{exp.role}</span>
                  <div className="flex flex-row flex-wrap items-center gap-[3pt] text-[11pt] font-medium text-[#373737]">
                    <span>{exp.company}</span>
                    <span>|</span>
                    <span>{exp.location || ""}</span>
                    <span>|</span>
                    <span>
                      {formatDateMonthYear(exp.startDate)} - {exp.current ? "Present" : formatDateMonthYear(exp.endDate)}
                    </span>
                  </div>
                  {exp.description ? <HtmlDisplay content={exp.description} className={htmlClass} /> : null}
                </div>
              ))}
            </div>
          </section>
        );
      }
      case SECTIONS.EDUCATION: {
        const visible = (data.education || []).filter(e => !e.hidden);
        if (visible.length === 0) return null;
        return (
          <section key="education" className={shellClass} style={shellWidthStyle}>
            {renderSectionHeading(SECTIONS.EDUCATION)}
            <div className="flex flex-col gap-[8pt]">
              {visible.map(edu => (
                <div key={edu.id} className="flex flex-col gap-[1.5pt] mb-[4pt]">
                  <span className="text-[12pt] font-semibold text-[#373737]">{edu.degree}</span>
                  <span className="text-[11pt] font-medium text-[#373737]">{edu.school}</span>
                  <div className="flex flex-row flex-wrap items-center gap-[3pt] text-[11pt] font-medium text-[#373737]">
                    <span>{edu.location || ""}</span>
                    <span>|</span>
                    <span>
                      {formatDateMonthYear(edu.startDate)} - {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
                    </span>
                  </div>
                  {edu.description ? <HtmlDisplay content={edu.description} className={htmlClass} /> : null}
                </div>
              ))}
            </div>
          </section>
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
          <section key="skills" className={shellClass} style={shellWidthStyle}>
            {renderSectionHeading(SECTIONS.SKILLS)}
            <div className="flex flex-col gap-[4pt]">
              {Object.keys(grouped).map(cat => (
                <div key={cat}>
                  <span className="text-[11pt] font-medium text-[#373737] block">{cat} :</span>
                  <div className="flex flex-row flex-wrap gap-[4pt] mt-[3pt]">
                    {grouped[cat].map((name, idx) => (
                      <span key={`${cat}-${idx}`} className="text-[11pt] border border-[#2D4B98] rounded px-[8pt] py-[4pt] text-[#373737]">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      }
      case SECTIONS.PROJECTS: {
        const visible = (data.projects || []).filter(p => !p.hidden);
        if (visible.length === 0) return null;
        return (
          <section key="projects" className={shellClass} style={shellWidthStyle}>
            {renderSectionHeading(SECTIONS.PROJECTS)}
            <div className="flex flex-col gap-[8pt]">
              {visible.map(proj => (
                <div key={proj.id} className="flex flex-col gap-[3pt] mb-[4pt]">
                  {proj.url ? (
                    <a
                      href={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`}
                      className="text-[11pt] font-medium text-[#373737] hover:underline m-0"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {proj.title}
                    </a>
                  ) : (
                    <span className="text-[11pt] font-medium text-[#373737]">{proj.title}</span>
                  )}
                  {proj.description ? <HtmlDisplay content={proj.description} className={htmlClass} /> : null}
                </div>
              ))}
            </div>
          </section>
        );
      }
      case SECTIONS.CERTIFICATIONS: {
        const visible = (data.certifications || []).filter(c => !c.hidden);
        if (visible.length === 0) return null;
        return (
          <section key="certifications" className={shellClass} style={shellWidthStyle}>
            {renderSectionHeading(SECTIONS.CERTIFICATIONS)}
            <div className="flex flex-col gap-[8pt]">
              {visible.map(cert => (
                <div key={cert.id} className="flex flex-col gap-[1.5pt]">
                  {cert.credentialUrl ? (
                    <a
                      href={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                      className="text-[11pt] font-medium text-[#373737] hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {cert.title}
                    </a>
                  ) : (
                    <span className="text-[11pt] font-medium text-[#373737]">{cert.title}</span>
                  )}
                  <span className="text-[11pt] font-medium text-[#373737]">
                    {cert.issuer || ""}
                    {cert.issuer && cert.date ? " - " : ""}
                    {cert.date ? formatDateMonthYear(cert.date) : ""}
                  </span>
                </div>
              ))}
            </div>
          </section>
        );
      }
      default:
        return null;
    }
  };

  const renderSectionById = (id: string) => {
    if (isCustomSection(id)) {
      const custom = data.customSections.find(s => s.id === id);
      if (!custom) return null;
      const visibleItems = custom.items.filter(i => !i.hidden);
      if (visibleItems.length === 0) return null;
      return (
        <section key={id} className={shellClass} style={shellWidthStyle}>
          <h2 className="text-[12pt] font-bold text-[#2D4B98] uppercase m-0 mb-[3pt] leading-tight w-full">{custom.title}</h2>
          <div className="flex flex-col gap-[8pt]">{renderCustomBody(custom)}</div>
        </section>
      );
    }
    return renderStandard(id);
  };

  const renderColumn = (ids: string[]) => (
    <>
      {ids.map(id => {
        const node = renderSectionById(id);
        return node ? <React.Fragment key={id}>{node}</React.Fragment> : null;
      })}
    </>
  );

  const pad = primeslatePtToPx(T.pagePaddingPt);
  const pictureSrc = profile.picture?.trim();
  const showPhoto = pictureSrc && isHttpUrl(pictureSrc);

  return (
    <ScaledA4PreviewShell
      previewScale={previewScale}
      isModal={isModal}
      outerClassName="bg-white text-[#373737]"
      nonModalOuterClassName="shadow-2xl"
      innerClassName={isModal ? "flex-1 box-border" : ""}
      scaledInnerStyle={{ padding: pad, ...fontStack }}
      modalInnerStyle={fontStack}
    >
      <div className="flex flex-row justify-between items-start gap-[4pt] mb-[4pt]">
        <div className="flex flex-col gap-[3pt] flex-1 min-w-0 pr-[8pt]">
          {profile.fullName ? <h1 className="text-[28pt] font-semibold text-[#2D4B98] m-0 leading-tight">{profile.fullName}</h1> : null}
          {profile.title?.trim() ? <p className="text-[14pt] font-light text-[#666666] m-0 leading-[1.4]">{profile.title.trim()}</p> : null}
        </div>
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary user/profile URLs for resume preview
          <img src={pictureSrc} alt="" className="w-[70pt] h-[70pt] rounded object-cover shrink-0 border border-transparent" />
        ) : null}
      </div>
      {profile.summary?.trim() ? (
        <div className="mb-[8pt]">
          <HtmlDisplay content={profile.summary} className={htmlClass} />
        </div>
      ) : null}
      {renderContactBar()}
      <div className="flex flex-row items-start w-full">
        <div className="flex flex-col" style={{ width: T.layout.leftColumnWidth }}>
          {renderColumn(leftColumnIds)}
        </div>
        <div className="flex flex-col" style={{ width: T.layout.rightColumnWidth }}>
          {renderColumn(rightColumnIds)}
        </div>
      </div>
    </ScaledA4PreviewShell>
  );
};

export default PrimeslatePreview;
