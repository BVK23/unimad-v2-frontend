import React from "react";
import { Globe } from "lucide-react";
import { ResumeData } from "../../../../types";
import HtmlDisplay from "../../shared/HtmlDisplay";
import ScaledA4PreviewShell from "../../shared/ScaledA4PreviewShell";
import { parseDate } from "../../shared/dateUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";

interface ClassicPreviewProps {
  data: ResumeData;
  previewScale: number;
  isModal?: boolean;
}

const ClassicPreview: React.FC<ClassicPreviewProps> = ({ data, previewScale, isModal = false }) => {
  const { profile, experience, education, skills, projects, certifications, customSections, sectionOrder } = data;
  const sectionHeadingClass = "font-bold text-[11pt] text-slate-900 border-b border-slate-300 pb-[3px] mb-[8px]";
  const bodyHtmlClass = "text-[10pt] text-slate-800 leading-[1.4] mt-[2px]";
  const dateTextClass = "text-[9pt] text-slate-500";
  const locationTextClass = "text-[8pt] text-slate-400";

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "profile":
        return (
          <section key="profile" className="mb-[12px] last:mb-0">
            <h3 className={sectionHeadingClass}>Professional Summary</h3>
            <HtmlDisplay content={profile.summary} className={bodyHtmlClass} variant="pdfTight" />
          </section>
        );
      case "experience":
        if (experience.length === 0) return null;
        return (
          <section key="experience" className="mb-[12px] last:mb-0">
            <h3 className={sectionHeadingClass}>Experience</h3>
            <div>
              {experience
                .filter(e => !e.hidden)
                .map(exp => (
                  <div key={exp.id} className="mb-[8px]">
                    <div className="flex justify-between items-end mb-[2px] text-slate-900">
                      <span className="text-[10pt] font-semibold">{exp.company}</span>
                      <span className={dateTextClass}>
                        {parseDate(exp.startDate)} – {exp.current ? "Present" : parseDate(exp.endDate)}
                      </span>
                    </div>
                    <div className="italic text-[10pt] text-slate-700 mb-[2px]">{exp.role}</div>
                    <HtmlDisplay content={exp.description} className={bodyHtmlClass} variant="pdfTight" />
                  </div>
                ))}
            </div>
          </section>
        );
      case "education":
        if (education.length === 0) return null;
        return (
          <section key="education" className="mb-[12px] last:mb-0">
            <h3 className={sectionHeadingClass}>Education</h3>
            <div>
              {education
                .filter(e => !e.hidden)
                .map(edu => (
                  <div key={edu.id} className="mb-[6px]">
                    <div className="flex justify-between items-end mb-[2px]">
                      <div>
                        <div className="font-bold text-[10pt] text-slate-900">{edu.school}</div>
                        <div className="text-[10pt] text-slate-700">{edu.degree}</div>
                        {edu.location && <div className={locationTextClass}>{edu.location}</div>}
                      </div>
                      <div className={`text-right ${dateTextClass}`}>
                        {parseDate(edu.startDate)} – {edu.current ? "Present" : parseDate(edu.endDate)}
                      </div>
                    </div>
                    {edu.description && <HtmlDisplay content={edu.description} className={bodyHtmlClass} variant="pdfTight" />}
                  </div>
                ))}
            </div>
          </section>
        );
      case "skills":
        if (skills.length === 0) return null;
        return (
          <section key="skills" className="mb-[12px] last:mb-0">
            <h3 className={sectionHeadingClass}>Skills</h3>
            <p className="text-[10pt] text-slate-700">
              {skills
                .filter(s => !s.hidden)
                .map(s => s.name)
                .join(" • ")}
            </p>
          </section>
        );
      case "projects":
        if (projects.length === 0) return null;
        return (
          <section key="projects" className="mb-[12px] last:mb-0">
            <h3 className={sectionHeadingClass}>Projects</h3>
            <div>
              {projects
                .filter(p => !p.hidden)
                .map(proj => (
                  <div key={proj.id} className="mb-[8px]">
                    <div className="flex items-center mb-[2px]">
                      <span className="font-bold text-[10pt] text-slate-900">{proj.title}</span>
                      {proj.url && (
                        <a
                          href={proj.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-slate-700 flex-shrink-0"
                        >
                          <Globe size={9} className="ml-[3px]" />
                        </a>
                      )}
                    </div>
                    <HtmlDisplay content={proj.description} className={bodyHtmlClass} variant="pdfTight" />
                  </div>
                ))}
            </div>
          </section>
        );
      case "certifications":
        if (certifications.length === 0) return null;
        return (
          <section key="certifications" className="mb-[12px] last:mb-0">
            <h3 className={sectionHeadingClass}>Certifications</h3>
            <div>
              {certifications
                .filter(c => !c.hidden)
                .map(cert => (
                  <div key={cert.id} className="mb-[6px] text-[10pt]">
                    <div className="flex items-center mb-[2px]">
                      <span className="font-bold text-[10pt] text-slate-900">{cert.title}</span>
                      {cert.credentialUrl && (
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-slate-700 flex-shrink-0"
                        >
                          <Globe size={9} className="ml-[3px]" />
                        </a>
                      )}
                    </div>
                    <div className="flex justify-between items-end mb-[2px]">
                      {cert.issuer && <div className="text-[10pt] text-slate-700">{cert.issuer}</div>}
                      {cert.date && <div className={`text-right ${dateTextClass}`}>{parseDate(cert.date)}</div>}
                    </div>
                    {cert.description && <HtmlDisplay content={cert.description} className={bodyHtmlClass} variant="pdfTight" />}
                  </div>
                ))}
            </div>
          </section>
        );
      default:
        const customSec = customSections.find(sec => sec.id === sectionId);
        if (!customSec) return null;
        return (
          <section key={customSec.id} className="mb-[12px] last:mb-0">
            <h3 className={sectionHeadingClass}>{customSec.title}</h3>
            {customSec.items
              .filter(i => !i.hidden)
              .map(item => (
                <div key={item.id} className="text-[10pt] mb-[8px]">
                  <div className="flex justify-between items-end mb-[2px] text-slate-900">
                    {item.title && <span className="text-[10pt] font-semibold">{item.title}</span>}
                    {item.startDate && (
                      <span className={dateTextClass}>
                        {parseDate(item.startDate)} – {item.current ? "Present" : parseDate(item.endDate)}
                      </span>
                    )}
                  </div>
                  {item.subtitle && <div className="italic text-[10pt] text-slate-700 mb-[2px]">{item.subtitle}</div>}
                  {item.location && <div className={locationTextClass}>{item.location}</div>}
                  <HtmlDisplay content={item.description} className={bodyHtmlClass} variant="pdfTight" />
                </div>
              ))}
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
      <div className="text-center border-b-2 border-slate-800 pb-[15px] mb-[20px]">
        <h1 className="text-[22pt] font-bold text-slate-900 mb-[6px]">{profile.fullName}</h1>
        <div className="text-[9pt] text-slate-600 flex justify-center gap-[4px] flex-wrap items-center">
          <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
          <span className="text-slate-400">|</span>
          <span>{profile.email}</span>
          <span className="text-slate-400">|</span>
          <span>{profile.phone}</span>
          {profile.portfolio && (
            <>
              <span className="text-slate-400">|</span>
              <a href={getPortfolioUrl(profile.portfolio)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                Portfolio
              </a>
            </>
          )}
          {profile.linkedin && (
            <>
              <span className="text-slate-400">|</span>
              <a href={getLinkedinUrl(profile.linkedin)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                LinkedIn
              </a>
            </>
          )}
          {profile.github && (
            <>
              <span className="text-slate-400">|</span>
              <a href={getGithubUrl(profile.github)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                GitHub
              </a>
            </>
          )}
        </div>
      </div>

      <div className="space-y-[12px]">{sectionOrder.filter(s => !s.hidden).map(s => renderSection(s.id))}</div>
    </ScaledA4PreviewShell>
  );
};

export default ClassicPreview;
