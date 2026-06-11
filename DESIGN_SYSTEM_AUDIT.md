# Unimad Design System Audit

This document is a comprehensive audit of the design system patterns, colors, typography, and components currently implemented across the Unimad platform. You can use this to crosscheck inconsistencies and formulate a final, unified design system file.

---

## 1. Typography

### Fonts

- **Primary Sans-Serif:** `Onest` (Weights: 100-900, typically 300 Light to 600 SemiBold). Applied globally via `font-sans`.
- **Secondary Serif / Display:** `Italiana` (Weight: 400). Used specifically for elegant display headings (e.g., Jobs Italiana preview route).
- **Fallback:** `sans-serif` for Onest, `Georgia, serif` for Italiana.

### Common Text Styles

- **Global Body:** `text-sm font-light text-slate-900 dark:text-slate-100 antialiased`
- **Small Text / Meta:** `text-xs text-slate-500 dark:text-slate-400`
- **Micro Text / Badges:** `text-[10px] font-medium uppercase tracking-widest`
- **Section Headings:** `text-base` or `text-lg font-semibold text-slate-900 dark:text-white`
- **Page Titles:** `text-2xl font-medium leading-none`
- **Hero/Display:** `text-4xl md:text-6xl font-semibold leading-tight`

---

## 2. Color Palette

### Brand Colors (Blue)

Defined in `tailwind.config.js`:

- `brand-50`: `#f0f6fe`
- `brand-100`: `#dde9fc`
- `brand-500`: `#346de0` _(Primary Brand Color)_
- `brand-600`: `#2553d0`
- `brand-900`: `#1b316b`

### Neutral / Surface Colors

- **Light Mode Backgrounds:** `bg-slate-50` (App background), `bg-white` (Cards, Modals, Headers).
- **Dark Mode Backgrounds:** `dark:bg-[#0a0a0a]` (App background), `dark:bg-[#111]` or `dark:bg-[#1a1a1a]` (Cards, Modals).
- **Borders:** `border-slate-200 dark:border-slate-800` (Standard), `dark:border-white/5` or `dark:border-white/10` (Subtle overlays).

### Semantic Colors

- **Success:** `text-emerald-600 dark:text-emerald-400` (e.g., "Added to tracker").
- **Error/Critical:** `text-red-600 dark:text-red-400` or `text-red-500`.
- **Warning:** `text-yellow-500` or `bg-gradient-to-b from-amber-200 to-yellow-400`.

### Gradients

- **Content Lab / Premium:** `bg-gradient-to-br from-[#0056d6] via-[#0b63f5] to-[#1a84ff]`
- **Unicoach / Dark Blue:** `bg-gradient-to-br from-[#001433] via-[#002654] to-[#003366]`

---

## 3. Components

### Buttons & CTAs

_Inconsistencies exist between "Brand Blue" and "Dark Navy" primary buttons._

1. **Primary CTA (Dark Navy / High Contrast):**
   - Classes: `bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-black dark:hover:bg-slate-200`
   - Usage: "Apply Now" (Jobs), "Prepare Application".
2. **Primary CTA (Brand Blue):**
   - Classes: `bg-[#346DE0] hover:bg-[#254DB3] text-white shadow-md shadow-blue-500/20`
   - Usage: "Generate connection request", "Schedule / Post".
3. **Secondary / Outline:**
   - Classes: `border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800`
4. **Text Links:**
   - Classes: `text-[#346DE0] hover:text-[#254DB3] dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2`
5. **Pill Buttons (Small):**
   - Classes: `rounded-full px-4 py-2 text-xs font-medium`

### Cards & Containers

- **Standard Card:** `rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111]`
- **Interactive Card (Hover state):** `hover:border-slate-300 hover:shadow-md transition-all`
- **Selected State:** `border-brand-500/50 bg-brand-50 shadow-sm ring-1 ring-brand-500/25`

### Inputs & Forms

- **Standard Input:** `rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#346DE0] focus:ring-1 focus:ring-[#346DE0]/20 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white`
- **Search Bar:** Often includes a left-padded icon (`pl-10`) and a subtle background (`bg-slate-50 dark:bg-white/5`).

### Modals & Overlays

- **Backdrop:** `fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm`
- **Modal Container:** `w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#1a1a1a]`
- **Animations:** `animate-in fade-in zoom-in-95 duration-200`

---

## 4. Spacing & Layout

- **Page Max Width:** `max-w-7xl` (Standard), `max-w-[1400px]` (Jobs/Discovery), `max-w-6xl` (LinkedIn Dashboard).
- **Standard Padding:** `p-4` or `p-6` for cards/modals. `px-6 py-4` for headers.
- **Gaps:** `gap-2` (micro elements), `gap-4` (standard grid/flex), `gap-6` (large sections).
- **Border Radius:** Heavy use of highly rounded corners. `rounded-xl` (12px) for inputs/small cards, `rounded-2xl` (16px) or `rounded-3xl` (24px) for main containers and modals. `rounded-full` for pills and avatars.

---

## 5. Global Elements

### Scrollbars

- **Track:** Seamless white (`#ffffff`) in light mode, soft off-white (`#f8fafc`) in dark mode. Fully rounded.
- **Thumb:** Light blue pill (`#b8d4f8`), hover (`#9bc0f6`). Thin white border to sit cleanly on the track.
- **Utility Classes:** `.no-scrollbar` (hides completely), `.minimal-scrollbar` / `.scrollbar-thin` (applies the global thin blue pill style).

### Animations & Effects

- **Shimmer:** Used on premium banners (LinkedIn Optimize, Unicoach CTA). A 10s infinite skewed gradient sweep.
- **Pulse:** `animate-pulse` used for loading skeletons.
- **Hover Scale:** `active:scale-95` on almost all primary buttons for tactile feedback. `hover:scale-105` on some floating elements.

---

## 6. Identified Inconsistencies for Review

1. **Primary Button Colors:** The platform mixes `#346DE0` (Brand Blue) and `slate-900` (Dark Navy) for primary actions. A single primary action color hierarchy should be established.
2. **Dark Mode Surface Colors:** Mix of `#0a0a0a`, `#080808`, and `#0d0d0d` for the main background. Cards mix `#111`, `#1a1a1a`, and `slate-900`.
3. **Border Radii:** Cards alternate between `rounded-xl` and `rounded-2xl`. Modals alternate between `rounded-2xl` and `rounded-3xl`.
4. **Max Widths:** The main container width varies across routes (`max-w-7xl`, `max-w-6xl`, `max-w-[1400px]`).

_Use this document to consolidate your design tokens and provide a final `theme` configuration for `tailwind.config.js`._
