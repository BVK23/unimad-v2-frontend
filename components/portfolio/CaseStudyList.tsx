"use client";
import React from 'react';
import { ArrowRight, FileText } from 'lucide-react';

interface CaseStudy {
  id: string;
  title: string;
  summary: string;
  category?: string;
  link?: string;
}

interface CaseStudyListProps {
  variant?: string;
  data: {
    title?: string;
    description?: string;
    items: CaseStudy[];
  };
}

const CaseStudyList: React.FC<CaseStudyListProps> = ({ variant = 'list', data }) => {
  const { title, description, items = [] } = data;

  return (
    <section className="py-20 px-6 max-w-5xl mx-auto">
      {(title || description) && (
        <div className="mb-12 space-y-4 text-center">
          {title && <h2 className="text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h2>}
          {description && <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">{description}</p>}
        </div>
      )}

      <div className="space-y-4">
        {items.length > 0 ? items.map((item) => (
          <a
            key={item.id}
            href={item.link || "#"}
            className="group block p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-brand-500 transition-all hover:shadow-xl hover:shadow-brand-500/5"
          >
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg">
                    <FileText size={18} />
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.category || "Case Study"}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
                  {item.summary}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-brand-600 group-hover:text-white rounded-full transition-all group-hover:translate-x-2">
                <ArrowRight size={24} />
              </div>
            </div>
          </a>
        )) : (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <p className="text-slate-400">No case studies added yet.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CaseStudyList;
