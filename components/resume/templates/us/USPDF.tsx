import React from "react";
import { Page, View, Text, StyleSheet, Link } from "@react-pdf/renderer";
import { ResumeData } from "../../../../types";
import { SECTIONS, isCustomSection } from "../../config/constants";
import HtmlRenderer from "../../shared/HtmlRenderer";
import { parseDate as formatDateMonthYear } from "../../shared/dateUtils";
import { baseStyles } from "../../shared/pdf-base-styles";
import { deduplicateSectionOrder } from "../../shared/sectionOrderUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";

// Tokens
const TOKENS = {
  colors: {
    text: "#000000",
    muted: "#333333",
    divider: "#000000",
  },
  spacing: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    name_contact: 4,
    header_divider_top: 6,
    header_divider_bottom: 6,
    entry_gap: 6,
  },
  sizes: {
    name: 32,
    contact: 11,
    sectionTitle: 12,
    entryTitle: 11,
    role: 10,
    body: 10,
    meta: 9,
    dateColumn: 90,
  },
  lineHeights: {
    heading: 1.0,
    body: 1.15,
  },
  fontWeight: {
    regular: 400,
    medium: 600,
    bold: 700,
  },
};

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page, // padding:30, bg:#fff, flexDir:col, fontWeight:400
    padding: 24, // American template intentionally uses tighter 24pt margins
    fontFamily: "Times-Roman",
  },
  name: {
    textAlign: "center",
    fontSize: TOKENS.sizes.name,
    fontWeight: TOKENS.fontWeight.bold,
    letterSpacing: 1.28,
    marginBottom: TOKENS.spacing.name_contact,
    color: TOKENS.colors.text,
  },
  contactRow: {
    textAlign: "center",
    fontSize: TOKENS.sizes.contact,
    color: TOKENS.colors.text,
    marginBottom: TOKENS.spacing.header_divider_top,
  },
  section: {
    marginTop: TOKENS.spacing.lg,
  },
  sectionTitle: {
    fontSize: TOKENS.sizes.sectionTitle,
    fontWeight: TOKENS.fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.96,
    marginBottom: TOKENS.spacing.sm,
    lineHeight: TOKENS.lineHeights.heading,
    color: TOKENS.colors.text,
  },
  sectionDivider: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.colors.divider,
    marginTop: 2,
    marginBottom: 8,
  },
  entryRow: {
    marginBottom: TOKENS.spacing.entry_gap,
  },
  entryHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  entryLeft: {
    flex: 1,
    paddingRight: TOKENS.spacing.md,
  },
  entryRight: {
    minWidth: TOKENS.sizes.dateColumn,
    display: "flex",
    flexDirection: "column",
    gap: 3,
    alignItems: "flex-end",
  },
  entryTitle: {
    fontSize: TOKENS.sizes.entryTitle,
    fontWeight: TOKENS.fontWeight.bold,
    lineHeight: TOKENS.lineHeights.heading,
    color: TOKENS.colors.text,
  },
  entrySub: {
    fontSize: TOKENS.sizes.role,
    fontStyle: "italic",
    lineHeight: TOKENS.lineHeights.heading,
    marginTop: TOKENS.spacing.sm,
    color: TOKENS.colors.text,
  },
  entryMeta: {
    fontSize: TOKENS.sizes.meta,
    lineHeight: TOKENS.lineHeights.heading,
    color: TOKENS.colors.muted,
  },
  paragraph: {
    fontSize: TOKENS.sizes.body,
    lineHeight: TOKENS.lineHeights.body,
    marginBottom: TOKENS.spacing.xs,
    color: TOKENS.colors.text,
  },
});

const Experiences = ({ experiences }: { experiences: ResumeData["experience"] }) => {
  const visibleExperiences = (experiences || []).filter(exp => !exp.hidden);
  if (!visibleExperiences.length) return null;
  return (
    <View style={styles.section}>
      <View wrap={false}>
        <Text style={styles.sectionTitle}>Experience</Text>
        <View style={styles.sectionDivider} />
      </View>
      {visibleExperiences.map((exp, i) => (
        // Each experience is an anchor block — Company+Role+Location+Dates+Description stay together
        <View key={i} style={styles.entryRow} wrap={false}>
          <View style={styles.entryHeader}>
            <View style={styles.entryLeft}>
              <Text style={styles.entryTitle}>{exp.company}</Text>
              {exp.role ? <Text style={styles.entrySub}>{exp.role}</Text> : null}
            </View>
            <View style={styles.entryRight}>
              {exp.location ? <Text style={styles.entryMeta}>{exp.location}</Text> : null}
              <Text style={styles.entryMeta}>
                {formatDateMonthYear(exp.startDate)} — {exp.current ? "Present" : formatDateMonthYear(exp.endDate)}
              </Text>
            </View>
          </View>
          {exp.description && (
            <View style={{ marginTop: 4 }}>
              <HtmlRenderer
                html={exp.description}
                style={{
                  fontSize: TOKENS.sizes.body,
                  lineHeight: TOKENS.lineHeights.body,
                  fontFamily: "Times-Roman",
                  color: TOKENS.colors.text,
                }}
              />
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const Projects = ({ projects }: { projects: ResumeData["projects"] }) => {
  const visibleProjects = (projects || []).filter(proj => !proj.hidden);
  if (!visibleProjects.length) return null;
  return (
    <View style={styles.section}>
      <View wrap={false}>
        <Text style={styles.sectionTitle}>Projects</Text>
        <View style={styles.sectionDivider} />
      </View>
      {visibleProjects.map((proj, i) => (
        // Each project is an anchor block — Title+Description stay together
        <View key={i} style={{ ...styles.entryRow, marginBottom: TOKENS.spacing.md }} wrap={false}>
          {proj.url ? (
            <Link
              src={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`}
              style={{
                color: TOKENS.colors.text,
                textDecoration: "none",
                fontSize: TOKENS.sizes.entryTitle,
                fontWeight: TOKENS.fontWeight.bold,
                lineHeight: TOKENS.lineHeights.heading,
              }}
            >
              {proj.title}
            </Link>
          ) : (
            <Text style={styles.entryTitle}>{proj.title}</Text>
          )}
          {proj.description && (
            <View style={{ marginTop: 2 }}>
              <HtmlRenderer
                html={proj.description}
                style={{
                  fontSize: TOKENS.sizes.body,
                  lineHeight: TOKENS.lineHeights.body,
                  fontFamily: "Times-Roman",
                  color: TOKENS.colors.text,
                }}
              />
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const Skills = ({ skills }: { skills: ResumeData["skills"] }) => {
  const visibleSkills = (skills || []).filter(skill => !skill.hidden);
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
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Skills</Text>
      <View style={styles.sectionDivider} />
      {Object.entries(grouped).map(([cat, list], i) => (
        <View key={i} style={{ flexDirection: "row", marginBottom: 2 }}>
          <Text
            style={{
              width: 14,
              fontSize: TOKENS.sizes.body,
              color: TOKENS.colors.text,
            }}
          >
            •
          </Text>
          <Text style={styles.paragraph}>
            <Text style={{ fontWeight: TOKENS.fontWeight.bold }}>{cat}:</Text> {list.join(", ")}
          </Text>
        </View>
      ))}
    </View>
  );
};

const Certifications = ({ certifications }: { certifications: ResumeData["certifications"] }) => {
  const visibleCertifications = (certifications || []).filter(cert => !cert.hidden);
  if (!visibleCertifications.length) return null;
  return (
    <View style={styles.section}>
      <View wrap={false}>
        <Text style={styles.sectionTitle}>Certifications</Text>
        <View style={styles.sectionDivider} />
      </View>
      {visibleCertifications.map((cert, i) => (
        // Each cert is an anchor block — Title+Issuer+Date stay together
        <View key={i} style={{ marginBottom: TOKENS.spacing.md }} wrap={false}>
          <View style={styles.entryHeader}>
            <View style={styles.entryLeft}>
              {cert.credentialUrl ? (
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.entryTitle}>{cert.title} – </Text>
                  <Link
                    src={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                    style={{
                      textDecoration: "none",
                      color: TOKENS.colors.text,
                      fontSize: TOKENS.sizes.entryTitle,
                      fontWeight: TOKENS.fontWeight.bold,
                      lineHeight: TOKENS.lineHeights.heading,
                    }}
                  >
                    Verify Link
                  </Link>
                </View>
              ) : (
                <Text style={styles.entryTitle}>{cert.title}</Text>
              )}
              {cert.issuer && <Text style={styles.entrySub}>{cert.issuer}</Text>}
            </View>
            <View style={styles.entryRight}>
              {cert.date ? <Text style={styles.entryMeta}>{formatDateMonthYear(cert.date)}</Text> : null}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const Educations = ({ educations }: { educations: ResumeData["education"] }) => {
  const visibleEducations = (educations || []).filter(edu => !edu.hidden);
  if (!visibleEducations.length) return null;
  return (
    <View style={styles.section}>
      <View wrap={false}>
        <Text style={styles.sectionTitle}>Education</Text>
        <View style={styles.sectionDivider} />
      </View>
      {visibleEducations.map((edu, i) => (
        // Each education is an anchor block — Degree+School+Dates+Description stay together
        <View key={i} style={{ marginBottom: TOKENS.spacing.md }} wrap={false}>
          <View style={styles.entryHeader}>
            <View style={styles.entryLeft}>
              <Text style={styles.entryTitle}>{edu.degree || edu.school}</Text>
              <Text style={styles.entrySub}>{edu.school}</Text>
            </View>
            <View style={styles.entryRight}>
              <Text style={styles.entryMeta}>
                {formatDateMonthYear(edu.startDate)} — {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
              </Text>
            </View>
          </View>
          {edu.description ? (
            <View style={{ marginTop: 4 }}>
              <HtmlRenderer
                html={edu.description}
                style={{
                  fontSize: TOKENS.sizes.body,
                  lineHeight: TOKENS.lineHeights.body,
                  fontFamily: "Times-Roman",
                  color: TOKENS.colors.text,
                }}
              />
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
};

const SectionRenderer = ({ resume, type }: { resume: ResumeData; type: string }) => {
  if (isCustomSection(type)) {
    const customSection = resume.customSections?.find(s => s.id === type);
    if (!customSection || !customSection.items || !customSection.items.some(item => !item.hidden)) return null;

    return (
      <View style={styles.section}>
        {/* Section header is its own anchor — title+divider never orphan */}
        <View wrap={false}>
          <Text style={styles.sectionTitle}>{customSection.title || "Custom Section"}</Text>
          <View style={styles.sectionDivider} />
        </View>
        {customSection.items
          .filter(d => !d.hidden)
          .map((item, i) => (
            // Each custom item is an anchor block — Title+Description stay together
            <View key={i} style={{ marginBottom: TOKENS.spacing.md }} wrap={false}>
              <Text style={styles.entryTitle}>{item.title}</Text>
              {item.description && (
                <View style={{ marginTop: 2 }}>
                  <HtmlRenderer
                    html={item.description}
                    style={{
                      fontSize: TOKENS.sizes.body,
                      lineHeight: TOKENS.lineHeights.body,
                      fontFamily: "Times-Roman",
                      color: TOKENS.colors.text,
                    }}
                  />
                </View>
              )}
            </View>
          ))}
      </View>
    );
  }

  switch (type) {
    case SECTIONS.PROFILE:
      return resume.profile?.summary ? (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Professional Summary</Text>
          <View style={styles.sectionDivider} />
          <HtmlRenderer
            html={resume.profile.summary}
            style={{
              fontSize: TOKENS.sizes.body,
              lineHeight: TOKENS.lineHeights.body,
              fontFamily: "Times-Roman",
              color: TOKENS.colors.text,
            }}
          />
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

const USPDF = ({ data }: { data: ResumeData }) => {
  const profile = data.profile || {};

  const items: React.ReactNode[] = [];

  if (profile.email) {
    items.push(
      <Link key="email" src={`mailto:${profile.email}`} style={{ color: TOKENS.colors.text, textDecoration: "none" }}>
        {profile.email}
      </Link>
    );
  }

  if (profile.phone) {
    items.push(<Text key="phone">{profile.phone}</Text>);
  }

  if (profile.linkedin) {
    items.push(
      <Link key="linkedin" src={getLinkedinUrl(profile.linkedin)} style={{ color: TOKENS.colors.text, textDecoration: "none" }}>
        LinkedIn
      </Link>
    );
  }

  if (profile.github) {
    items.push(
      <Link key="github" src={getGithubUrl(profile.github)} style={{ color: TOKENS.colors.text, textDecoration: "none" }}>
        GitHub
      </Link>
    );
  }

  if (profile.portfolio) {
    items.push(
      <Link key="portfolio" src={getPortfolioUrl(profile.portfolio)} style={{ color: TOKENS.colors.text, textDecoration: "none" }}>
        Portfolio
      </Link>
    );
  }

  const locationParts = [profile.city, profile.country].filter(Boolean);
  if (locationParts.length > 0) {
    items.push(<Text key="location">{locationParts.join(", ")}</Text>);
  }

  const contactRow =
    items.length === 0 ? null : (
      <Text style={styles.contactRow}>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {item}
            {index < items.length - 1 && " | "}
          </React.Fragment>
        ))}
      </Text>
    );

  const sectionOrder = data.sectionOrder || [
    { id: SECTIONS.PROFILE },
    { id: SECTIONS.EXPERIENCE },
    { id: SECTIONS.PROJECTS },
    { id: SECTIONS.SKILLS },
    { id: SECTIONS.CERTIFICATIONS },
    { id: SECTIONS.EDUCATION },
  ];

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.name}>{profile.fullName || "Your Name"}</Text>
      {contactRow}
      {deduplicateSectionOrder(sectionOrder)
        .filter(s => !s.hidden)
        .map(section => (
          <SectionRenderer key={section.id} resume={data} type={section.id} />
        ))}
    </Page>
  );
};

export default USPDF;
