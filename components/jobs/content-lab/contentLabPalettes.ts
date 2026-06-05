/** Vibrant palettes for Content Lab hand-drawn icons */

export type ContentLabPalette = {
    fill: string;
    accent: string;
    highlight: string;
    stroke: string;
    iconBg: string;
    hoverBorder: string;
    hoverBg: string;
};

const YELLOW = {
    fill: '#fde047',
    accent: '#f59e0b',
    highlight: '#fef9c3',
    stroke: '#92400e',
    iconBg: 'bg-amber-100 dark:bg-amber-950/40',
    hoverBorder: 'group-hover/card:border-amber-300 dark:group-hover/card:border-amber-500/50',
    hoverBg: 'group-hover/card:bg-amber-50/90 dark:group-hover/card:bg-amber-950/25',
};

const BLUE = {
    fill: '#93c5fd',
    accent: '#346de0',
    highlight: '#dbeafe',
    stroke: '#1e3a8a',
    iconBg: 'bg-sky-100 dark:bg-sky-950/40',
    hoverBorder: 'group-hover/card:border-sky-300 dark:group-hover/card:border-sky-500/50',
    hoverBg: 'group-hover/card:bg-sky-50/90 dark:group-hover/card:bg-sky-950/25',
};

const GREEN = {
    fill: '#6ee7b7',
    accent: '#10b981',
    highlight: '#d1fae5',
    stroke: '#065f46',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/40',
    hoverBorder: 'group-hover/card:border-emerald-300 dark:group-hover/card:border-emerald-500/50',
    hoverBg: 'group-hover/card:bg-emerald-50/90 dark:group-hover/card:bg-emerald-950/25',
};

const PURPLE = {
    fill: '#c4b5fd',
    accent: '#8b5cf6',
    highlight: '#ede9fe',
    stroke: '#5b21b6',
    iconBg: 'bg-violet-100 dark:bg-violet-950/40',
    hoverBorder: 'group-hover/card:border-violet-300 dark:group-hover/card:border-violet-500/50',
    hoverBg: 'group-hover/card:bg-violet-50/90 dark:group-hover/card:bg-violet-950/25',
};

const TOOL_PALETTES: Record<string, ContentLabPalette> = {
    'cover-letter': YELLOW,
    'cold-email': BLUE,
    referral: GREEN,
    vpd: PURPLE,
};

export function getContentLabPalette(toolId: string): ContentLabPalette {
    return TOOL_PALETTES[toolId] ?? BLUE;
}
