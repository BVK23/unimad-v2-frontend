import React from "react";
import { Page, View, Text, StyleSheet, Link } from "@react-pdf/renderer";
import { ResumeData } from "../../../../types";
import { SECTIONS, isCustomSection } from "../../config/constants";
import HtmlRenderer from "../../shared/HtmlRenderer";
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
    indent: 0,
    sectionGap: 16, // Preview: gap-[16px] between sections
    sm: 3,
    md: 9, // gapMid
    block: 12, // gapBlock (gap-3 in preview = 12px)
  },
  sizes: {
    name: 28,
    sectionTitle: 12,
    subheading: 10,
    body: 9,
    meta: 8,
  },
  weights: {
    heavy: 700,
    semi: 600,
    medium: 500,
    normal: 400,
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
    alignItems: "flex-start",
    paddingBottom: 6,
    gap: 0,
  },
  name: {
    fontSize: TOKENS.sizes.name,
    fontWeight: TOKENS.weights.semi,
    marginBottom: 6,
    color: TOKENS.colors.text,
  },
  contactRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    fontSize: 9,
    gap: 6,
    color: TOKENS.colors.text,
    flexWrap: "wrap",
    marginTop: 4,
  },
  contactSeparator: {
    fontSize: 9,
    color: TOKENS.colors.text,
  },
  link: {
    color: TOKENS.colors.text,
    textDecoration: "none",
  },
  section: {
    gap: TOKENS.spacing.sm, // Internal gap
    marginBottom: TOKENS.spacing.sectionGap,
  },
  sectionWrapper: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    gap: 4, // Preview: gap-[4px] between SectionHeading and content
  },
  sectionHeading: {
    display: "flex",
    flexDirection: "column",
    gap: 2.4,
    marginLeft: TOKENS.spacing.indent,
  },
  sectionTitle: {
    fontSize: TOKENS.sizes.sectionTitle,
    fontWeight: TOKENS.weights.semi,
    color: TOKENS.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.3, // Preview: tracking-wide (0.025em × 12pt ≈ 0.3pt)
  },
  sectionContent: {
    marginLeft: TOKENS.spacing.indent,
    display: "flex",
    flexDirection: "column",
    gap: TOKENS.spacing.block,
  },
  entryRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: TOKENS.sizes.body,
  },
  entryLeft: {
    fontSize: TOKENS.sizes.subheading,
    fontWeight: TOKENS.weights.medium,
    color: TOKENS.colors.text,
  },
  entryRight: {
    fontSize: TOKENS.sizes.meta,
    color: TOKENS.colors.muted,
    fontWeight: TOKENS.weights.normal,
  },
  entrySubtitleRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: TOKENS.sizes.body,
    fontWeight: TOKENS.weights.normal,
    color: TOKENS.colors.accent,
    marginBottom: 4,
  },
  entrySubtitleLeft: {
    color: TOKENS.colors.accent,
  },
  entrySubtitleRight: {
    fontWeight: TOKENS.weights.normal,
    color: TOKENS.colors.muted,
  },
  entryWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  listWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    marginLeft: 2,
  },
  skillsWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    fontSize: TOKENS.sizes.body,
  },
  skillsCategoryRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 3,
    width: "98%",
  },
  skillsCategory: {
    fontWeight: TOKENS.weights.medium,
    color: TOKENS.colors.accent,
    flexShrink: 0,
  },
  skillsCategoryData: {
    fontWeight: TOKENS.weights.normal,
    flexGrow: 1,
    width: "80%",
  },
});

const SectionHeading = ({ title }: { title: string }) => (
  // Section title is its own wrap={false} unit — never orphaned from content
  <View style={styles.sectionHeading} wrap={false}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const Experiences = ({ experiences }: { experiences: ResumeData["experience"] }) => {
  const visibleExperiences = (experiences || []).filter(exp => !exp.hidden);
  if (!visibleExperiences.length) return null;

  return (
    // Outer section wrapper does NOT have wrap={false} — each entry handles its own
    <View style={styles.sectionWrapper}>
      <SectionHeading title="Work Experience" />
      <View style={styles.sectionContent}>
        {visibleExperiences.map((exp, idx) => (
          // Each experience is an anchor block — Role+Company+Dates+Description stay together
          <View key={idx} style={styles.entryWrapper} wrap={false}>
            <View style={styles.entryRow}>
              <Text style={styles.entryLeft}>{exp.role}</Text>
              <Text style={styles.entryRight}>
                {formatDateMonthYear(exp.startDate)} - {exp.current ? "Present" : formatDateMonthYear(exp.endDate)}
              </Text>
            </View>
            <View style={styles.entrySubtitleRow}>
              <Text style={styles.entrySubtitleLeft}>{exp.company}</Text>
              <Text style={styles.entrySubtitleRight}>{exp.location || ""}</Text>
            </View>
            {exp.description && (
              <View style={{ marginTop: 2, paddingLeft: 2 }}>
                <HtmlRenderer
                  html={exp.description}
                  style={{
                    fontSize: 9,
                    color: TOKENS.colors.text,
                    lineHeight: 1.5,
                    fontFamily: "Onest",
                  }}
                />
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const Educations = ({ educations }: { educations: ResumeData["education"] }) => {
  const visibleEducations = (educations || []).filter(e => !e.hidden);
  if (!visibleEducations.length) return null;

  return (
    <View style={styles.sectionWrapper}>
      <SectionHeading title="Education" />
      <View style={{ ...styles.sectionContent, gap: TOKENS.spacing.md }}>
        {visibleEducations.map((edu, idx) => (
          // Each education is an anchor block — Degree+School+Dates+Description stay together
          <View key={idx} style={{ display: "flex", flexDirection: "column", gap: 1 }} wrap={false}>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 9.75,
                fontWeight: TOKENS.weights.medium,
                color: TOKENS.colors.text,
              }}
            >
              <Text>{edu.degree}</Text>
              <Text style={styles.entryRight}>
                {formatDateMonthYear(edu.startDate)} - {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
              </Text>
            </View>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 9,
                fontWeight: TOKENS.weights.normal,
                marginBottom: 2,
              }}
            >
              <Text>{edu.school}</Text>
              <Text style={styles.entrySubtitleRight}>{edu.location || ""}</Text>
            </View>
            {edu.description && (
              <View
                style={{
                  fontSize: 9,
                  color: TOKENS.colors.text,
                  marginTop: 2,
                  paddingLeft: 2,
                }}
              >
                <HtmlRenderer
                  html={edu.description}
                  style={{
                    fontSize: 9,
                    color: TOKENS.colors.text,
                    lineHeight: 1.5,
                    fontFamily: "Onest",
                  }}
                />
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const Projects = ({ projects }: { projects: ResumeData["projects"] }) => {
  const visibleProjects = (projects || []).filter(p => !p.hidden);
  if (!visibleProjects.length) return null;

  return (
    <View style={styles.sectionWrapper}>
      <SectionHeading title="Projects" />
      <View style={{ ...styles.sectionContent, gap: TOKENS.spacing.md }}>
        {visibleProjects.map((project, idx) => (
          // Each project is an anchor block — Title+Description stay together
          <View key={idx} style={{ display: "flex", flexDirection: "column", gap: 2 }} wrap={false}>
            <View
              style={{
                fontSize: 9,
                fontWeight: TOKENS.weights.medium,
                color: TOKENS.colors.accent,
              }}
            >
              {project.url ? (
                <Link
                  src={project.url.startsWith("http") ? project.url : `https://${project.url}`}
                  style={{
                    textDecoration: "none",
                    color: TOKENS.colors.accent,
                    fontWeight: TOKENS.weights.medium,
                    fontSize: 9,
                  }}
                >
                  {project.title}
                </Link>
              ) : (
                <Text
                  style={{
                    fontWeight: TOKENS.weights.medium,
                    fontSize: 9,
                    color: TOKENS.colors.accent,
                  }}
                >
                  {project.title}
                </Text>
              )}
            </View>
            {project.description && (
              <View style={{ marginTop: 2, paddingLeft: 2 }}>
                <HtmlRenderer
                  html={project.description}
                  style={{
                    fontSize: 9,
                    color: TOKENS.colors.text,
                    lineHeight: 1.5,
                    fontFamily: "Onest",
                  }}
                />
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const Certifications = ({ certifications }: { certifications: ResumeData["certifications"] }) => {
  const visibleCertifications = (certifications || []).filter(c => !c.hidden);
  if (!visibleCertifications.length) return null;

  return (
    <View style={styles.sectionWrapper}>
      <SectionHeading title="Certifications" />
      <View style={{ ...styles.sectionContent, gap: 9 }}>
        {visibleCertifications.map((cert, idx) => (
          // Each cert is an anchor block — Title+Issuer+Date stay together
          <View key={idx} style={styles.entryWrapper} wrap={false}>
            <View style={styles.entryRow}>
              {cert.credentialUrl ? (
                <Link
                  src={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                  style={{
                    color: TOKENS.colors.accent,
                    textDecoration: "none",
                    fontWeight: TOKENS.weights.medium,
                    fontSize: 9,
                  }}
                >
                  {cert.title}
                </Link>
              ) : (
                <Text style={{ fontWeight: TOKENS.weights.medium, fontSize: 9 }}>{cert.title}</Text>
              )}
              <Text style={styles.entryRight}>{cert.date ? formatDateMonthYear(cert.date) : ""}</Text>
            </View>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontWeight: TOKENS.weights.normal,
                  fontSize: 9,
                  lineHeight: 1.3,
                }}
              >
                {cert.issuer}
              </Text>
            </View>
            {cert.description && (
              <View style={{ fontSize: 9, color: TOKENS.colors.text, marginTop: 2 }}>
                <HtmlRenderer
                  html={cert.description}
                  style={{
                    fontSize: 9,
                    color: TOKENS.colors.text,
                    lineHeight: 1.5,
                    fontFamily: "Onest",
                  }}
                />
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const Skills = ({ skills }: { skills: ResumeData["skills"] }) => {
  const visibleSkills = (skills || []).filter(s => !s.hidden && s.name);
  if (!visibleSkills.length) return null;

  // Group skills by their level (which acts as the category label)
  const grouped = visibleSkills.reduce(
    (acc, s) => {
      const cat = s.category?.trim() || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s.name!);
      return acc;
    },
    {} as Record<string, string[]>
  );

  return (
    <View style={styles.sectionWrapper} wrap={false}>
      <SectionHeading title="Skills" />
      <View style={{ ...styles.sectionContent, ...styles.skillsWrapper }}>
        {Object.entries(grouped).map(([category, items], i) => (
          <View key={i} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {/* Category label in blue accent, matching preview */}
            <Text style={styles.skillsCategory}>{category}</Text>
            <Text style={styles.skillsCategoryData}>{items.join(", ")}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const AusPDF: React.FC<{ data: ResumeData }> = ({ data }) => {
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
    const pieces: React.ReactNode[] = [];

    if (profile.email) {
      pieces.push(<Text key="email">{profile.email}</Text>);
    }

    if (profile.phone) {
      pieces.push(<Text key="phone">{profile.phone}</Text>);
    }

    if (profile.linkedin) {
      pieces.push(
        <Link key="linkedin" src={getLinkedinUrl(profile.linkedin)} style={styles.link}>
          LinkedIn
        </Link>
      );
    }

    if (profile.portfolio) {
      pieces.push(
        <Link key="portfolio" src={getPortfolioUrl(profile.portfolio)} style={styles.link}>
          Portfolio
        </Link>
      );
    }

    if (profile.github) {
      pieces.push(
        <Link key="github" src={getGithubUrl(profile.github)} style={styles.link}>
          GitHub
        </Link>
      );
    }

    const loc = [profile.city, profile.country].filter(Boolean).join(", ");
    if (loc) {
      pieces.push(<Text key="location">{loc}</Text>);
    }

    if (pieces.length === 0) return null;

    return (
      <View style={styles.contactRow}>
        {pieces.map((piece, i) => (
          <React.Fragment key={i}>
            {piece}
            {i < pieces.length - 1 && <Text style={styles.contactSeparator}>|</Text>}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const SectionRenderer = ({ resume, type }: { resume: ResumeData; type: string }) => {
    if (isCustomSection(type)) {
      const customSection = resume.customSections?.find(s => s.id === type);
      if (!customSection || !customSection.items || !customSection.items.some(item => !item.hidden)) return null;

      return (
        <View style={styles.sectionWrapper}>
          <SectionHeading title={customSection.title || "Custom Section"} />
          <View style={{ ...styles.sectionContent, gap: TOKENS.spacing.md }}>
            {customSection.items
              .filter(d => !d.hidden)
              .map((item, i) => (
                // Each custom item is an anchor block — Title+Description stay together
                <View key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }} wrap={false}>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 9,
                    }}
                  >
                    <View>
                      <Text style={styles.entryLeft}>{item.title}</Text>
                    </View>
                    <Text style={styles.entryRight}>
                      {[
                        item.location,
                        item.startDate
                          ? `${formatDateMonthYear(item.startDate)}${item.endDate ? ` - ${formatDateMonthYear(item.endDate)}` : ""}`
                          : "",
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </Text>
                  </View>
                  {item.description && (
                    <View style={{ marginTop: 2 }}>
                      <HtmlRenderer
                        html={item.description}
                        style={{
                          fontSize: 9,
                          color: TOKENS.colors.text,
                          lineHeight: 1.5,
                          fontFamily: "Onest",
                        }}
                      />
                    </View>
                  )}
                </View>
              ))}
          </View>
        </View>
      );
    }

    switch (type) {
      case SECTIONS.PROFILE:
        return resume.profile?.summary ? (
          <View style={styles.sectionWrapper}>
            <SectionHeading title="Professional Summary" />
            <View style={styles.sectionContent}>
              <HtmlRenderer
                html={resume.profile.summary}
                style={{
                  fontSize: 9,
                  color: TOKENS.colors.text,
                  lineHeight: 1.5,
                  fontFamily: "Onest",
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

  return (
    <Page size="A4" style={styles.page}>
      {/* Header left-aligned */}
      {profile.fullName && (
        <View style={styles.header}>
          <Text style={styles.name}>{profile.fullName || "YOUR NAME"}</Text>
          {generateContactRow()}
        </View>
      )}

      <View
        style={{
          display: "flex",
          flexDirection: "column",
          gap: TOKENS.spacing.sectionGap,
          marginTop: 6,
        }}
      >
        {deduplicateSectionOrder(sortedSections)
          .filter(s => !s.hidden)
          .map(section => (
            <SectionRenderer key={section.id} resume={data} type={section.id} />
          ))}
      </View>
    </Page>
  );
};

export default AusPDF;
