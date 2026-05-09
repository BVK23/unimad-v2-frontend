import React from "react";
import { Page, Text, View, StyleSheet, Link, Svg, Circle, Line, Path } from "@react-pdf/renderer";
import { ResumeData } from "../../../../types";
import "../../config/fonts";
import HtmlRenderer from "../../shared/HtmlRenderer";
import { parseDate } from "../../shared/dateUtils";
import { baseStyles } from "../../shared/pdf-base-styles";
import { deduplicateSectionOrder } from "../../shared/sectionOrderUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";

const GlobeIcon = ({ size = 9, color = "#475569" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={{ marginLeft: 3 }}>
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
    <Line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="2" />
    <Path
      d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page, // padding:30, bg:#fff, flexDir:col, fontWeight:400
    fontFamily: "Onest",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
  },
  contactText: {
    fontSize: 9,
    color: "#64748b",
  },
  dot: {
    fontSize: 9,
    color: "#94a3b8",
  },
  twoColumn: {
    flexDirection: "row",
  },
  sidebar: {
    width: "30%",
    paddingRight: 15,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },
  main: {
    width: "70%",
    paddingLeft: 15,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 3,
    marginBottom: 8,
  },
  sidebarSectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 6,
    textAlign: "right",
  },
  experienceItem: {
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 2,
  },
  role: {
    fontSize: 10,
    fontWeight: 700,
    color: "#1e293b",
  },
  date: {
    fontSize: 8,
    color: "#64748b",
  },
  company: {
    fontSize: 9,
    color: "#64748b",
    fontStyle: "italic",
  },
  location: {
    fontSize: 8,
    color: "#94a3b8",
  },
  description: {
    fontSize: 9,
    color: "#334155",
    lineHeight: 1.4,
    marginTop: 2,
  },
  educationItem: {
    marginBottom: 8,
    textAlign: "right",
  },
  school: {
    fontSize: 10,
    fontWeight: 600,
    color: "#0f172a",
    textAlign: "right",
  },
  degree: {
    fontSize: 9,
    color: "#64748b",
    fontStyle: "italic",
    textAlign: "right",
  },
  skillText: {
    fontSize: 9,
    color: "#475569",
    textAlign: "right",
    marginBottom: 2,
  },
});

interface MinimalPDFProps {
  data: ResumeData;
}

const MinimalPDF: React.FC<MinimalPDFProps> = ({ data }) => {
  const { profile, experience, education, skills, projects, certifications, customSections, sectionOrder } = data;

  const renderSection = (id: string) => {
    switch (id) {
      case "profile":
        if (!profile.summary) return null;
        return (
          <View key="profile" style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <HtmlRenderer html={profile.summary} style={styles.description} />
          </View>
        );
      case "experience":
        if (experience.length === 0) return null;
        return (
          <View key="experience" style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience
              .filter(e => !e.hidden)
              .map(exp => (
                <View key={exp.id} style={styles.experienceItem}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.role}>{exp.role}</Text>
                    <Text style={styles.date}>
                      {parseDate(exp.startDate)} - {exp.current ? "Present" : parseDate(exp.endDate)}
                    </Text>
                  </View>
                  <Text style={styles.company}>{exp.company}</Text>
                  <HtmlRenderer html={exp.description} style={styles.description} />
                </View>
              ))}
          </View>
        );
      case "education":
      case "skills":
        return null; // Rendered in sidebar
      case "projects":
        if (projects.length === 0) return null;
        return (
          <View key="projects" style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects
              .filter(p => !p.hidden)
              .map(proj => (
                <View key={proj.id} style={styles.experienceItem}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 2,
                    }}
                  >
                    {proj.url ? (
                      <Link
                        src={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`}
                        style={{ ...styles.role, textDecoration: "none" }}
                      >
                        {proj.title}
                      </Link>
                    ) : (
                      <Text style={styles.role}>{proj.title}</Text>
                    )}
                    {proj.url && <GlobeIcon />}
                  </View>
                  <HtmlRenderer html={proj.description} style={styles.description} />
                </View>
              ))}
          </View>
        );
      case "certifications":
        if (certifications.length === 0) return null;
        return (
          <View key="certifications" style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certifications
              .filter(c => !c.hidden)
              .map(cert => (
                <View key={cert.id} style={{ marginBottom: 6 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 2,
                    }}
                  >
                    {cert.credentialUrl ? (
                      <Link
                        src={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                        style={{ ...styles.role, textDecoration: "none" }}
                      >
                        {cert.title}
                      </Link>
                    ) : (
                      <Text style={styles.role}>{cert.title}</Text>
                    )}
                    {cert.credentialUrl && <GlobeIcon />}
                  </View>
                  <View style={styles.rowBetween}>
                    {cert.issuer && <Text style={styles.company}>{cert.issuer}</Text>}
                    {cert.date && <Text style={styles.date}>{parseDate(cert.date)}</Text>}
                  </View>
                  {cert.description && <HtmlRenderer html={cert.description} style={styles.description} />}
                </View>
              ))}
          </View>
        );
      default:
        const customSec = customSections.find(s => s.id === id);
        if (!customSec) return null;
        return (
          <View key={customSec.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{customSec.title}</Text>
            {customSec.items
              .filter(i => !i.hidden)
              .map(item => (
                <View key={item.id} style={styles.experienceItem}>
                  <View style={styles.rowBetween}>
                    {item.title && <Text style={styles.role}>{item.title}</Text>}
                    {item.subtitle && <Text style={styles.date}>{item.subtitle}</Text>}
                  </View>
                  <HtmlRenderer html={item.description} style={styles.description} />
                </View>
              ))}
          </View>
        );
    }
  };

  return (
    <Page size="A4" style={styles.page}>
      {/* Centered Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{profile.fullName}</Text>
        <View style={styles.contactRow}>
          <Text style={styles.contactText}>{profile.email}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.contactText}>{profile.phone}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.contactText}>{[profile.city, profile.country].filter(Boolean).join(", ")}</Text>
          {profile.portfolio && (
            <>
              <Text style={styles.dot}>•</Text>
              <Link src={getPortfolioUrl(profile.portfolio)} style={{ ...styles.contactText, textDecoration: "none" }}>
                Portfolio
              </Link>
            </>
          )}
          {profile.linkedin && (
            <>
              <Text style={styles.dot}>•</Text>
              <Link src={getLinkedinUrl(profile.linkedin)} style={{ ...styles.contactText, textDecoration: "none" }}>
                LinkedIn
              </Link>
            </>
          )}
          {profile.github && (
            <>
              <Text style={styles.dot}>•</Text>
              <Link src={getGithubUrl(profile.github)} style={{ ...styles.contactText, textDecoration: "none" }}>
                GitHub
              </Link>
            </>
          )}
        </View>
      </View>

      {/* Two-Column Layout */}
      <View style={styles.twoColumn}>
        <View style={styles.sidebar}>
          <View style={styles.section}>
            <Text style={styles.sidebarSectionTitle}>Education</Text>
            {education
              .filter(e => !e.hidden)
              .map(edu => (
                <View key={edu.id} style={styles.educationItem}>
                  <Text style={styles.school}>{edu.school}</Text>
                  <Text style={styles.degree}>{edu.degree}</Text>
                  <Text style={{ ...styles.date, textAlign: "right" }}>{edu.endDate}</Text>
                  {edu.location && <Text style={{ ...styles.location, textAlign: "right" }}>{edu.location}</Text>}
                </View>
              ))}
          </View>
          <View style={styles.section}>
            <Text style={styles.sidebarSectionTitle}>Skills</Text>
            {skills
              .filter(s => !s.hidden)
              .map(skill => (
                <Text key={skill.id} style={styles.skillText}>
                  {skill.name}
                </Text>
              ))}
          </View>
        </View>
        <View style={styles.main}>
          {deduplicateSectionOrder(sectionOrder)
            .filter(s => !s.hidden)
            .map(s => {
              if (s.id === "education" || s.id === "skills") return null;
              return renderSection(s.id);
            })}
        </View>
      </View>
    </Page>
  );
};

export default MinimalPDF;
