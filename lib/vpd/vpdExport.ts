import { PortfolioItem } from '@/types';

export function getVpdShareUrl(projectId: string): string {
    const slug = String(projectId)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return `https://vpd.unimad.app/${slug || 'draft'}`;
}

export async function shareVpdLink(project: PortfolioItem): Promise<string> {
    const url = getVpdShareUrl(String(project.id));
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
    }
    return url;
}

export function downloadVpdPdf(project: PortfolioItem): void {
    const title = project.title?.trim() || 'Value Proposition Document';
    if (typeof window === 'undefined') return;

    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) {
        window.alert('Allow pop-ups to download your VPD as PDF.');
        return;
    }

    const blocks = project.detailedBlocks ?? [];
    const blockHtml = blocks
        .map((block) => {
            const heading = block.title ? `<h3>${escapeHtml(block.title)}</h3>` : '';
            const body = escapeHtml(
                String(block.content || '')
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<[^>]+>/g, ''),
            );
            return `<section class="block"><div class="block-inner">${heading}<p>${body.replace(/\n/g, '<br/>')}</p></div></section>`;
        })
        .join('');

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; color: #0f172a; }
    h1 { font-size: 28px; margin-bottom: 8px; }
    .desc { color: #64748b; margin-bottom: 24px; }
    .block { margin-bottom: 16px; page-break-inside: avoid; }
    .block-inner { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
    h3 { font-size: 14px; margin: 0 0 8px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; }
    p { margin: 0; line-height: 1.6; font-size: 15px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${project.description ? `<p class="desc">${escapeHtml(project.description)}</p>` : ''}
  ${blockHtml || '<p>No content yet.</p>'}
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
