"use client";

import React, { useState, useEffect, useRef } from "react";
import { UnimadLogo } from "@/components/unimad-logo";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  ArrowRight,
  Star,
  UserCircle,
  Target,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Award,
  Play,
  Pause,
  Loader2,
  Sparkles,
  Check,
  Copy,
  Quote,
  Building2,
  MousePointer2,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";

const CALENDLY_EVENT_URL = "https://calendly.com/unimad_ai/onboarding-to-unimad";
const THANK_YOU_PATH = "/webinar/thank-you";

const buildCalendlyUrl = origin => {
  const redirect = encodeURIComponent(`${origin}${THANK_YOU_PATH}`);
  return `${CALENDLY_EVENT_URL}?hide_event_type_details=1&hide_gdpr_banner=1&redirect_url=${redirect}`;
};

// --- Counter Component (using requestAnimationFrame for better performance) ---
const StatItem = ({ end, duration = 2000, prefix = "", suffix = "", label }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTimestamp = null;
    const step = timestamp => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration, isVisible]);

  return (
    <div ref={elementRef} className="flex flex-col items-center">
      <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-blue-600 mb-1 sm:mb-2 tracking-tight">
        <span className="tabular-nums">
          {prefix}
          {count.toLocaleString()}
          {suffix}
        </span>
      </p>
      <p className="text-slate-500 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.2em] text-center px-1">{label}</p>
    </div>
  );
};

// --- Navbar ---
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm py-4" : "bg-transparent py-6"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-center items-center">
        <Link href="/">
          <UnimadLogo className="h-8 sm:h-9 w-auto text-[#346DE0]" />
        </Link>
      </div>
    </nav>
  );
};

// --- Hero Recruiter DMs ---
// Note: We show all 4 on tablet & desktop, but only the top 2 on mobile
// to keep the hero text and CTA fully readable on small screens.
const RecruiterMsg = ({ avatar, name, msg, time, positionClasses, delay }) => (
  <div
    className={`absolute ${positionClasses} items-start gap-2 sm:gap-3 bg-white/95 backdrop-blur-sm p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-blue-50 max-w-[160px] sm:max-w-[180px] md:max-w-[220px] animate-float z-20 transition-all duration-700 opacity-0 animate-fade-in-up-delayed`}
    style={{ animationDelay: `${delay}s`, animationFillMode: "forwards" }}
  >
    <div className="relative shrink-0">
      <Image
        src={avatar}
        alt={name}
        width={36}
        height={36}
        className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full object-cover border border-slate-100 shadow-sm"
      />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-0.5">
        <h4 className="font-semibold text-slate-900 text-[10px] sm:text-xs truncate pr-1">{name}</h4>
        <span className="text-[9px] sm:text-[10px] text-slate-400 whitespace-nowrap">{time}</span>
      </div>
      <p className="text-[10px] sm:text-[11px] text-slate-500 line-clamp-2 leading-snug">{msg}</p>
    </div>
  </div>
);

// --- AI Headline Generator Component ---
const AIHeadlineGenerator = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateHeadline = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      // TODO: Replace with your backend API endpoint for AI headline generation
      // For now, this is a placeholder that can be connected to your backend
      const response = await fetch("/api/ai-headline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.headline || "Failed to generate headline.");
      } else {
        setResult("AI generation is unavailable. Join our Masterclass to learn the formula!");
      }
    } catch (error) {
      console.error(error);
      setResult("AI generation is unavailable. Join our Masterclass to learn the formula!");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-blue-200 mb-2">What&apos;s your major or current role?</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. MSc Data Science student"
              className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              onKeyDown={e => e.key === "Enter" && generateHeadline()}
            />
            <button
              onClick={generateHeadline}
              disabled={loading || !input.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 rounded-xl transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 relative group">
            <p className="text-slate-200 text-sm leading-relaxed pr-8 italic">&quot;{result}&quot;</p>
            <button onClick={copyToClipboard} className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}

        <p className="text-[10px] text-slate-500 italic">
          * This is a simple preview. Our Masterclass shows you how to fully optimize your profile for UK/US standards.
        </p>
      </div>
    </div>
  );
};

// --- Meet Founder Component ---
const MeetFounder = () => (
  <section className="py-12 sm:py-16 md:py-24 bg-[#020617] text-white relative overflow-hidden">
    {/* Background decorative elements */}
    <div className="absolute top-0 right-0 w-[300px] sm:w-[400px] md:w-[600px] h-[300px] sm:h-[400px] md:h-[600px] bg-blue-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
    <div className="absolute bottom-0 left-0 w-[200px] sm:w-[300px] md:w-[400px] h-[200px] sm:h-[300px] md:h-[400px] bg-blue-400/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
      <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-24 items-center">
        {/* Text Side */}
        <div className="space-y-6 sm:space-y-8 order-last md:order-first">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-blue-900/30 border border-blue-700/50 text-blue-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-3 sm:mb-4">
              Your Host
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-white mb-2 tracking-tight">
              Meet Shaki, your host to this Masterclass.
            </h2>
          </div>

          <div className="space-y-4 sm:space-y-6 text-slate-300 leading-relaxed max-w-lg text-base sm:text-lg">
            <p>
              Shaki went through{" "}
              <span className="text-white font-bold underline decoration-slate-500 decoration-2 underline-offset-4">
                1000s of rejections
              </span>{" "}
              before he landed his one offer in the UK that changed his life forever.
            </p>
            <p>He built Unimad so no student has to feel lost or alone again.</p>
          </div>

          {/* Stats Box */}
          <div className="border border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 bg-slate-900/50 backdrop-blur-sm relative group transition-colors">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Stat 1 */}
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-blue-400 tracking-wider">Mentored</p>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">4000+</div>
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium uppercase tracking-wide">International Students</div>
              </div>
              {/* Stat 2 */}
              <div className="space-y-1 relative border-t sm:border-t-0 sm:border-l border-slate-800 pt-4 sm:pt-0 sm:pl-6 text-center sm:text-left">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-green-400 tracking-wider">Helped</p>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">100s</div>
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium uppercase tracking-wide">Secure Job Offers</div>
              </div>
              {/* Stat 3 */}
              <div className="space-y-1 relative border-t sm:border-t-0 sm:border-l border-slate-800 pt-4 sm:pt-0 sm:pl-6 text-center sm:text-left">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-purple-400 tracking-wider">Landed</p>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">1000s</div>
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium uppercase tracking-wide">Of Interviews</div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="border-l-4 border-blue-500 pl-4 sm:pl-6 py-1">
              <p className="text-base sm:text-lg text-slate-300 font-medium italic leading-relaxed opacity-90">
                &quot;He is on a mission to make it easier for you to get noticed, get hired, and finally win the career you deserve.&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Image Side */}
        <div className="flex justify-center md:justify-end relative order-first md:order-last py-6 sm:py-8 md:py-0">
          {/* Floating Frame with Animation */}
          <div className="relative p-6 sm:p-10 md:p-14 animate-float">
            <div className="relative">
              {/* Image */}
              <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 sm:border-6 md:border-8 border-slate-800 shadow-2xl relative z-10">
                <Image
                  src="/images/unicoach/webinar/shaki.jpg"
                  alt="Shaki - Founder of Unimad"
                  width={320}
                  height={320}
                  className="w-full h-full object-cover grayscale transform transition-transform duration-700 hover:scale-105"
                />
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-4 sm:-bottom-6 -left-4 sm:-left-8 bg-slate-800 p-2.5 sm:p-4 rounded-lg sm:rounded-xl shadow-xl border border-slate-700 z-20 flex items-center gap-2 sm:gap-4 pr-4 sm:pr-8">
                <div className="bg-blue-600 p-1.5 sm:p-2.5 rounded-md sm:rounded-lg shadow-lg shadow-blue-900/50">
                  <Quote className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white fill-current" />
                </div>
                <div>
                  <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Founder & Mentor</p>
                  <p className="text-sm sm:text-lg font-bold text-white leading-none">Shaki</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// --- Feature Card Component ---
const FeatureCard = ({ type, step, title, description, benefits }) => (
  <div className="bg-white p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[40px] border border-slate-200/60 flex flex-col gap-4 sm:gap-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group overflow-hidden">
    {/* Visual Header Mockup */}
    <div className="bg-slate-50/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100/50 flex items-center justify-center h-[180px] sm:h-[200px] md:h-[220px] relative z-0">
      {type === "vpd" ? (
        <div className="relative w-full h-[140px] flex items-center justify-center perspective-1000">
          {/* Resume - Back Left */}
          <div className="absolute w-24 h-32 bg-white rounded-lg shadow-sm border border-slate-200 p-2.5 flex flex-col gap-2 transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-x-12 group-hover:-translate-y-2 group-hover:-rotate-6 z-10 origin-bottom-right">
            {/* Header */}
            <div className="flex gap-2 items-center mb-1">
              <div className="w-6 h-6 rounded bg-slate-100 shrink-0"></div>
              <div className="flex-1 space-y-1">
                <div className="h-1.5 bg-slate-800 rounded w-full opacity-20"></div>
                <div className="h-1 bg-slate-200 rounded w-2/3"></div>
              </div>
            </div>
            {/* Body */}
            <div className="space-y-1.5 mt-1">
              <div className="h-1 bg-slate-100 rounded w-full"></div>
              <div className="h-1 bg-slate-100 rounded w-full"></div>
              <div className="h-1 bg-slate-100 rounded w-5/6"></div>
            </div>
            <div className="space-y-1.5 mt-auto">
              <div className="h-1 bg-slate-100 rounded w-3/4"></div>
              <div className="h-1 bg-slate-100 rounded w-1/2"></div>
            </div>
          </div>

          {/* Portfolio - Back Right */}
          <div className="absolute w-24 h-32 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-12 group-hover:-translate-y-2 group-hover:rotate-6 z-10 origin-bottom-left">
            {/* Cover */}
            <div className="h-10 bg-slate-100 w-full"></div>
            {/* Profile */}
            <div className="px-2.5 relative">
              <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white -mt-4 mb-2"></div>
              <div className="space-y-1.5">
                <div className="h-1.5 bg-slate-800 rounded w-2/3 opacity-20"></div>
                <div className="h-1 bg-slate-200 rounded w-full"></div>
                <div className="h-1 bg-slate-200 rounded w-5/6"></div>
              </div>
              {/* Grid */}
              <div className="grid grid-cols-2 gap-1 mt-2.5">
                <div className="h-6 bg-slate-50 rounded"></div>
                <div className="h-6 bg-slate-50 rounded"></div>
              </div>
            </div>
          </div>

          {/* LinkedIn Profile - Front Center */}
          <div className="absolute w-32 h-40 bg-white rounded-xl shadow-xl shadow-blue-900/5 border border-slate-200 overflow-hidden transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-y-2 group-hover:scale-105 z-20 flex flex-col">
            {/* Banner */}
            <div className="h-10 bg-slate-50 w-full border-b border-slate-100 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100/50"></div>
            </div>
            <div className="px-3 flex-1 flex flex-col">
              {/* Profile Pic */}
              <div className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-sm -mt-5 mb-2 flex items-center justify-center z-10">
                <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              {/* Name & Headline */}
              <div className="space-y-1.5 mb-3">
                <div className="h-2 bg-slate-400 rounded w-3/4"></div>
                <div className="h-1.5 bg-slate-300 rounded w-full"></div>
                <div className="h-1.5 bg-slate-200 rounded w-2/3"></div>
              </div>
              {/* Buttons */}
              <div className="flex gap-2 mb-3">
                <div className="h-4 bg-[#0a66c2] rounded-full w-14"></div>
                <div className="h-4 border border-slate-300 rounded-full w-8"></div>
              </div>
              {/* Activity/Experience Mock */}
              <div className="mt-auto mb-3 space-y-1.5 opacity-50">
                <div className="h-1 bg-slate-200 rounded w-full"></div>
                <div className="h-1 bg-slate-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      ) : type === "linkedin" ? (
        <div className="relative w-full max-w-[260px] group/job">
          {/* Background Stack */}
          <div className="absolute inset-0 bg-white rounded-xl border border-slate-100 shadow-sm opacity-0 scale-95 origin-center transition-all duration-500 group-hover:opacity-100 group-hover:rotate-6 group-hover:translate-x-2 -z-10"></div>
          <div className="absolute inset-0 bg-white rounded-xl border border-slate-100 shadow-sm opacity-0 scale-90 origin-center transition-all duration-500 delay-75 group-hover:opacity-60 group-hover:-rotate-6 group-hover:-translate-x-2 -z-20"></div>

          <div className="bg-white p-4 rounded-xl shadow-[0_8px_25px_rgba(0,0,0,0.06)] border border-slate-100 relative z-10 transition-all duration-300 group-hover:-translate-y-1">
            <div className="flex gap-3 mb-4">
              {/* Company logo */}
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 shadow-sm">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 space-y-1.5 py-1">
                <div className="h-2 bg-slate-400 rounded-full w-3/4"></div>
                <div className="h-1.5 bg-slate-200 rounded-full w-1/2"></div>
              </div>
            </div>
            <div className="flex gap-2 mb-5 opacity-60">
              <div className="h-5 w-14 bg-slate-100 rounded-md"></div>
              <div className="h-5 w-10 bg-slate-100 rounded-md"></div>
            </div>
            <div className="relative h-9 w-full overflow-hidden rounded-lg bg-blue-600 shadow-md shadow-blue-200 transition-all duration-300 group-hover:bg-green-500 group-hover:shadow-green-200">
              <div className="absolute inset-0 flex items-center justify-center text-white text-[11px] font-bold tracking-wide transition-transform duration-300 group-hover:-translate-y-full">
                Apply Now
              </div>
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 text-white text-[11px] font-bold tracking-wide translate-y-full transition-transform duration-300 group-hover:translate-y-0">
                <Check className="w-3.5 h-3.5 stroke-[3px]" />
                <span>Applied</span>
              </div>
            </div>
          </div>

          {/* Mouse Pointer */}
          <div className="absolute -bottom-4 -right-4 z-20 opacity-0 transform translate-y-4 transition-all duration-500 delay-100 group-hover:opacity-100 group-hover:translate-y-[-24px] group-hover:translate-x-[-24px] pointer-events-none">
            <MousePointer2 className="w-6 h-6 fill-slate-900 text-white drop-shadow-xl" />
          </div>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-50 w-full max-w-[260px] transform group-hover:scale-105 transition-transform duration-500">
          <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-900 text-[11px]">Chat with HR</span>
          </div>
          <div className="space-y-2">
            <div className="bg-slate-50 p-2 rounded-lg rounded-tl-none w-5/6">
              <div className="h-1 bg-slate-200 rounded w-3/4"></div>
            </div>
            <div className="flex justify-end">
              <div className="bg-blue-600 p-2 rounded-lg rounded-tr-none w-4/5">
                <div className="h-1 bg-white/30 rounded w-full"></div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 text-[10px] font-bold text-blue-600">
              <Award className="w-3.5 h-3.5" />
              <span>Offer Received: Signed</span>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Content */}
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 text-white font-bold text-base sm:text-lg shrink-0 shadow-md shadow-blue-200">
          {step}
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors pt-0.5">
          {title}
        </h3>
      </div>
      <p className="text-slate-600 leading-relaxed font-normal text-sm sm:text-base pl-0 sm:pl-1">{description}</p>
    </div>

    {/* Checklist */}
    <ul className="space-y-2 sm:space-y-3 mt-auto pt-3 sm:pt-4 border-t border-slate-50">
      {benefits.map((benefit, i) => (
        <li key={i} className="flex items-start gap-2 sm:gap-3 text-slate-700 text-xs sm:text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0 mt-0.5" />
          <span>{benefit}</span>
        </li>
      ))}
    </ul>
  </div>
);

// --- Video Testimonial Card Component ---
const VideoTestimonialCard = ({ videoUrl, thumbnail, studentName, major }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative group shrink-0 w-[110px] sm:w-[130px] md:w-[160px] aspect-[9/16] rounded-xl sm:rounded-2xl overflow-hidden shadow-lg bg-slate-200 border border-slate-100">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnail}
        className="w-full h-full object-cover"
        controls={isPlaying}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      {!isPlaying && (
        <div
          className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex flex-col justify-between p-2 sm:p-3 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="flex justify-center items-center flex-grow">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-blue-600 shadow-md transform group-hover:scale-110 transition-transform">
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
            </div>
          </div>
          <div className="text-white">
            <h4 className="font-semibold text-[9px] sm:text-[10px] md:text-xs leading-tight truncate">{studentName}</h4>
            <p className="text-[7px] sm:text-[8px] md:text-[10px] text-white/80 uppercase tracking-wider mt-0.5 truncate">{major}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Testimonial Card Component ---
const TestimonialCard = ({ n, sub, inst, t }) => (
  <div className="p-6 sm:p-8 rounded-2xl sm:rounded-[32px] bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 flex flex-col">
    <div className="flex items-center gap-1 mb-4 sm:mb-6 text-yellow-400">
      {[...Array(5)].map((_, j) => (
        <Star key={j} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
      ))}
    </div>
    <p className="text-slate-600 mb-6 sm:mb-8 leading-relaxed font-normal italic text-sm sm:text-[15px]">&quot;{t}&quot;</p>
    <div className="flex items-center gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-50">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#1da1f2] flex items-center justify-center font-bold text-white text-xs sm:text-sm shadow-sm shrink-0 uppercase">
        {n[0]}
      </div>
      <div className="min-w-0 text-left">
        <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight truncate">{n}</h4>
        <p className="text-[10px] sm:text-[11px] text-blue-600 font-bold uppercase tracking-tight mt-0.5 truncate">{sub}</p>
        <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate">{inst}</p>
      </div>
    </div>
  </div>
);

// --- FAQ Item Component ---
const FAQItem = ({ q, a, isOpen, onClick }) => (
  <div
    className="bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 overflow-hidden transition-all hover:shadow-md cursor-pointer"
    onClick={onClick}
  >
    <div className="p-4 sm:p-6 flex justify-between items-center gap-4">
      <h3 className="font-semibold text-slate-900 text-xs sm:text-sm md:text-base text-left flex-1">{q}</h3>
      {isOpen ? (
        <ChevronUp className="text-blue-600 shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
      ) : (
        <ChevronDown className="text-slate-400 shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
      )}
    </div>
    {isOpen && <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-slate-600 animate-fade-in-up text-xs sm:text-sm text-left">{a}</div>}
  </div>
);

// --- Unimad U-mark (crisp SVG for playbook cover) ---
const UnimadMark = ({ className }) => (
  <svg viewBox="0 0 37 37" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path
      d="M37 2.57135V17.5654C37 18.5145 36.9302 19.4411 36.8022 20.345C36.5462 22.2997 35.9994 24.1641 35.2082 25.8929C34.3239 27.8477 33.1371 29.6216 31.7176 31.147C31.6362 31.2487 31.5431 31.3504 31.4384 31.4408C29.984 32.9436 28.2852 34.1978 26.4236 35.1243C25.3648 35.6554 24.2711 36.0735 23.1192 36.3898C22.4792 36.5593 21.816 36.7062 21.1412 36.7966C20.2802 36.9322 19.3959 37 18.5 37C17.6041 37 16.7198 36.9322 15.8588 36.7966C15.1956 36.7062 14.5208 36.5593 13.8808 36.3898C12.7289 36.0735 11.6352 35.6554 10.5764 35.1243C8.71478 34.1978 7.01604 32.9436 5.56164 31.4408C5.46855 31.3504 5.36384 31.2487 5.28239 31.147C3.85126 29.6216 2.65283 27.8477 1.78019 25.8929C1.00063 24.1641 0.453774 22.2997 0.197799 20.345C0.0698113 19.4411 0 18.5145 0 17.5654V2.57135C0 0.593988 2.02453 -0.637624 3.64182 0.345406L12.6475 5.78032C13.4038 6.23229 13.8692 7.07973 13.8692 7.99496V25.4861C13.8692 25.6556 14.067 25.7686 14.2182 25.6782L18.3836 23.3619C18.4535 23.3167 18.5465 23.3167 18.6164 23.3619L22.7701 25.6782C22.9214 25.7686 23.1192 25.6556 23.1192 25.4861V7.99496C23.1192 7.07973 23.5846 6.23229 24.3409 5.78032L33.3349 0.345406C34.9638 -0.637624 36.9884 0.593988 36.9884 2.57135H37Z"
      fill="white"
    />
  </svg>
);

// --- 3D Playbook Book ---
const PlaybookBook3D = () => (
  <div
    className="group shrink-0 relative flex items-center justify-center w-[180px] h-[230px] sm:w-[210px] sm:h-[270px] md:w-[240px] md:h-[300px]"
    style={{ perspective: "1000px" }}
  >
    <div className="relative w-[140px] h-[196px] sm:w-[165px] sm:h-[231px] md:w-[185px] md:h-[259px] transition-transform duration-700 ease-out [transform-style:preserve-3d] [transform:rotateY(-32deg)_rotateX(6deg)] group-hover:[transform:rotateY(-18deg)_rotateX(4deg)_scale(1.03)]">
      {/* Front cover */}
      <div
        className="absolute inset-0 rounded-r-lg rounded-l-[3px] overflow-hidden shadow-2xl shadow-blue-900/25"
        style={{ transform: "translateZ(14px)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#5B9BF8] via-[#346DE0] to-[#1E4FA8]" />
        <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.25)_0%,transparent_45%,rgba(0,0,0,0.1)_100%)]" />
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-white/20" />
        <div className="relative z-10 h-full flex flex-col p-4 sm:p-5 md:p-6">
          <UnimadMark className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 shrink-0" />
          <div className="flex-1" />
          <p className="text-[10px] sm:text-[11px] md:text-xs font-bold text-white leading-[1.4] tracking-tight">
            Career Positioning System Playbook
          </p>
          <div className="mt-3 sm:mt-4 h-[2px] w-8 bg-white/35" />
        </div>
      </div>

      {/* Back cover */}
      <div
        className="absolute inset-0 rounded-r-lg rounded-l-[3px] bg-[#17356E]"
        style={{ transform: "translateZ(-14px) rotateY(180deg)" }}
      />

      {/* Spine */}
      <div
        className="absolute top-0 left-0 w-[28px] h-full rounded-l-[2px] overflow-hidden"
        style={{ transform: "rotateY(-90deg)", transformOrigin: "left center" }}
      >
        <div className="w-full h-full bg-gradient-to-b from-[#346DE0] via-[#2858B8] to-[#1A3F7A]" />
        <div className="absolute inset-y-0 right-0 w-px bg-white/10" />
      </div>

      {/* Page edges */}
      <div
        className="absolute top-[4px] bottom-[4px] right-0 w-[28px]"
        style={{ transform: "rotateY(90deg)", transformOrigin: "right center" }}
      >
        <div
          className="w-full h-full rounded-r-[2px] border border-slate-200/80"
          style={{
            background: "repeating-linear-gradient(to bottom, #ffffff 0px, #ffffff 1px, #e2e8f0 1px, #e2e8f0 2.5px)",
            boxShadow: "inset -3px 0 6px rgba(0,0,0,0.06)",
          }}
        />
      </div>
    </div>

    {/* Ground shadow */}
    <div className="absolute bottom-0 left-1/2 -translate-x-[45%] w-[130px] sm:w-[150px] h-[18px] bg-blue-900/20 blur-xl rounded-full pointer-events-none" />
  </div>
);

// --- Main App Component ---
const WebinarPage = () => {
  const router = useRouter();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [calendlyUrl, setCalendlyUrl] = useState("");
  const calendlyRef = useRef(null);
  const calendlyInitialized = useRef(false);
  const [mounted, setMounted] = useState(false);

  // Only run on client side to avoid hydration issues
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only mount gate for Calendly
    setMounted(true);
    setCalendlyUrl(buildCalendlyUrl(window.location.origin));

    // Inject Calendly CSS
    const calendlyLink = document.createElement("link");
    calendlyLink.href = "https://assets.calendly.com/assets/external/widget.css";
    calendlyLink.rel = "stylesheet";
    document.head.appendChild(calendlyLink);

    // Inject styles only on client
    const style = document.createElement("style");
    style.textContent = `
     @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
     @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
     .animate-float { animation: float 6s ease-in-out infinite; }
     .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
     .animate-fade-in-up-delayed { animation: fade-in-up 0.8s ease-out forwards; opacity: 0; }
   `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
      // Remove Calendly link if it exists
      const existingLink = document.querySelector('link[href="https://assets.calendly.com/assets/external/widget.css"]');
      if (existingLink) {
        document.head.removeChild(existingLink);
      }
    };
  }, []);

  // Calendly event tracking
  useEffect(() => {
    const isCalendlyEvent = e => {
      return e.origin === "https://calendly.com" && e.data.event?.startsWith("calendly.");
    };

    const handleCalendlyMessage = e => {
      if (isCalendlyEvent(e)) {
        console.log("Calendly Event:", e.data.event);
        console.log("Event Details:", e.data.payload);

        // Track specific events if needed
        if (e.data.event === "calendly.event_scheduled") {
          router.push(THANK_YOU_PATH);
        }
      }
    };

    window.addEventListener("message", handleCalendlyMessage);
    return () => window.removeEventListener("message", handleCalendlyMessage);
  }, [router]);

  useEffect(() => {
    if (!calendlyUrl || !calendlyRef.current) return;

    const initInlineCalendly = () => {
      if (!window.Calendly || !calendlyRef.current || calendlyInitialized.current) return;
      calendlyRef.current.innerHTML = "";
      window.Calendly.initInlineWidget({
        url: calendlyUrl,
        parentElement: calendlyRef.current,
      });
      calendlyInitialized.current = true;
    };

    initInlineCalendly();
    if (!window.Calendly) {
      const timer = setInterval(() => {
        if (window.Calendly) {
          clearInterval(timer);
          initInlineCalendly();
        }
      }, 200);
      return () => clearInterval(timer);
    }
  }, [calendlyUrl]);

  // Initialize Calendly Popup Widget with customizations
  // URL parameters: hide_event_type_details=1 (hides event info), hide_gdpr_banner=1 (hides cookie banner)
  const openCalendlyPopup = () => {
    // Trigger Confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#2563EB", "#00BA00", "#ffffff", "#60A5FA"],
      disableForReducedMotion: true,
    });

    const calendlyUrl = buildCalendlyUrl(window.location.origin);

    const checkCalendly = (attempts = 0) => {
      if (typeof window !== "undefined" && window.Calendly) {
        try {
          window.Calendly.initPopupWidget({
            url: calendlyUrl,
          });
        } catch (error) {
          console.error("Error opening Calendly popup:", error);
          // Fallback: open in new tab if widget fails
          window.open(calendlyUrl, "_blank");
        }
      } else if (attempts < 20) {
        // Retry up to 20 times (4 seconds total)
        setTimeout(() => checkCalendly(attempts + 1), 200);
      } else {
        // Fallback: open in new tab if widget fails to load after retries
        window.open(calendlyUrl, "_blank");
      }
    };

    checkCalendly();
  };

  const testimonials = [
    {
      n: "Bharath Anand",
      sub: "MSC in User Experiences",
      inst: "University of Birmingham",
      t: "Unicoach has been a game changer. I was able to optimise my CV and develop an impactful value proposition document that recruiters loved.",
    },
    {
      n: "Akhila",
      sub: "MSC in Sustainability",
      inst: "RGU University",
      t: "Honestly, going through the Unicoach program felt like having a dedicated career mentor by my side. It broke down complex goals into simple steps.",
    },
    {
      n: "Vanshika",
      sub: "B.E. in Computer Science",
      inst: "Trinity College Dubline",
      t: "Shaki always believed in me. His encouragement gave me the confidence I needed to land my job at Deloitte. Truly life changing!",
    },
  ];

  const videoTestimonials = [
    {
      name: "Anwesha",
      major: "Data Analytics",
      thumb: "/images/unicoach/webinar/anwesha_thumbnail.webp",
      video: "https://storage.googleapis.com/unimadai-public-assets/testimonials/anwesha_testimonial.mp4",
    },
    {
      name: "Sri",
      major: "Computer Science",
      thumb: "/images/unicoach/webinar/sri_thumbnail.webp",
      video: "https://storage.googleapis.com/unimadai-public-assets/testimonials/sri_testimonial.mp4",
    },
    {
      name: "Vanshika",
      major: "MBA",
      thumb: "/images/unicoach/webinar/vanshika_thumbnail.webp",
      video: "https://storage.googleapis.com/unimadai-public-assets/testimonials/vanshika_testimonial.mp4",
    },
    {
      name: "Varsha",
      major: "Supply Chain",
      thumb: "/images/unicoach/webinar/varsha_thumbnail.webp",
      video: "https://storage.googleapis.com/unimadai-public-assets/testimonials/varsha_testimonial.mp4",
    },
    {
      name: "Aniket",
      major: "Media Analyst",
      thumb: "/images/unicoach/webinar/aniket_thumbnail.webp",
      video: "https://storage.googleapis.com/unimadai-public-assets/testimonials/aniket_testimonial.mp4",
    },
    {
      name: "Sreenu",
      major: "DevOps Engineer",
      thumb: "/images/unicoach/webinar/sreenu_thumbnail.webp",
      video: "https://storage.googleapis.com/unimadai-public-assets/testimonials/sreenu_testimonial.mp4",
    },
  ];

  const studentAvatars = [
    "/images/unicoach/landing/testimonials/anwesha.webp",
    "/images/unicoach/landing/testimonials/sripathi.webp",
    "/images/unicoach/landing/testimonials/sarada-priya.webp",
    "/images/unicoach/landing/testimonials/abhishek.webp",
  ];

  const scrollToCTA = () => {
    // Trigger Confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#2563EB", "#00BA00", "#ffffff", "#60A5FA"],
      disableForReducedMotion: true,
    });

    document.getElementById("final-cta")?.scrollIntoView({ behavior: "smooth" });
  };

  const faqs = [
    {
      q: "Is it free?",
      a: "Yes, the initial Masterclass is 100% free. We want to help international students break the debt cycle and land high-paying roles.",
    },
    {
      q: "Will there be a replay?",
      a: "No recordings will be provided. The best value comes from the live, interactive session where you can ask specific questions about your job search.",
    },
    {
      q: "Who can join?",
      a: "International students in the UK, US, Canada, Ireland, Australia, & New Zealand who are super hungry to land a full-time job.",
    },
    {
      q: "Do I need to be in a tech background?",
      a: "Not at all. We focus on strategy, positioning, and psychological triggers that make recruiters notice you, regardless of your background.",
    },
  ];

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 sm:pt-32 pb-12 sm:pb-20 bg-gradient-to-br from-blue-50 via-white to-white px-4 sm:px-6">
        <div className="absolute top-0 right-0 w-[400px] sm:w-[600px] md:w-[800px] h-[400px] sm:h-[600px] md:h-[800px] bg-blue-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 -z-10 opacity-60"></div>

        {/* Animated Recruiter DMs */}
        {/* Top-left - always visible */}
        <RecruiterMsg
          avatar="/images/unicoach/landing/testimonials/aarthi.webp"
          name="Aarthi (Coursera)"
          msg="The VPD was a total game changer for me."
          time="2m ago"
          positionClasses="flex top-[10%] sm:top-[15%] left-[2%] sm:left-[2%] 2xl:left-[8%]"
          delay={0.5}
        />
        {/* Top-right - always visible */}
        <RecruiterMsg
          avatar="/images/unicoach/landing/testimonials/kushal.webp"
          name="Kushal (TopDog Law)"
          msg="My portfolio impressed them! Landed a role."
          time="15m ago"
          positionClasses="flex top-[15%] sm:top-[20%] right-[2%] sm:right-[2%] 2xl:right-[8%]"
          delay={1.2}
        />
        {/* Bottom-left - hidden on mobile, visible from sm+ */}
        <RecruiterMsg
          avatar="/images/unicoach/landing/testimonials/vanshika.webp"
          name="Vanshika (Green Crowd)"
          msg="Got invited for an interview this Thursday."
          time="1h ago"
          positionClasses="hidden sm:flex bottom-[18%] sm:bottom-[20%] left-[3%] 2xl:left-[10%]"
          delay={1.8}
        />
        {/* Bottom-right - hidden on mobile, visible from sm+ */}
        <RecruiterMsg
          avatar="/images/home/madstories/madhumitha.webp"
          name="Madhu (Solo)"
          msg="Optimised my LinkedIn and got noticed."
          time="Just now"
          positionClasses="hidden sm:flex bottom-[22%] sm:bottom-[25%] right-[3%] 2xl:right-[12%]"
          delay={2.4}
        />

        <div className="max-w-5xl mx-auto relative z-10 text-center flex flex-col items-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-1 sm:gap-2 bg-white/60 backdrop-blur-sm border border-slate-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-slate-500 font-medium text-[10px] sm:text-xs md:text-sm shadow-sm mb-6 sm:mb-8 animate-fade-in-up">
            <span className="whitespace-nowrap text-slate-700 font-semibold">Unimad Career Positioning System</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="whitespace-nowrap">Thursday, 18th June</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-bold text-slate-900 tracking-tight mb-4 sm:mb-6 leading-[1.1] sm:leading-[1.08] px-2 max-w-4xl">
            Master the Framework that Turns{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Applications into Interviews.</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 font-normal px-4">
            A free live session with the Founder of Unimad who went from hundreds of rejections to real offers. Walk away with the playbook.
          </p>

          <button
            onClick={scrollToCTA}
            className="group relative px-6 sm:px-10 md:px-12 py-3 sm:py-4 md:py-5 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-full font-bold text-sm sm:text-base md:text-lg shadow-[0_20px_40px_rgba(37,99,235,0.35)] transition-all transform hover:-translate-y-1 flex items-center gap-2 sm:gap-3 overflow-hidden cursor-pointer"
          >
            <span className="relative z-10">Save my free seat</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-xs sm:text-sm text-slate-500 mt-3 sm:mt-4 font-medium">(FREE · 60 mins · LIVE)</p>

          <div className="text-xs sm:text-sm text-slate-500 mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2 px-4">
            <div className="flex -space-x-3">
              {studentAvatars.map((src, i) => (
                <div key={i} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 border-2 border-white overflow-hidden shadow-sm">
                  <Image src={src} alt="Student" width={36} height={36} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <span className="font-medium sm:ml-2 text-center sm:text-left">Join 8000+ international students</span>
          </div>
        </div>
      </section>

      {/* The Unimad System Redesigned Grid Section */}
      <section id="benefits" className="py-12 sm:py-16 md:py-24 bg-slate-50/50 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 sm:mb-16 md:mb-20 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 max-w-4xl mx-auto tracking-tight leading-tight px-2">
              Unlock the <span className="text-blue-600">Unimad system</span> in this 60-min Masterclass
            </h2>
            <p className="text-slate-600 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mx-auto px-4">
              A proven 3-step framework developed from years of hiring data to land you a job in record time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            <FeatureCard
              type="vpd"
              step={1}
              title="Build your Foundation"
              description="You'll find your niche and build your digital footprint."
              benefits={["A base resume.", "Your LinkedIn optimised.", "A portfolio explaining your story."]}
            />
            <FeatureCard
              type="linkedin"
              step={2}
              title="Start your Game"
              description="You'll build a foundation and start with applications."
              benefits={[
                "Quality & Quantity Applications",
                "Personal branding to stay visible online.",
                "Developing a repeatable process for applications.",
              ]}
            />
            <FeatureCard
              type="interview"
              step={3}
              title="Convert Interviews"
              description="You'll learn how to dominate interviews with AI."
              benefits={["Technical tests", "Behavioural Interviews", "Value Proposition Documents"]}
            />
          </div>
        </div>
      </section>

      {/* Stories Section */}
      <section id="stories" className="py-12 sm:py-16 md:py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-12 sm:mb-16 tracking-tight px-2">
            Don&apos;t take our word for it.
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-12 py-8 sm:py-12 border-y border-slate-200">
            <StatItem end={2} prefix="$" suffix="M+" label="In Job Offers" />
            <StatItem end={4} suffix="k+" label="Happy Students" />
            <StatItem end={500} suffix="+" label="Interviews Booked" />
            <StatItem end={100} suffix="+" label="Companies Hired" />
          </div>

          <div className="mt-12 sm:mt-16 relative">
            <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

            <div
              className="overflow-x-auto pb-6 sm:pb-8 no-scrollbar snap-x snap-mandatory px-2 sm:px-4 md:px-0"
              onWheel={e => {
                // Convert vertical mouse wheel scroll to horizontal scroll
                if (e.deltaY !== 0) {
                  e.preventDefault();
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
            >
              <div className="flex gap-3 sm:gap-4 md:gap-6">
                {videoTestimonials.map((vt, i) => (
                  <div key={i} className="snap-center first:pl-2 sm:first:pl-4 last:pr-2 sm:last:pr-4 flex-shrink-0">
                    <VideoTestimonialCard studentName={vt.name} major={vt.major} thumbnail={vt.thumb} videoUrl={vt.video} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12 items-start">
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} {...t} />
            ))}
          </div>

          <div className="mt-12 sm:mt-16 md:mt-20 flex flex-col items-center px-4">
            <button
              onClick={scrollToCTA}
              className="group px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-b from-slate-50 to-slate-200/50 border-2 border-blue-600 text-blue-600 hover:bg-white rounded-full font-bold text-base sm:text-lg transition-all flex items-center gap-2 sm:gap-3 shadow-xl hover:shadow-blue-100 active:scale-95 w-full sm:w-auto max-w-sm sm:max-w-none justify-center cursor-pointer"
            >
              Reserve Your Spot
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Meet The Founder Section */}
      <MeetFounder />

      {/* Free Playbook Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-slate-50/50 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl sm:rounded-[40px] border border-slate-200/60 p-8 sm:p-12 md:p-16 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center gap-8 sm:gap-12 md:gap-16">
            <PlaybookBook3D />
            <div className="text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-4 sm:mb-5">
                Free Bonus
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4 sm:mb-5 tracking-tight leading-tight">
                Get the <span className="text-blue-600">Career Positioning System Playbook</span>
              </h2>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl mx-auto md:mx-0">
                Attend the live Masterclass and we&apos;ll send you our playbook, a step-by-step guide to positioning yourself so recruiters
                notice you, reach out, and invite you to interview.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-12 sm:py-16 md:py-24 bg-white px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-8 sm:mb-12 px-2">Frequently Asked Questions</h2>
          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                {...faq}
                isOpen={openFaqIndex === index}
                onClick={() => setOpenFaqIndex(index === openFaqIndex ? -1 : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Calendly Script - Load for inline widget (also supports popup if button is re-enabled) */}
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="afterInteractive" />

      {/* Final CTA - Inline Calendly calendar (one less click) */}
      <section id="final-cta" className="py-12 sm:py-16 md:py-24 bg-white text-center px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-blue-50 rounded-3xl sm:rounded-[40px] p-8 sm:p-12 md:p-20 border border-blue-100 shadow-sm relative overflow-hidden">
          <div className="absolute -top-12 sm:-top-24 -left-12 sm:-left-24 w-32 h-32 sm:w-64 sm:h-64 bg-blue-600/5 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="inline-block p-1.5 sm:p-2 bg-red-100 text-red-600 rounded-lg font-bold text-[10px] sm:text-xs mb-4 sm:mb-6 animate-pulse">
              Only a few spots remaining this week
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 tracking-tight leading-tight px-2">
              Don&apos;t Stay Stuck. <br />
              Build Your Mad Story.
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 sm:mb-10 max-w-2xl mx-auto font-normal px-2">
              Join the live session and unlock the system to land better offers with AI.
            </p>
            {/* Inline Calendly widget - no popup, one less click */}
            {calendlyUrl ? (
              <div
                ref={calendlyRef}
                className="calendly-inline-widget w-full rounded-2xl overflow-hidden border border-blue-100 bg-white"
                style={{ minWidth: 320, height: 700 }}
              />
            ) : (
              <div
                className="w-full rounded-2xl border border-blue-100 bg-white flex items-center justify-center text-slate-400 text-sm"
                style={{ minWidth: 320, height: 700 }}
              >
                Loading booking calendar...
              </div>
            )}
            {/* Commented button - revert to this if inline doesn't look good
            <button
              onClick={openCalendlyPopup}
              className="px-8 sm:px-12 py-4 sm:py-5 bg-blue-600 text-white rounded-full font-bold text-base sm:text-lg md:text-xl hover:bg-blue-700 transition-all transform hover:-translate-y-1 shadow-2xl shadow-blue-300 cursor-pointer w-full sm:w-auto max-w-sm sm:max-w-none"
            >
              Secure your free seat now
            </button>
            */}
            <p className="text-[10px] sm:text-xs md:text-sm text-slate-400 mt-4 sm:mt-6 font-medium uppercase tracking-wider sm:tracking-widest px-2">
              No credit card required • 60 mins • Live Training
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 sm:py-12 border-t border-slate-100 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <UnimadLogo className="h-7 sm:h-8 w-auto text-[#346DE0]" />
          <p className="text-slate-400 text-[10px] sm:text-xs font-normal text-center md:text-left">
            © 2025 Unicoach. Empowering international students globally.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default WebinarPage;
