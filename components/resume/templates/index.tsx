import React from "react";
import type { PdfHighlightMap } from "@/features/adk-chat/adkResumeHighlightDiff";
import { ResumeData, ResumeTemplateId } from "../../../types";
import AusPDF from "./aus/AusPDF";
import AusPreview from "./aus/AusPreview";
import BasicPDF from "./basic/BasicPDF";
import BasicPreview from "./basic/BasicPreview";
import CanadaPDF from "./canada/CanadaPDF";
import CanadaPreview from "./canada/CanadaPreview";
import ClassicPDF from "./classic/ClassicPDF";
import ClassicPreview from "./classic/ClassicPreview";
import IrelandPDF from "./ireland/IrelandPDF";
import IrelandPreview from "./ireland/IrelandPreview";
import MinimalPDF from "./minimal/MinimalPDF";
import MinimalPreview from "./minimal/MinimalPreview";
import ModernPDF from "./modern/ModernPDF";
import ModernPreview from "./modern/ModernPreview";
import NextgenPDF from "./nextgen/NextgenPDF";
import NextgenPreview from "./nextgen/NextgenPreview";
import PrimeslatePDF from "./primeslate/PrimeslatePDF";
import PrimeslatePreview from "./primeslate/PrimeslatePreview";
import ProfessionalPDF from "./professional/ProfessionalPDF";
import ProfessionalPreview from "./professional/ProfessionalPreview";
import SlateproPDF from "./slatepro/SlateproPDF";
import SlateproPreview from "./slatepro/SlateproPreview";
import USPDF from "./us/USPDF";
import USPreview from "./us/USPreview";

/** Options passed to preview renderers */
export interface PreviewOptions {
  activeSection?: string;
  isEditing?: boolean;
  previewScale?: number;
  isModal?: boolean;
}

export interface RenderPdfPageOptions {
  highlights?: PdfHighlightMap;
}

export interface TemplateRenderer {
  id: ResumeTemplateId;
  renderPreview(data: ResumeData, options?: PreviewOptions): React.ReactNode;
  renderPDFPage(data: ResumeData, options?: RenderPdfPageOptions): React.ReactElement;
}

const templateRegistry = new Map<ResumeTemplateId, TemplateRenderer>();

export const registerTemplate = (template: TemplateRenderer) => {
  templateRegistry.set(template.id, template);
};

export const getTemplate = (id: ResumeTemplateId): TemplateRenderer | undefined => {
  return templateRegistry.get(id);
};

export const getAllTemplates = (): TemplateRenderer[] => {
  return Array.from(templateRegistry.values());
};

registerTemplate({
  id: "modern",
  renderPreview: (data, options) => <ModernPreview data={data} previewScale={options?.previewScale ?? 1} isModal={options?.isModal} />,
  renderPDFPage: data => <ModernPDF data={data} />,
});

registerTemplate({
  id: "minimal",
  renderPreview: (data, options) => <MinimalPreview data={data} previewScale={options?.previewScale ?? 1} isModal={options?.isModal} />,
  renderPDFPage: data => <MinimalPDF data={data} />,
});

registerTemplate({
  id: "classic",
  renderPreview: (data, options) => <ClassicPreview data={data} previewScale={options?.previewScale ?? 1} isModal={options?.isModal} />,
  renderPDFPage: data => <ClassicPDF data={data} />,
});

registerTemplate({
  id: "us",
  renderPreview: (data, options) => <USPreview data={data} previewScale={options?.previewScale ?? 1} isModal={options?.isModal} />,
  renderPDFPage: data => <USPDF data={data} />,
});

registerTemplate({
  id: "canada",
  renderPreview: (data, options) => <CanadaPreview data={data} previewScale={options?.previewScale ?? 1} isModal={options?.isModal} />,
  renderPDFPage: data => <CanadaPDF data={data} />,
});

registerTemplate({
  id: "basic",
  renderPreview: (data, options) => <BasicPreview data={data} previewScale={options?.previewScale ?? 1} isModal={options?.isModal} />,
  renderPDFPage: (data, options) => <BasicPDF data={data} highlights={options?.highlights} />,
});

registerTemplate({
  id: "ireland",
  renderPreview: (data, options) => <IrelandPreview data={data} previewScale={options?.previewScale ?? 1} isModal={options?.isModal} />,
  renderPDFPage: data => <IrelandPDF data={data} />,
});

registerTemplate({
  id: "aus",
  renderPreview: (data, options) => <AusPreview data={data} previewScale={options?.previewScale ?? 1} isModal={options?.isModal} />,
  renderPDFPage: data => <AusPDF data={data} />,
});

registerTemplate({
  id: "nextgen",
  renderPreview: (data, options) => <NextgenPreview data={data} previewScale={options?.previewScale ?? 1} isModal={options?.isModal} />,
  renderPDFPage: data => <NextgenPDF data={data} />,
});

registerTemplate({
  id: "professional",
  renderPreview: (data, options) => (
    <ProfessionalPreview data={data} previewScale={options?.previewScale ?? 1} isModal={options?.isModal} />
  ),
  renderPDFPage: data => <ProfessionalPDF data={data} />,
});

registerTemplate({
  id: "slatepro",
  renderPreview: (data, options) => <SlateproPreview data={data} previewScale={options?.previewScale ?? 1} isModal={options?.isModal} />,
  renderPDFPage: data => <SlateproPDF data={data} />,
});

registerTemplate({
  id: "primeslate",
  renderPreview: (data, options) => <PrimeslatePreview data={data} previewScale={options?.previewScale ?? 1} isModal={options?.isModal} />,
  renderPDFPage: data => <PrimeslatePDF data={data} />,
});
