import React from "react";
import { CustomSection, CustomSectionItem, ResumeData } from "../../../../types";
import { isCustomSection, SECTIONS } from "../../config/constants";
import HtmlDisplay from "../../shared/HtmlDisplay";
import ScaledA4PreviewShell from "../../shared/ScaledA4PreviewShell";
import { parseDate as formatDateMonthYear } from "../../shared/dateUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";
import { buildSlateproColumns } from "./slatepro-columns";
import { SLATEPRO_TOKENS as T, slateproPtToPx } from "./slatepro-tokens";

const STANDARD_LABELS: Record<string, string> = {
  profile: "Summary",
  experience: "Experiences",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
};

interface SlateproPreviewProps {
  data: ResumeData;
  previewScale?: number;
  isModal?: boolean;
}

const SlateproPreview: React.FC<SlateproPreviewProps> = ({ data, previewScale = 1, isModal = false }) => {
  const profile = data.profile || {};
  const { leftColumnIds, rightColumnIds } = buildSlateproColumns(data);
  const educationSplit = data.educationLeftColumn === true;

  const fontStack = { fontFamily: `${T.fontFamily}, ui-sans-serif, system-ui, sans-serif` } as const;

  const initials = (profile.fullName || "")
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sectionDisplayTitle = (label: string) => (label === "Summary" ? "CAREER OBJECTIVE" : label.toUpperCase());

  const SectionHeading = ({ title }: { title: string }) => (
    <div className="flex flex-col gap-[2.4pt] mb-0">
      <h2 className="text-[12pt] font-bold text-[#373737] uppercase m-0 leading-tight">{sectionDisplayTitle(title)}</h2>
      <div className="w-full h-[0.5px] bg-[#373737]" />
    </div>
  );

  const CustomCertTitlePv = ({ title, issuer, dateStr }: { title: string; issuer?: string; dateStr?: string }) => (
    <div className="flex flex-col gap-[1.5pt]">
      <span className="text-[10pt] font-semibold text-[#373737]">{title}</span>
      <span className="text-[11pt] font-medium text-[#666666]">
        {issuer || ""}
        {issuer && dateStr ? " - " : ""}
        {dateStr ? formatDateMonthYear(dateStr) : ""}
      </span>
    </div>
  );

  const CustomSectionTitlePv = ({ item }: { item: CustomSectionItem }) => {
    const datePart =
      item.startDate &&
      `${formatDateMonthYear(item.startDate)}${item.current || item.endDate ? ` - ${item.current ? "Present" : formatDateMonthYear(item.endDate)}` : ""}`;
    const sub = item.subtitle?.trim();
    return (
      <div className="flex flex-col gap-[3pt]">
        <div className="flex flex-row justify-between items-start gap-[6pt]">
          <div className="flex flex-col gap-[1.5pt] min-w-0 flex-1">
            {item.title ? <span className="text-[10pt] font-semibold text-[#373737]">{item.title}</span> : null}
            {sub ? <span className="text-[11pt] font-medium text-[#666666]">{sub}</span> : null}
            {item.location ? <span className="text-[11pt] font-medium text-[#666666]">{item.location}</span> : null}
          </div>
          {datePart ? <span className="text-[11pt] font-medium text-[#666666] shrink-0">{datePart}</span> : null}
        </div>
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
            <div key={item.id}>
              <CustomCertTitlePv title={item.title || ""} issuer={item.subtitle} dateStr={item.endDate || item.startDate} />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-[8pt]">
        {visible.map(item => (
          <div key={item.id} className="flex flex-col gap-[3pt] mb-[5pt]">
            <CustomSectionTitlePv item={item} />
            {item.description ? (
              <HtmlDisplay content={item.description} className="text-[9pt] text-[#373737] leading-[1.4] [&>p]:mb-[3pt]" />
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  const renderContactBlock = () => (
    <>
      <div className="flex flex-col gap-[2.4pt] mb-[8pt]">
        <span className="text-[10pt] font-semibold text-[#373737]">CONTACT</span>
        <div className="w-full h-[0.5px] bg-[#373737]" />
      </div>
      <div className="flex flex-col gap-[8pt] mb-[8pt]">
        {profile.email ? (
          <div className="flex flex-col gap-[3pt]">
            <span className="text-[11pt] font-semibold text-[#373737]">Email</span>
            <span className="text-[11pt] font-medium text-[#373737]">{profile.email}</span>
          </div>
        ) : null}
        {(profile.city || profile.country) && (
          <div className="flex flex-col gap-[3pt]">
            <span className="text-[11pt] font-semibold text-[#373737]">Location</span>
            <span className="text-[11pt] font-medium text-[#373737]">
              {[profile.city, profile.country].filter(Boolean).join(profile.city && profile.country ? ", " : "")}
            </span>
          </div>
        )}
        {profile.phone ? (
          <div className="flex flex-col gap-[3pt]">
            <span className="text-[11pt] font-semibold text-[#373737]">Phone</span>
            <span className="text-[11pt] font-medium text-[#373737]">{profile.phone}</span>
          </div>
        ) : null}
        {profile.linkedin ? (
          <div className="flex flex-col gap-[3pt]">
            <span className="text-[11pt] font-semibold text-[#373737]">LinkedIn</span>
            <a
              href={getLinkedinUrl(profile.linkedin)}
              className="text-[11pt] font-medium text-[#373737] hover:underline break-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              {profile.linkedin}
            </a>
          </div>
        ) : null}
        {profile.portfolio ? (
          <div className="flex flex-col gap-[3pt]">
            <span className="text-[11pt] font-semibold text-[#373737]">Portfolio</span>
            <a
              href={profile.portfolio.startsWith("http") ? profile.portfolio : getPortfolioUrl(profile.portfolio)}
              className="text-[11pt] font-medium text-[#373737] hover:underline break-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              {profile.portfolio}
            </a>
          </div>
        ) : null}
        {profile.github ? (
          <div className="flex flex-col gap-[3pt]">
            <span className="text-[11pt] font-semibold text-[#373737]">GitHub</span>
            <a
              href={getGithubUrl(profile.github)}
              className="text-[11pt] font-medium text-[#373737] hover:underline break-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              {profile.github}
            </a>
          </div>
        ) : null}
      </div>
    </>
  );

  const htmlClass = "text-[9pt] text-[#373737] leading-[1.4] [&>p]:mb-[3pt]";

  const renderStandard = (sectionId: string) => {
    switch (sectionId) {
      case SECTIONS.PROFILE: {
        if (!profile.summary?.trim()) return null;
        return (
          <section key="profile" className="flex flex-col gap-[8pt] mb-[8pt]">
            <SectionHeading title={STANDARD_LABELS.profile} />
            <div className="flex flex-col gap-[8pt]">
              <HtmlDisplay content={profile.summary} className={htmlClass} />
            </div>
          </section>
        );
      }
      case SECTIONS.EXPERIENCE: {
        const visible = (data.experience || []).filter(e => !e.hidden);
        if (visible.length === 0) return null;
        return (
          <section key="experience" className="flex flex-col gap-[8pt] mb-[8pt]">
            <SectionHeading title={STANDARD_LABELS.experience} />
            <div className="flex flex-col gap-[8pt]">
              {visible.map(exp => (
                <div key={exp.id} className="flex flex-col gap-[2.5pt] mb-[4pt]">
                  <div className="flex flex-row justify-between items-center gap-[6pt]">
                    <div className="flex flex-col gap-[1.5pt] min-w-0 flex-1">
                      <span className="text-[10pt] font-semibold text-[#373737]">{exp.role}</span>
                      <div className="flex flex-row flex-wrap items-center gap-[3pt] text-[11pt] font-medium text-[#666666]">
                        <span>{exp.company}</span>
                        <span>|</span>
                        <span>{exp.location || ""}</span>
                      </div>
                    </div>
                    <span className="text-[11pt] font-medium text-[#666666] shrink-0">
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
          <section key="education" className="flex flex-col gap-[8pt] mb-[8pt]">
            <SectionHeading title={STANDARD_LABELS.education} />
            <div className="flex flex-col gap-[8pt]">
              {visible.map(edu => (
                <div key={edu.id} className={`flex flex-col gap-[3pt] ${educationSplit ? "mb-[6pt]" : "mb-[1.5pt]"}`}>
                  {educationSplit ? (
                    <>
                      <div className="flex flex-row justify-between items-start gap-[6pt]">
                        <div className="w-[70%] min-w-0">
                          <span className="text-[10pt] font-semibold text-[#373737] block">{edu.school}</span>
                          <span className="text-[11pt] font-medium text-[#666666] block">{edu.degree}</span>
                        </div>
                        <span className="text-[11pt] font-medium text-[#666666] shrink-0">
                          {formatDateMonthYear(edu.startDate)} - {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
                        </span>
                      </div>
                      {edu.location ? (
                        <div className="flex flex-row flex-wrap gap-[3pt] text-[11pt] font-medium text-[#666666]">
                          <span>{edu.location}</span>
                        </div>
                      ) : null}
                      {edu.description ? <HtmlDisplay content={edu.description} className={htmlClass} /> : null}
                    </>
                  ) : (
                    <>
                      <span className="text-[10pt] font-semibold text-[#373737] block">{edu.school}</span>
                      <span className="text-[11pt] font-medium text-[#666666] block">{edu.degree}</span>
                      <div className="flex flex-row flex-wrap items-center gap-[3pt] text-[11pt] font-medium text-[#666666]">
                        <span>
                          {formatDateMonthYear(edu.startDate)} - {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
                        </span>
                        <span>|</span>
                        <span>{edu.location || ""}</span>
                      </div>
                      {edu.description ? <HtmlDisplay content={edu.description} className={htmlClass} /> : null}
                    </>
                  )}
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
          <section key="skills" className="flex flex-col gap-[8pt] mb-[8pt]">
            <SectionHeading title={STANDARD_LABELS.skills} />
            <div className="flex flex-col gap-[4pt]">
              {Object.keys(grouped).map(cat => (
                <div key={cat}>
                  <span className="text-[11pt] font-medium text-[#666666] block">{cat} :</span>
                  <span className="text-[11pt] font-medium text-[#666666] block">{grouped[cat].join(", ")}</span>
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
          <section key="projects" className="flex flex-col gap-[8pt] mb-[8pt]">
            <SectionHeading title={STANDARD_LABELS.projects} />
            <div className="flex flex-col gap-[8pt]">
              {visible.map(proj => (
                <div key={proj.id} className="flex flex-col gap-[3pt] mb-[4pt]">
                  {proj.url ? (
                    <a
                      href={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`}
                      className="text-[11pt] font-medium text-[#666666] hover:underline m-0"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {proj.title}
                    </a>
                  ) : (
                    <span className="text-[11pt] font-medium text-[#666666]">{proj.title}</span>
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
          <section key="certifications" className="flex flex-col gap-[8pt] mb-[8pt]">
            <SectionHeading title={STANDARD_LABELS.certifications} />
            <div className="flex flex-col gap-[8pt]">
              {visible.map(cert => (
                <div key={cert.id} className="flex flex-col gap-[1.5pt]">
                  {cert.credentialUrl ? (
                    <a
                      href={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                      className="text-[11pt] font-medium text-[#666666] hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {cert.title}
                    </a>
                  ) : (
                    <span className="text-[11pt] font-medium text-[#666666]">{cert.title}</span>
                  )}
                  <span className="text-[11pt] font-medium text-[#666666]">
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

  const renderSectionById = (sectionId: string) => {
    if (isCustomSection(sectionId)) {
      const custom = data.customSections.find(s => s.id === sectionId);
      if (!custom) return null;
      const visibleItems = custom.items.filter(i => !i.hidden);
      if (visibleItems.length === 0) return null;
      return (
        <section key={sectionId} className="flex flex-col gap-[8pt] mb-[8pt]">
          <SectionHeading title={custom.title} />
          <div className="flex flex-col gap-[8pt]">{renderCustomBody(custom)}</div>
        </section>
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

  const pad = slateproPtToPx(T.pagePaddingPt);

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
      <div className="flex flex-row items-center gap-[10pt] mb-[4pt]">
        <div className="w-[70pt] h-[70pt] shrink-0 rounded-full border border-black flex items-center justify-center">
          {initials ? <span className="text-[25pt] text-[#373737] leading-none">{initials}</span> : null}
        </div>
        <div className="flex flex-col gap-[3pt] min-w-0 flex-1">
          {profile.fullName ? <h1 className="text-[28pt] font-semibold text-[#373737] m-0 leading-tight">{profile.fullName}</h1> : null}
          {profile.title ? <p className="text-[14pt] font-light text-[#373737] m-0 leading-[1.4]">{profile.title}</p> : null}
        </div>
      </div>

      <div className="w-full h-[0.5px] bg-[#373737] mb-[8pt]" />

      <div className="flex flex-row items-stretch w-full">
        <div
          className="flex flex-col"
          style={{
            width: T.layout.leftColumnWidth,
            paddingRight: `${T.layout.leftColumnPaddingRight}pt`,
          }}
        >
          {renderColumn(leftColumnIds)}
        </div>
        <div className="w-[0.5px] min-h-full bg-[#373737] shrink-0" />
        <div
          className="flex flex-col"
          style={{
            width: T.layout.rightColumnWidth,
            paddingLeft: `${T.layout.rightColumnPaddingLeft}pt`,
          }}
        >
          {renderContactBlock()}
          {renderColumn(rightColumnIds)}
        </div>
      </div>
    </ScaledA4PreviewShell>
  );
};

export default SlateproPreview;
