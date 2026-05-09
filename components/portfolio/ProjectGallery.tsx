"use client";
import React from "react";
import { ExternalLink, ArrowRight } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags?: string[];
  link?: string;
}

interface ProjectGalleryProps {
  variant?: string;
  data: {
    title?: string;
    description?: string;
    projects: Project[];
  };
}

const ProjectGallery: React.FC<ProjectGalleryProps> = ({ variant = "grid", data }) => {
  const { title, description, projects = [] } = data;

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      {(title || description) && (
        <div className="mb-12 space-y-4">
          {title && <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{title}</h2>}
          {description && <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">{description}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.length > 0 ? (
          projects.map(project => (
            <div
              key={project.id}
              className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/10 hover:-translate-y-2"
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={project.image || "https://picsum.photos/400/300"}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <a
                    href={project.link || "#"}
                    className="w-full py-2 bg-white text-slate-900 text-center rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    View Case Study <ExternalLink size={14} />
                  </a>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {project.tags?.map((tag, i) => (
                    <span key={i} className="text-[10px] uppercase tracking-wider font-bold text-brand-600 dark:text-brand-400">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                  {project.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2">{project.description}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <p className="text-slate-400">No projects added yet. Drag and drop projects here.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectGallery;
