import React from "react";
import { Page, View, Text, StyleSheet, Link } from "@react-pdf/renderer";
import { CustomSection, CustomSectionItem, ResumeData } from "../../../../types";
import { getTemplateConfig, isCustomSection, SECTIONS } from "../../config/constants";
import HtmlRenderer from "../../shared/HtmlRenderer";
import { parseDate as formatDateMonthYear } from "../../shared/dateUtils";
import { getGithubUrl, getLinkedinUrl, getPortfolioUrl } from "../../shared/urlUtils";
import { buildNextgenColumns } from "./nextgen-columns";
import { NEXTGEN_TOKENS as T } from "./nextgen-tokens";

const hyphenationNoBreak = (word: string) => [word];

const STANDARD_LABELS: Record<string, string> = {
  profile: "Summary",
  experience: "Experiences",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
};

const htmlBodyStyle = {
  fontSize: T.sizes.body,
  textAlign: "justify" as const,
  lineHeight: 1.4,
  fontFamily: T.fontFamily,
  color: T.colors.text,
};

const nextgenPdfCfg = getTemplateConfig("nextgen").pdf;

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    fontWeight: 400,
    paddingTop: T.pagePaddingPt.top,
    paddingBottom: T.pagePaddingPt.bottom,
    paddingLeft: T.pagePaddingPt.horizontal,
    paddingRight: T.pagePaddingPt.horizontal,
    fontFamily: nextgenPdfCfg.fontFamily,
    color: T.colors.text,
    fontSize: T.sizes.body,
  },
  personalWrapper: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    padding: `${T.spacing.personalPaddingTop}pt 0 ${T.spacing.personalPaddingBottom}pt 0`,
    textAlign: "center",
    gap: `${T.spacing.headerBottomGap}pt`,
  },
  name: {
    fontSize: T.sizes.name,
    fontWeight: T.weights.name,
    lineHeight: 1.2,
    marginTop: 0,
    marginBottom: "2pt",
    color: T.colors.text,
  },
  contactRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    fontSize: T.sizes.contact,
    gap: `${T.spacing.entryGap}pt`,
    flexWrap: "wrap",
  },
  pipe: {
    fontSize: T.sizes.pipe,
    color: T.colors.text,
  },
  link: {
    color: T.colors.text,
    textDecoration: "none",
  },
  rule: {
    width: "100%",
    height: 2,
    backgroundColor: T.colors.text,
  },
  row: {
    display: "flex",
    flexDirection: "row",
  },
  colLeft: {
    width: T.layout.leftColumnWidth,
  },
  colRight: {
    width: T.layout.rightColumnWidth,
    display: "flex",
    flexDirection: "column",
    gap: `${T.spacing.rightColumnGap}pt`,
  },
  sectionShell: {
    color: T.colors.text,
    width: T.layout.sectionWidth,
    display: "flex",
    flexDirection: "column",
    marginBottom: `${T.spacing.sectionMarginBottom}pt`,
  },
  sectionHeadingWrap: {
    display: "flex",
    flexDirection: "column",
    gap: `${T.spacing.sectionHeadingGap}pt`,
    marginLeft: `${T.spacing.sectionContentMarginLeft}pt`,
    marginBottom: "2pt",
  },
  sectionHeadingText: {
    fontSize: T.sizes.sectionHeading,
    fontWeight: T.weights.sectionHeading,
    textTransform: "uppercase",
  },
  sectionContent: {
    marginLeft: `${T.spacing.sectionContentMarginLeft}pt`,
    display: "flex",
    flexDirection: "column",
    gap: `${T.spacing.sectionContentGap}pt`,
  },
  flexCol: {
    display: "flex",
    flexDirection: "column",
  },
  expBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "2pt",
    marginBottom: `${T.spacing.sectionMarginBottom}pt`,
  },
  rowBetween: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: `${T.spacing.entryGap}pt`,
  },
  subtitle: {
    fontSize: T.sizes.subtitle,
    fontWeight: T.weights.subtitle,
    color: T.colors.text,
  },
  secondTitle: {
    fontSize: T.sizes.secondTitle,
    fontWeight: T.weights.secondTitle,
    color: T.colors.text,
  },
  skillsBlock: {
    display: "flex",
    flexDirection: "column",
    gap: `${T.spacing.entryGap}pt`,
  },
  certBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
});

const NextgenPDF = ({ data }: { data: ResumeData }) => {
  const { leftColumnIds, rightColumnIds } = buildNextgenColumns(data);
  const profile = data.profile || {};
  const educationSplit = data.educationLeftColumn === true;

  const renderContactRow = () => {
    const parts: React.ReactNode[] = [];
    if (profile.email) {
      parts.push(
        <Text key="email" style={{ fontSize: T.sizes.contact }}>
          {profile.email}
        </Text>
      );
    }
    if (profile.phone) {
      parts.push(
        <Text key="pipe-p" style={styles.pipe}>
          |
        </Text>,
        <Text key="phone" style={{ fontSize: T.sizes.contact }}>
          {profile.phone}
        </Text>
      );
    }
    if (profile.linkedin) {
      parts.push(
        <Text key="pipe-l" style={styles.pipe}>
          |
        </Text>,
        <Link key="linkedin" style={styles.link} src={getLinkedinUrl(profile.linkedin)}>
          <Text style={{ fontSize: T.sizes.contact }}>LinkedIn</Text>
        </Link>
      );
    }
    if (profile.portfolio) {
      parts.push(
        <Text key="pipe-port" style={styles.pipe}>
          |
        </Text>,
        <Link key="portfolio" style={styles.link} src={getPortfolioUrl(profile.portfolio)}>
          <Text style={{ fontSize: T.sizes.contact }}>Portfolio</Text>
        </Link>
      );
    }
    if (profile.github) {
      parts.push(
        <Text key="pipe-g" style={styles.pipe}>
          |
        </Text>,
        <Link key="github" style={styles.link} src={getGithubUrl(profile.github)}>
          <Text style={{ fontSize: T.sizes.contact }}>GitHub</Text>
        </Link>
      );
    }
    const loc = [profile.city, profile.country].filter(Boolean).join(profile.city && profile.country ? ", " : "");
    if (loc) {
      parts.push(
        <Text key="pipe-loc" style={styles.pipe}>
          |
        </Text>,
        <Text key="loc" style={{ fontSize: T.sizes.contact }}>
          {loc}
        </Text>
      );
    }
    if (parts.length === 0) return null;
    return <View style={styles.contactRow}>{parts}</View>;
  };

  const SectionHeading = ({ title }: { title: string }) => (
    <View style={styles.sectionHeadingWrap}>
      <Text style={styles.sectionHeadingText}>{title.toUpperCase()}</Text>
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
    <View style={styles.flexCol}>
      {credentialUrl ? (
        <Link style={styles.link} src={credentialUrl.startsWith("http") ? credentialUrl : `https://${credentialUrl}`}>
          <Text style={styles.subtitle}>{title}</Text>
        </Link>
      ) : (
        <Text style={styles.subtitle}>{title}</Text>
      )}
      <Text style={styles.secondTitle}>
        {issuer || ""}
        {issuer && dateStr ? " - " : ""}
        {dateStr ? formatDateMonthYear(dateStr) : ""}
      </Text>
    </View>
  );

  const CustomSectionTitlePdf = ({ item }: { item: CustomSectionItem }) => {
    const datePart =
      item.startDate && `${formatDateMonthYear(item.startDate)}${item.endDate ? ` - ${formatDateMonthYear(item.endDate)}` : ""}`;
    const rightText = [item.location, datePart].filter(Boolean).join(" | ");
    return (
      <View style={styles.flexCol}>
        {item.title ? <Text style={styles.subtitle}>{item.title}</Text> : null}
        {item.subtitle?.trim() ? <Text style={styles.secondTitle}>{item.subtitle.trim()}</Text> : null}
        {rightText ? <Text style={styles.secondTitle}>{rightText}</Text> : null}
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
            <View key={item.id} style={{ marginBottom: `${T.spacing.entryGap}pt` }}>
              <CertificationTitlePdf title={item.title || ""} issuer={item.subtitle} dateStr={item.endDate || item.startDate} />
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.flexCol}>
        {visible.map(item => (
          <View key={item.id} style={{ marginBottom: `${T.spacing.sectionMarginBottom}pt` }}>
            <CustomSectionTitlePdf item={item} />
            {item.description ? <HtmlRenderer html={item.description} style={htmlBodyStyle} listFontSize={T.sizes.listItem} /> : null}
          </View>
        ))}
      </View>
    );
  };

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
        const experienceTitleLeftCol = "66%";
        const experienceTitleRightCol = "34%";
        return (
          <View key="experience" style={styles.sectionShell}>
            <SectionHeading title={STANDARD_LABELS.experience} />
            <View style={styles.sectionContent}>
              {visible.map(exp => (
                <View key={exp.id} style={styles.expBlock} wrap={false}>
                  <View style={styles.rowBetween}>
                    <View style={{ width: experienceTitleLeftCol }}>
                      <Text style={styles.subtitle}>{exp.company}</Text>
                    </View>
                    <View style={{ width: experienceTitleRightCol, textAlign: "right" }}>
                      <Text style={styles.subtitle} hyphenationCallback={hyphenationNoBreak}>
                        {exp.role}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rowBetween}>
                    <View style={{ width: T.layout.experienceLeftCol }}>
                      <Text style={styles.secondTitle}>
                        {formatDateMonthYear(exp.startDate)} - {exp.current ? "Present" : formatDateMonthYear(exp.endDate)}
                      </Text>
                    </View>
                    <View style={{ width: T.layout.experienceRightCol, textAlign: "right" }}>
                      <Text style={styles.secondTitle}>{exp.location || ""}</Text>
                    </View>
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
                <View key={edu.id} style={{ marginBottom: `${T.spacing.entryGap}pt` }} wrap={false}>
                  {educationSplit ? (
                    <>
                      <View style={styles.rowBetween}>
                        <View style={{ width: T.layout.experienceLeftCol }}>
                          <Text style={styles.subtitle}>{edu.school}</Text>
                          <Text style={styles.secondTitle}>{edu.degree}</Text>
                        </View>
                        <Text style={styles.secondTitle}>
                          {formatDateMonthYear(edu.startDate)} - {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
                        </Text>
                      </View>
                      <View style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: `${T.spacing.headerBottomGap}pt` }}>
                        <Text style={styles.secondTitle}>{edu.location || ""}</Text>
                      </View>
                      {edu.description ? (
                        <HtmlRenderer html={edu.description} style={htmlBodyStyle} listFontSize={T.sizes.listItem} />
                      ) : null}
                    </>
                  ) : (
                    <>
                      <Text style={styles.subtitle}>{edu.school}</Text>
                      <Text style={styles.secondTitle}>{edu.degree}</Text>
                      <Text style={styles.secondTitle}>
                        {formatDateMonthYear(edu.startDate)} - {edu.current ? "Present" : formatDateMonthYear(edu.endDate)}
                      </Text>
                      <Text style={styles.secondTitle}>{edu.location || ""}</Text>
                      {edu.description ? (
                        <HtmlRenderer html={edu.description} style={htmlBodyStyle} listFontSize={T.sizes.listItem} />
                      ) : null}
                    </>
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
              <View style={styles.skillsBlock}>
                {Object.keys(grouped).map(cat => (
                  <View key={cat}>
                    <Text style={styles.subtitle}>{cat} :</Text>
                    <Text style={styles.secondTitle}>{grouped[cat].join(", ")}</Text>
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
                <View key={proj.id} style={styles.skillsBlock} wrap={false}>
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
                <View key={cert.id} style={styles.certBlock} wrap={false}>
                  <View style={styles.flexCol}>
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
      <View style={styles.personalWrapper}>
        {profile.fullName ? <Text style={styles.name}>{profile.fullName}</Text> : null}
        {renderContactRow()}
      </View>
      <View style={styles.rule} />
      <View style={styles.row}>
        <View style={styles.colLeft}>{renderColumn(leftColumnIds)}</View>
        <View style={styles.colRight}>{renderColumn(rightColumnIds)}</View>
      </View>
    </Page>
  );
};

export default NextgenPDF;
