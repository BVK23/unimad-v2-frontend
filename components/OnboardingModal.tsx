import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Wand2, Edit3, MousePointerClick, LayoutTemplate, Share2, Layers } from 'lucide-react';

interface OnboardingModalProps {
    onComplete: () => void;
}

const STEPS = [
    {
        id: 'edit',
        title: "Click to Edit",
        description: "Everything you see is editable. Just click on any text, title, or section to update it immediately.",
        image: "https://placehold.co/600x400/f1f5f9/334155?text=GIF:+Click+to+Edit",
        icon: <Edit3 size={24} className="text-blue-500" />,
        color: "bg-blue-50"
    },
    {
        id: 'sections',
        title: "Manage Sections",
        description: "Add new custom sections or drag to rearrange them in the sidebar to structure your resume perfectly.",
        image: "https://placehold.co/600x400/f1f5f9/334155?text=GIF:+Rearrange+Sections",
        icon: <Layers size={24} className="text-orange-500" />,
        color: "bg-orange-50"
    },
    {
        id: 'templates',
        title: "Switch Templates",
        description: "Explore different professional designs from the template gallery to find the look that fits your brand.",
        image: "https://placehold.co/600x400/f1f5f9/334155?text=GIF:+Change+Template",
        icon: <LayoutTemplate size={24} className="text-emerald-500" />,
        color: "bg-emerald-50"
    },
    {
        id: 'ai',
        title: "Improve with Unibot",
        description: "Stuck on what to write? Use Unibot to rewrite your bullet points and summaries instantly.",
        image: "https://placehold.co/600x400/f1f5f9/334155?text=GIF:+AI+Improvement",
        icon: <Wand2 size={24} className="text-blue-500" />,
        color: "bg-blue-50"
    },
    {
        id: 'share',
        title: "Share & Download",
        description: "Once you're ready, download your resume as a PDF or share a live link with recruiters.",
        image: "https://placehold.co/600x400/f1f5f9/334155?text=GIF:+Share+and+Download",
        icon: <Share2 size={24} className="text-teal-500" />,
        color: "bg-teal-50"
    }
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const stepData = STEPS[currentStep];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Close/Skip */}
                <button
                    onClick={onComplete}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-20"
                >
                    <X size={20} />
                </button>

                {/* Progress Bar */}
                <div className="flex gap-1 p-1 absolute top-0 left-0 w-full z-20">
                    {STEPS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${idx <= currentStep ? 'bg-brand-500' : 'bg-slate-200'}`}
                        ></div>
                    ))}
                </div>

                {/* Media Area */}
                <div className="bg-slate-50 w-full aspect-video flex-shrink-0 relative overflow-hidden group">
                    <img
                        key={stepData.image}
                        src={stepData.image}
                        alt={stepData.title}
                        className="w-full h-full object-cover animate-in fade-in duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none"></div>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col items-center text-center flex-1 overflow-y-auto bg-white dark:bg-slate-900">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${stepData.color} shadow-sm`}>
                        {stepData.icon}
                    </div>

                    <h2 className="text-2xl font-medium text-slate-900 dark:text-white mb-2">{stepData.title}</h2>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6 text-sm">{stepData.description}</p>

                    <div className="flex items-center gap-3 w-full mt-auto">
                        {currentStep > 0 ? (
                            <button
                                onClick={handlePrev}
                                className="px-5 py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2"
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>
                        ) : (
                            <button
                                onClick={onComplete}
                                className="px-5 py-3 text-slate-400 font-medium hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                Skip
                            </button>
                        )}

                        <button
                            onClick={handleNext}
                            className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl shadow-lg shadow-brand-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            {currentStep === STEPS.length - 1 ? "Get Started" : "Next"}
                            {currentStep < STEPS.length - 1 && <ArrowRight size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
