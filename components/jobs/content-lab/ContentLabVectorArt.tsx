import React from 'react';
import { getContentLabPalette } from './contentLabPalettes';

type ArtProps = {
    className?: string;
};

const artClass = 'cl-art h-[76px] w-[76px] shrink-0';

const strokeProps = {
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
};

/** Hand-drawn cover letter — paper + pen */
export function CoverLetterArt({ className = '' }: ArtProps) {
    const p = getContentLabPalette('cover-letter');
    return (
        <HandDrawnSvg className={`cl-art-letter ${className}`}>
            <path
                d="M19 15c1-2 3-2 5-1l24-1c2 0 4 2 4 4l1 38c0 2-2 4-4 3l-26 2c-3 1-5-1-5-4l-1-39c0-2 2-3 4-2z"
                fill={p.fill}
                stroke={p.stroke}
                strokeWidth="2"
                {...strokeProps}
            />
            <path
                d="M26 26h18"
                stroke={p.stroke}
                strokeWidth="2"
                className="cl-letter-line cl-letter-line-1"
                opacity="0"
                {...strokeProps}
            />
            <path
                d="M26 33h14"
                stroke={p.stroke}
                strokeWidth="2"
                className="cl-letter-line cl-letter-line-2"
                opacity="0"
                {...strokeProps}
            />
            <path
                d="M26 40h16"
                stroke={p.stroke}
                strokeWidth="2"
                className="cl-letter-line cl-letter-line-3"
                opacity="0"
                {...strokeProps}
            />
            <g className="cl-letter-pen">
                <path
                    d="M44 48l9 8-3 3-9-8 3-3z"
                    fill={p.accent}
                    stroke={p.stroke}
                    strokeWidth="2"
                    {...strokeProps}
                />
                <path
                    d="M44 48l-4-7 4-2 5 7-5 2z"
                    fill={p.highlight}
                    stroke={p.stroke}
                    strokeWidth="2"
                    {...strokeProps}
                />
            </g>
        </HandDrawnSvg>
    );
}

/** Hand-drawn cold email — envelope */
export function ColdEmailArt({ className = '' }: ArtProps) {
    const p = getContentLabPalette('cold-email');
    return (
        <HandDrawnSvg className={`cl-art-email ${className}`}>
            <path
                d="M8 36h10M5 43h8"
                stroke={p.accent}
                strokeWidth="1.75"
                strokeLinecap="round"
                className="cl-email-trail cl-email-trail-1"
                opacity="0"
            />
            <path
                d="M6 40h7"
                stroke={p.accent}
                strokeWidth="1.75"
                strokeLinecap="round"
                className="cl-email-trail cl-email-trail-2"
                opacity="0"
            />
            <g className="cl-email-group">
                <path
                    d="M17 24c0-2 2-3 4-3h26c2 0 4 1 4 3v24c0 2-2 3-4 3H21c-2 0-4-1-4-3V24z"
                    fill={p.fill}
                    stroke={p.stroke}
                    strokeWidth="2"
                    {...strokeProps}
                />
                <path
                    d="M17 24l17 13 17-13"
                    fill="none"
                    stroke={p.stroke}
                    strokeWidth="2"
                    {...strokeProps}
                />
            </g>
        </HandDrawnSvg>
    );
}

/** Hand-drawn referral — person + orbiting circle */
export function ReferralArt({ className = '' }: ArtProps) {
    const p = getContentLabPalette('referral');
    return (
        <HandDrawnSvg className={`cl-art-referral ${className}`}>
            <g className="cl-referral-orbit-system" style={{ transformOrigin: '36px 38px' }}>
                <ellipse
                    cx="36"
                    cy="38"
                    rx="22"
                    ry="10"
                    fill="none"
                    stroke={p.accent}
                    strokeWidth="1.75"
                    strokeDasharray="4 5"
                    opacity="0.55"
                    className="cl-referral-orbit"
                />
                <circle
                    cx="58"
                    cy="38"
                    r="3.5"
                    fill={p.accent}
                    stroke={p.stroke}
                    strokeWidth="1.5"
                    className="cl-referral-orbit-dot"
                />
            </g>
            <g className="cl-referral-person">
                <circle cx="36" cy="28" r="9" fill={p.fill} stroke={p.stroke} strokeWidth="2" {...strokeProps} />
                <path
                    d="M22 54c2-10 8-14 14-14s12 4 14 14"
                    fill={p.fill}
                    stroke={p.stroke}
                    strokeWidth="2"
                    {...strokeProps}
                />
            </g>
        </HandDrawnSvg>
    );
}

/** Hand-drawn value prop — diamond */
export function ValuePropArt({ className = '' }: ArtProps) {
    const p = getContentLabPalette('vpd');
    return (
        <HandDrawnSvg className={`cl-art-vpd ${className}`}>
            <g className="cl-vpd-group">
                <path
                    d="M36 14l19 16-19 28L17 30l19-16z"
                    fill={p.fill}
                    stroke={p.stroke}
                    strokeWidth="2"
                    {...strokeProps}
                />
                <path d="M17 30h38" stroke={p.stroke} strokeWidth="1.75" opacity="0.6" {...strokeProps} />
                <path d="M28 14l8 44 8-44" stroke={p.accent} strokeWidth="2" opacity="0.65" {...strokeProps} />
            </g>
            <path
                className="cl-vpd-sparkle cl-vpd-sparkle-1"
                d="M11 20l2-4 3 2-2 3-3-2-2 3-2-3 3-2z"
                fill="#fbbf24"
                stroke={p.stroke}
                strokeWidth="1.5"
                {...strokeProps}
            />
            <path
                className="cl-vpd-sparkle cl-vpd-sparkle-2"
                d="M58 18l2-3 2 2-2 2-2-2 2 2-2-2z"
                fill="#f472b6"
                stroke={p.stroke}
                strokeWidth="1.5"
                {...strokeProps}
            />
        </HandDrawnSvg>
    );
}

function HandDrawnSvg({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <svg
            viewBox="0 0 72 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${artClass} ${className}`}
            aria-hidden
            style={{ overflow: 'visible' }}
        >
            {children}
        </svg>
    );
}

export const CONTENT_LAB_ART: Record<string, React.FC<ArtProps>> = {
    'cover-letter': CoverLetterArt,
    'cold-email': ColdEmailArt,
    referral: ReferralArt,
    vpd: ValuePropArt,
};
