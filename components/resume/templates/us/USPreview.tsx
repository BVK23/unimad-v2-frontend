import React from "react";
import { ResumeData } from "../../../../types";
import { SECTIONS, isCustomSection } from "../../config/constants";
import HtmlDisplay from "../../shared/HtmlDisplay";
import ScaledA4PreviewShell from "../../shared/ScaledA4PreviewShell";
import { parseDate } from "../../shared/dateUtils";
import { deduplicateSectionOrder } from "../../shared/sectionOrderUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";

interface USPreviewProps {
  data: ResumeData;
  previewScale: number;
  isModal?: boolean;
}

// Helper to convert PDF points to standard web pixels (approx 1pt = 1.333px)
const ptToPx = (pt: number) => pt * (4 / 3);

// Must mirror TOKENS.lineHeights.body in USPDF so preview text rhythm matches the PDF.
const US_BODY_LINE_HEIGHT = 1.3;

const USPreview: React.FC<USPreviewProps> = ({ data, previewScale, isModal = false }) => {
  const { profile, experience, education, skills, projects, certifications, customSections, sectionOrder } = data;

  const usInnerStyle = {
    fontFamily: '"Times New Roman", Times, serif',
    color: "#000000",
    fontSize: `${ptToPx(10)}px`,
    lineHeight: 1.15,
    backgroundColor: "#ffffff",
  } as const;

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{ marginTop: `${ptToPx(16)}px` }}>
      <h2
        className="uppercase font-bold leading-none"
        style={{ fontSize: `${ptToPx(12)}px`, letterSpacing: "0.08em", marginBottom: `${ptToPx(4)}px` }}
      >
        {children}
      </h2>
      <div
        style={{
          width: "100%",
          borderBottom: "1px solid #000000",
          marginTop: `${ptToPx(2)}px`,
          marginBottom: `${ptToPx(6)}px`,
        }}
      />
    </div>
  );

  const renderSection = (id: string) => {
    if (isCustomSection(id)) {
      const customSection = customSections?.find(s => s.id === id);
      if (!customSection || !customSection.items || !customSection.items.some(item => !item.hidden)) return null;

      const visibleItems = customSection.items.filter(d => !d.hidden);

      return (
        <section key={id}>
          {visibleItems.map((item, i) => (
            <div key={i} style={{ marginBottom: `${ptToPx(6)}px`, breakInside: i === 0 ? "avoid" : "auto" }}>
              {i === 0 && <SectionTitle>{customSection.title || "Custom Section"}</SectionTitle>}
              <div className="flex justify-between items-start">
                <div className="flex-1" style={{ paddingRight: `${ptToPx(8)}px` }}>
                  {item.title && (
                    <h3 className="font-bold block" style={{ fontSize: `${ptToPx(11)}px`, lineHeight: 1.15 }}>
                      {item.title}
                    </h3>
                  )}
                  {item.subtitle && (
                    <p className="italic block" style={{ fontSize: `${ptToPx(10)}px`, marginTop: `${ptToPx(4)}px`, lineHeight: 1.15 }}>
                      {item.subtitle}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 text-right" style={{ minWidth: `${ptToPx(90)}px` }}>
                  {item.location && <span style={{ fontSize: `${ptToPx(9)}px`, color: "#333333", lineHeight: 1.15 }}>{item.location}</span>}
                  {item.startDate && (
                    <span style={{ fontSize: `${ptToPx(9)}px`, color: "#333333", lineHeight: 1.15 }}>
                      {parseDate(item.startDate)} — {item.current ? "Present" : parseDate(item.endDate)}
                    </span>
                  )}
                </div>
              </div>
              {item.description && (
                <div style={{ marginTop: `${ptToPx(4)}px` }}>
                  <HtmlDisplay content={item.description} lineHeight={US_BODY_LINE_HEIGHT} />
                </div>
              )}
            </div>
          ))}
        </section>
      );
    }

    switch (id) {
      case SECTIONS.PROFILE:
        if (!profile?.summary) return null;
        return (
          <section key={id} style={{ breakInside: "avoid" }}>
            <SectionTitle>Professional Summary</SectionTitle>
            <HtmlDisplay content={profile.summary} lineHeight={US_BODY_LINE_HEIGHT} />
          </section>
        );
      case SECTIONS.EXPERIENCE: {
        const visibleExperiences = (experience || []).filter(e => !e.hidden);
        if (!visibleExperiences.length) return null;
        return (
          <section key={id}>
            <SectionTitle>Experience</SectionTitle>
            {visibleExperiences.map((exp, i) => (
              <div key={i} style={{ marginBottom: `${ptToPx(6)}px`, breakInside: i === 0 ? "avoid" : "auto" }}>
                <div className="flex justify-between items-start">
                  <div className="flex-1" style={{ paddingRight: `${ptToPx(8)}px` }}>
                    <h3 className="font-bold leading-none" style={{ fontSize: `${ptToPx(11)}px` }}>
                      {exp.company}
                    </h3>
                    {exp.role && (
                      <p className="italic leading-none" style={{ fontSize: `${ptToPx(10)}px`, marginTop: `${ptToPx(4)}px` }}>
                        {exp.role}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right" style={{ minWidth: `${ptToPx(90)}px` }}>
                    {exp.location && <span style={{ fontSize: `${ptToPx(9)}px`, color: "#333333", lineHeight: 1 }}>{exp.location}</span>}
                    <span style={{ fontSize: `${ptToPx(9)}px`, color: "#333333", lineHeight: 1 }}>
                      {parseDate(exp.startDate)} — {exp.current ? "Present" : parseDate(exp.endDate)}
                    </span>
                  </div>
                </div>
                {exp.description && (
                  <div style={{ marginTop: `${ptToPx(4)}px` }}>
                    <HtmlDisplay content={exp.description} lineHeight={US_BODY_LINE_HEIGHT} />
                  </div>
                )}
              </div>
            ))}
          </section>
        );
      }
      case SECTIONS.EDUCATION: {
        const visibleEducations = (education || []).filter(e => !e.hidden);
        if (!visibleEducations.length) return null;
        return (
          <section key={id}>
            <SectionTitle>Education</SectionTitle>
            {visibleEducations.map((edu, i) => (
              <div key={i} style={{ marginBottom: `${ptToPx(6)}px`, breakInside: i === 0 ? "avoid" : "auto" }}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold leading-none" style={{ fontSize: `${ptToPx(11)}px` }}>
                      {edu.degree || edu.school}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span style={{ fontSize: `${ptToPx(9)}px`, color: "#333333", lineHeight: 1 }}>
                      {parseDate(edu.startDate)} — {edu.current ? "Present" : parseDate(edu.endDate)}
                    </span>
                  </div>
                </div>
                <p className="italic leading-none" style={{ fontSize: `${ptToPx(10)}px`, marginTop: `${ptToPx(4)}px` }}>
                  {edu.school}
                </p>
                {edu.description && (
                  <div
                    style={{ fontSize: `${ptToPx(10)}px`, color: "#000000", lineHeight: US_BODY_LINE_HEIGHT, marginTop: `${ptToPx(4)}px` }}
                  >
                    <HtmlDisplay content={edu.description} lineHeight={US_BODY_LINE_HEIGHT} />
                  </div>
                )}
              </div>
            ))}
          </section>
        );
      }
      case SECTIONS.SKILLS: {
        const visibleSkills = (skills || []).filter(s => !s.hidden);
        if (!visibleSkills.length) return null;
        const grouped = visibleSkills.reduce(
          (acc, s) => {
            const cat = s.category?.trim() || "Other";
            acc[cat] = acc[cat] || [];
            if (s.name) acc[cat].push(s.name);
            return acc;
          },
          {} as Record<string, string[]>
        );

        return (
          <section key={id} style={{ breakInside: "avoid" }}>
            <SectionTitle>Skills</SectionTitle>
            {Object.entries(grouped).map(([cat, list], i) => (
              <div key={i} style={{ marginBottom: `${ptToPx(2)}px` }}>
                <span className="mr-3">•</span>
                <span className="font-bold">{cat}:</span> {list.join(", ")}
              </div>
            ))}
          </section>
        );
      }
      case SECTIONS.PROJECTS: {
        const visibleProjects = (projects || []).filter(p => !p.hidden);
        if (!visibleProjects.length) return null;
        return (
          <section key={id}>
            <SectionTitle>Projects</SectionTitle>
            {visibleProjects.map((proj, i) => (
              <div key={i} style={{ marginBottom: `${ptToPx(6)}px`, breakInside: i === 0 ? "avoid" : "auto" }}>
                {proj.url ? (
                  <a
                    href={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-black no-underline hover:underline"
                  >
                    <h3 className="font-bold leading-none" style={{ fontSize: `${ptToPx(11)}px` }}>
                      {proj.title}
                    </h3>
                  </a>
                ) : (
                  <h3 className="font-bold leading-none" style={{ fontSize: `${ptToPx(11)}px` }}>
                    {proj.title}
                  </h3>
                )}
                {proj.description && (
                  <div style={{ marginTop: `${ptToPx(2)}px` }}>
                    <HtmlDisplay content={proj.description} lineHeight={US_BODY_LINE_HEIGHT} />
                  </div>
                )}
              </div>
            ))}
          </section>
        );
      }
      case SECTIONS.CERTIFICATIONS: {
        const visibleCertifications = (certifications || []).filter(c => !c.hidden);
        if (!visibleCertifications.length) return null;
        return (
          <section key={id}>
            <SectionTitle>Certifications</SectionTitle>
            {visibleCertifications.map((cert, i) => (
              <div key={i} style={{ marginBottom: `${ptToPx(6)}px`, breakInside: i === 0 ? "avoid" : "auto" }}>
                <div className="flex justify-between items-start">
                  <div className="flex-1" style={{ paddingRight: `${ptToPx(8)}px` }}>
                    <h3 className="font-bold leading-none" style={{ fontSize: `${ptToPx(11)}px` }}>
                      {cert.title}
                      {cert.credentialUrl && (
                        <>
                          {" – "}
                          <a
                            href={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-black hover:underline"
                            style={{ fontWeight: "normal" }}
                          >
                            Verify Link
                          </a>
                        </>
                      )}
                    </h3>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    {cert.date && (
                      <span style={{ fontSize: `${ptToPx(9)}px`, color: "#333333", lineHeight: 1 }}>{parseDate(cert.date)}</span>
                    )}
                  </div>
                </div>
                {cert.issuer && (
                  <p className="italic leading-none" style={{ fontSize: `${ptToPx(10)}px`, marginTop: `${ptToPx(4)}px` }}>
                    {cert.issuer}
                  </p>
                )}
              </div>
            ))}
          </section>
        );
      }
      default:
        return null;
    }
  };

  const buildContactRow = () => {
    const p = profile || {};
    const items: React.ReactNode[] = [];

    if (p.email)
      items.push(
        <a key="email" href={`mailto:${p.email}`} className="text-black hover:underline">
          {p.email}
        </a>
      );
    if (p.phone) items.push(<span key="phone">{p.phone}</span>);
    if (p.linkedin)
      items.push(
        <a key="linkedin" href={getLinkedinUrl(p.linkedin)} target="_blank" rel="noreferrer" className="text-black hover:underline">
          LinkedIn
        </a>
      );
    if (p.github)
      items.push(
        <a key="github" href={getGithubUrl(p.github)} target="_blank" rel="noreferrer" className="text-black hover:underline">
          GitHub
        </a>
      );
    if (p.portfolio)
      items.push(
        <a key="portfolio" href={getPortfolioUrl(p.portfolio)} target="_blank" rel="noreferrer" className="text-black hover:underline">
          Portfolio
        </a>
      );

    const loc = [p.city, p.country].filter(Boolean).join(", ");
    if (loc) items.push(<span key="location">{loc}</span>);

    if (!items.length) return null;

    return (
      <div className="text-center" style={{ fontSize: `${ptToPx(11)}px`, marginBottom: `${ptToPx(6)}px` }}>
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {item}
            {i < items.length - 1 && " | "}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const orderedSections = sectionOrder || [
    { id: SECTIONS.PROFILE },
    { id: SECTIONS.EXPERIENCE },
    { id: SECTIONS.PROJECTS },
    { id: SECTIONS.SKILLS },
    { id: SECTIONS.CERTIFICATIONS },
    { id: SECTIONS.EDUCATION },
  ];

  return (
    <ScaledA4PreviewShell
      previewScale={previewScale}
      isModal={isModal}
      outerClassName="w-full mx-auto shadow-2xl"
      modalInnerStyle={usInnerStyle}
      modalPadding={`${ptToPx(24)}px`}
      scaledInnerStyle={{ ...usInnerStyle, padding: `${ptToPx(24)}px` }}
    >
      <h1
        className="text-center font-bold"
        style={{ fontSize: `${ptToPx(32)}px`, letterSpacing: "0.04em", marginBottom: `${ptToPx(4)}px` }}
      >
        {profile?.fullName || "Your Name"}
      </h1>
      {buildContactRow()}

      <div className="w-full h-full">
        {deduplicateSectionOrder(orderedSections)
          .filter(s => !s.hidden)
          .map(s => renderSection(s.id))}
      </div>
    </ScaledA4PreviewShell>
  );
};

export default USPreview;
