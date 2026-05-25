import React from "react";
import type { PdfHighlightMap } from "@/features/adk-chat/adkResumeHighlightDiff";
import { htmlToPlainText } from "@/utils/html-to-text";
import { Page, View, Text, StyleSheet, Link } from "@react-pdf/renderer";
import { ResumeData } from "../../../../types";
import { SECTIONS, isCustomSection } from "../../config/constants";
import HtmlRenderer from "../../shared/HtmlRenderer";
import { PdfAdkGutterHighlight } from "../../shared/PdfAdkGutterHighlight";
import { parseDate as formatDateMonthYear } from "../../shared/dateUtils";
import { baseStyles } from "../../shared/pdf-base-styles";
import { deduplicateSectionOrder } from "../../shared/sectionOrderUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";

const TOKENS = {
  colors: {
    text: "#373737",
    accent: "#346DE0",
    divider: "#373737",
    muted: "#666666",
  },
  spacing: {
    sectionGap: 11, // gap-[15px] → ~11pt
    sm: 3,
    md: 6, // gap-2 = 8px → ~6pt between entries
    lg: 9,
  },
  sizes: {
    name: 21,
    sectionTitle: 12,
    body: 9,
    contact: 9,
  },
};

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page, // padding:30, bg:#fff, flexDir:col, fontWeight:400
    color: TOKENS.colors.text,
    fontSize: TOKENS.sizes.body,
    fontFamily: "Onest",
  },
  header: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "0 0 7pt 0",
    textAlign: "center",
    gap: TOKENS.spacing.sm,
  },
  name: {
    fontSize: 21,
    fontWeight: 700,
    marginBottom: 6,
    color: TOKENS.colors.text,
  },
  contactRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 9,
    gap: 6,
    color: TOKENS.colors.text,
    flexWrap: "wrap",
  },
  contactSeparator: {
    fontSize: 12,
    color: TOKENS.colors.text,
  },
  link: {
    color: TOKENS.colors.text,
    textDecoration: "none",
  },
  section: {
    gap: TOKENS.spacing.sm, // Internal gap
  },
  sectionWrapper: {
    display: "flex",
    flexDirection: "column",
  },
  sectionHeading: {
    display: "flex",
    flexDirection: "column",
    gap: 2.4,
    marginBottom: TOKENS.spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: TOKENS.colors.text,
  },
  hr: {
    width: "100%",
    height: 1,
    backgroundColor: TOKENS.colors.divider,
  },
  sectionContent: {
    display: "flex",
    flexDirection: "column",
    gap: TOKENS.spacing.md,
  },
  entryRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    fontSize: 9,
    fontWeight: 600,
  },
  entryLeft: {
    fontWeight: 600,
    color: TOKENS.colors.text,
  },
  entryRight: {
    fontWeight: "normal",
    color: TOKENS.colors.text,
  },
  entryWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 5.4,
  },
  entryHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  descriptionWrapper: {
    fontSize: 9,
    color: TOKENS.colors.text,
  },
});

const SectionHeading = ({ title }: { title: string }) => (
  <View style={styles.sectionHeading} wrap={false}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.hr} />
  </View>
);

const Experiences = ({ experiences, highlights }: { experiences: ResumeData["experience"]; highlights: PdfHighlightMap }) => {
  const visibleExperiences = (experiences || []).filter(exp => !exp.hidden);
  if (!visibleExperiences.length) return null;

  return (
    <View style={styles.sectionWrapper}>
      {visibleExperiences.map((exp, idx) => (
        <PdfAdkGutterHighlight key={idx} kind={highlights[`experience:${exp.id}`]}>
          <View style={styles.entryWrapper} wrap={false}>
            {/* Anchor: SectionHeading glued to first entry */}
            {idx === 0 && <SectionHeading title="Work Experience" />}
            <View style={styles.entryHeader}>
              <View style={styles.entryRow}>
                <Text style={styles.entryLeft}>{exp.role}</Text>
                <Text style={styles.entryRight}>
                  {formatDateMonthYear(exp.startDate)} — {exp.current ? "Present" : formatDateMonthYear(exp.endDate)}
                </Text>
              </View>
              <View style={styles.entryRow}>
                <Text style={styles.entryLeft}>{exp.company}</Text>
                <Text style={styles.entryRight}>{exp.location || ""}</Text>
              </View>
            </View>
            {exp.description && (
              <View style={styles.descriptionWrapper}>
                <HtmlRenderer
                  html={exp.description}
                  style={{
                    fontSize: 9,
                    lineHeight: 1.4,
                    fontFamily: "Onest",
                    color: TOKENS.colors.text,
                  }}
                />
              </View>
            )}
          </View>
        </PdfAdkGutterHighlight>
      ))}
    </View>
  );
};

const Educations = ({ educations, highlights }: { educations: ResumeData["education"]; highlights: PdfHighlightMap }) => {
  const visibleEducations = (educations || []).filter(e => !e.hidden);
  if (!visibleEducations.length) return null;

  return (
    <View style={styles.sectionWrapper}>
      {visibleEducations.map((edu, idx) => (
        <PdfAdkGutterHighlight key={idx} kind={highlights[`education:${edu.id}`]}>
          <View style={styles.entryWrapper} wrap={false}>
            {idx === 0 && <SectionHeading title="Education" />}
            <View style={styles.entryHeader}>
              <View style={styles.entryRow}>
                <Text style={styles.entryLeft}>{edu.degree}</Text>
                <Text style={styles.entryRight}>
                  {formatDateMonthYear(edu.startDate)} — {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
                </Text>
              </View>
              <View style={styles.entryRow}>
                <Text style={styles.entryLeft}>{edu.school}</Text>
                <Text style={styles.entryRight}>{edu.location || ""}</Text>
              </View>
            </View>
            {edu.description && (
              <View style={styles.descriptionWrapper}>
                <HtmlRenderer
                  html={edu.description}
                  style={{
                    fontSize: 9,
                    lineHeight: 1.4,
                    fontFamily: "Onest",
                    color: TOKENS.colors.text,
                  }}
                />
              </View>
            )}
          </View>
        </PdfAdkGutterHighlight>
      ))}
    </View>
  );
};

const Projects = ({ projects, highlights }: { projects: ResumeData["projects"]; highlights: PdfHighlightMap }) => {
  const visibleProjects = (projects || []).filter(p => !p.hidden);
  if (!visibleProjects.length) return null;

  return (
    <View style={styles.sectionWrapper}>
      {visibleProjects.map((project, idx) => (
        <PdfAdkGutterHighlight key={idx} kind={highlights[`projects:${project.id}`]}>
          <View style={styles.entryWrapper} wrap={false}>
            {idx === 0 && <SectionHeading title="Projects" />}
            {project.url ? (
              <Link
                style={{ ...styles.link, fontWeight: 600, fontSize: 9 }}
                src={project.url.startsWith("http") ? project.url : `https://${project.url}`}
              >
                {project.title}
              </Link>
            ) : (
              <Text style={{ fontWeight: 600, fontSize: 9 }}>{project.title}</Text>
            )}
            {project.description && (
              <View style={styles.descriptionWrapper}>
                <HtmlRenderer
                  html={project.description}
                  style={{
                    fontSize: 9,
                    lineHeight: 1.4,
                    fontFamily: "Onest",
                    color: TOKENS.colors.text,
                  }}
                />
              </View>
            )}
          </View>
        </PdfAdkGutterHighlight>
      ))}
    </View>
  );
};

const Certifications = ({ certifications, highlights }: { certifications: ResumeData["certifications"]; highlights: PdfHighlightMap }) => {
  const visibleCertifications = (certifications || []).filter(c => !c.hidden);
  if (!visibleCertifications.length) return null;

  return (
    <View style={styles.sectionWrapper}>
      {visibleCertifications.map((cert, idx) => (
        <PdfAdkGutterHighlight key={idx} kind={highlights[`certifications:${cert.id}`]}>
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              marginBottom: 5,
            }}
            wrap={false}
          >
            {idx === 0 && <SectionHeading title="Certifications" />}
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 9,
                fontWeight: 600,
              }}
            >
              {cert.credentialUrl ? (
                <Link
                  style={styles.link}
                  src={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                >
                  <Text>{cert.title}</Text>
                </Link>
              ) : (
                <Text>{cert.title}</Text>
              )}
              <Text style={{ fontSize: 8, color: "#666666", fontWeight: "normal" }}>
                {cert.issuer}
                {cert.issuer && cert.date ? " - " : ""}
                {cert.date ? formatDateMonthYear(cert.date) : ""}
              </Text>
            </View>
            {cert.description && (
              <View style={styles.descriptionWrapper}>
                <HtmlRenderer
                  html={cert.description}
                  style={{
                    fontSize: 9,
                    lineHeight: 1.4,
                    fontFamily: "Onest",
                    color: TOKENS.colors.text,
                  }}
                />
              </View>
            )}
          </View>
        </PdfAdkGutterHighlight>
      ))}
    </View>
  );
};

const Skills = ({ skills, highlights }: { skills: ResumeData["skills"]; highlights: PdfHighlightMap }) => {
  const visibleSkills = (skills || []).filter(s => !s.hidden && s.name);
  if (!visibleSkills.length) return null;

  const groupedSkills = visibleSkills.reduce(
    (acc, skill) => {
      const cat = skill.category?.trim() || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill.name);
      return acc;
    },
    {} as Record<string, string[]>
  );

  const skillsStripe = highlights.skills;

  return (
    <PdfAdkGutterHighlight kind={skillsStripe}>
      <View style={styles.sectionWrapper}>
        {Object.entries(groupedSkills).map(([category, items], idx) => (
          // Column wrapper so SectionHeading (on idx===0) stays above the row, not inline with it
          <View key={idx} style={{ display: "flex", flexDirection: "column" }} wrap={false}>
            {idx === 0 && <SectionHeading title="Skills" />}
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-start",
                width: "98%",
                gap: 3,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: "bold", flexShrink: 0 }}>
                {category} : <Text style={{ fontSize: 9, fontWeight: "normal" }}>{items.join(", ")}</Text>
              </Text>
            </View>
          </View>
        ))}
      </View>
    </PdfAdkGutterHighlight>
  );
};

const SectionRenderer = ({ resume, type, highlights }: { resume: ResumeData; type: string; highlights: PdfHighlightMap }) => {
  if (isCustomSection(type)) {
    const customSection = resume.customSections?.find(s => s.id === type);
    if (!customSection || !customSection.items || !customSection.items.some(item => !item.hidden)) return null;

    const customStripe = highlights.customSections;

    return (
      <PdfAdkGutterHighlight kind={customStripe}>
        <View style={styles.sectionWrapper}>
          {customSection.items
            .filter(d => !d.hidden)
            .map((item, i) => (
              <View
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  fontSize: 9,
                  marginBottom: 4,
                }}
                wrap={false}
              >
                {i === 0 && <SectionHeading title={customSection.title || "Custom Section"} />}
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View>{item.title && <Text style={{ fontWeight: 600 }}>{item.title}</Text>}</View>
                </View>
                {item.description && (
                  <View style={styles.descriptionWrapper}>
                    <HtmlRenderer
                      html={item.description}
                      style={{
                        fontSize: 9,
                        lineHeight: 1.4,
                        fontFamily: "Onest",
                        color: TOKENS.colors.text,
                      }}
                    />
                  </View>
                )}
              </View>
            ))}
        </View>
      </PdfAdkGutterHighlight>
    );
  }

  switch (type) {
    case SECTIONS.PROFILE: {
      const summary = resume.profile?.summary;
      const hasSummary = Boolean(summary && htmlToPlainText(summary).trim());
      return hasSummary ? (
        <View style={styles.sectionWrapper} wrap={false}>
          <SectionHeading title="Professional Summary" />
          <PdfAdkGutterHighlight kind={highlights.profile}>
            <View style={styles.sectionContent}>
              <View style={styles.descriptionWrapper}>
                <HtmlRenderer
                  html={resume.profile.summary}
                  style={{
                    fontSize: 9,
                    lineHeight: 1.4,
                    fontFamily: "Onest",
                    color: TOKENS.colors.text,
                  }}
                />
              </View>
            </View>
          </PdfAdkGutterHighlight>
        </View>
      ) : null;
    }
    case SECTIONS.SKILLS:
      return <Skills skills={resume.skills} highlights={highlights} />;
    case SECTIONS.EXPERIENCE:
      return <Experiences experiences={resume.experience} highlights={highlights} />;
    case SECTIONS.EDUCATION:
      return <Educations educations={resume.education} highlights={highlights} />;
    case SECTIONS.CERTIFICATIONS:
      return <Certifications certifications={resume.certifications} highlights={highlights} />;
    case SECTIONS.PROJECTS:
      return <Projects projects={resume.projects} highlights={highlights} />;
    default:
      return null;
  }
};

const BasicPDF = ({ data, highlights = {} }: { data: ResumeData; highlights?: PdfHighlightMap }) => {
  const profile = data.profile || {};

  const sortedSections = data.sectionOrder || [
    { id: SECTIONS.PROFILE },
    { id: SECTIONS.EXPERIENCE },
    { id: SECTIONS.EDUCATION },
    { id: SECTIONS.SKILLS },
    { id: SECTIONS.PROJECTS },
    { id: SECTIONS.CERTIFICATIONS },
  ];

  const generateContactRow = () => {
    const contactPieces: React.ReactNode[] = [];

    if (profile.email) {
      contactPieces.push(<Text key="email">{profile.email}</Text>);
    }

    if (profile.phone) {
      contactPieces.push(<Text key="phone">{profile.phone}</Text>);
    }

    if (profile.linkedin) {
      contactPieces.push(
        <Link key="linkedin" style={styles.link} src={getLinkedinUrl(profile.linkedin)}>
          LinkedIn
        </Link>
      );
    }

    if (profile.portfolio) {
      contactPieces.push(
        <Link key="portfolio" style={styles.link} src={getPortfolioUrl(profile.portfolio)}>
          Portfolio
        </Link>
      );
    }

    if (profile.github) {
      contactPieces.push(
        <Link key="github" style={styles.link} src={getGithubUrl(profile.github)}>
          GitHub
        </Link>
      );
    }

    const loc = [profile.city, profile.country].filter(Boolean).join(", ");
    if (loc) {
      contactPieces.push(<Text key="location">{loc}</Text>);
    }

    if (contactPieces.length === 0) return null;

    return (
      <View style={styles.contactRow}>
        {contactPieces.map((piece, i) => (
          <React.Fragment key={i}>
            {piece}
            {i < contactPieces.length - 1 && <Text style={styles.contactSeparator}>|</Text>}
          </React.Fragment>
        ))}
      </View>
    );
  };

  return (
    <Page size="A4" style={styles.page}>
      {profile.fullName && (
        <View style={styles.header}>
          <Text style={styles.name}>{profile.fullName || "YOUR NAME"}</Text>
          {generateContactRow()}
        </View>
      )}

      <View
        style={{
          width: "100%",
          margin: "0 auto",
          marginTop: 2,
          display: "flex",
          flexDirection: "column",
          gap: 11,
        }}
      >
        {deduplicateSectionOrder(sortedSections)
          .filter(s => !s.hidden)
          .map(section => (
            <SectionRenderer key={section.id} resume={data} type={section.id} highlights={highlights} />
          ))}
      </View>
    </Page>
  );
};

export default BasicPDF;
