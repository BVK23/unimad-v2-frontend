import React from "react";
import { Document } from "@react-pdf/renderer";
import type { PdfHighlightMap } from "@/features/adk-chat/adkResumeHighlightDiff";
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
