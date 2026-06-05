"use client";
import React from 'react';

interface Metric {
  id: string;
  value: string;
  label: string;
  description?: string;
}

interface MetricGridProps {
  variant?: string;
  data: {
    title?: string;
    description?: string;
    metrics: Metric[];
  };
}

const MetricGrid: React.FC<MetricGridProps> = ({ variant = 'grid', data }) => {
  const { title, description, metrics = [] } = data;

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] my-12">
      {(title || description) && (
        <div className="mb-16 text-center space-y-4">
          {title && <h2 className="text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h2>}
          {description && <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">{description}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 text-center">
        {metrics.length > 0 ? metrics.map((metric) => (
          <div key={metric.id} className="space-y-4 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl group">
            <div className="text-5xl md:text-6xl font-black text-brand-600 dark:text-brand-400 tabular-nums group-hover:scale-110 transition-transform duration-300">
              {metric.value}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{metric.label}</h3>
              {metric.description && <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{metric.description}</p>}
            </div>
          </div>
        )) : (
          <div className="col-span-full py-12 text-slate-400">No metrics added yet.</div>
        )}
      </div>
    </section>
  );
};

export default MetricGrid;
