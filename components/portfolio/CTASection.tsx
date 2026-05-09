"use client";
import React from "react";
import { Mail, Phone, MapPin, Send, Calendar } from "lucide-react";

interface CTASectionProps {
  variant?: string; // 'contact' | 'calendly'
  data: {
    title?: string;
    description?: string;
    email?: string;
    phone?: string;
    location?: string;
    calendlyUrl?: string;
  };
}

const CTASection: React.FC<CTASectionProps> = ({ variant = "contact", data }) => {
  const { title, description, email, phone, location, calendlyUrl } = data;

  if (variant === "calendly") {
    return (
      <section className="py-24 px-6 max-w-5xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white">{title || "Let's find a time to talk"}</h2>
          {description && <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">{description}</p>}
        </div>

        <div className="aspect-[16/10] w-full bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-12 overflow-hidden relative group">
          {calendlyUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
              <Calendar size={48} className="text-brand-600 animate-bounce" />
              <p className="text-slate-500">
                Calendly Scheduler would load here for: <br />
                <span className="font-mono text-xs">{calendlyUrl}</span>
              </p>
              <button className="px-8 py-3 bg-brand-600 text-white rounded-full font-medium shadow-lg">Schedule Meeting</button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <Calendar size={48} className="text-slate-300 mx-auto" />
              <p className="text-slate-400 italic">No Calendly URL provided. Drag a Calendly block and add your link.</p>
            </div>
          )}
          {/* Subtle overlay to simulate embed feel */}
          <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="bg-slate-900 dark:bg-brand-950 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row">
        <div className="p-12 lg:p-20 lg:w-1/2 space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              {title || "Let's build something incredible together"}
            </h2>
            <p className="text-lg text-white/60 leading-relaxed">
              {description ||
                "I'm currently available for freelance projects and full-time opportunities. Reach out and let's start a conversation."}
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 text-white/80">
              <div className="p-3 bg-white/10 rounded-2xl">
                <Mail size={20} />
              </div>
              <span>{email || "hello@unimad.dev"}</span>
            </div>
            <div className="flex items-center gap-4 text-white/80">
              <div className="p-3 bg-white/10 rounded-2xl">
                <Phone size={20} />
              </div>
              <span>{phone || "+1 (555) 000-0000"}</span>
            </div>
            <div className="flex items-center gap-4 text-white/80">
              <div className="p-3 bg-white/10 rounded-2xl">
                <MapPin size={20} />
              </div>
              <span>{location || "San Francisco, CA"}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-12 lg:p-20 lg:w-1/2 flex flex-col justify-center">
          <form className="space-y-6" onSubmit={e => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-brand-500 rounded-xl outline-none transition-all"
                  placeholder="Alex Morgan"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-brand-500 rounded-xl outline-none transition-all"
                  placeholder="alex@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Message</label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-brand-500 rounded-xl outline-none transition-all resize-none"
                placeholder="How can I help you?"
              />
            </div>
            <button className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98]">
              Send Message <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
