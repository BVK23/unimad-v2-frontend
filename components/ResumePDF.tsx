import React from "react";
import type { PdfHighlightMap } from "@/features/adk-chat/adkResumeHighlightDiff";
import { Document } from "@react-pdf/renderer";
import { ResumeData } from "../types";
// Import fonts side-effect (ensures fonts are registered before any template renders)
import "./resume/config/fonts";
import { getTemplate } from "./resume/templates";

interface ResumePDFProps {
  data: ResumeData;
  highlights?: PdfHighlightMap;
}

const ResumePDF: React.FC<ResumePDFProps> = ({ data, highlights }) => {
  const template = getTemplate(data.templateId);

  return <Document>{template ? template.renderPDFPage(data, { highlights }) : null}</Document>;
};

export default ResumePDF;
