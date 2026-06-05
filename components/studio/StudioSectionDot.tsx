import React from 'react';

/** Yellow accent dot used in place of section icons (e.g. Scheduled posts). */
const StudioSectionDot: React.FC = () => (
    <span
        className="h-2 w-2 shrink-0 rounded-full bg-amber-400 ring-2 ring-amber-400/25 dark:bg-amber-300 dark:ring-amber-300/20"
        aria-hidden
    />
);

export default StudioSectionDot;
