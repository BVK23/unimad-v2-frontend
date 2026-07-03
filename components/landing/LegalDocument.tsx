import type { ReactNode } from "react";

type LegalDocumentProps = {
  title: string;
  lastUpdated?: string;
  children: ReactNode;
};

export function LegalDocument({ title, lastUpdated, children }: LegalDocumentProps) {
  return (
    <article className="legal-doc">
      <header className="legal-doc__header">
        <h1 className="legal-doc__title">{title}</h1>
        {lastUpdated ? <p className="legal-doc__updated">Last updated: {lastUpdated}</p> : null}
      </header>
      <div className="legal-doc__body">{children}</div>
    </article>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="legal-section">
      <h2 className="legal-section__title">{title}</h2>
      <div className="legal-section__content">{children}</div>
    </section>
  );
}

export function LegalParagraph({ children }: { children: ReactNode }) {
  return <p className="legal-p">{children}</p>;
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="legal-list">
      {items.map(item => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
