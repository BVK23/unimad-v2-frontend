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
    borderBottomWidth: 2,
    borderBottomColor: "#1e293b",
    paddingBottom: 15,
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
    color: "#475569",
  },
  pipe: {
    fontSize: 9,
    color: "#94a3b8",
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0f172a",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 3,
    marginBottom: 8,
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
    color: "#0f172a",
  },
  roleItalic: {
    fontSize: 10,
    color: "#334155",
    fontStyle: "italic",
    marginBottom: 2,
  },
  date: {
    fontSize: 9,
    color: "#64748b",
  },
  company: {
    fontSize: 10,
    fontWeight: 600,
    color: "#0f172a",
  },
  location: {
    fontSize: 8,
    color: "#94a3b8",
  },
  description: {
    fontSize: 10,
    color: "#1e293b",
    lineHeight: 1.4,
    marginTop: 2,
  },
  educationItem: {
    marginBottom: 6,
  },
  school: {
    fontSize: 10,
    fontWeight: 700,
    color: "#0f172a",
  },
  degree: {
    fontSize: 10,
    color: "#334155",
  },
  skillsText: {
    fontSize: 10,
    color: "#334155",
  },
});

interface ClassicPDFProps {
  data: ResumeData;
}

const ClassicPDF: React.FC<ClassicPDFProps> = ({ data }) => {
  const { profile, experience, education, skills, projects, certifications, customSections, sectionOrder } = data;

  const renderSection = (id: string) => {
    switch (id) {
      case "profile":
        if (!profile.summary) return null;
        return (
          <View key="profile" style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
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
                    <Text style={styles.company}>{exp.company}</Text>
                    <Text style={styles.date}>
                      {parseDate(exp.startDate)} – {exp.current ? "Present" : parseDate(exp.endDate)}
                    </Text>
                  </View>
                  <Text style={styles.roleItalic}>{exp.role}</Text>
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
                  <View style={styles.rowBetween}>
                    <View>
                      <Text style={styles.school}>{edu.school}</Text>
                      <Text style={styles.degree}>{edu.degree}</Text>
                      {edu.location && <Text style={styles.location}>{edu.location}</Text>}
                    </View>
                    <Text style={styles.date}>
                      {parseDate(edu.startDate)} – {edu.current ? "Present" : parseDate(edu.endDate)}
                    </Text>
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
            <Text style={styles.skillsText}>
              {skills
                .filter(s => !s.hidden)
                .map(s => s.name)
                .join(" • ")}
            </Text>
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
                    {cert.issuer && <Text style={{ ...styles.degree, fontStyle: "normal" }}>{cert.issuer}</Text>}
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
                    {item.title && <Text style={styles.company}>{item.title}</Text>}
                    {item.startDate && (
                      <Text style={styles.date}>
                        {parseDate(item.startDate)} – {item.current ? "Present" : parseDate(item.endDate)}
                      </Text>
                    )}
                  </View>
                  {item.subtitle && <Text style={styles.roleItalic}>{item.subtitle}</Text>}
                  {item.location && <Text style={styles.location}>{item.location}</Text>}
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
        <Text style={styles.name}>{profile.fullName}</Text>
        <View style={styles.contactRow}>
          <Text style={styles.contactText}>{[profile.city, profile.country].filter(Boolean).join(", ")}</Text>
          <Text style={styles.pipe}>|</Text>
          <Text style={styles.contactText}>{profile.email}</Text>
          <Text style={styles.pipe}>|</Text>
          <Text style={styles.contactText}>{profile.phone}</Text>
          {profile.portfolio && (
            <>
              <Text style={styles.pipe}>|</Text>
              <Link src={getPortfolioUrl(profile.portfolio)} style={{ ...styles.contactText, textDecoration: "none" }}>
                Portfolio
              </Link>
            </>
          )}
          {profile.linkedin && (
            <>
              <Text style={styles.pipe}>|</Text>
              <Link src={getLinkedinUrl(profile.linkedin)} style={{ ...styles.contactText, textDecoration: "none" }}>
                LinkedIn
              </Link>
            </>
          )}
          {profile.github && (
            <>
              <Text style={styles.pipe}>|</Text>
              <Link src={getGithubUrl(profile.github)} style={{ ...styles.contactText, textDecoration: "none" }}>
                GitHub
              </Link>
            </>
          )}
        </View>
      </View>

      {deduplicateSectionOrder(sectionOrder)
        .filter(s => !s.hidden)
        .map(s => renderSection(s.id))}
    </Page>
  );
};

export default ClassicPDF;
