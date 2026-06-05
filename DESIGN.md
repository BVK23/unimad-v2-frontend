# Design System: Unimad AG
**Project ID:** Unimad-Local-001

## 1. Visual Theme & Atmosphere
**Professional SaaS, Clean, Modern, Trustworthy.**
The interface exudes a sense of professional reliability mixed with modern SaaS aesthetics. It balances high-density information (dashboards, resume editors) with airy whitespace and soft semantic coloring. The mood is "Productive & Polished." It leverages glassmorphism and subtle gradients to feel alive without being distracting.

## 2. Color Palette & Roles

### Brand Colors (Trust & Action)
*   **Unimad Blue (Primary)**: `#346DE0` (Brand-500) - Used for primary buttons, active states, and key branding moments.
*   **Surface Blue**: `#F0F6FE` (Brand-50) - Used for subtle backgrounds and highlighted rows.
*   **Deep Navy**: `#1B316B` (Brand-900) - Used for strong contrast backgrounds or dark mode accents.

### functional/State Colors
*   **Slate Neutral**: `#0f172a` (Slate-900) to `#f8fafc` (Slate-50) - The backbone of the interface. Used for text, borders, and main surface backgrounds.
*   **Sky Accent**: Used for "Startup" vibes, Visa badges, and informational accents (replacing Indigo).
*   **Teal Success**: Used for "Creative" vibes, completion states, and "Post to Unimad" toggles (replacing Purple).
*   **Orange Warning/History**: Used for "Timeline" vibes and History actions.
*   **Rose Error/Bold**: Used for "Designer" vibes, destructive actions, and alerts.

## 3. Typography Rules
**Font Family:** `Onest`, sans-serif.

*   **Headings:** Medium to Semibold weights only. **Do not use Bold.** Used for page titles and widget headers.
*   **Body:** Regular to Medium weights. High legibility focus for dense data (resumes, job cards).
*   **Interactive Text:** Medium weight. often used in buttons and pills.

## 4. Component Stylings

*   **Buttons:**
    *   **Primary:** Pill-shaped or soft rounded rectangles (`rounded-xl`), filled with Brand Blue (`#346DE0`), white text, subtle shadow (`shadow-lg`). Active state scales down (`active:scale-95`).
    *   **Secondary/Outline:** Bordered with Slate-200, transparent or white background, Slate-700 text.
    *   **Ghost:** Transparent background, hover tint (`hover:bg-slate-50`).

*   **Cards/Containers:**
    *   **Standard Card:** White background (`bg-white`), bordered (`border-slate-200`), Generously rounded corners (`rounded-2xl` or `rounded-xl`), subtle shadow (`shadow-sm`).
    *   **Glass Card:** Semi-transparent white (`bg-white/80`), backdrop blur (`backdrop-blur-sm`), used for overlays and floating widgets.

*   **Inputs/Forms:**
    *   **Fields:** Slate-50 background (`bg-slate-50`), borderless or subtle border (`border-slate-200`), large padding (`p-3`), rounded (`rounded-xl`). Focus ring is Brand Blue (`ring-blue-500/20`).

## 5. Layout Principles
*   **Grid & Flex:** Heavy use of flexbox for component alignment. Grid used for dashboard widgets and card layouts.
*   **Spacing:** Comfortable padding (`p-6`, `p-8`) inside containers to maintain readability.
*   **Sidebar Navigation:** Fixed or sticky sidebars for primary navigation contexts (Community, Resume Dashboard).
