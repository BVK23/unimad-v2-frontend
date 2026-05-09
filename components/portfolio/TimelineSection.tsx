"use client";
import React from "react";
import { Calendar } from "lucide-react";

interface TimelineItem {
  id: string;
  year: string;
  title: string;
  subtitle: string;
  description?: string;
}

interface TimelineSectionProps {
  variant?: string; // 'vertical' | 'horizontal'
  data: {
    title?: string;
    description?: string;
    items: TimelineItem[];
  };
}

const TimelineSection: React.FC<TimelineSectionProps> = ({ variant = "vertical", data }) => {
  const { title, description, items = [] } = data;

  return (
    <section className="py-20 px-6 max-w-5xl mx-auto">
      {(title || description) && (
        <div className="mb-16 space-y-4">
          {title && <h2 className="text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h2>}
          {description && <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">{description}</p>}
        </div>
      )}

      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800 md:-translate-x-1/2" />

        <div className="space-y-12">
          {items.length > 0 ? (
            items.map((item, index) => (
              <div
                key={item.id}
                className={`relative flex flex-col md:flex-row items-start md:items-center gap-8 ${index % 2 === 0 ? "md:flex-row-reverse" : ""}`}
              >
                {/* Dot */}
                <div className="absolute left-0 md:left-1/2 w-4 h-4 rounded-full bg-brand-600 border-4 border-white dark:border-slate-950 md:-translate-x-1/2 z-10" />

                <div className={`w-full md:w-1/2 pl-8 md:pl-0 ${index % 2 === 0 ? "md:pl-16" : "md:pr-16 text-left md:text-right"}`}>
                  <div className="inline-block px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-full text-xs font-bold mb-4">
                    {item.year}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">{item.subtitle}</h4>
                  {item.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md ml-0 mr-auto md:ml-auto md:mr-0 inline-block">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="hidden md:block w-1/2" />
              </div>
            ))
          ) : (
            <div className="py-12 text-slate-400 text-center">No timeline items added yet.</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;
