"use client";
import React from 'react';
import HeroSection from './HeroSection';
import ProjectGallery from './ProjectGallery';
import CaseStudyList from './CaseStudyList';
import MetricGrid from './MetricGrid';
import TechStack from './TechStack';
import BioSection from './BioSection';
import TimelineSection from './TimelineSection';
import CTASection from './CTASection';
import { PortfolioBlock } from '../../types';

interface BrandBlockProps {
  block: PortfolioBlock;
  isEditMode?: boolean;
}

const BrandBlock: React.FC<BrandBlockProps> = ({ block, isEditMode = false }) => {
  const { type, variant, data } = block;

  const renderBlockContent = () => {
    switch (type) {
      case 'hero':
        return <HeroSection variant={variant} data={data} />;
      case 'proof_gallery':
        return <ProjectGallery variant={variant} data={data} />;
      case 'proof_casestudy':
        return <CaseStudyList variant={variant} data={data} />;
      case 'authority_metrics':
        return <MetricGrid variant={variant} data={data} />;
      case 'authority_stack':
        return <TechStack variant={variant} data={data} />;
      case 'narrative_bio':
        return <BioSection variant={variant} data={data} />;
      case 'narrative_timeline':
        return <TimelineSection variant={variant} data={data} />;
      case 'cta_contact':
        return <CTASection variant="contact" data={data} />;
      case 'cta_calendly':
        return <CTASection variant="calendly" data={data} />;
      default:
        return (
          <div className="py-12 px-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 italic">
            Unknown block type: {type}
          </div>
        );
    }
  };

  return (
    <div className={`relative w-full group ${isEditMode ? 'hover:outline hover:outline-2 hover:outline-brand-500/50' : ''}`}>
      {renderBlockContent()}
    </div>
  );
};

export default BrandBlock;
