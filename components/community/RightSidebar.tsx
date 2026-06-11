import React from "react";
import { ArrowRight, Video, TrendingUp } from "lucide-react";
import { SUGGESTED_GROUPS } from "./Feed/FeedHelper";

const RightSidebar: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Upcoming Webinar Widget */}
      <div className="bg-gradient-to-br from-brand-900 to-slate-900 rounded-xl p-5 text-white shadow-md relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Video size={80} />
        </div>

        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-brand-500 mb-2">LIVE TODAY</span>
        <h3 className="font-medium text-lg leading-tight mb-1">Mastering Figma Auto Layout</h3>
        <p className="text-white/60 text-xs mb-4">with Sarah Design • 4:00 PM EST</p>

        <button className="w-full bg-white text-slate-900 py-2 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-1">
          Register Free <ArrowRight size={12} />
        </button>
      </div>

      {/* Suggested Groups */}
      <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white">Groups for You</h4>
          <button className="text-xs text-brand-500 hover:text-brand-600">See All</button>
        </div>

        <div className="space-y-4">
          {SUGGESTED_GROUPS.map(group => (
            <div key={group.id} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-lg shadow-inner">
                {group.image}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-sm font-medium text-slate-900 dark:text-white truncate">{group.name}</h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{group.members}</p>
              </div>
              <button className="text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 p-1.5 rounded-full transition-colors">
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm p-4">
        <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-brand-500" />
          Trending Now
        </h4>
        <div className="flex flex-wrap gap-2">
          {["#RemoteWork", "#AI", "#DesignSystems", "#React", "#CareerTips"].map(tag => (
            <span
              key={tag}
              className="px-3 py-1 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-xs rounded-full cursor-pointer transition-colors border border-slate-200 dark:border-white/5"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-slate-400">
        <p>© 2026 Unimad Inc.</p>
        <div className="flex justify-center gap-2 mt-1">
          <a href="#" className="hover:underline">
            Privacy
          </a>
          <span>•</span>
          <a href="#" className="hover:underline">
            Terms
          </a>
          <span>•</span>
          <a href="#" className="hover:underline">
            Cookies
          </a>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
