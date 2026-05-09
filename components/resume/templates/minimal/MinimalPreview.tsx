import React from "react";
import { Globe } from "lucide-react";
import { ResumeData } from "../../../../types";
import HtmlDisplay from "../../shared/HtmlDisplay";
import ScaledA4PreviewShell from "../../shared/ScaledA4PreviewShell";
import { parseDate } from "../../shared/dateUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";

interface MinimalPreviewProps {
  data: ResumeData;
  previewScale: number;
  isModal?: boolean;
}

const MinimalPreview: React.FC<MinimalPreviewProps> = ({ data, previewScale, isModal = false }) => {
  const { profile, experience, education, skills, projects, certifications, customSections, sectionOrder } = data;
  const mainSectionTitleClass =
    "font-bold text-slate-900 mb-[8px] text-[10pt] uppercase tracking-[0.8pt] border-b border-slate-200 pb-[3px]";
  const sidebarSectionTitleClass = "font-bold text-slate-900 mb-[6px] text-[10pt]";
  const bodyHtmlClass = "text-[9pt] text-slate-600 leading-[1.4] mt-[2px]";

  const renderSectionMinimal = (id: string) => {
    switch (id) {
      case "profile":
        return (
          <section key="profile" className="mb-[12px] last:mb-0">
            <h3 className={mainSectionTitleClass}>Profile</h3>
            <HtmlDisplay content={profile.summary} className={bodyHtmlClass} variant="pdfTight" />
          </section>
        );
      case "experience":
        if (experience.length === 0) return null;
        return (
          <section key="experience" className="mb-[12px] last:mb-0">
            <h3 className={mainSectionTitleClass}>Experience</h3>
            <div>
              {experience
                .filter(e => !e.hidden)
                .map(exp => (
                  <div key={exp.id} className="mb-[8px]">
                    <div className="flex justify-between items-end mb-[2px]">
                      <h4 className="font-bold text-slate-800 text-[10pt]">{exp.role}</h4>
                      <span className="text-[8pt] text-slate-500">
                        {parseDate(exp.startDate)} - {exp.current ? "Present" : parseDate(exp.endDate)}
                      </span>
                    </div>
                    <p className="text-[9pt] text-slate-500 italic">{exp.company}</p>
                    <HtmlDisplay content={exp.description} className={bodyHtmlClass} variant="pdfTight" />
                  </div>
                ))}
            </div>
          </section>
        );
      case "education":
        return null; // Rendered in side column
      case "skills":
        return null; // Rendered in side column
      case "projects":
        if (projects.length === 0) return null;
        return (
          <section key="projects" className="mb-[12px] last:mb-0">
            <h3 className={mainSectionTitleClass}>Projects</h3>
            <div>
              {projects
                .filter(p => !p.hidden)
                .map(proj => (
                  <div key={proj.id} className="mb-[8px]">
                    <div className="flex items-center mb-[2px]">
                      <h4 className="font-bold text-slate-800 text-[10pt]">{proj.title}</h4>
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
            <h3 className={mainSectionTitleClass}>Certifications</h3>
            <div>
              {certifications
                .filter(c => !c.hidden)
                .map(cert => (
                  <div key={cert.id} className="mb-[6px]">
                    <div className="flex items-center mb-[2px]">
                      <span className="font-bold text-slate-800 text-[10pt]">{cert.title}</span>
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
                      {cert.issuer && <span className="text-[9pt] text-slate-500 italic">{cert.issuer}</span>}
                      {cert.date && <span className="text-[8pt] text-slate-500">{parseDate(cert.date)}</span>}
                    </div>
                    {cert.description && <HtmlDisplay content={cert.description} className={bodyHtmlClass} variant="pdfTight" />}
                  </div>
                ))}
            </div>
          </section>
        );
      default:
        const customSec = customSections.find(s => s.id === id);
        if (!customSec) return null;
        return (
          <section key={customSec.id} className="mb-[12px] last:mb-0">
            <h3 className={mainSectionTitleClass}>{customSec.title}</h3>
            <div>
              {customSec.items
                .filter(i => !i.hidden)
                .map(item => (
                  <div key={item.id} className="text-[9pt] text-slate-700 mb-[8px]">
                    <div className="flex justify-between items-end mb-[2px]">
                      {item.title && <span className="font-bold block text-slate-800 text-[10pt]">{item.title}</span>}
                      {item.subtitle && <span className="text-[8pt] text-slate-500">{item.subtitle}</span>}
                    </div>
                    {item.hasDates && (item.startDate || item.endDate) ? (
                      <div className="flex justify-between text-[8pt] text-slate-500 mb-[2px]">
                        {item.hasLocation ? <span className="text-slate-400">{item.location}</span> : <span></span>}
                        <span className="italic">{item.startDate && `${item.startDate}${item.endDate ? ` - ${item.endDate}` : ""}`}</span>
                      </div>
                    ) : item.hasLocation && item.location ? (
                      <div className="text-[8pt] text-slate-400 mb-[2px]">{item.location}</div>
                    ) : null}
                    <HtmlDisplay content={item.description} className={bodyHtmlClass} variant="pdfTight" />
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
      <div className="text-center mb-[20px]">
        <h1 className="text-[22pt] font-bold text-slate-900 mb-[6px] leading-tight">{profile.fullName}</h1>
        <p className="text-[9pt] text-slate-500 flex justify-center items-center gap-[4px] flex-wrap">
          <span>{profile.email}</span>
          <span className="text-[9pt] text-slate-400">•</span>
          <span>{profile.phone}</span>
          <span className="text-[9pt] text-slate-400">•</span>
          <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
          {profile.portfolio && (
            <>
              <span className="text-[9pt] text-slate-400">•</span>
              <a href={getPortfolioUrl(profile.portfolio)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                Portfolio
              </a>
            </>
          )}
          {profile.linkedin && (
            <>
              <span className="text-[9pt] text-slate-400">•</span>
              <a href={getLinkedinUrl(profile.linkedin)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                LinkedIn
              </a>
            </>
          )}
          {profile.github && (
            <>
              <span className="text-[9pt] text-slate-400">•</span>
              <a href={getGithubUrl(profile.github)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                GitHub
              </a>
            </>
          )}
        </p>
      </div>

      <div className="flex">
        <div className="w-[30%] text-right border-r border-slate-200 pr-[15px] space-y-[12px]">
          {/* Fixed Sidebar: Education & Skills */}
          <section className="mb-[12px] last:mb-0">
            <h3 className={sidebarSectionTitleClass}>Education</h3>
            {education
              .filter(e => !e.hidden)
              .map(edu => (
                <div key={edu.id} className="mb-[8px]">
                  <p className="font-semibold text-[10pt] text-slate-900">{edu.school}</p>
                  <p className="text-[9pt] text-slate-500 italic">{edu.degree}</p>
                  <p className="text-[8pt] text-slate-500">{edu.endDate}</p>
                  {edu.location && <p className="text-[8pt] text-slate-400">{edu.location}</p>}
                </div>
              ))}
          </section>
          <section className="mb-[12px] last:mb-0">
            <h3 className={sidebarSectionTitleClass}>Skills</h3>
            <div className="flex flex-col items-end">
              {skills
                .filter(s => !s.hidden)
                .map(skill => (
                  <span key={skill.id} className="text-[9pt] text-slate-600 mb-[2px]">
                    {skill.name}
                  </span>
                ))}
            </div>
          </section>
        </div>
        <div className="w-[70%] pl-[15px] space-y-[12px]">
          {/* Reorderable Main Content */}
          {sectionOrder
            .filter(s => !s.hidden)
            .map(s => {
              if (s.id === "education" || s.id === "skills") return null;
              return renderSectionMinimal(s.id);
            })}
        </div>
      </div>
    </ScaledA4PreviewShell>
  );
};

export default MinimalPreview;
