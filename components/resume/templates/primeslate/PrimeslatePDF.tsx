import React from "react";
import { Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { CustomSection, CustomSectionItem, ResumeData } from "../../../../types";
import { isCustomSection, SECTIONS } from "../../config/constants";
import "../../config/fonts";
import HtmlRenderer from "../../shared/HtmlRenderer";
import { parseDate as formatDateMonthYear } from "../../shared/dateUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";
import { buildPrimeslateColumns } from "./primeslate-columns";
import { PRIMESLATE_TOKENS as T } from "./primeslate-tokens";

const STANDARD_LABELS: Record<string, string> = {
  profile: "Summary",
  experience: "Experiences",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
};

const isHttpUrl = (s: string) => /^https?:\/\//i.test(s.trim());

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: T.pagePaddingPt,
    fontFamily: T.fontFamily,
    fontWeight: 400,
    color: T.colors.text,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: T.spacing.headerMarginBottom,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "column",
    gap: 4,
    paddingRight: 8,
    minWidth: 0,
  },
  name: {
    fontSize: T.sizes.name,
    fontWeight: T.weights.name,
    color: T.colors.accent,
  },
  profileTitle: {
    fontSize: T.sizes.profileTitle,
    fontWeight: T.weights.profileTitle,
    color: T.colors.muted,
  },
  photo: {
    width: T.layout.photoSize,
    height: T.layout.photoSize,
    borderRadius: T.layout.photoRadius,
    objectFit: "cover",
  },
  summaryWrap: {
    marginBottom: T.spacing.sectionMarginBottom,
  },
  contactBar: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: T.colors.border,
    paddingTop: T.spacing.contactBarPaddingY,
    paddingBottom: T.spacing.contactBarPaddingY,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: T.spacing.contactBarGap,
    marginBottom: T.spacing.sectionMarginBottom,
    marginTop: T.spacing.sectionMarginBottom,
  },
  contactText: {
    fontSize: T.sizes.contactBar,
    fontWeight: T.weights.contactBar,
    color: T.colors.text,
  },
  slash: {
    fontSize: T.sizes.slash,
    color: T.colors.text,
  },
  link: {
    color: T.colors.text,
    textDecoration: "none",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  colLeft: {
    width: T.layout.leftColumnWidth,
  },
  colRight: {
    width: T.layout.rightColumnWidth,
  },
  sectionShell: {
    width: T.layout.sectionShellWidth,
    flexDirection: "column",
    gap: 3,
    marginBottom: T.spacing.sectionMarginBottom,
    color: T.colors.text,
  },
  sectionHeadingText: {
    fontSize: T.sizes.sectionHeading,
    fontWeight: T.weights.sectionHeading,
    color: T.colors.accent,
    textTransform: "uppercase",
  },
  sectionContent: {
    flexDirection: "column",
    gap: T.spacing.sectionContentGap,
  },
  firstTitle: {
    fontSize: T.sizes.firstTitle,
    fontWeight: T.weights.firstTitle,
    color: T.colors.text,
  },
  subtitle: {
    fontSize: T.sizes.subtitle,
    fontWeight: T.weights.subtitle,
    color: T.colors.text,
  },
  subWrap: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
    alignItems: "center",
  },
  flexCol: {
    flexDirection: "column",
    gap: 3,
  },
  skillPill: {
    borderWidth: 1,
    borderColor: T.colors.skillPillBorder,
    paddingVertical: T.spacing.skillPillPaddingY,
    paddingHorizontal: T.spacing.skillPillPaddingX,
    borderRadius: 4,
  },
  skillPillText: {
    fontSize: T.sizes.subtitle,
    fontWeight: 400,
    color: T.colors.text,
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: T.spacing.skillPillGap,
  },
  categoryBlock: {
    flexDirection: "column",
    gap: T.spacing.categoryGap,
  },
});

const PrimeslatePDF = ({ data }: { data: ResumeData }) => {
  const profile = data.profile || {};
  const { leftColumnIds, rightColumnIds } = buildPrimeslateColumns(data);

  const htmlBodyStyle = {
    fontSize: T.sizes.body,
    lineHeight: 1.4,
    fontFamily: T.fontFamily,
    color: T.colors.text,
  };

  const renderContactBar = () => {
    const nodes: React.ReactNode[] = [];
    let i = 0;
    const pushSlash = () => {
      nodes.push(
        <Text key={`slash-${i}`} style={styles.slash}>
          /
        </Text>
      );
      i += 1;
    };
    const push = (key: string, el: React.ReactNode) => {
      if (nodes.length > 0) pushSlash();
      nodes.push(<React.Fragment key={key}>{el}</React.Fragment>);
    };

    if (profile.email) push("email", <Text style={styles.contactText}>{profile.email}</Text>);
    if (profile.phone) push("phone", <Text style={styles.contactText}>{profile.phone}</Text>);
    if (profile.linkedin) {
      push(
        "linkedin",
        <Link style={styles.link} src={getLinkedinUrl(profile.linkedin)}>
          <Text style={styles.contactText}>LinkedIn</Text>
        </Link>
      );
    }
    if (profile.portfolio) {
      const href = profile.portfolio.startsWith("http") ? profile.portfolio : getPortfolioUrl(profile.portfolio);
      push(
        "portfolio",
        <Link style={styles.link} src={href}>
          <Text style={styles.contactText}>Portfolio</Text>
        </Link>
      );
    }
    if (profile.github) {
      push(
        "github",
        <Link style={styles.link} src={getGithubUrl(profile.github)}>
          <Text style={styles.contactText}>GitHub</Text>
        </Link>
      );
    }
    const loc = [profile.city, profile.country].filter(Boolean).join(profile.city && profile.country ? ", " : "");
    if (loc) push("loc", <Text style={styles.contactText}>{loc}</Text>);

    if (nodes.length === 0) return null;
    return <View style={styles.contactBar}>{nodes}</View>;
  };

  const renderSectionHeading = (sectionKey: string) => {
    const label = STANDARD_LABELS[sectionKey] ?? sectionKey;
    return (
      <View style={{ marginBottom: 2 }}>
        <Text style={styles.sectionHeadingText}>{label.toUpperCase()}</Text>
      </View>
    );
  };

  const renderCustomCertTitle = (title: string, issuer?: string, dateStr?: string) => (
    <View style={styles.flexCol}>
      <Text style={styles.firstTitle}>{title}</Text>
      <Text style={styles.subtitle}>
        {issuer || ""}
        {issuer && dateStr ? " - " : ""}
        {dateStr ? formatDateMonthYear(dateStr) : ""}
      </Text>
    </View>
  );

  const renderCustomSectionTitle = (item: CustomSectionItem) => {
    const datePart =
      item.startDate && `${formatDateMonthYear(item.startDate)}${item.endDate ? ` - ${formatDateMonthYear(item.endDate)}` : ""}`;
    const meta = [item.location, datePart].filter(Boolean).join(" | ");
    const sub = item.subtitle?.trim();
    return (
      <View style={styles.flexCol}>
        {item.title ? <Text style={styles.firstTitle}>{item.title}</Text> : null}
        {sub ? <Text style={styles.subtitle}>{sub}</Text> : null}
        {meta ? <Text style={styles.subtitle}>{meta}</Text> : null}
      </View>
    );
  };

  const renderCustomSectionBody = (custom: CustomSection) => {
    const isCertSection = custom.title === "Certifications";
    const visible = custom.items.filter(it => !it.hidden);
    if (visible.length === 0) return null;

    if (isCertSection) {
      return (
        <View style={styles.flexCol}>
          {visible.map(item => (
            <View key={item.id} style={{ marginBottom: 6 }}>
              {renderCustomCertTitle(item.title || "", item.subtitle, item.endDate || item.startDate)}
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.flexCol}>
        {visible.map(item => (
          <View key={item.id} style={{ marginBottom: 4 }}>
            {renderCustomSectionTitle(item)}
            {item.description ? <HtmlRenderer html={item.description} style={htmlBodyStyle} listFontSize={T.sizes.listItem} /> : null}
          </View>
        ))}
      </View>
    );
  };

  const renderStandardSection = (sectionId: string) => {
    switch (sectionId) {
      case SECTIONS.PROFILE:
        return null;
      case SECTIONS.EXPERIENCE: {
        const visible = (data.experience || []).filter(e => !e.hidden);
        if (visible.length === 0) return null;
        return (
          <View key="experience" style={styles.sectionShell} wrap={false}>
            {renderSectionHeading(SECTIONS.EXPERIENCE)}
            <View style={styles.sectionContent}>
              {visible.map(exp => (
                <View key={exp.id} style={{ marginBottom: 4 }} wrap={false}>
                  <Text style={styles.firstTitle}>{exp.role}</Text>
                  <View style={styles.subWrap}>
                    <Text style={styles.subtitle}>{exp.company}</Text>
                    <Text style={styles.subtitle}>|</Text>
                    <Text style={styles.subtitle}>{exp.location || ""}</Text>
                    <Text style={styles.subtitle}>|</Text>
                    <Text style={styles.subtitle}>
                      {formatDateMonthYear(exp.startDate)} - {exp.current ? "Present" : formatDateMonthYear(exp.endDate)}
                    </Text>
                  </View>
                  {exp.description ? <HtmlRenderer html={exp.description} style={htmlBodyStyle} listFontSize={T.sizes.listItem} /> : null}
                </View>
              ))}
            </View>
          </View>
        );
      }
      case SECTIONS.EDUCATION: {
        const visible = (data.education || []).filter(e => !e.hidden);
        if (visible.length === 0) return null;
        return (
          <View key="education" style={styles.sectionShell} wrap={false}>
            {renderSectionHeading(SECTIONS.EDUCATION)}
            <View style={styles.sectionContent}>
              {visible.map(edu => (
                <View key={edu.id} style={{ marginBottom: 4 }} wrap={false}>
                  <Text style={styles.firstTitle}>{edu.degree}</Text>
                  <Text style={styles.subtitle}>{edu.school}</Text>
                  <View style={styles.subWrap}>
                    <Text style={styles.subtitle}>{edu.location || ""}</Text>
                    <Text style={styles.subtitle}>|</Text>
                    <Text style={styles.subtitle}>
                      {formatDateMonthYear(edu.startDate)} - {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
                    </Text>
                  </View>
                  {edu.description ? <HtmlRenderer html={edu.description} style={htmlBodyStyle} listFontSize={T.sizes.listItem} /> : null}
                </View>
              ))}
            </View>
          </View>
        );
      }
      case SECTIONS.SKILLS: {
        const grouped = (data.skills || [])
          .filter(s => !s.hidden)
          .reduce(
            (acc, skill) => {
              const cat = skill.category?.trim() || "Other";
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(skill.name);
              return acc;
            },
            {} as Record<string, string[]>
          );
        if (Object.keys(grouped).length === 0) return null;
        return (
          <View key="skills" style={styles.sectionShell} wrap={false}>
            {renderSectionHeading(SECTIONS.SKILLS)}
            <View style={styles.sectionContent}>
              {Object.keys(grouped).map(cat => (
                <View key={cat} style={styles.categoryBlock}>
                  <Text style={styles.subtitle}>{cat} :</Text>
                  <View style={styles.skillsRow}>
                    {grouped[cat].map((skillName, idx) => (
                      <View key={`${cat}-${idx}`} style={styles.skillPill} wrap={false}>
                        <Text style={styles.skillPillText}>{skillName}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      }
      case SECTIONS.PROJECTS: {
        const visible = (data.projects || []).filter(p => !p.hidden);
        if (visible.length === 0) return null;
        return (
          <View key="projects" style={styles.sectionShell}>
            {renderSectionHeading(SECTIONS.PROJECTS)}
            <View style={styles.sectionContent}>
              {visible.map(proj => (
                <View key={proj.id} style={{ marginBottom: 4 }} wrap={false}>
                  {proj.url ? (
                    <Link style={styles.link} src={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`}>
                      <Text style={styles.subtitle}>{proj.title}</Text>
                    </Link>
                  ) : (
                    <Text style={styles.subtitle}>{proj.title}</Text>
                  )}
                  {proj.description ? <HtmlRenderer html={proj.description} style={htmlBodyStyle} listFontSize={T.sizes.listItem} /> : null}
                </View>
              ))}
            </View>
          </View>
        );
      }
      case SECTIONS.CERTIFICATIONS: {
        const visible = (data.certifications || []).filter(c => !c.hidden);
        if (visible.length === 0) return null;
        return (
          <View key="certifications" style={styles.sectionShell}>
            {renderSectionHeading(SECTIONS.CERTIFICATIONS)}
            <View style={styles.sectionContent}>
              {visible.map(cert => (
                <View key={cert.id} style={styles.flexCol} wrap={false}>
                  {cert.credentialUrl ? (
                    <Link
                      style={styles.link}
                      src={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                    >
                      <Text style={styles.subtitle}>{cert.title}</Text>
                    </Link>
                  ) : (
                    <Text style={styles.subtitle}>{cert.title}</Text>
                  )}
                  <Text style={styles.subtitle}>
                    {cert.issuer || ""}
                    {cert.issuer && cert.date ? " - " : ""}
                    {cert.date ? formatDateMonthYear(cert.date) : ""}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      }
      default:
        return null;
    }
  };

  const renderSectionById = (id: string) => {
    if (isCustomSection(id)) {
      const custom = data.customSections.find(s => s.id === id);
      if (!custom) return null;
      const visibleItems = custom.items.filter(i => !i.hidden);
      if (visibleItems.length === 0) return null;
      return (
        <View key={id} style={styles.sectionShell} wrap={false}>
          {renderSectionHeading(custom.title)}
          <View style={styles.sectionContent}>{renderCustomSectionBody(custom)}</View>
        </View>
      );
    }
    return renderStandardSection(id);
  };

  const renderColumn = (ids: string[]) => (
    <>
      {ids.map(id => {
        const node = renderSectionById(id);
        return node ? <React.Fragment key={id}>{node}</React.Fragment> : null;
      })}
    </>
  );

  const pictureSrc = profile.picture?.trim();
  const showPhoto = pictureSrc && isHttpUrl(pictureSrc);

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {profile.fullName ? <Text style={styles.name}>{profile.fullName}</Text> : null}
          {profile.title?.trim() ? <Text style={styles.profileTitle}>{profile.title.trim()}</Text> : null}
        </View>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image has no alt prop */}
        {showPhoto ? <Image style={styles.photo} src={pictureSrc} /> : null}
      </View>
      {profile.summary?.trim() ? (
        <View style={styles.summaryWrap}>
          <HtmlRenderer html={profile.summary} style={htmlBodyStyle} listFontSize={T.sizes.listItem} />
        </View>
      ) : null}
      {renderContactBar()}
      <View style={styles.row}>
        <View style={styles.colLeft}>{renderColumn(leftColumnIds)}</View>
        <View style={styles.colRight}>{renderColumn(rightColumnIds)}</View>
      </View>
    </Page>
  );
};

export default PrimeslatePDF;
