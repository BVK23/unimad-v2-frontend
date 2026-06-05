# Unimad Portfolio Evolution Plan: "The Notion-Behance Hybrid"

## 1. Core Philosophy
The Portfolio tab will evolve from a static grid into a **Dynamic Page Builder**. 
- **Behance aspect:** Visually stunning, large imagery, immersive project case studies.
- **Notion aspect:** Block-based editing, drag-and-drop reordering, slash-commands for new content, and infinite flexibility.

## 2. The Architecture: "Everything is a Block"
We will refactor the current `PortfolioItem` into a robust `Block` architecture.

### Data Structure
```typescript
type BlockType = 
  | 'text' | 'heading' | 'image' | 'video' 
  | 'code' | 'embed' | 'project-card' 
  | 'service-card' | 'collapsible' | 'columns';

interface Block {
  id: string;
  type: BlockType;
  content: any; // Flexible payload based on type
  style?: BlockStyle; // Custom background, padding, etc.
  children?: Block[]; // for columns or collapsible sections
}
```

### The "Page" Concept
The Main Portfolio is simply Page 0.
Each "Project" is a new Page with its own ID and array of Blocks.
This allows the *Project Detail View* to be just as editable and rich as the homepage.

## 3. Specialized Blocks for Professionals

### 👩‍💻 For the Software Engineer
- **Code Block:** Syntax highlighting with copy button.
- **Repo Card:** Live stats from a GitHub repo (stars, forks, description).
- **Tech Stack Grid:** Icon grid of technologies used.
- **Terminal Block:** A "command line" looking bio section.

### 🎨 For the Creative / Designer
- **Masonry Gallery:** Auto-arranging image grid.
- **Before/After Slider:** Interactive slider to compare original vs. final design.
- **Figma Embed:** Live interactive Figma prototype frame.
- **Color Palette:** Visual display of hex codes used in a project.

### 📊 For the Data Scientist
- **Notebook Cell:** Similar to Jupyter notebooks, combining markdown and code.
- **Data Visualization wrapper:** Embed spots for Tableau/PowerBI or simple Recharts.

### 💼 For the Entrepreneur / Business
- **Service Tier:** Pricing cards (Basic, Pro, Enterprise).
- **Calendly Embed:** "Book a Call" direct integration.
- **Testamonial Carousel:** Client reviews.

## 4. Interaction Improvements
- **"Slash" Command:** typing `/` opens the block menu (Notion style).
- **Inline Editing:** No more heavy modals for simple text edits. Click and type.
- **Drag Handles:** Six-dot grip handle on hover for every block.

## 5. Execution Roadmap

### Phase 1: The Foundation (Current Sprint)
1.  **Refactor State:** Move from `items` to `blocks` schematic.
2.  **Generic Render Engine:** A component that takes a `Block` and renders the correct sub-component.
3.  **Project "Page" Rendering:** Update the Project Modal to use this same engine, allowing rich case studies.

### Phase 2: The Block Library
1.  Add `CollapsibleSection` (Accordion).
2.  Add `CodeBlock`.
3.  Add `ServiceCard`.

### Phase 3: Polish
1.  Implement "View Mode" specific animations.
2.  Add mobile responsiveness for complex blocks.

## 6. Draft Implementation Example (Collapsible)

```tsx
// Example of how a collapsible block stores data
{
  type: 'collapsible',
  title: 'My Development Process',
  content: {
     isOpen: false
  },
  children: [
    { type: 'text', content: 'First I analyze...' },
    { type: 'image', content: 'diagram.png' }
  ]
}
```
