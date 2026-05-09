import React from "react";
import { Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { CustomSection, CustomSectionItem, ResumeData } from "../../../../types";
import { isCustomSection, SECTIONS } from "../../config/constants";
import HtmlRenderer from "../../shared/HtmlRenderer";
import { parseDate } from "../../shared/dateUtils";
import { deduplicateSectionOrder } from "../../shared/sectionOrderUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";
import { PROFESSIONAL_TOKENS as T } from "./professional-tokens";

const STANDARD_LABELS: Record<string, string> = {
  profile: "Summary",
  experience: "Experiences",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
};

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: T.pagePaddingPt,
    fontFamily: T.fontFamily,
    color: T.colors.text,
    fontWeight: 400,
  },
  header: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: T.sizes.name,
    fontWeight: T.weights.name,
  },
  subHeader: {
    display: "flex",
    alignItems: "center",
    fontWeight: T.weights.title,
    fontSize: T.sizes.title,
    marginBottom: T.spacing.subHeaderMarginBottom,
  },
  headerDetails: {
    fontSize: T.sizes.contact,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: T.spacing.headerDetailsPaddingY,
    paddingBottom: T.spacing.headerDetailsPaddingY,
    gap: T.spacing.headerDetailsGap,
    borderTopWidth: 1,
    borderTopColor: T.colors.text,
    borderBottomWidth: 1,
    borderBottomColor: T.colors.text,
    marginBottom: T.spacing.headerDetailsMarginBottom,
    color: T.colors.text,
  },
  heading: {
    display: "flex",
    flexDirection: "column",
    gap: T.spacing.personalHeadingGap,
    marginBottom: T.spacing.personalHeadingMarginBottom,
  },
  headingStyle: {
    fontSize: T.sizes.sectionHeading,
    fontWeight: T.weights.sectionHeading,
  },
  sectionMain: {
    width: "100%",
    marginTop: T.spacing.mainSectionTop,
    display: "flex",
    flexDirection: "column",
    gap: T.spacing.sectionGap,
  },
  sectionWrapper: {
    color: T.colors.text,
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  sectionContent: {
    display: "flex",
    flexDirection: "column",
    gap: T.spacing.sectionContentGap,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    marginBottom: T.spacing.rowMarginBottom,
  },
  subWrapper: {
    width: T.layout.leftColumnWidth,
    display: "flex",
    flexDirection: "column",
  },
  dateText: {
    fontWeight: T.weights.leftDate,
    fontSize: T.sizes.leftDate,
  },
  text: {
    fontWeight: T.weights.leftBody,
    fontSize: T.sizes.leftBody,
  },
  subText: {
    fontWeight: T.weights.leftMuted,
    fontSize: T.sizes.leftBody,
  },
  customSubtitle: {
    fontSize: T.sizes.leftBody,
    fontWeight: T.weights.leftBody,
    color: T.colors.muted,
  },
  rightColumn: {
    width: T.layout.rightColumnWidth,
    display: "flex",
    justifyContent: "flex-start",
    flexDirection: "column",
  },
  rightColumnHeader: {
    fontSize: T.sizes.rightHeader,
    fontWeight: T.weights.rightHeader,
  },
  rightColumnDescription: {
    fontSize: T.sizes.rightBody,
    fontWeight: T.weights.rightBody,
  },
  skillsMain: {
    display: "flex",
    flexDirection: "row",
    gap: T.spacing.skillsGap,
    flexWrap: "wrap",
  },
  skillHeader: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.skillHeaderGap,
  },
  certWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: T.spacing.certItemGap,
    marginBottom: T.spacing.rowMarginBottom,
  },
  certTitleRow: {
    fontSize: T.sizes.certRow,
    fontWeight: T.weights.certTitle,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: T.spacing.certTitleMarginBottom,
  },
  certSubtitle: {
    color: T.colors.muted,
    fontSize: T.sizes.certSubtitle,
  },
  link: {
    color: T.colors.text,
    textDecoration: "none",
  },
  customSectionTitleRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: T.sizes.customRowFont,
    fontWeight: T.weights.customTitle,
  },
  flexRow: {
    display: "flex",
    flexDirection: "row",
  },
});

const htmlDescStyle = {
  fontSize: T.sizes.rightBody,
  fontWeight: T.weights.rightBody,
  fontFamily: T.fontFamily,
  color: T.colors.text,
};

const ProfessionalPDF: React.FC<{ data: ResumeData }> = ({ data }) => {
  const { profile, experience, education, skills, projects, certifications, customSections, sectionOrder } = data;

  const formatRange = (start: string | undefined, end: string | undefined, current?: boolean) => {
    const a = parseDate(start);
    const b = current ? "Present" : parseDate(end);
    return `${a} - ${b}`;
  };

  const SectionHeading = ({ title }: { title: string }) => (
    <View style={styles.heading}>
      <Text style={styles.headingStyle}>{title}</Text>
      <View style={{ width: "100%", height: 1, backgroundColor: T.colors.text }} />
    </View>
  );

  const CertificationTitlePdf = ({
    title,
    credentialUrl,
    issuer,
    dateStr,
  }: {
    title: string;
    credentialUrl?: string;
    issuer?: string;
    dateStr?: string;
  }) => (
    <View style={{ display: "flex", flexDirection: "column", gap: T.spacing.certItemGap }}>
      <View style={styles.customSectionTitleRow}>
        {credentialUrl ? (
          <Link style={styles.link} src={credentialUrl.startsWith("http") ? credentialUrl : `https://${credentialUrl}`}>
            <Text>{title}</Text>
          </Link>
        ) : (
          <Text>{title}</Text>
        )}
        <Text style={styles.certSubtitle}>
          {issuer || ""}
          {issuer && dateStr ? " - " : ""}
          {dateStr ? parseDate(dateStr) : ""}
        </Text>
      </View>
    </View>
  );

  const CustomSectionLeftPdf = ({ item }: { item: CustomSectionItem }) => (
    <View style={styles.subWrapper}>
      {item.startDate ? (
        <View>
          <Text style={styles.dateText}>
            {parseDate(item.startDate)} - {item.current ? "Present" : parseDate(item.endDate)}
          </Text>
        </View>
      ) : null}
      {item.title ? (
        <View>
          <Text style={styles.text}>{item.title}</Text>
        </View>
      ) : null}
      {item.subtitle?.trim() ? (
        <View>
          <Text style={styles.customSubtitle}>{item.subtitle.trim()}</Text>
        </View>
      ) : null}
      {item.location ? (
        <View>
          <Text style={styles.subText}>{item.location}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderStandardCertifications = () => {
    const visible = (certifications || []).filter(c => !c.hidden);
    if (visible.length === 0) return null;
    return (
      <View>
        {visible.map(cert => (
          <View key={cert.id} style={styles.certWrapper}>
            <View style={styles.certTitleRow}>
              {cert.credentialUrl ? (
                <Link
                  style={styles.link}
                  src={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                >
                  <Text style={styles.text}>{cert.title}</Text>
                </Link>
              ) : (
                <Text style={{ fontWeight: T.weights.certTitle }}>{cert.title}</Text>
              )}
              <Text style={styles.text}>
                {cert.issuer || ""}
                {cert.issuer && cert.date ? " - " : ""}
                {cert.date ? parseDate(cert.date) : ""}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderCustomSectionBody = (custom: CustomSection) => {
    const isCertSection = custom.title === "Certifications";
    const visible = custom.items.filter(i => !i.hidden);
    if (visible.length === 0) return null;

    if (isCertSection) {
      return (
        <View style={{ display: "flex", flexDirection: "column" }}>
          {visible.map(item => (
            <View key={item.id} style={{ display: "flex", flexDirection: "column", gap: T.spacing.certItemGap }}>
              <CertificationTitlePdf title={item.title || ""} issuer={item.subtitle} dateStr={item.endDate || item.startDate} />
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={{ display: "flex", flexDirection: "column" }}>
        {visible.map(item => (
          <View
            key={item.id}
            style={{
              display: "flex",
              flexDirection: "row",
              gap: T.spacing.customRowGap,
              marginBottom: T.spacing.rowMarginBottom,
            }}
          >
            <CustomSectionLeftPdf item={item} />
            <View style={styles.rightColumn}>
              {item.description ? <HtmlRenderer html={item.description} style={htmlDescStyle} listFontSize={T.sizes.listItem} /> : null}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderSection = (sectionId: string) => {
    if (isCustomSection(sectionId)) {
      const custom = customSections.find(s => s.id === sectionId);
      if (!custom) return null;
      const visibleItems = custom.items.filter(i => !i.hidden);
      if (visibleItems.length === 0) return null;
      return (
        <View key={sectionId} style={styles.sectionWrapper}>
          <SectionHeading title={custom.title} />
          <View style={styles.sectionContent}>{renderCustomSectionBody(custom)}</View>
        </View>
      );
    }

    switch (sectionId) {
      case SECTIONS.PROFILE: {
        if (!profile.summary?.trim()) return null;
        return (
          <View key="profile" style={styles.sectionWrapper} wrap={false}>
            <SectionHeading title={STANDARD_LABELS.profile} />
            <View style={styles.sectionContent}>
              <HtmlRenderer html={profile.summary} style={htmlDescStyle} listFontSize={T.sizes.listItem} />
            </View>
          </View>
        );
      }
      case SECTIONS.EXPERIENCE: {
        const visible = experience.filter(e => !e.hidden);
        if (visible.length === 0) return null;
        return (
          <View key="experience" style={styles.sectionWrapper}>
            <SectionHeading title={STANDARD_LABELS.experience} />
            <View style={styles.sectionContent}>
              {visible.map(exp => (
                <View key={exp.id} style={styles.row} wrap={false}>
                  <View style={styles.subWrapper}>
                    <Text style={styles.dateText}>{formatRange(exp.startDate, exp.endDate, exp.current)}</Text>
                    <Text style={styles.text}>{exp.company}</Text>
                    {exp.location ? <Text style={styles.subText}>{exp.location}</Text> : null}
                  </View>
                  <View style={styles.rightColumn}>
                    <Text style={styles.rightColumnHeader}>{exp.role}</Text>
                    <View style={styles.rightColumnDescription}>
                      {exp.description ? (
                        <HtmlRenderer html={exp.description} style={htmlDescStyle} listFontSize={T.sizes.listItem} />
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      }
      case SECTIONS.EDUCATION: {
        const visible = education.filter(e => !e.hidden);
        if (visible.length === 0) return null;
        return (
          <View key="education" style={styles.sectionWrapper}>
            <SectionHeading title={STANDARD_LABELS.education} />
            <View style={styles.sectionContent}>
              {visible.map(edu => (
                <View key={edu.id} style={styles.row} wrap={false}>
                  <View style={styles.subWrapper}>
                    <Text style={styles.dateText}>{formatRange(edu.startDate, edu.endDate, edu.current)}</Text>
                    <Text style={styles.subText}>{edu.school}</Text>
                  </View>
                  <View style={styles.rightColumn}>
                    <Text style={styles.rightColumnHeader}>{edu.degree}</Text>
                    <View style={styles.rightColumnDescription}>
                      {edu.description ? (
                        <HtmlRenderer html={edu.description} style={htmlDescStyle} listFontSize={T.sizes.listItem} />
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      }
      case SECTIONS.SKILLS: {
        const visible = skills.filter(s => !s.hidden);
        if (visible.length === 0) return null;
        return (
          <View key="skills" style={styles.sectionWrapper}>
            <SectionHeading title={STANDARD_LABELS.skills} />
            <View style={styles.sectionContent}>
              <View style={styles.skillsMain}>
                {visible.map(sk => (
                  <View key={sk.id} style={styles.skillHeader}>
                    <Text style={styles.text}>•</Text>
                    <Text style={styles.text}>{sk.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );
      }
      case SECTIONS.PROJECTS: {
        const visible = projects.filter(p => !p.hidden);
        if (visible.length === 0) return null;
        return (
          <View key="projects" style={styles.sectionWrapper}>
            <SectionHeading title={STANDARD_LABELS.projects} />
            <View style={styles.sectionContent}>
              {visible.map(proj => (
                <View key={proj.id} style={styles.row} wrap={false}>
                  <View style={styles.subWrapper}>
                    {proj.url ? (
                      <Link style={styles.link} src={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`}>
                        <Text style={styles.dateText}>{proj.title}</Text>
                      </Link>
                    ) : (
                      <Text style={styles.dateText}>{proj.title}</Text>
                    )}
                  </View>
                  <View style={styles.rightColumn}>
                    <View style={styles.rightColumnDescription}>
                      {proj.description ? (
                        <HtmlRenderer html={proj.description} style={htmlDescStyle} listFontSize={T.sizes.listItem} />
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      }
      case SECTIONS.CERTIFICATIONS: {
        const node = renderStandardCertifications();
        if (!node) return null;
        return (
          <View key="certifications" style={styles.sectionWrapper}>
            <SectionHeading title={STANDARD_LABELS.certifications} />
            <View style={styles.sectionContent}>{node}</View>
          </View>
        );
      }
      default:
        return null;
    }
  };

  const contactChunks: React.ReactNode[] = [];
  if (profile.phone) {
    contactChunks.push(
      <View key="phone" style={styles.flexRow}>
        <Text style={{ fontSize: T.sizes.contact }}>{profile.phone}</Text>
      </View>
    );
  }
  const loc = [profile.city, profile.country].filter(Boolean).join(profile.city && profile.country ? ", " : "");
  if (loc) {
    contactChunks.push(
      <View key="loc" style={styles.flexRow}>
        <Text style={{ fontSize: T.sizes.contact }}>{loc}</Text>
      </View>
    );
  }
  if (profile.email) {
    contactChunks.push(
      <View key="email" style={styles.flexRow}>
        <Text style={{ fontSize: T.sizes.contact }}>{profile.email}</Text>
      </View>
    );
  }
  if (profile.linkedin) {
    contactChunks.push(
      <Link key="linkedin" style={styles.link} src={getLinkedinUrl(profile.linkedin)}>
        <Text style={{ fontSize: T.sizes.contact }}>LinkedIn</Text>
      </Link>
    );
  }
  if (profile.portfolio) {
    contactChunks.push(
      <Link key="portfolio" style={styles.link} src={getPortfolioUrl(profile.portfolio)}>
        <Text style={{ fontSize: T.sizes.contact }}>Portfolio</Text>
      </Link>
    );
  }
  if (profile.github) {
    contactChunks.push(
      <Link key="github" style={styles.link} src={getGithubUrl(profile.github)}>
        <Text style={{ fontSize: T.sizes.contact }}>GitHub</Text>
      </Link>
    );
  }

  const hasHeaderBlock = Boolean(profile.fullName || profile.title || contactChunks.length > 0);

  return (
    <Page size="A4" style={styles.page}>
      {hasHeaderBlock ? (
        <View>
          {profile.fullName ? (
            <View style={styles.header}>
              <Text>{profile.fullName}</Text>
            </View>
          ) : null}
          {profile.title ? (
            <View style={styles.subHeader}>
              <Text>{profile.title}</Text>
            </View>
          ) : null}
          {contactChunks.length > 0 ? <View style={styles.headerDetails}>{contactChunks}</View> : null}
        </View>
      ) : null}

      <View style={styles.sectionMain}>
        {deduplicateSectionOrder(sectionOrder)
          .filter(s => !s.hidden)
          .map(s => renderSection(s.id))}
      </View>
    </Page>
  );
};

export default ProfessionalPDF;
