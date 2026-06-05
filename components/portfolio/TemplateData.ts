import { PortfolioPageSchema, PortfolioData } from '../../types';

export const PORTFOLIO_TEMPLATES: Record<string, PortfolioPageSchema> = {
  Creative: {
    id: 'tpl_creative',
    name: 'Creative Portfolio',
    category: 'Creative',
    theme: { primaryColor: '#f43f5e', fontFamily: 'Inter', mode: 'dark' },
    blocks: [
      {
        id: 'c_b1',
        type: 'hero',
        variant: 'full-bg',
        data: {
          title: "Design that speaks louder than words",
          subtitle: "Crafting visual stories for the world's most innovative brands.",
          image: "https://images.unsplash.com/photo-1497015289639-54688650d173?auto=format&fit=crop&q=80",
          ctaLabel: "View Masterpieces"
        }
      },
      {
        id: 'c_b2',
        type: 'proof_gallery',
        variant: 'grid_3col',
        data: {
          title: "Recent Masterpieces",
          projects: [
            { id: 'p1', title: 'Aura App', description: 'Next-gen mindfulness experience', image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80', tags: ['UI/UX', 'Mobile'] },
            { id: 'p2', title: 'Lumina Brand', description: 'Visual identity for a sustainable energy company', image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80', tags: ['Branding', 'Web'] },
            { id: 'p3', title: 'Solaris Web', description: 'Immersive desktop experience for futuristic architects', image: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&q=80', tags: ['Frontend', 'WebGL'] }
          ]
        }
      },
      {
        id: 'c_b3',
        type: 'narrative_bio',
        variant: 'standard',
        data: {
          title: "The Creative Soul",
          bio: "My journey began with a pencil and evolved into a deep passion for digital interaction. I believe every pixel should lead to a meaningful connection.",
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80"
        }
      },
      {
        id: 'c_b4',
        type: 'cta_contact',
        variant: 'contact',
        data: {
          title: "Let's Create Magic",
          description: "Reach out and let's turn your wildest ideas into reality."
        }
      }
    ]
  },
  Finance: {
    id: 'tpl_finance',
    name: 'Finance Portfolio',
    category: 'Finance',
    theme: { primaryColor: '#0f172a', fontFamily: 'Inter', mode: 'light' },
    blocks: [
      {
        id: 'f_b1',
        type: 'hero',
        variant: 'split',
        data: {
          title: "Strategic Wealth Management for Modern Leaders",
          subtitle: "Helping you navigate complex markets with confidence and clarity through data-driven strategies.",
          image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80",
          ctaLabel: "Request Analysis"
        }
      },
      {
        id: 'f_b2',
        type: 'authority_metrics',
        variant: 'grid',
        data: {
          title: "Quantifiable Impact",
          metrics: [
            { id: 'm1', value: '$250M+', label: 'Assets Managed', description: 'Trust earned across private and institutional clients.' },
            { id: 'm2', value: '18%', label: 'Avg. ROI', description: 'Consistently outperforming benchmark indices over 5 years.' },
            { id: 'm3', value: '98%', label: 'Retention', description: 'Commitment to long-term client success and partnership.' }
          ]
        }
      },
      {
        id: 'f_b3',
        type: 'narrative_timeline',
        variant: 'vertical',
        data: {
          title: "A Decade of Financial Stewardship",
          items: [
            { id: 't1', year: '2024', title: 'Senior Investment Officer', subtitle: 'Capital Group', description: 'Leading structured finance initiatives.' },
            { id: 't2', year: '2020', title: 'Portfolio Analyst', subtitle: 'Greenway Trust', description: 'Optimization of mid-size tech portfolios.' }
          ]
        }
      },
      {
        id: 'f_b4',
        type: 'cta_contact',
        variant: 'contact',
        data: {
          title: "Unlock Your Potential",
          description: "Reach out for a confidential strategy session."
        }
      }
    ]
  },
  Business: {
    id: 'tpl_business',
    name: 'Business Portfolio',
    category: 'Business',
    theme: { primaryColor: '#2563eb', fontFamily: 'Inter', mode: 'light' },
    blocks: [
      {
        id: 'b_b1',
        type: 'hero',
        variant: 'centered',
        data: {
          title: "Driving Corporate Excellence through Digital Transformation",
          subtitle: "Equipping companies with the tools and strategies to thrive in a rapidly evolving global market.",
          ctaLabel: "Start Consultation"
        }
      },
      {
        id: 'b_b2',
        type: 'authority_metrics',
        variant: 'grid',
        data: {
          title: "Operational Efficiency",
          metrics: [
            { id: 'm1', value: '35%', label: 'Cost Reduction', description: 'Streamlined operations through AI and automation.' },
            { id: 'm2', value: '2x', label: 'Speed to Market', description: 'Optimized internal workflows for agile delivery.' }
          ]
        }
      },
      {
        id: 'b_b3',
        type: 'proof_gallery',
        variant: 'grid_3col',
        data: {
          title: "Strategic Partnerships",
          projects: [
             { id: 'p1', title: 'Global Logistics', description: 'Supply chain optimization for Fortune 500 company', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80' }
          ]
        }
      },
      {
        id: 'b_b4',
        type: 'cta_calendly',
        variant: 'calendly',
        data: {
          title: "Book a Strategy Call",
          calendlyUrl: "https://calendly.com/business-consultant"
        }
      }
    ]
  },
  Professional: {
    id: 'tpl_professional',
    name: 'Professional Portfolio',
    category: 'Professional',
    theme: { primaryColor: '#1e293b', fontFamily: 'Inter', mode: 'light' },
    blocks: [
      {
        id: 'p_b1',
        type: 'hero',
        variant: 'split',
        data: {
          title: "Leadership that Inspires and Delivers",
          subtitle: "An experienced executive with a proven track record of scaling high-performance teams and building resilient startups.",
          image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80",
          ctaLabel: "Download Executive Summary"
        }
      },
      {
        id: 'p_b2',
        type: 'narrative_bio',
        variant: 'standard',
        data: {
          title: "My Professional Story",
          bio: "I've spent the last 15 years at the intersection of leadership, innovation, and people management.",
          image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80"
        }
      },
      {
        id: 'p_b3',
        type: 'authority_stack',
        variant: 'grid',
        data: {
          title: "Key Competencies",
          items: [
            { id: 's1', name: 'Strategic Planning', icon: 'default' },
            { id: 's2', name: 'Executive Leadership', icon: 'default' },
            { id: 's3', name: 'Scaling Teams', icon: 'default' }
          ]
        }
      },
      {
        id: 'p_b4',
        type: 'cta_contact',
        variant: 'contact',
        data: {
          title: "Connect for Opportunities"
        }
      }
    ]
  },
  Tech: {
    id: 'tpl_tech',
    name: 'Tech Portfolio',
    category: 'Tech',
    theme: { primaryColor: '#00dc82', fontFamily: 'Inter', mode: 'dark' },
    blocks: [
      {
        id: 't_b1',
        type: 'hero',
        variant: 'full-bg',
        data: {
          title: "Building the Future through Code",
          subtitle: "Full-stack engineer building scalable, high-performance applications with modern technology stacks.",
          image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80",
          ctaLabel: "Browse GitHub"
        }
      },
      {
        id: 't_b2',
        type: 'authority_stack',
        variant: 'grid',
        data: {
          title: "Technology Stack",
          items: [
            { id: 's1', name: 'Next.js', icon: 'frontend' },
            { id: 's2', name: 'TypeScript', icon: 'default' },
            { id: 's3', name: 'Node.js', icon: 'backend' },
            { id: 's4', name: 'Cloud Native', icon: 'cloud' }
          ]
        }
      },
      {
        id: 't_b3',
        type: 'proof_gallery',
        variant: 'grid_3col',
        data: {
          title: "Full-Stack Projects",
          projects: [
            { id: 'p1', title: 'Open Source UI', description: 'Re-usable component library for React', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80', tags: ['OSS', 'React'] }
          ]
        }
      },
      {
        id: 't_b4',
        type: 'cta_contact',
        variant: 'contact',
        data: {
          title: "Let's Build Together"
        }
      }
    ]
  }
};
