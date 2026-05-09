import React from "react";
import { Page, View, Text, StyleSheet, Link } from "@react-pdf/renderer";
import { ResumeData } from "../../../../types";
import { SECTIONS, isCustomSection } from "../../config/constants";
import HtmlRenderer from "../../shared/HtmlRenderer";
import { parseDate as formatDateMonthYear } from "../../shared/dateUtils";
import { baseStyles } from "../../shared/pdf-base-styles";
import { deduplicateSectionOrder } from "../../shared/sectionOrderUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";

// Design tokens for consistent spacing and sizing
const TOKENS = {
  colors: {
    jobTitle: "#000000",
    text: "#111111",
    muted: "#666666",
    divider: "#000000",
  },
  spacing: {
    page: {
      top: 28,
      right: 28,
      bottom: 28,
      left: 28,
    },
    xs: 2,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },
  sizes: {
    name: 20,
    jobTitle: 11,
    sectionTitle: 12,
    body: 10,
    meta: 9,
    bullet: 9,
    contact: 10,
  },
  lineHeight: {
    body: 1.25,
    tight: 1.1,
  },
  letterSpacing: {
    sectionTitle: 1.5,
    name: 0.25,
  },
};

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page, // padding:30, bg:#fff, flexDir:col, fontWeight:400
    fontFamily: "Onest",
  },
  header: {
    textAlign: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 18, // Preview: text-2xl (24px) → 24*0.75=18pt
    fontWeight: 600,
    color: "#111111",
    marginBottom: 1,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  jobTitle: {
    fontSize: 10.9, // Preview: text-[14.5px] → 14.5*0.75=10.875pt
    fontWeight: "normal",
    marginBottom: 1,
    color: "#666666",
    letterSpacing: 0,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 9, // Preview: text-xs (12px) → 12*0.75=9pt
    color: "#111111",
    lineHeight: 1.2,
    marginTop: 1,
    marginBottom: 2,
  },
  contactItem: {
    marginHorizontal: 3,
    textDecoration: "none",
    color: "#111111",
  },
  contactSeparator: {
    marginHorizontal: 3,
    color: "#111111",
  },
  hr: {
    height: 1,
    backgroundColor: "#000000",
    marginTop: 2,
    marginBottom: 6, // Preview: mb-2 (8px) → 8*0.75=6pt
  },
  section: {
    marginBottom: 12, // Preview: mb-4 (16px) → 16*0.75=12pt
    flexDirection: "column",
  },
  sectionTitleWrapper: {
    textAlign: "center",
    marginBottom: 2, // Preview: mb-1 (4px) → 4*0.75=3pt
  },
  sectionTitle: {
    fontSize: 11.25, // Preview: text-[15px] → 15*0.75=11.25pt
    fontWeight: 500,
    color: "#111111",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 0,
  },
  bodyText: {
    fontSize: 9.75, // Preview: text-[13px] → 13*0.75=9.75pt
    fontWeight: "normal",
    lineHeight: 1.4,
    color: "#111111",
    marginBottom: 2,
    textAlign: "justify",
  },
  metaText: {
    fontSize: 9, // Preview: text-xs (12px) → 9pt
    color: "#666666",
    fontWeight: "normal",
    lineHeight: 1.3,
  },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
    marginBottom: 0,
  },
  entryTitle: {
    fontSize: 12, // Matching companyName (Title)
    fontWeight: "normal",
    color: "#666666",
    marginBottom: 0,
    textDecoration: "none",
  },
  entrySubtitle: {
    fontSize: 10.9, // Preview: text-[14.5px] → 14.5*0.75=10.875pt
    color: "#111111",
    fontWeight: "normal",
    fontStyle: "normal",
    marginBottom: 0,
  },
  companyName: {
    fontSize: 12, // Preview: text-[16px] → 16*0.75=12pt
    fontWeight: "normal",
    color: "#666666",
    fontStyle: "normal",
    flex: 1,
  },
  entryDate: {
    fontSize: 10.9, // Preview: text-[14.5px] → 14.5*0.75=10.875pt
    color: "#111111",
    textAlign: "right",
    fontWeight: "normal",
    flexShrink: 0,
    marginLeft: 6,
  },
  link: {
    color: TOKENS.colors.text,
    textDecoration: "none",
  },
});

const Experiences = ({ experiences }: { experiences: ResumeData["experience"] }) => {
  const visibleExperiences = (experiences || []).filter(exp => !exp.hidden);
  if (!visibleExperiences.length) return null;

  return (
    <View style={styles.section}>
      {/* Section header — title+divider never orphaned */}
      <View wrap={false}>
        <View style={styles.sectionTitleWrapper}>
          <Text style={styles.sectionTitle}>Experience</Text>
        </View>
        <View style={styles.hr} />
      </View>
      {visibleExperiences.map((exp, idx) => {
        const header = (
          <View>
            <View style={styles.entryRow}>
              <Text style={styles.companyName}>{exp.company}</Text>
              <Text style={styles.entryDate}>{exp.location || ""}</Text>
            </View>
            <View style={styles.entryRow}>
              <Text style={styles.entrySubtitle}>{exp.role}</Text>
              <Text style={styles.entryDate}>
                {formatDateMonthYear(exp.startDate)} — {exp.current ? "Present" : formatDateMonthYear(exp.endDate)}
              </Text>
            </View>
          </View>
        );

        const description = exp.description ? (
          <HtmlRenderer
            html={exp.description}
            style={{
              fontSize: 9.75,
              color: "#111111",
              lineHeight: 1.4,
              textAlign: "justify",
            }}
          />
        ) : null;

        // Each experience is an anchor block — Company+Role+Dates+Description stay together
        return (
          <View key={idx} style={{ marginBottom: TOKENS.spacing.md }} wrap={false}>
            {header}
            {description && <View style={{ marginTop: 2 }}>{description}</View>}
          </View>
        );
      })}
    </View>
  );
};

const Educations = ({ educations }: { educations: ResumeData["education"] }) => {
  const visibleEducations = (educations || []).filter(e => !e.hidden);
  if (!visibleEducations.length) return null;

  return (
    <View style={styles.section}>
      {visibleEducations.map((edu, idx) => {
        const content = (
          <View>
            <View style={styles.entryRow}>
              <Text style={styles.companyName}>{edu.school}</Text>
              <Text style={styles.entryDate}>{edu.location || ""}</Text>
            </View>
            <View style={styles.entryRow}>
              <Text style={styles.entrySubtitle}>{edu.degree}</Text>
              <Text style={styles.entryDate}>
                {formatDateMonthYear(edu.startDate)} — {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
              </Text>
            </View>
            {edu.description && (
              <View style={{ marginTop: 2 }}>
                <HtmlRenderer
                  html={edu.description}
                  style={{
                    fontSize: 9,
                    lineHeight: 1.4,
                    fontFamily: "Onest",
                    color: "#111111",
                  }}
                />
              </View>
            )}
          </View>
        );

        if (idx === 0) {
          return (
            <View key={idx} style={{ marginBottom: TOKENS.spacing.md }} wrap={false}>
              <View style={styles.sectionTitleWrapper}>
                <Text style={styles.sectionTitle}>Education</Text>
              </View>
              <View style={styles.hr} />
              {content}
            </View>
          );
        }

        return (
          <View key={idx} style={{ marginBottom: TOKENS.spacing.md }} wrap={false}>
            {content}
          </View>
        );
      })}
    </View>
  );
};

const Projects = ({ projects }: { projects: ResumeData["projects"] }) => {
  const visibleProjects = (projects || []).filter(p => !p.hidden);
  if (!visibleProjects.length) return null;

  return (
    <View style={styles.section}>
      {/* Section header — title+divider never orphaned */}
      <View wrap={false}>
        <View style={styles.sectionTitleWrapper}>
          <Text style={styles.sectionTitle}>Projects</Text>
        </View>
        <View style={styles.hr} />
      </View>
      {visibleProjects.map((project, idx) => {
        const content = (
          <View>
            {project.url ? (
              <Link
                style={{ ...styles.link, ...styles.entryTitle }}
                src={project.url.startsWith("http") ? project.url : `https://${project.url}`}
              >
                {project.title}
              </Link>
            ) : (
              <Text style={styles.entryTitle}>{project.title}</Text>
            )}
            {project.description && (
              <View style={{ marginTop: 2 }}>
                <HtmlRenderer
                  html={project.description}
                  style={{
                    fontSize: 9.75,
                    color: "#111111",
                    lineHeight: 1.4,
                    textAlign: "justify",
                  }}
                />
              </View>
            )}
          </View>
        );

        // Each project is an anchor block — Title+Description stay together
        return (
          <View key={idx} style={{ marginBottom: TOKENS.spacing.md }} wrap={false}>
            {content}
          </View>
        );
      })}
    </View>
  );
};

const Certifications = ({ certifications }: { certifications: ResumeData["certifications"] }) => {
  const visibleCertifications = (certifications || []).filter(c => !c.hidden);
  if (!visibleCertifications.length) return null;

  return (
    <View style={styles.section}>
      {/* Section header — title+divider never orphaned */}
      <View wrap={false}>
        <View style={styles.sectionTitleWrapper}>
          <Text style={styles.sectionTitle}>Certifications</Text>
        </View>
        <View style={styles.hr} />
      </View>
      {visibleCertifications.map((cert, idx) => {
        const content = (
          <View>
            <View style={styles.entryRow}>
              {cert.credentialUrl ? (
                <Link
                  style={{ ...styles.link, ...styles.entryTitle }}
                  src={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                >
                  {cert.title}
                </Link>
              ) : (
                <Text style={styles.entryTitle}>{cert.title}</Text>
              )}
              <Text style={styles.entryDate}>{cert.date ? formatDateMonthYear(cert.date) : ""}</Text>
            </View>
            <Text style={styles.entrySubtitle}>{cert.issuer}</Text>
            {cert.description && (
              <View style={{ marginTop: 2 }}>
                <HtmlRenderer
                  html={cert.description}
                  style={{
                    fontSize: 9.75,
                    color: "#111111",
                    lineHeight: 1.4,
                    textAlign: "justify",
                  }}
                />
              </View>
            )}
          </View>
        );

        // Each cert is an anchor block — Title+Issuer+Date stay together
        return (
          <View key={idx} style={{ marginBottom: TOKENS.spacing.sm }} wrap={false}>
            {content}
          </View>
        );
      })}
    </View>
  );
};

const Skills = ({ skills }: { skills: ResumeData["skills"] }) => {
  const visibleSkills = (skills || []).filter(s => !s.hidden && s.name);
  if (!visibleSkills.length) return null;

  const skillItems = visibleSkills.map(s => s.name);

  return (
    <View style={styles.section} wrap={false}>
      <View style={styles.sectionTitleWrapper}>
        <Text style={styles.sectionTitle}>Skills</Text>
      </View>
      <View style={styles.hr} />
      <View>
        <Text style={styles.bodyText}>{skillItems.join(" - ")}</Text>
      </View>
    </View>
  );
};

const SectionRenderer = ({ resume, type }: { resume: ResumeData; type: string }) => {
  if (isCustomSection(type)) {
    const customSection = resume.customSections?.find(s => s.id === type);
    if (!customSection || !customSection.items || !customSection.items.some(item => !item.hidden)) return null;

    return (
      <View style={styles.section}>
        {/* Section header — title+divider never orphaned */}
        <View wrap={false}>
          <View style={styles.sectionTitleWrapper}>
            <Text style={styles.sectionTitle}>{customSection.title || "Custom Section"}</Text>
          </View>
          <View style={styles.hr} />
        </View>
        {customSection.items
          .filter(d => !d.hidden)
          .map((item, i) => {
            const content = (
              <View>
                <Text style={styles.entryTitle}>{item.title}</Text>
                {item.description && (
                  <View style={{ marginTop: 2 }}>
                    <HtmlRenderer
                      html={item.description}
                      style={{
                        fontSize: 9.75,
                        color: "#111111",
                        lineHeight: 1.4,
                        textAlign: "justify",
                      }}
                    />
                  </View>
                )}
              </View>
            );

            // Each custom item is an anchor block — Title+Description stay together
            return (
              <View key={i} style={{ marginBottom: TOKENS.spacing.sm }} wrap={false}>
                {content}
              </View>
            );
          })}
      </View>
    );
  }

  switch (type) {
    case SECTIONS.PROFILE:
      return resume.profile?.summary ? (
        <View style={styles.section} wrap={false}>
          <View style={styles.sectionTitleWrapper}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
          </View>
          <View style={styles.hr} />
          <View style={{ marginTop: 2 }}>
            <HtmlRenderer
              html={resume.profile.summary}
              style={{
                fontSize: 9.75,
                color: "#111111",
                lineHeight: 1.4,
                textAlign: "justify",
              }}
            />
          </View>
        </View>
      ) : null;
    case SECTIONS.SKILLS:
      return <Skills skills={resume.skills} />;
    case SECTIONS.EXPERIENCE:
      return <Experiences experiences={resume.experience} />;
    case SECTIONS.EDUCATION:
      return <Educations educations={resume.education} />;
    case SECTIONS.CERTIFICATIONS:
      return <Certifications certifications={resume.certifications} />;
    case SECTIONS.PROJECTS:
      return <Projects projects={resume.projects} />;
    default:
      return null;
  }
};

const CanadaPDF = ({ data }: { data: ResumeData }) => {
  const profile = data.profile || {};
  const jobTitle = profile.title || "";

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
      contactPieces.push(
        <Link key="email" style={styles.contactItem} src={`mailto:${profile.email}`}>
          {profile.email}
        </Link>
      );
    }

    if (profile.linkedin) {
      contactPieces.push(
        <Link key="linkedin" style={styles.contactItem} src={getLinkedinUrl(profile.linkedin)}>
          LinkedIn
        </Link>
      );
    }

    if (profile.portfolio) {
      contactPieces.push(
        <Link key="portfolio" style={styles.contactItem} src={getPortfolioUrl(profile.portfolio)}>
          Portfolio
        </Link>
      );
    }

    if (profile.github) {
      contactPieces.push(
        <Link key="github" style={styles.contactItem} src={getGithubUrl(profile.github)}>
          GitHub
        </Link>
      );
    }

    const loc = [profile.city, profile.country].filter(Boolean).join(", ");
    if (loc) {
      contactPieces.push(
        <Text key="location" style={styles.contactItem}>
          {loc}
        </Text>
      );
    }

    if (contactPieces.length === 0 && !profile.phone) return null;

    // If phone exists, append it. (Legacy canada didn't seem to render phone explicitly in the mapping, but we should)
    if (profile.phone) {
      contactPieces.unshift(
        <Text key="phone" style={styles.contactItem}>
          {profile.phone}
        </Text>
      );
    }

    return (
      <View style={styles.contactRow}>
        {contactPieces.map((piece, i) => (
          <React.Fragment key={i}>
            {piece}
            {i < contactPieces.length - 1 && <Text style={styles.contactSeparator}>•</Text>}
          </React.Fragment>
        ))}
      </View>
    );
  };

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>{profile.fullName || "YOUR NAME"}</Text>
        {jobTitle ? <Text style={styles.jobTitle}>{jobTitle}</Text> : null}
        {generateContactRow()}
      </View>

      <View>
        {deduplicateSectionOrder(sortedSections)
          .filter(s => !s.hidden)
          .map(section => (
            <SectionRenderer key={section.id} resume={data} type={section.id} />
          ))}
      </View>
    </Page>
  );
};

export default CanadaPDF;
