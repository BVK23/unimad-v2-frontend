import React from "react";
import { Globe } from "lucide-react";
import { ResumeData } from "../../../../types";
import HtmlDisplay from "../../shared/HtmlDisplay";
import ScaledA4PreviewShell from "../../shared/ScaledA4PreviewShell";
import { parseDate } from "../../shared/dateUtils";
import { deduplicateSectionOrder } from "../../shared/sectionOrderUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";

interface ModernPreviewProps {
  data: ResumeData;
  previewScale: number;
  isModal?: boolean;
}

const ModernPreview: React.FC<ModernPreviewProps> = ({ data, previewScale, isModal = false }) => {
  const { profile, experience, education, skills, projects, certifications, customSections, sectionOrder } = data;
  const sectionTitleClass = "text-[11px] font-bold text-brand-500 uppercase tracking-[1px] mb-[8px]";
  const htmlBodyClass = "text-[10px] text-slate-700 leading-[1.4]";

  const renderSection = (id: string) => {
    switch (id) {
      case "profile":
        return (
          <section key="profile">
            <h3 className={sectionTitleClass}>Summary</h3>
            <HtmlDisplay content={profile.summary} className={htmlBodyClass} variant="pdfTight" />
          </section>
        );
      case "experience":
        if (experience.length === 0) return null;
        return (
          <section key="experience">
            <h3 className={sectionTitleClass}>Experience</h3>
            <div>
              {experience
                .filter(e => !e.hidden)
                .map(exp => (
                  <div key={exp.id} className="mb-[10px]">
                    <div className="flex justify-between items-end mb-[2px]">
                      <h4 className="font-bold text-[11px] text-slate-900">{exp.role}</h4>
                      <span className="text-[9px] text-slate-500">
                        {parseDate(exp.startDate)} - {exp.current ? "Present" : parseDate(exp.endDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-end mb-[2px]">
                      <p className="text-[10px] text-brand-600 font-semibold">{exp.company}</p>
                      {exp.location && <span className="text-[9px] text-slate-400">{exp.location}</span>}
                    </div>
                    <HtmlDisplay content={exp.description} className={htmlBodyClass} variant="pdfTight" />
                  </div>
                ))}
            </div>
          </section>
        );
      case "education":
        if (education.length === 0) return null;
        return (
          <section key="education">
            <h3 className={sectionTitleClass}>Education</h3>
            <div>
              {education
                .filter(e => !e.hidden)
                .map(edu => (
                  <div key={edu.id} className="mb-[8px]">
                    <h4 className="font-bold text-[11px] text-slate-900">{edu.school}</h4>
                    <p className="text-[10px] text-slate-700">{edu.degree}</p>
                    <div className="flex justify-between items-end mb-[2px] mt-[2px]">
                      <p className="text-[9px] text-slate-500">
                        {parseDate(edu.startDate)} - {edu.current ? "Present" : parseDate(edu.endDate)}
                      </p>
                      {edu.location && <span className="text-[9px] text-slate-400">{edu.location}</span>}
                    </div>
                    {edu.description && (
                      <HtmlDisplay content={edu.description} className={`${htmlBodyClass} mt-[2px]`} variant="pdfTight" />
                    )}
                  </div>
                ))}
            </div>
          </section>
        );
      case "skills":
        if (skills.length === 0) return null;
        return (
          <section key="skills">
            <h3 className={sectionTitleClass}>Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skills
                .filter(s => !s.hidden)
                .map(skill => (
                  <span key={skill.id} className="text-[9px] bg-slate-100 text-slate-700 px-2 py-1 rounded">
                    {skill.name}
                  </span>
                ))}
            </div>
          </section>
        );
      case "projects":
        if (projects.length === 0) return null;
        return (
          <section key="projects">
            <h3 className={sectionTitleClass}>Projects</h3>
            <div>
              {projects
                .filter(p => !p.hidden)
                .map(proj => (
                  <div key={proj.id} className="mb-[10px]">
                    <div className="flex items-center mb-[2px]">
                      <h4 className="font-bold text-[11px] text-slate-900">{proj.title}</h4>
                      {proj.url && (
                        <a
                          href={proj.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-500 hover:text-brand-600 flex-shrink-0"
                        >
                          <Globe size={9} className="ml-[3px]" />
                        </a>
                      )}
                    </div>
                    <HtmlDisplay content={proj.description} className={htmlBodyClass} variant="pdfTight" />
                  </div>
                ))}
            </div>
          </section>
        );
      case "certifications":
        if (certifications.length === 0) return null;
        return (
          <section key="certifications">
            <h3 className={sectionTitleClass}>Certifications</h3>
            <div>
              {certifications
                .filter(c => !c.hidden)
                .map(cert => (
                  <div key={cert.id} className="mb-[8px]">
                    <div className="flex items-center mb-[2px]">
                      <span className="font-bold text-[11px] text-slate-900">{cert.title}</span>
                      {cert.credentialUrl && (
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-500 hover:text-brand-600 flex-shrink-0"
                        >
                          <Globe size={9} className="ml-[3px]" />
                        </a>
                      )}
                    </div>
                    <div className="flex justify-between items-end mb-[2px]">
                      {cert.issuer && <span className="text-[10px] text-brand-600 font-semibold">{cert.issuer}</span>}
                      {cert.date && <span className="text-[9px] text-slate-500">{parseDate(cert.date)}</span>}
                    </div>
                    {cert.description && <HtmlDisplay content={cert.description} className={htmlBodyClass} variant="pdfTight" />}
                  </div>
                ))}
            </div>
          </section>
        );
      default:
        const customSec = customSections.find(s => s.id === id);
        if (!customSec) return null;
        return (
          <section key={customSec.id}>
            <h3 className={sectionTitleClass}>{customSec.title}</h3>
            <div>
              {customSec.items
                .filter(i => !i.hidden)
                .map(item => (
                  <div key={item.id} className="mb-[10px]">
                    <div className="flex justify-between items-end mb-[2px]">
                      {item.title && <h4 className="font-bold text-[11px] text-slate-900">{item.title}</h4>}
                      {item.subtitle && <span className="text-[9px] text-slate-500">{item.subtitle}</span>}
                    </div>
                    {(item.hasDates && (item.startDate || item.endDate)) || (item.hasLocation && item.location) ? (
                      <div className="flex justify-between text-[9px] text-slate-400 mb-[2px]">
                        {item.hasLocation && <span className="text-slate-400">{item.location}</span>}
                        {item.hasDates && (
                          <span>
                            {item.startDate &&
                              `${parseDate(item.startDate)} - ${item.current ? "Present" : item.endDate ? parseDate(item.endDate) : ""}`}
                          </span>
                        )}
                      </div>
                    ) : null}
                    <HtmlDisplay content={item.description} className={htmlBodyClass} variant="pdfTight" />
                  </div>
                ))}
            </div>
          </section>
        );
    }
  };

  return (
    <ScaledA4PreviewShell
      previewScale={previewScale}
      isModal={isModal}
      outerClassName="bg-white shadow-2xl text-slate-900 mx-auto"
      innerClassName="h-full w-full font-sans"
      scaledInnerStyle={{ padding: "40px" }}
      modalPadding="40px"
    >
      <div className="flex justify-between items-start border-b-2 border-brand-500 pb-[20px] mb-[20px]">
        <div>
          <h1 className="text-[24px] font-bold text-slate-900 uppercase">{profile.fullName}</h1>
          <p className="text-[14px] text-brand-600 font-medium mt-[4px]">{profile.title}</p>
        </div>
        <div className="text-right text-[10px] text-slate-600 space-y-0.5">
          <p className="mb-[2px]">{profile.email}</p>
          <p className="mb-[2px]">{profile.phone}</p>
          <p className="mb-[2px]">{[profile.city, profile.country].filter(Boolean).join(", ")}</p>
          {profile.portfolio && (
            <a
              href={getPortfolioUrl(profile.portfolio)}
              className="text-brand-500 hover:underline block mb-[2px]"
              target="_blank"
              rel="noopener noreferrer"
            >
              Portfolio
            </a>
          )}
          {profile.linkedin && (
            <a
              href={getLinkedinUrl(profile.linkedin)}
              className="text-brand-500 hover:underline block mb-[2px]"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          )}
          {profile.github && (
            <a
              href={getGithubUrl(profile.github)}
              className="text-brand-500 hover:underline block mb-[2px]"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          )}
        </div>
      </div>

      <div className="space-y-[15px]">
        {deduplicateSectionOrder(sectionOrder)
          .filter(s => !s.hidden)
          .map(s => renderSection(s.id))}
      </div>
    </ScaledA4PreviewShell>
  );
};

export default ModernPreview;
