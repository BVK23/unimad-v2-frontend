/**
 * Preview typography aligned with `utils/pdf-export.tsx` (A4, Helvetica 11pt, #333).
 */
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

/** ~96dpi conversion for scale-to-fit in compact previews */
export const A4_WIDTH_PX = Math.round(A4_WIDTH_MM * (96 / 25.4));

export const APPLICATION_DOCUMENT_PAGE_SURFACE_CLASS =
  "bg-white text-[#333] font-sans text-[11pt] leading-[1.6] shadow-lg border border-slate-200 rounded-sm dark:bg-white dark:text-[#333] dark:border-slate-300";

export const APPLICATION_DOCUMENT_PADDING_CLASS = "p-[53px]";

/** Body / editor content — spacing mirrors pdfStyles paragraph & list margins. */
export const APPLICATION_DOCUMENT_BODY_CLASS =
  "max-w-none min-h-full w-full border-none bg-transparent font-sans text-[11pt] leading-[1.6] text-[#333] outline-none dark:text-[#333] " +
  "[&_p]:mb-2 [&_p:last-child]:mb-0 " +
  "[&_strong]:font-bold [&_b]:font-bold " +
  "[&_ul]:my-2 [&_ul]:mb-2 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:pl-0 " +
  "[&_ol]:my-2 [&_ol]:mb-2 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:pl-0 " +
  "[&_li]:mb-1 [&_li:last-child]:mb-0 [&_li>p]:my-0";
