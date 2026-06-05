import React from 'react';
import { PortfolioItem } from '../../types';

interface VpdCardThumbnailProps {
    project: PortfolioItem;
    className?: string;
}

const stripText = (value: string) =>
    value.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').trim();

const VpdCardThumbnail: React.FC<VpdCardThumbnailProps> = ({ project, className = '' }) => {
    const blocks = project.detailedBlocks ?? [];
    const title = project.title?.trim() || 'Untitled VPD';

    return (
        <div
            className={`relative h-full w-full overflow-hidden bg-slate-100 dark:bg-slate-900 ${className}`}
            aria-hidden
        >
            {/* Mini hero */}
            <div className="h-[32%] shrink-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 px-2 pb-2 pt-2">
                <p className="line-clamp-2 text-[7px] font-semibold leading-tight text-white">{title}</p>
                {project.description ? (
                    <p className="mt-0.5 line-clamp-1 text-[5px] text-white/70">{project.description}</p>
                ) : null}
            </div>

            {/* Mini block grid */}
            <div className="grid h-[68%] grid-cols-12 gap-0.5 p-1">
                {blocks.length > 0 ? (
                    blocks.slice(0, 4).map((block) => {
                        const span = Math.max(1, Math.min(12, Number(block.span) || 12));
                        const colClass =
                            span >= 12
                                ? 'col-span-12'
                                : span >= 8
                                  ? 'col-span-8'
                                  : span >= 6
                                    ? 'col-span-6'
                                    : 'col-span-4';
                        const preview =
                            block.type === 'link-box'
                                ? block.title || stripText(block.content || 'Link')
                                : stripText(block.content || block.title || '');

                        return (
                            <div
                                key={block.id}
                                className={`${colClass} overflow-hidden rounded-[3px] border border-slate-200/90 bg-white dark:border-slate-600 dark:bg-slate-800`}
                            >
                                {block.title ? (
                                    <p className="border-b border-slate-100 px-0.5 py-px text-[4px] font-semibold text-slate-500 dark:border-slate-700">
                                        {block.title}
                                    </p>
                                ) : null}
                                <p className="line-clamp-3 px-0.5 py-px text-[4px] leading-[1.15] text-slate-600 dark:text-slate-300">
                                    {preview || '…'}
                                </p>
                            </div>
                        );
                    })
                ) : (
                    <>
                        <div className="col-span-12 rounded-[3px] border border-dashed border-slate-300 bg-white/80 dark:border-slate-600 dark:bg-slate-800/80" />
                        <div className="col-span-6 rounded-[3px] border border-slate-200/90 bg-white dark:border-slate-600 dark:bg-slate-800" />
                        <div className="col-span-6 rounded-[3px] border border-slate-200/90 bg-white dark:border-slate-600 dark:bg-slate-800" />
                    </>
                )}
            </div>
        </div>
    );
};

export default VpdCardThumbnail;
