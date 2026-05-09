import React from "react";
import { Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { CustomSection, CustomSectionItem, ResumeData } from "../../../../types";
import { isCustomSection, SECTIONS } from "../../config/constants";
import "../../config/fonts";
import HtmlRenderer from "../../shared/HtmlRenderer";
import { parseDate as formatDateMonthYear } from "../../shared/dateUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";
import { buildSlateproColumns } from "./slatepro-columns";
import { SLATEPRO_TOKENS as T } from "./slatepro-tokens";

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
    fontWeight: 400,
    color: T.colors.text,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.headerGap,
    marginBottom: T.spacing.headerBottom,
  },
  avatar: {
    width: T.layout.avatarSize,
    height: T.layout.avatarSize,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: T.colors.avatarBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: T.sizes.avatarInitials,
    color: T.colors.text,
  },
  headerTextCol: {
    flexDirection: "column",
    gap: T.spacing.nameTitleGap,
    flex: 1,
  },
  name: {
    fontSize: T.sizes.name,
    fontWeight: T.weights.name,
    color: T.colors.text,
  },
  title: {
    fontSize: T.sizes.title,
    fontWeight: T.weights.titleLight,
    color: T.colors.text,
  },
  ruleFull: {
    width: "100%",
    height: 0.5,
    backgroundColor: T.colors.rule,
    marginTop: T.spacing.sectionGap,
    marginBottom: T.spacing.ruleGap,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  colLeft: {
    width: T.layout.leftColumnWidth,
    paddingRight: T.layout.leftColumnPaddingRight,
  },
  colDivider: {
    width: 0.5,
    minHeight: "100%",
    backgroundColor: T.colors.rule,
  },
  colRight: {
    width: T.layout.rightColumnWidth,
    paddingLeft: T.layout.rightColumnPaddingLeft,
  },
  sectionShell: {
    flexDirection: "column",
    gap: 2,
    marginBottom: T.spacing.sectionGap,
    color: T.colors.text,
  },
  sectionHeadingCol: {
    flexDirection: "column",
    gap: T.spacing.sectionHeadingGap,
  },
  sectionHeadingText: {
    fontSize: T.sizes.sectionHeading,
    fontWeight: T.weights.sectionHeading,
    color: T.colors.text,
  },
  sectionRule: {
    width: "100%",
    height: 0.5,
    backgroundColor: T.colors.rule,
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
    color: T.colors.muted,
  },
  subtitleText: {
    fontSize: T.sizes.subtitle,
    fontWeight: T.weights.subtitle,
    color: T.colors.text,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expBlock: {
    flexDirection: "column",
    gap: T.spacing.experienceGap,
    marginBottom: 4,
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
  contactHeadingCol: {
    flexDirection: "column",
    gap: T.spacing.sectionHeadingGap,
    marginBottom: T.spacing.contactBlockGap,
  },
  contactBlock: {
    flexDirection: "column",
    gap: T.spacing.contactBlockGap,
    marginBottom: T.spacing.sectionGap,
  },
  contactRow: {
    flexDirection: "column",
    gap: T.spacing.contactRowGap,
  },
  contactLabel: {
    fontSize: T.sizes.contactLabel,
    fontWeight: T.weights.contactLabel,
    color: T.colors.text,
  },
  contactValue: {
    fontSize: T.sizes.contactValue,
    fontWeight: T.weights.contactValue,
    color: T.colors.text,
  },
  link: {
    color: T.colors.text,
    textDecoration: "none",
  },
});

const SlateproPDF = ({ data }: { data: ResumeData }) => {
  const profile = data.profile || {};
  const { leftColumnIds, rightColumnIds } = buildSlateproColumns(data);
  const educationSplit = data.educationLeftColumn === true;

  const htmlBodyStyle = {
    fontSize: T.sizes.body,
    lineHeight: 1.4,
    fontFamily: T.fontFamily,
    color: T.colors.text,
  };

  const initials = (profile.fullName || "")
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sectionDisplayTitle = (label: string) => (label === "Summary" ? "PROFESSIONAL SUMMARY" : label.toUpperCase());

  const SectionHeading = ({ title }: { title: string }) => (
    <View style={styles.sectionHeadingCol}>
      <Text style={styles.sectionHeadingText}>{sectionDisplayTitle(title)}</Text>
      <View style={styles.sectionRule} />
    </View>
  );

  const CustomCertTitlePdf = ({ title, issuer, dateStr }: { title: string; issuer?: string; dateStr?: string }) => (
    <View style={styles.flexCol}>
      <Text style={styles.firstTitle}>{title}</Text>
      <Text style={styles.subtitle}>
        {issuer || ""}
        {issuer && dateStr ? " - " : ""}
        {dateStr ? formatDateMonthYear(dateStr) : ""}
      </Text>
    </View>
  );

  const CustomSectionTitlePdf = ({ item }: { item: CustomSectionItem }) => {
    const datePart =
      item.startDate && `${formatDateMonthYear(item.startDate)}${item.endDate ? ` - ${formatDateMonthYear(item.endDate)}` : ""}`;
    const sub = item.subtitle?.trim();
    return (
      <View style={styles.flexCol}>
        <View style={styles.rowBetween}>
          <View style={styles.flexCol}>
            {item.title ? <Text style={styles.firstTitle}>{item.title}</Text> : null}
            {sub ? <Text style={styles.subtitle}>{sub}</Text> : null}
            {item.location ? <Text style={styles.subtitle}>{item.location}</Text> : null}
          </View>
          {datePart ? <Text style={styles.subtitle}>{datePart}</Text> : null}
        </View>
      </View>
    );
  };

  const renderCustomSectionBody = (custom: CustomSection) => {
    const isCertSection = custom.title === "Certifications";
    const visible = custom.items.filter(i => !i.hidden);
    if (visible.length === 0) return null;

    if (isCertSection) {
      return (
        <View style={styles.flexCol}>
          {visible.map(item => (
            <View key={item.id} style={{ marginBottom: 6 }}>
              <CustomCertTitlePdf title={item.title || ""} issuer={item.subtitle} dateStr={item.endDate || item.startDate} />
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.flexCol}>
        {visible.map(item => (
          <View key={item.id} style={{ marginBottom: 5 }}>
            <CustomSectionTitlePdf item={item} />
            {item.description ? <HtmlRenderer html={item.description} style={htmlBodyStyle} listFontSize={T.sizes.listItem} /> : null}
          </View>
        ))}
      </View>
    );
  };

  const renderContactDetails = () => (
    <>
      <View style={styles.contactHeadingCol}>
        <Text style={styles.sectionHeadingText}>CONTACT</Text>
        <View style={styles.sectionRule} />
      </View>
      <View style={styles.contactBlock}>
        {profile.email ? (
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>{profile.email}</Text>
          </View>
        ) : null}
        {(profile.city || profile.country) && (
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>Location</Text>
            <Text style={styles.contactValue}>
              {[profile.city, profile.country].filter(Boolean).join(profile.city && profile.country ? ", " : "")}
            </Text>
          </View>
        )}
        {profile.phone ? (
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>Phone</Text>
            <Text style={styles.contactValue}>{profile.phone}</Text>
          </View>
        ) : null}
        {profile.linkedin ? (
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>LinkedIn</Text>
            <Link style={styles.contactValue} src={getLinkedinUrl(profile.linkedin)}>
              <Text style={styles.contactValue}>{profile.linkedin}</Text>
            </Link>
          </View>
        ) : null}
        {profile.portfolio ? (
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>Portfolio</Text>
            <Link
              style={styles.contactValue}
              src={profile.portfolio.startsWith("http") ? profile.portfolio : getPortfolioUrl(profile.portfolio)}
            >
              <Text style={styles.contactValue}>{profile.portfolio}</Text>
            </Link>
          </View>
        ) : null}
        {profile.github ? (
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>GitHub</Text>
            <Link style={styles.contactValue} src={getGithubUrl(profile.github)}>
              <Text style={styles.contactValue}>{profile.github}</Text>
            </Link>
          </View>
        ) : null}
      </View>
    </>
  );

  const renderStandardSection = (sectionId: string) => {
    switch (sectionId) {
      case SECTIONS.PROFILE: {
        if (!profile.summary?.trim()) return null;
        return (
          <View key="profile" style={styles.sectionShell} wrap={false}>
            <SectionHeading title={STANDARD_LABELS.profile} />
            <View style={styles.sectionContent}>
              <HtmlRenderer html={profile.summary} style={htmlBodyStyle} listFontSize={T.sizes.listItem} />
            </View>
          </View>
        );
      }
      case SECTIONS.EXPERIENCE: {
        const visible = (data.experience || []).filter(e => !e.hidden);
        if (visible.length === 0) return null;
        return (
          <View key="experience" style={styles.sectionShell}>
            <SectionHeading title={STANDARD_LABELS.experience} />
            <View style={styles.sectionContent}>
              {visible.map(exp => (
                <View key={exp.id} style={styles.expBlock} wrap={false}>
                  <View style={styles.rowBetween}>
                    <View style={styles.flexCol}>
                      <Text style={styles.firstTitle}>{exp.role}</Text>
                      <View style={styles.subWrap}>
                        <Text style={styles.subtitle}>{exp.company}</Text>
                        <Text style={styles.subtitle}>|</Text>
                        <Text style={styles.subtitle}>{exp.location || ""}</Text>
                      </View>
                    </View>
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
          <View key="education" style={styles.sectionShell}>
            <SectionHeading title={STANDARD_LABELS.education} />
            <View style={styles.sectionContent}>
              {visible.map(edu => (
                <View key={edu.id} style={{ marginBottom: educationSplit ? 6 : 2 }} wrap={false}>
                  {educationSplit ? (
                    <View style={styles.flexCol}>
                      <View style={styles.rowBetween}>
                        <View style={{ width: "70%" }}>
                          <Text style={styles.firstTitle}>{edu.school}</Text>
                          <Text style={styles.subtitle}>{edu.degree}</Text>
                        </View>
                        <Text style={styles.subtitle}>
                          {formatDateMonthYear(edu.startDate)} - {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
                        </Text>
                      </View>
                      {edu.location ? (
                        <View style={styles.subWrap}>
                          <Text style={styles.subtitle}>{edu.location}</Text>
                        </View>
                      ) : null}
                      {edu.description ? (
                        <HtmlRenderer html={edu.description} style={htmlBodyStyle} listFontSize={T.sizes.listItem} />
                      ) : null}
                    </View>
                  ) : (
                    <View style={styles.flexCol}>
                      <Text style={styles.firstTitle}>{edu.school}</Text>
                      <Text style={styles.subtitle}>{edu.degree}</Text>
                      <View style={styles.subWrap}>
                        <Text style={styles.subtitle}>
                          {formatDateMonthYear(edu.startDate)} - {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
                        </Text>
                        <Text style={styles.subtitle}>|</Text>
                        <Text style={styles.subtitle}>{edu.location || ""}</Text>
                      </View>
                      {edu.description ? (
                        <HtmlRenderer html={edu.description} style={htmlBodyStyle} listFontSize={T.sizes.listItem} />
                      ) : null}
                    </View>
                  )}
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
            <SectionHeading title={STANDARD_LABELS.skills} />
            <View style={styles.sectionContent}>
              <View style={{ flexDirection: "column", gap: T.spacing.skillsCategoryGap }}>
                {Object.keys(grouped).map(cat => (
                  <View key={cat}>
                    <Text style={[styles.subtitle, { marginBottom: 2 }]}>{cat} :</Text>
                    <Text style={styles.subtitle}>{grouped[cat].join(", ")}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );
      }
      case SECTIONS.PROJECTS: {
        const visible = (data.projects || []).filter(p => !p.hidden);
        if (visible.length === 0) return null;
        return (
          <View key="projects" style={styles.sectionShell}>
            <SectionHeading title={STANDARD_LABELS.projects} />
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
            <SectionHeading title={STANDARD_LABELS.certifications} />
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

  const renderSectionById = (sectionId: string) => {
    if (isCustomSection(sectionId)) {
      const custom = data.customSections.find(s => s.id === sectionId);
      if (!custom) return null;
      const visibleItems = custom.items.filter(i => !i.hidden);
      if (visibleItems.length === 0) return null;
      return (
        <View key={sectionId} style={styles.sectionShell} wrap={false}>
          <SectionHeading title={custom.title} />
          <View style={styles.sectionContent}>{renderCustomSectionBody(custom)}</View>
        </View>
      );
    }
    return renderStandardSection(sectionId);
  };

  const renderColumn = (ids: string[]) => (
    <>
      {ids.map(id => {
        const node = renderSectionById(id);
        return node ? <React.Fragment key={id}>{node}</React.Fragment> : null;
      })}
    </>
  );

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>{initials ? <Text style={styles.avatarInitials}>{initials}</Text> : null}</View>
        <View style={styles.headerTextCol}>
          {profile.fullName ? <Text style={styles.name}>{profile.fullName}</Text> : null}
          {profile.title ? <Text style={styles.title}>{profile.title}</Text> : null}
        </View>
      </View>
      <View style={styles.ruleFull} />
      <View style={styles.row}>
        <View style={styles.colLeft}>{renderColumn(leftColumnIds)}</View>
        <View style={styles.colDivider} />
        <View style={styles.colRight}>
          {renderContactDetails()}
          {renderColumn(rightColumnIds)}
        </View>
      </View>
    </Page>
  );
};

export default SlateproPDF;
