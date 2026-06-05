"use client";
import React from 'react';

interface BioSectionProps {
  variant?: string;
  data: {
    title?: string;
    description?: string;
    image?: string;
    bio: string;
    stats?: { label: string, value: string }[];
  };
}

const BioSection: React.FC<BioSectionProps> = ({ variant = 'standard', data }) => {
  const { title, description, image, bio, stats = [] } = data;

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white leading-tight">
              {title || "A bit about me and my journey"}
            </h2>
            {description && <p className="text-xl text-brand-600 dark:text-brand-400 font-medium">{description}</p>}
          </div>

          <div className="prose prose-lg dark:prose-invert text-slate-600 dark:text-slate-400 max-w-none">
            {bio ? bio.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            )) : (
              <p>Add your bio here to tell your story.</p>
            )}
          </div>

          {stats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
              {stats.map((stat, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                  <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500 ring-1 ring-slate-200 dark:ring-white/10">
            <img 
              src={image || "https://picsum.photos/800/800"} 
              alt="Bio profile" 
              className="w-full h-full object-cover"
            />
          </div>
          {/* Accent decoration */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>
        </div>
      </div>
    </section>
  );
};

export default BioSection;
