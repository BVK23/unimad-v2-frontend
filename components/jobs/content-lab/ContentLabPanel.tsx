import React from 'react';
import { ChevronRight } from 'lucide-react';
import { GeneratorContext } from '../../../types/jobs';
import { CONTENT_LAB_ART } from './ContentLabVectorArt';
import { getContentLabPalette } from './contentLabPalettes';

const CONTENT_LAB_TOOLS: {
    name: string;
    desc: string;
    type: GeneratorContext['type'];
    hoverBg: string;
}[] = [
    { name: 'Cover Letter', desc: 'Tailored letters', type: 'cover-letter', hoverBg: 'content-lab-card--letter' },
    { name: 'Cold Email', desc: 'Outreach templates', type: 'cold-email', hoverBg: 'content-lab-card--email' },
    { name: 'Referral', desc: 'Get referred', type: 'referral', hoverBg: 'content-lab-card--referral' },
    { name: 'Value Prop', desc: 'Your strengths', type: 'vpd', hoverBg: 'content-lab-card--vpd' },
];

interface ContentLabPanelProps {
    onNavigateToStudio: (context: GeneratorContext) => void;
}

export default function ContentLabPanel({ onNavigateToStudio }: ContentLabPanelProps) {
    return (
        <div className="relative flex min-h-[220px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-7 dark:border-slate-700 dark:bg-slate-900">
            <div className="relative z-10 shrink-0">
                <h2 className="text-base font-semibold leading-snug text-slate-900 sm:text-[17px] dark:text-white">
                    Supercharge applications with Content Lab
                </h2>
                <button
                    type="button"
                    onClick={() => onNavigateToStudio({ type: 'cover-letter' })}
                    className="group/lab-link mt-1 flex items-center gap-0.5 text-[11px] font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                    Open Content Lab
                    <ChevronRight size={12} className="transition-transform group-hover/lab-link:translate-x-0.5" />
                </button>
            </div>

            <div className="relative z-10 mt-3 grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
                {CONTENT_LAB_TOOLS.map((tool) => {
                    const Art = CONTENT_LAB_ART[tool.type];
                    const palette = getContentLabPalette(tool.type);
                    return (
                        <button
                            key={tool.name}
                            type="button"
                            onClick={() => onNavigateToStudio({ type: tool.type })}
                            className={`content-lab-feature-card ${tool.hoverBg} ${palette.hoverBorder} ${palette.hoverBg} group/card relative flex min-h-[120px] flex-col items-center justify-center gap-2 overflow-visible rounded-xl border border-slate-200 bg-white px-2 py-3 text-center transition-all dark:border-slate-700 dark:bg-slate-900`}
                        >
                            <div className="content-lab-art-wrap relative z-[1] flex h-[80px] w-[80px] shrink-0 items-center justify-center overflow-visible">
                                {Art ? <Art /> : null}
                            </div>
                            <div className="relative z-[1] flex flex-col items-center justify-center gap-0.5">
                                <h4 className="text-[11px] font-semibold leading-tight text-slate-900 dark:text-white">
                                    {tool.name}
                                </h4>
                                <p className="text-[9px] leading-snug text-slate-500 dark:text-slate-400">
                                    {tool.desc}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            <style jsx>{`
                .content-lab-feature-card {
                    transition:
                        transform 0.25s ease,
                        border-color 0.25s ease,
                        background-color 0.25s ease,
                        box-shadow 0.25s ease;
                }

                .content-lab-feature-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(52, 109, 224, 0.1);
                }

                /* —— Cover letter: hand-drawn writing —— */
                .content-lab-card--letter:hover :global(.cl-letter-line-1) {
                    animation: clSketchLine 2.2s ease-in-out infinite;
                }
                .content-lab-card--letter:hover :global(.cl-letter-line-2) {
                    animation: clSketchLine 2.2s ease-in-out infinite 0.25s;
                }
                .content-lab-card--letter:hover :global(.cl-letter-line-3) {
                    animation: clSketchLine 2.2s ease-in-out infinite 0.5s;
                }
                .content-lab-card--letter:hover :global(.cl-letter-pen) {
                    animation: clSketchPen 2.2s ease-in-out infinite;
                }

                @keyframes clSketchLine {
                    0%, 12%, 88%, 100% {
                        opacity: 0;
                    }
                    35%, 65% {
                        opacity: 1;
                    }
                }

                @keyframes clSketchPen {
                    0%, 100% {
                        transform: translate(0, 0) rotate(0deg);
                    }
                    50% {
                        transform: translate(-10px, -12px) rotate(-10deg);
                    }
                }

                /* —— Cold email: gentle float —— */
                .content-lab-card--email:hover :global(.cl-email-group) {
                    animation: clSketchFloat 2.4s ease-in-out infinite;
                }
                .content-lab-card--email:hover :global(.cl-email-trail-1) {
                    animation: clSketchTrail 2.4s ease-in-out infinite;
                }
                .content-lab-card--email:hover :global(.cl-email-trail-2) {
                    animation: clSketchTrail 2.4s ease-in-out infinite 0.2s;
                }

                @keyframes clSketchFloat {
                    0%, 100% {
                        transform: translate(0, 0) rotate(0deg);
                    }
                    50% {
                        transform: translate(5px, -6px) rotate(3deg);
                    }
                }

                @keyframes clSketchTrail {
                    0%, 100% {
                        opacity: 0;
                        transform: translateX(10px);
                    }
                    50% {
                        opacity: 0.7;
                        transform: translateX(0);
                    }
                }

                /* —— Referral: orbit —— */
                .content-lab-card--referral:hover :global(.cl-referral-orbit-system) {
                    animation: clSketchOrbit 3s linear infinite;
                }
                .content-lab-card--referral:hover :global(.cl-referral-person) {
                    animation: clSketchBob 2.5s ease-in-out infinite;
                }

                @keyframes clSketchOrbit {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }

                @keyframes clSketchBob {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-4px);
                    }
                }

                /* —— VPD: gentle wiggle —— */
                .content-lab-card--vpd:hover :global(.cl-vpd-group) {
                    animation: clSketchWiggle 2.5s ease-in-out infinite;
                    transform-origin: 36px 36px;
                }
                .content-lab-card--vpd:hover :global(.cl-vpd-sparkle-1) {
                    animation: clSketchSparkle 1.8s ease-in-out infinite;
                    transform-origin: 14px 18px;
                }
                .content-lab-card--vpd:hover :global(.cl-vpd-sparkle-2) {
                    animation: clSketchSparkle 1.8s ease-in-out infinite 0.9s;
                    transform-origin: 60px 16px;
                }

                @keyframes clSketchWiggle {
                    0%, 100% {
                        transform: rotate(0deg) scale(1);
                    }
                    25% {
                        transform: rotate(-5deg) scale(1.04);
                    }
                    75% {
                        transform: rotate(5deg) scale(1.04);
                    }
                }

                @keyframes clSketchSparkle {
                    0%, 100% {
                        opacity: 0.4;
                        transform: scale(0.8);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.2);
                    }
                }
            `}</style>
        </div>
    );
}
