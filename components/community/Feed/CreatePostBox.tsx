import React from 'react';
import { Image, Link, Smile } from 'lucide-react';

const CreatePostBox: React.FC = () => {
    return (
        <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 p-4 shadow-sm">
            <div className="flex gap-3 mb-3">

                <input
                    type="text"
                    placeholder="Start a post, share your thoughts..."
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
            </div>
            <div className="flex justify-between items-center pt-2">
                <div className="flex gap-2">
                    <ActionButton icon={Image} label="Media" />
                    <ActionButton icon={Link} label="Link" />
                    <ActionButton icon={Smile} label="Emoji" />
                </div>
                <button className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Post
                </button>
            </div>
        </div>
    );
};

const ActionButton = ({ icon: Icon, label }: { icon: any, label: string }) => (
    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 transition-colors">
        <Icon size={16} />
        {label}
    </button>
);

export default CreatePostBox;
