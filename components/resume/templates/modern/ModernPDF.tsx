import React from "react";
import { Page, Text, View, StyleSheet, Link, Svg, Circle, Line, Path } from "@react-pdf/renderer";
import { ResumeData } from "../../../../types";
// Import centralized font registration (side-effect: registers fonts)
import "../../config/fonts";
import HtmlRenderer from "../../shared/HtmlRenderer";
import { parseDate } from "../../shared/dateUtils";
import { baseStyles } from "../../shared/pdf-base-styles";
import { deduplicateSectionOrder } from "../../shared/sectionOrderUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";

const GlobeIcon = ({ size = 9, color = "#346de0" }: { size?: number; color?: string }) => (
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
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#346de0",
    paddingBottom: 20,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "column",
  },
  headerRight: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  name: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 14,
    color: "#2553d0",
    marginTop: 4,
    fontWeight: 500,
  },
  contactText: {
    fontSize: 10,
    color: "#475569",
    marginBottom: 2,
  },
  contactLink: {
    fontSize: 10,
    color: "#346de0",
    textDecoration: "none",
    marginBottom: 2,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    color: "#346de0",
    textTransform: "uppercase",
    marginBottom: 8,
    fontWeight: 700,
    letterSpacing: 1,
  },
  experienceItem: {
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 2,
  },
  role: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0f172a",
  },
  date: {
    fontSize: 9,
    color: "#64748b",
  },
  company: {
    fontSize: 10,
    fontWeight: 600,
    color: "#2553d0",
  },
  location: {
    fontSize: 9,
    color: "#94a3b8",
  },
  description: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.4,
    marginTop: 2,
  },
  educationItem: {
    marginBottom: 8,
  },
  school: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0f172a",
  },
  degree: {
    fontSize: 10,
    color: "#334155",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  skillText: {
    fontSize: 9,
    color: "#334155",
  },
});

interface ModernPDFProps {
  data: ResumeData;
}

const ModernPDF: React.FC<ModernPDFProps> = ({ data }) => {
  const { profile, experience, education, skills, projects, certifications, customSections, sectionOrder } = data;

  const renderSection = (id: string) => {
    switch (id) {
      case "profile":
        if (!profile.summary) return null;
        return (
          <View key="profile" style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
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
                  <View style={styles.rowBetween}>
                    <Text style={styles.company}>{exp.company}</Text>
                    {exp.location && <Text style={styles.location}>{exp.location}</Text>}
                  </View>
                  <HtmlRenderer html={exp.description} style={styles.description} />
                </View>
              ))}
          </View>
        );
      case "education":
        if (education.length === 0) return null;
        return (
          <View key="education" style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education
              .filter(e => !e.hidden)
              .map(edu => (
                <View key={edu.id} style={styles.educationItem}>
                  <Text style={styles.school}>{edu.school}</Text>
                  <Text style={styles.degree}>{edu.degree}</Text>
                  <View style={styles.rowBetween}>
                    <Text style={styles.date}>
                      {parseDate(edu.startDate)} - {edu.current ? "Present" : parseDate(edu.endDate)}
                    </Text>
                    {edu.location && <Text style={styles.location}>{edu.location}</Text>}
                  </View>
                  {edu.description && <HtmlRenderer html={edu.description} style={styles.description} />}
                </View>
              ))}
          </View>
        );
      case "skills":
        if (skills.length === 0) return null;
        return (
          <View key="skills" style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {skills
                .filter(s => !s.hidden)
                .map(skill => (
                  <View key={skill.id} style={styles.skillBadge}>
                    <Text style={styles.skillText}>{skill.name}</Text>
                  </View>
                ))}
            </View>
          </View>
        );
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
                <View key={cert.id} style={styles.educationItem}>
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
        const visibleItems = customSec.items.filter(i => !i.hidden);
        return (
          <View key={customSec.id} style={styles.section}>
            {visibleItems.map((item, idx) => (
              <View key={item.id} style={styles.experienceItem} wrap={false}>
                {idx === 0 && <Text style={styles.sectionTitle}>{customSec.title}</Text>}
                <View style={styles.rowBetween}>
                  {item.title && <Text style={styles.role}>{item.title}</Text>}
                  {item.subtitle && <Text style={styles.date}>{item.subtitle}</Text>}
                </View>
                {(item.hasDates || item.hasLocation) && (
                  <View style={styles.rowBetween}>
                    {item.hasLocation ? <Text style={styles.location}>{item.location}</Text> : <Text></Text>}
                    {item.hasDates && (
                      <Text style={styles.date}>
                        {parseDate(item.startDate)}
                        {item.startDate ? " - " : ""}
                        {item.current ? "Present" : item.endDate ? parseDate(item.endDate) : ""}
                      </Text>
                    )}
                  </View>
                )}
                <HtmlRenderer html={item.description} style={styles.description} />
              </View>
            ))}
          </View>
        );
    }
  };

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{profile.fullName}</Text>
          <Text style={styles.title}>{profile.title}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.contactText}>{profile.email}</Text>
          <Text style={styles.contactText}>{profile.phone}</Text>
          <Text style={styles.contactText}>{[profile.city, profile.country].filter(Boolean).join(", ")}</Text>
          {profile.portfolio && (
            <Link src={getPortfolioUrl(profile.portfolio)} style={styles.contactLink}>
              Portfolio
            </Link>
          )}
          {profile.linkedin && (
            <Link src={getLinkedinUrl(profile.linkedin)} style={styles.contactLink}>
              LinkedIn
            </Link>
          )}
          {profile.github && (
            <Link src={getGithubUrl(profile.github)} style={styles.contactLink}>
              GitHub
            </Link>
          )}
        </View>
      </View>

      {deduplicateSectionOrder(sectionOrder)
        .filter(s => !s.hidden)
        .map(s => renderSection(s.id))}
    </Page>
  );
};

export default ModernPDF;
