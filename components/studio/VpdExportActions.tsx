'use client';

import React, { useState } from 'react';
import { Download, Link2 } from 'lucide-react';
import { PortfolioItem } from '../../types';
import { downloadVpdPdf, shareVpdLink } from '@/lib/vpd/vpdExport';

interface VpdExportActionsProps {
    project: PortfolioItem;
    className?: string;
    onShare?: (url: string) => void;
}

const VpdExportActions: React.FC<VpdExportActionsProps> = ({ project, className = '', onShare }) => {
    const [shareHint, setShareHint] = useState<string | null>(null);

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const url = await shareVpdLink(project);
            setShareHint('Link copied');
            onShare?.(url);
            window.setTimeout(() => setShareHint(null), 2000);
        } catch {
            window.alert('Could not copy link. Try again.');
        }
    };

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        downloadVpdPdf(project);
    };

    return (
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
            <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
                <Link2 size={14} />
                {shareHint ?? 'Share link'}
            </button>
            <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
                <Download size={14} />
                Download PDF
            </button>
        </div>
    );
};

export default VpdExportActions;
