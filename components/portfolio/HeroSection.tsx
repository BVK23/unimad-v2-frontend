"use client";
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  variant?: string;
  data: {
    title?: string;
    subtitle?: string;
    image?: string;
    ctaLabel?: string;
    ctaLink?: string;
    secondaryCtaLabel?: string;
    secondaryCtaLink?: string;
  };
}

const HeroSection: React.FC<HeroSectionProps> = ({ variant = 'centered', data }) => {
  const { title, subtitle, image, ctaLabel, ctaLink, secondaryCtaLabel, secondaryCtaLink } = data;

  if (variant === 'split') {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-20 px-6 max-w-7xl mx-auto">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            {title || "Crafting digital experiences that matter"}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-lg">
            {subtitle || "I'm a designer and developer specializing in building beautiful, functional, and user-centered digital products."}
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            {ctaLabel && (
              <a href={ctaLink || "#"} className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-full font-medium transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2">
                {ctaLabel} <ArrowRight size={18} />
              </a>
            )}
            {secondaryCtaLabel && (
              <a href={secondaryCtaLink || "#"} className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-full font-medium hover:bg-slate-50 transition-all">
                {secondaryCtaLabel}
              </a>
            )}
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-slate-100 dark:bg-slate-800">
            <img 
              src={image || "https://picsum.photos/800/1000"} 
              alt="Hero image" 
              className="w-full h-full object-cover"
            />
          </div>
          {/* Decorative element */}
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        </div>
      </section>
    );
  }

  if (variant === 'full-bg') {
    return (
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <img 
          src={image || "https://picsum.photos/1920/1080"} 
          alt="Hero background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight mb-6">
            {title || "Unleashing the power of creative thinking"}
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto mb-10">
            {subtitle || "Building bold solutions for ambitious brands through strategy-led design and cutting-edge technology."}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {ctaLabel && (
              <a href={ctaLink || "#"} className="px-10 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-full font-medium transition-all shadow-xl shadow-brand-500/30 flex items-center gap-2 text-lg">
                {ctaLabel} <ArrowRight size={20} />
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Default: Centered
  return (
    <section className="py-24 px-6 text-center max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="inline-block px-4 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-full text-sm font-semibold tracking-wide uppercase mb-2">
        Portfolio Piece
      </div>
      <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-slate-900 dark:text-white leading-[0.9]">
        {title || "Innovating at the edge of possible"}
      </h1>
      <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
        {subtitle || "A collection of thoughts, designs, and experiments from a decade of building in the digital space."}
      </p>
      <div className="flex flex-wrap justify-center gap-4 pt-6">
        {ctaLabel && (
          <a href={ctaLink || "#"} className="px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 active:scale-95 rounded-full font-medium transition-all flex items-center gap-2 shadow-lg">
            {ctaLabel} <ArrowRight size={18} />
          </a>
        )}
      </div>
      {image && (
        <div className="pt-16 max-w-4xl mx-auto">
          <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-200 dark:ring-white/10">
            <img src={image} alt="Hero" className="w-full h-full object-cover" />
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
