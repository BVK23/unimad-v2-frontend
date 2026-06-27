import type { ReactNode } from "react";

export { metadata } from "../../masterclass/layout";

export default function UniboardMasterclassLayout({ children }: { children: ReactNode }) {
  return <div className="masterclass-page-bg min-h-screen font-sans">{children}</div>;
}
