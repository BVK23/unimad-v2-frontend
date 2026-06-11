import React from "react";
import { Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import { ResumeData } from "../../../../types";
import { SECTIONS, isCustomSection } from "../../config/constants";
import "../../config/fonts";
import HtmlRenderer from "../../shared/HtmlRenderer";
import { parseDate as formatDateMonthYear } from "../../shared/dateUtils";
import { baseStyles } from "../../shared/pdf-base-styles";
import { deduplicateSectionOrder } from "../../shared/sectionOrderUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";

const TOKENS = {
  colors: {
    text: "#000000",
    divider: "#000000",
  },
  spacing: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    name_contact: 2,
    entry_gap: 6,
  },
  sizes: {
    name: 30,
    contact: 11,
    sectionTitle: 12,
    entryTitle: 11,
    role: 10,
    body: 10,
    meta: 10,
    dateColumn: 90,
  },
  lineHeights: {
    heading: 1.0,
    body: 1.4,
  },
  fontWeight: {
    regular: 400,
    bold: 700,
  },
};

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page, // padding:30, bg:#fff, flexDir:col, fontWeight:400
    fontFamily: "Onest",
    fontSize: TOKENS.sizes.body,
    color: TOKENS.colors.text,
  },
  name: {
    textAlign: "center",
    fontSize: TOKENS.sizes.name,
    fontWeight: TOKENS.fontWeight.bold,
    letterSpacing: 0.4,
    marginBottom: TOKENS.spacing.name_contact,
    lineHeight: 1.1,
    fontFamily: "Times-Roman",
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 20,
    gap: 4,
  },
  contactItem: {
    fontSize: TOKENS.sizes.contact,
    color: TOKENS.colors.text,
    textDecoration: "none",
  },
  contactSeparator: {
    fontSize: TOKENS.sizes.contact,
    color: TOKENS.colors.text,
    marginHorizontal: TOKENS.spacing.xs,
  },
  section: {
    marginBottom: 0, // Removed large bottom margin, let the divider handle spacing between sections
  },
  sectionTitle: {
    fontSize: TOKENS.sizes.sectionTitle,
    fontWeight: TOKENS.fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.2,
    marginBottom: TOKENS.spacing.sm,
    lineHeight: TOKENS.lineHeights.heading,
    color: TOKENS.colors.text,
    fontFamily: "Times-Roman",
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.colors.divider,
    marginBottom: 0,
  },
  entryRow: {
    marginBottom: TOKENS.spacing.entry_gap,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: TOKENS.spacing.sm,
  },
  entryLeft: {
    flex: 1,
    paddingRight: TOKENS.spacing.md,
  },
  entryRight: {
    minWidth: TOKENS.sizes.dateColumn,
    flexDirection: "column",
    alignItems: "flex-end",
    gap: TOKENS.spacing.sm,
  },
  entryTitle: {
    fontSize: TOKENS.sizes.entryTitle,
    fontWeight: TOKENS.fontWeight.bold,
    color: TOKENS.colors.text,
    marginBottom: 2,
  },
  entryRole: {
    fontSize: TOKENS.sizes.role,
    fontWeight: TOKENS.fontWeight.bold,
    color: TOKENS.colors.text,
  },
  entryMeta: {
    fontSize: TOKENS.sizes.meta,
    fontWeight: TOKENS.fontWeight.bold,
    color: TOKENS.colors.text,
    marginBottom: 2,
  },
  description: {
    fontSize: TOKENS.sizes.body,
    lineHeight: TOKENS.lineHeights.body,
    color: TOKENS.colors.text,
  },
  skillRow: {
    flexDirection: "row",
    marginBottom: TOKENS.spacing.xs,
    paddingLeft: 12,
  },
  skillDot: {
    width: 10,
    fontSize: TOKENS.sizes.body,
    color: TOKENS.colors.text,
    marginLeft: -12,
  },
  skillContent: {
    fontSize: TOKENS.sizes.body,
    color: TOKENS.colors.text,
  },
});

interface IrelandPDFProps {
  data: ResumeData;
}

const IrelandPDF: React.FC<IrelandPDFProps> = ({ data }) => {
  const profile = data.profile || {};
  const sortedSections = data.sectionOrder || [
    { id: SECTIONS.EXPERIENCE },
    { id: SECTIONS.PROJECTS },
    { id: SECTIONS.SKILLS },
    { id: SECTIONS.CERTIFICATIONS },
    { id: SECTIONS.EDUCATION },
  ];

  const generateContactRow = () => {
    const parts: React.ReactNode[] = [];

    if (profile.email)
      parts.push(
        <Text key="email" style={styles.contactItem}>
          {profile.email}
        </Text>
      );
    if (profile.phone)
      parts.push(
        <Text key="phone" style={styles.contactItem}>
          {profile.phone}
        </Text>
      );
    if (profile.linkedin)
      parts.push(
        <Link key="linkedin" src={getLinkedinUrl(profile.linkedin)} style={styles.contactItem}>
          LinkedIn
        </Link>
      );
    if (profile.portfolio)
      parts.push(
        <Link key="portfolio" src={getPortfolioUrl(profile.portfolio)} style={styles.contactItem}>
          Portfolio
        </Link>
      );
    if (profile.github)
      parts.push(
        <Link key="github" src={getGithubUrl(profile.github)} style={styles.contactItem}>
          GitHub
        </Link>
      );

    const loc = [profile.city, profile.country].filter(Boolean).join(", ");
    if (loc)
      parts.push(
        <Text key="loc" style={styles.contactItem}>
          {loc}
        </Text>
      );

    if (parts.length === 0) return null;

    return (
      <View style={styles.contactRow}>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < parts.length - 1 && <Text style={styles.contactSeparator}>|</Text>}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const renderSectionHeading = (title: string, isFirstSection = false) => {
    return (
      <View wrap={false} style={{ marginBottom: TOKENS.spacing.sm }}>
        <View
          style={{
            ...styles.sectionDivider,
            marginTop: isFirstSection ? 4 : 12,
            marginBottom: 12,
          }}
        />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    );
  };

  const renderExperiences = (experiences: ResumeData["experience"], isFirstSection = false) => {
    const visible = (experiences || []).filter(e => !e.hidden);
    if (visible.length === 0) return null;

    return (
      <View style={styles.section}>
        {visible.map((exp, idx) => (
          <View key={idx} style={styles.entryRow} wrap={false}>
            {idx === 0 && renderSectionHeading("Experience", isFirstSection)}
            <View style={styles.entryHeader}>
              <View style={styles.entryLeft}>
                <Text style={styles.entryTitle}>{exp.company}</Text>
                {exp.role && <Text style={styles.entryRole}>{exp.role}</Text>}
              </View>
              <View style={styles.entryRight}>
                <Text style={styles.entryMeta}>
                  {formatDateMonthYear(exp.startDate)} — {exp.current ? "Present" : formatDateMonthYear(exp.endDate)}
                </Text>
                {exp.location && <Text style={styles.entryMeta}>{exp.location}</Text>}
              </View>
            </View>
            <HtmlRenderer html={exp.description} style={styles.description} />
          </View>
        ))}
      </View>
    );
  };

  const renderProjects = (projects: ResumeData["projects"], isFirstSection = false) => {
    const visible = (projects || []).filter(p => !p.hidden);
    if (visible.length === 0) return null;

    return (
      <View style={styles.section}>
        {visible.map((proj, idx) => (
          <View key={idx} style={styles.entryRow} wrap={false}>
            {idx === 0 && renderSectionHeading("Projects", isFirstSection)}
            {proj.url ? (
              <Link
                src={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`}
                style={{ ...styles.entryTitle, textDecoration: "none" }}
              >
                {proj.title}
              </Link>
            ) : (
              <Text style={styles.entryTitle}>{proj.title}</Text>
            )}
            {proj.description && <HtmlRenderer html={proj.description} style={styles.description} />}
          </View>
        ))}
      </View>
    );
  };

  const renderSkills = (skills: ResumeData["skills"], isFirstSection = false) => {
    const visible = (skills || []).filter(s => !s.hidden && s.name);
    if (visible.length === 0) return null;

    const groupedSkills = visible.reduce(
      (acc, skill) => {
        const cat = skill.category?.trim() || "Other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(skill.name);
        return acc;
      },
      {} as Record<string, string[]>
    );

    return (
      <View style={styles.section} wrap={false}>
        {renderSectionHeading("Skills", isFirstSection)}
        {Object.entries(groupedSkills).map(([category, items], idx) => (
          <View key={idx} style={styles.skillRow}>
            <Text style={styles.skillDot}>•</Text>
            <Text style={styles.skillContent}>
              <Text style={{ fontWeight: TOKENS.fontWeight.bold }}>{category}:</Text> {items.join(", ")}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderCertifications = (certifications: ResumeData["certifications"], isFirstSection = false) => {
    const visible = (certifications || []).filter(c => !c.hidden);
    if (visible.length === 0) return null;

    return (
      <View style={styles.section}>
        {visible.map((cert, idx) => (
          <View key={idx} style={styles.entryRow} wrap={false}>
            {idx === 0 && renderSectionHeading("Certifications", isFirstSection)}
            <View style={styles.entryHeader}>
              <View style={styles.entryLeft}>
                {cert.credentialUrl ? (
                  <Link
                    src={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                    style={{ ...styles.entryTitle, textDecoration: "none" }}
                  >
                    {cert.title}
                  </Link>
                ) : (
                  <Text style={styles.entryTitle}>{cert.title}</Text>
                )}
              </View>
              <View style={styles.entryRight}>{cert.date && <Text style={styles.entryMeta}>{formatDateMonthYear(cert.date)}</Text>}</View>
            </View>
            <Text style={{ ...styles.entryRole, fontWeight: 400 }}>{cert.issuer}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderEducations = (educations: ResumeData["education"], isFirstSection = false) => {
    const visible = (educations || []).filter(e => !e.hidden);
    if (visible.length === 0) return null;

    return (
      <View style={styles.section}>
        {visible.map((edu, idx) => (
          <View key={idx} style={styles.entryRow} wrap={false}>
            {idx === 0 && renderSectionHeading("Education", isFirstSection)}
            <View style={styles.entryHeader}>
              <View style={styles.entryLeft}>
                <Text style={styles.entryTitle}>{edu.degree}</Text>
                <Text style={{ ...styles.entryRole, fontWeight: 400 }}>{edu.school}</Text>
              </View>
              <View style={styles.entryRight}>
                <Text style={styles.entryMeta}>
                  {formatDateMonthYear(edu.startDate)} — {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
                </Text>
                {edu.location && <Text style={styles.entryMeta}>{edu.location}</Text>}
              </View>
            </View>
            {edu.description && (
              <View style={{ marginTop: 4 }}>
                <HtmlRenderer html={edu.description} style={styles.description} />
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderCustomSection = (sectionId: string, isFirstSection = false) => {
    const customSectionData = data.customSections?.find(s => s.id === sectionId);
    if (!customSectionData) return null;

    const visibleItems = (customSectionData.items || []).filter(i => !i.hidden);
    if (visibleItems.length === 0) return null;

    return (
      <View key={sectionId} style={styles.section}>
        {visibleItems.map((item, idx) => (
          <View key={idx} style={styles.entryRow} wrap={false}>
            {idx === 0 && renderSectionHeading(customSectionData.title || "Custom Section", isFirstSection)}
            <View style={styles.entryHeader}>
              <View style={styles.entryLeft}>
                <Text style={styles.entryTitle}>{item.title}</Text>
                {item.subtitle && <Text style={styles.entryRole}>{item.subtitle}</Text>}
              </View>
              <View style={styles.entryRight}>
                {item.startDate && (
                  <Text style={styles.entryMeta}>
                    {formatDateMonthYear(item.startDate)} — {item.endDate ? formatDateMonthYear(item.endDate) : "Present"}
                  </Text>
                )}
                {item.location && <Text style={styles.entryMeta}>{item.location}</Text>}
              </View>
            </View>
            <HtmlRenderer html={item.description} style={styles.description} />
          </View>
        ))}
      </View>
    );
  };

  const renderSummary = (isFirstSection = false) => {
    if (!profile.summary) return null;
    return (
      <View style={styles.section} wrap={false}>
        {renderSectionHeading("Professional Summary", isFirstSection)}
        <HtmlRenderer html={profile.summary} style={styles.description} />
      </View>
    );
  };

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.name}>{profile.fullName || "Your Name"}</Text>
      {generateContactRow()}

      {deduplicateSectionOrder(sortedSections)
        .filter(s => !s.hidden)
        .map((section, idx) => {
          const sectionId = section.id;
          const isFirst = idx === 0;

          if (isCustomSection(sectionId)) return renderCustomSection(sectionId, isFirst);

          switch (sectionId) {
            case SECTIONS.PROFILE:
              return <React.Fragment key={sectionId}>{renderSummary(isFirst)}</React.Fragment>;
            case SECTIONS.EXPERIENCE:
              return <React.Fragment key={sectionId}>{renderExperiences(data.experience, isFirst)}</React.Fragment>;
            case SECTIONS.EDUCATION:
              return <React.Fragment key={sectionId}>{renderEducations(data.education, isFirst)}</React.Fragment>;
            case SECTIONS.SKILLS:
              return <React.Fragment key={sectionId}>{renderSkills(data.skills, isFirst)}</React.Fragment>;
            case SECTIONS.PROJECTS:
              return <React.Fragment key={sectionId}>{renderProjects(data.projects, isFirst)}</React.Fragment>;
            case SECTIONS.CERTIFICATIONS:
              return <React.Fragment key={sectionId}>{renderCertifications(data.certifications, isFirst)}</React.Fragment>;
            default:
              return null;
          }
        })}
    </Page>
  );
};

export default IrelandPDF;
