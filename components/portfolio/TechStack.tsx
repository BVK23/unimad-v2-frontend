"use client";
import React from 'react';
import { Code, Server, Smartphone, Layout, Database, Cloud } from 'lucide-react';

interface TechItem {
  id: string;
  name: string;
  icon?: string; // Icon name from lucide or image URL
  category?: string;
}

interface TechStackProps {
  variant?: string;
  data: {
    title?: string;
    description?: string;
    items: TechItem[];
  };
}

const iconMap: Record<string, React.ReactNode> = {
  'frontend': <Layout size={24} />,
  'backend': <Server size={24} />,
  'mobile': <Smartphone size={24} />,
  'database': <Database size={24} />,
  'cloud': <Cloud size={24} />,
  'default': <Code size={24} />
};

const TechStack: React.FC<TechStackProps> = ({ variant = 'grid', data }) => {
  const { title, description, items = [] } = data;

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      {(title || description) && (
        <div className="mb-12 space-y-4">
          {title && <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{title}</h2>}
          {description && <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">{description}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {items.length > 0 ? items.map((item) => (
          <div 
            key={item.id} 
            className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-brand-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all group"
          >
            <div className="p-3 bg-white dark:bg-slate-800 text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 rounded-xl shadow-sm transition-all mb-4">
              {iconMap[item.icon || 'default'] || iconMap['default']}
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white text-center">
              {item.name}
            </span>
          </div>
        )) : (
          <div className="col-span-full py-12 text-slate-400 text-center">No tech items added yet.</div>
        )}
      </div>
    </section>
  );
};

export default TechStack;
