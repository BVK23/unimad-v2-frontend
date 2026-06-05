import React from 'react';
import { ChevronRight } from 'lucide-react';
import { GeneratorContext } from '../../types/jobs';

interface LinkedInRibbonBannerProps {
    onNavigateToStudio: (context: GeneratorContext) => void;
}

export default function LinkedInRibbonBanner({ onNavigateToStudio }: LinkedInRibbonBannerProps) {
    return (
        <div className="linkedin-ribbon relative w-full overflow-hidden border-y border-[#0a66c2]/25 bg-[#0a66c2]">
            <span className="linkedin-ribbon-shimmer pointer-events-none absolute inset-0" aria-hidden />
            <div className="relative z-10 mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-2.5 sm:py-3">
                <p className="min-w-0 flex-1 text-center text-[13px] font-medium leading-snug text-white sm:text-left">
                    Increase your chance of getting hired by 70% using LinkedIn
                </p>
                <button
                    type="button"
                    onClick={() => onNavigateToStudio({ type: 'linkedin-post' })}
                    className="group/li-cta flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                    Content Lab
                    <ChevronRight size={14} className="transition-transform group-hover/li-cta:translate-x-0.5" />
                </button>
            </div>

            <style jsx>{`
                .linkedin-ribbon-shimmer {
                    width: 40%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.08) 40%,
                        rgba(255, 255, 255, 0.22) 50%,
                        rgba(255, 255, 255, 0.08) 60%,
                        transparent
                    );
                    transform: translateX(-160%) skewX(-12deg);
                    animation: linkedinRibbonShimmer 10s ease-in-out infinite;
                }

                @keyframes linkedinRibbonShimmer {
                    0%,
                    84%,
                    100% {
                        transform: translateX(-160%) skewX(-12deg);
                    }
                    16% {
                        transform: translateX(380%) skewX(-12deg);
                    }
                }
            `}</style>
        </div>
    );
}
